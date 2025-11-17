/**
 * Rate Limiting Helper for Supabase Edge Functions
 * 
 * Prevents abuse and ensures fair usage of API endpoints using database-backed tracking.
 * Uses sliding window algorithm with 1-minute time windows.
 */

import { SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2';

export interface RateLimitConfig {
  endpoint: string;
  limit: number; // Max requests per window
  windowMinutes?: number; // Time window in minutes (default: 1)
}

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  limit: number;
  reset: Date;
}

/**
 * Check and enforce rate limit for a request
 * 
 * @param supabase - Supabase client with service role key (bypasses RLS)
 * @param identifier - User ID or IP address
 * @param config - Rate limit configuration
 * @returns Rate limit result with allowed status and headers info
 */
export async function checkRateLimit(
  supabase: SupabaseClient,
  identifier: string,
  config: RateLimitConfig
): Promise<RateLimitResult> {
  const { endpoint, limit, windowMinutes = 1 } = config;
  const now = new Date();
  const windowStart = new Date(now.getTime() - windowMinutes * 60 * 1000);

  try {
    // Fetch or create rate limit record
    const { data: rateLimitRecord, error: fetchError } = await supabase
      .from('rate_limits')
      .select('*')
      .eq('identifier', identifier)
      .eq('endpoint', endpoint)
      .single();

    if (fetchError && fetchError.code !== 'PGRST116') {
      // Error other than "not found"
      console.error('[Rate Limit] Error fetching record:', fetchError);
      // Fail open - allow request if we can't check rate limit
      return {
        allowed: true,
        remaining: limit - 1,
        limit,
        reset: new Date(now.getTime() + windowMinutes * 60 * 1000)
      };
    }

    if (!rateLimitRecord) {
      // First request - create new record
      const { error: insertError } = await supabase
        .from('rate_limits')
        .insert({
          identifier,
          endpoint,
          request_count: 1,
          window_start: now.toISOString()
        });

      if (insertError) {
        console.error('[Rate Limit] Error creating record:', insertError);
        // Fail open
        return {
          allowed: true,
          remaining: limit - 1,
          limit,
          reset: new Date(now.getTime() + windowMinutes * 60 * 1000)
        };
      }

      return {
        allowed: true,
        remaining: limit - 1,
        limit,
        reset: new Date(now.getTime() + windowMinutes * 60 * 1000)
      };
    }

    // Check if window has expired
    const recordWindowStart = new Date(rateLimitRecord.window_start);
    if (recordWindowStart < windowStart) {
      // Window expired - reset counter
      const { error: updateError } = await supabase
        .from('rate_limits')
        .update({
          request_count: 1,
          window_start: now.toISOString()
        })
        .eq('identifier', identifier)
        .eq('endpoint', endpoint);

      if (updateError) {
        console.error('[Rate Limit] Error resetting window:', updateError);
        // Fail open
        return {
          allowed: true,
          remaining: limit - 1,
          limit,
          reset: new Date(now.getTime() + windowMinutes * 60 * 1000)
        };
      }

      return {
        allowed: true,
        remaining: limit - 1,
        limit,
        reset: new Date(now.getTime() + windowMinutes * 60 * 1000)
      };
    }

    // Window is still active - check limit
    const currentCount = rateLimitRecord.request_count;
    
    if (currentCount >= limit) {
      // Rate limit exceeded
      const resetTime = new Date(recordWindowStart.getTime() + windowMinutes * 60 * 1000);
      return {
        allowed: false,
        remaining: 0,
        limit,
        reset: resetTime
      };
    }

    // Increment counter
    const { error: incrementError } = await supabase
      .from('rate_limits')
      .update({
        request_count: currentCount + 1
      })
      .eq('identifier', identifier)
      .eq('endpoint', endpoint);

    if (incrementError) {
      console.error('[Rate Limit] Error incrementing counter:', incrementError);
      // Fail open
      return {
        allowed: true,
        remaining: limit - currentCount - 1,
        limit,
        reset: new Date(recordWindowStart.getTime() + windowMinutes * 60 * 1000)
      };
    }

    return {
      allowed: true,
      remaining: limit - currentCount - 1,
      limit,
      reset: new Date(recordWindowStart.getTime() + windowMinutes * 60 * 1000)
    };
  } catch (error) {
    console.error('[Rate Limit] Unexpected error:', error);
    // Fail open on unexpected errors
    return {
      allowed: true,
      remaining: limit - 1,
      limit,
      reset: new Date(now.getTime() + windowMinutes * 60 * 1000)
    };
  }
}

/**
 * Generate rate limit headers for HTTP response
 */
export function getRateLimitHeaders(result: RateLimitResult): Record<string, string> {
  return {
    'X-RateLimit-Limit': result.limit.toString(),
    'X-RateLimit-Remaining': result.remaining.toString(),
    'X-RateLimit-Reset': Math.floor(result.reset.getTime() / 1000).toString(),
  };
}

/**
 * Get client identifier (user ID or IP address)
 */
export function getClientIdentifier(req: Request, userId?: string): string {
  // Prefer authenticated user ID
  if (userId) {
    return `user:${userId}`;
  }

  // Fallback to IP address
  const forwardedFor = req.headers.get('x-forwarded-for');
  const realIp = req.headers.get('x-real-ip');
  const ip = forwardedFor?.split(',')[0]?.trim() || realIp || 'unknown';
  
  return `ip:${ip}`;
}
