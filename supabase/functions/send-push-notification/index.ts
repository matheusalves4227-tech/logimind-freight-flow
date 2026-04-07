import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Web Push helpers
function base64UrlToUint8Array(base64url: string): Uint8Array {
  const base64 = base64url.replace(/-/g, "+").replace(/_/g, "/");
  const pad = "=".repeat((4 - (base64.length % 4)) % 4);
  const raw = atob(base64 + pad);
  return Uint8Array.from([...raw].map((c) => c.charCodeAt(0)));
}

async function importVapidKeys(publicKeyB64: string, privateKeyB64: string) {
  const publicKeyRaw = base64UrlToUint8Array(publicKeyB64);
  const privateKeyRaw = base64UrlToUint8Array(privateKeyB64);

  const publicKey = await crypto.subtle.importKey(
    "raw",
    publicKeyRaw,
    { name: "ECDSA", namedCurve: "P-256" },
    true,
    []
  );

  const privateKey = await crypto.subtle.importKey(
    "pkcs8",
    await buildPkcs8(privateKeyRaw),
    { name: "ECDSA", namedCurve: "P-256" },
    true,
    ["sign"]
  );

  return { publicKey, privateKey, publicKeyRaw };
}

async function buildPkcs8(privateKeyRaw: Uint8Array): Promise<ArrayBuffer> {
  // PKCS#8 wrapper for P-256 private key
  const header = new Uint8Array([
    0x30, 0x81, 0x87, 0x02, 0x01, 0x00, 0x30, 0x13, 0x06, 0x07, 0x2a, 0x86,
    0x48, 0xce, 0x3d, 0x02, 0x01, 0x06, 0x08, 0x2a, 0x86, 0x48, 0xce, 0x3d,
    0x03, 0x01, 0x07, 0x04, 0x6d, 0x30, 0x6b, 0x02, 0x01, 0x01, 0x04, 0x20,
  ]);
  const result = new Uint8Array(header.length + privateKeyRaw.length);
  result.set(header);
  result.set(privateKeyRaw, header.length);
  return result.buffer;
}

function uint8ArrayToBase64Url(arr: Uint8Array): string {
  return btoa(String.fromCharCode(...arr))
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

async function createVapidToken(
  endpoint: string,
  vapidPublicKey: string,
  vapidPrivateKey: string
): Promise<string> {
  const audience = new URL(endpoint).origin;
  const expiry = Math.floor(Date.now() / 1000) + 12 * 60 * 60;

  const header = { typ: "JWT", alg: "ES256" };
  const payload = {
    aud: audience,
    exp: expiry,
    sub: "mailto:matheus.alves@logimarket.com.br",
  };

  const enc = new TextEncoder();
  const headerB64 = uint8ArrayToBase64Url(enc.encode(JSON.stringify(header)));
  const payloadB64 = uint8ArrayToBase64Url(enc.encode(JSON.stringify(payload)));
  const unsignedToken = `${headerB64}.${payloadB64}`;

  const { privateKey: key } = await importVapidKeys(vapidPublicKey, vapidPrivateKey);
  const signature = await crypto.subtle.sign(
    { name: "ECDSA", hash: "SHA-256" },
    key,
    enc.encode(unsignedToken)
  );

  // Convert DER signature to raw r||s format
  const sigArray = new Uint8Array(signature);
  let r: Uint8Array, s: Uint8Array;
  if (sigArray[0] === 0x30) {
    // DER encoded
    const rLen = sigArray[3];
    const rStart = 4;
    r = sigArray.slice(rStart, rStart + rLen);
    const sLen = sigArray[rStart + rLen + 1];
    const sStart = rStart + rLen + 2;
    s = sigArray.slice(sStart, sStart + sLen);
    // Remove leading zeros and pad to 32 bytes
    if (r.length > 32) r = r.slice(r.length - 32);
    if (s.length > 32) s = s.slice(s.length - 32);
    if (r.length < 32) { const t = new Uint8Array(32); t.set(r, 32 - r.length); r = t; }
    if (s.length < 32) { const t = new Uint8Array(32); t.set(s, 32 - s.length); s = t; }
    const raw = new Uint8Array(64);
    raw.set(r, 0);
    raw.set(s, 32);
    return `${unsignedToken}.${uint8ArrayToBase64Url(raw)}`;
  }
  
  return `${unsignedToken}.${uint8ArrayToBase64Url(sigArray)}`;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const VAPID_PUBLIC_KEY = "BEivM6grnELjPRWtlwwBE05ZHdPn4feDkTrha4b-ptBefEYAFZ0SbOPsKLqKR-blYaUj-Pphs_9VKsHmzgequaY";
    const VAPID_PRIVATE_KEY = Deno.env.get("VAPID_PRIVATE_KEY");
    if (!VAPID_PRIVATE_KEY) throw new Error("VAPID_PRIVATE_KEY not configured");

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey);

    const { driverUserId, title, body, type, metadata } = await req.json();

    if (!driverUserId || !title || !body) {
      return new Response(JSON.stringify({ error: "Missing required fields" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // 1. Insert in-app notification
    await supabaseAdmin.from("driver_notifications").insert({
      driver_user_id: driverUserId,
      title,
      body,
      type: type || "opportunity",
      metadata: metadata || {},
    });

    // 2. Send push to all subscriptions of this user
    const { data: subscriptions } = await supabaseAdmin
      .from("push_subscriptions")
      .select("*")
      .eq("user_id", driverUserId);

    let pushSent = 0;
    let pushFailed = 0;

    if (subscriptions && subscriptions.length > 0) {
      for (const sub of subscriptions) {
        try {
          const vapidToken = await createVapidToken(sub.endpoint, VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY);

          const pushPayload = JSON.stringify({
            title,
            body,
            icon: "/favicon.png",
            tag: `logimarket-${type || "opportunity"}`,
            data: { url: "/motorista", ...metadata },
          });

          const response = await fetch(sub.endpoint, {
            method: "POST",
            headers: {
              "Content-Type": "application/octet-stream",
              "Content-Encoding": "aes128gcm",
              TTL: "86400",
              Authorization: `vapid t=${vapidToken}, k=${VAPID_PUBLIC_KEY}`,
            },
            body: new TextEncoder().encode(pushPayload),
          });

          if (response.status === 201 || response.status === 200) {
            pushSent++;
          } else if (response.status === 410 || response.status === 404) {
            // Subscription expired, remove it
            await supabaseAdmin.from("push_subscriptions").delete().eq("id", sub.id);
            pushFailed++;
          } else {
            pushFailed++;
          }
        } catch (e) {
          console.error("Push send error:", e);
          pushFailed++;
        }
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        inAppSent: true,
        pushSent,
        pushFailed,
        totalSubscriptions: subscriptions?.length || 0,
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
