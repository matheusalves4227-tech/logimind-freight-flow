-- Create rate_limits table for tracking API usage
CREATE TABLE IF NOT EXISTS public.rate_limits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  identifier TEXT NOT NULL, -- user_id or IP address
  endpoint TEXT NOT NULL, -- Edge function name (generate-quote, create-order)
  request_count INTEGER NOT NULL DEFAULT 0,
  window_start TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT rate_limits_identifier_endpoint_key UNIQUE (identifier, endpoint)
);

-- Enable RLS
ALTER TABLE public.rate_limits ENABLE ROW LEVEL SECURITY;

-- Allow service role to manage rate limits (used by edge functions)
CREATE POLICY "Service role can manage rate limits"
  ON public.rate_limits
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Create indexes for fast lookups
CREATE INDEX IF NOT EXISTS idx_rate_limits_identifier_endpoint 
  ON public.rate_limits(identifier, endpoint);

CREATE INDEX IF NOT EXISTS idx_rate_limits_window_start 
  ON public.rate_limits(window_start);

-- Add trigger for updated_at
CREATE TRIGGER update_rate_limits_updated_at
  BEFORE UPDATE ON public.rate_limits
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Add comments
COMMENT ON TABLE public.rate_limits IS 'Tracks API request counts for rate limiting to prevent abuse';
COMMENT ON COLUMN public.rate_limits.identifier IS 'User ID (authenticated) or IP address (anonymous)';
COMMENT ON COLUMN public.rate_limits.endpoint IS 'Edge function name being rate limited';
COMMENT ON COLUMN public.rate_limits.request_count IS 'Number of requests in current time window';
COMMENT ON COLUMN public.rate_limits.window_start IS 'Start timestamp of current rate limit window';