/**
 * Catch-all API proxy route handler.
 *
 * Replaces Next.js rewrites() so we get full control over the response,
 * especially Set-Cookie headers and redirect responses (Google OAuth).
 * Runs on the Edge runtime for minimal latency.
 */

const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

/**
 * Headers to strip from the upstream RESPONSE before forwarding to the browser.
 * The Edge Runtime's fetch() may decompress the body, making the original
 * content-encoding / content-length stale.
 */
const STRIP_RES_HEADERS = new Set([
  "content-encoding",
  "transfer-encoding",
  "content-length",
]);

/**
 * Headers to strip from the forwarded REQUEST to the backend.
 * - host: backend has its own hostname
 * - accept-encoding: prevent upstream from compressing (we handle that)
 * - content-length: let fetch recalculate from actual body to avoid mismatch
 */
const STRIP_REQ_HEADERS = new Set([
  "host",
  "accept-encoding",
  "content-length",
]);

async function handler(
  request: Request,
  { params }: { params: Promise<{ path: string[] }> },
) {
  const { path } = await params;
  const url = new URL(request.url);
  const target = `${BACKEND_URL}/api/${path.join("/")}${url.search}`;

  // Forward request headers, stripping problematic ones
  const headers = new Headers(request.headers);
  for (const h of STRIP_REQ_HEADERS) {
    headers.delete(h);
  }

  const init: RequestInit = {
    method: request.method,
    headers,
    redirect: "manual",
  };

  // Forward body for state-changing methods.
  // Consume as ArrayBuffer so fetch() can set correct content-length.
  if (!["GET", "HEAD", "OPTIONS"].includes(request.method)) {
    const body = await request.arrayBuffer();
    if (body.byteLength > 0) {
      init.body = body;
    }
  }

  try {
    const upstream = await fetch(target, init);

    // Read entire response body to avoid stream-forwarding issues
    const responseBody = await upstream.arrayBuffer();

    // Build clean response headers
    const responseHeaders = new Headers(upstream.headers);
    for (const h of STRIP_RES_HEADERS) {
      responseHeaders.delete(h);
    }

    // Log errors for debugging (visible in Vercel Runtime Logs)
    if (!upstream.ok && upstream.status >= 400) {
      const preview = new TextDecoder().decode(responseBody).substring(0, 500);
      console.error(
        `[proxy] ${request.method} ${target} → ${upstream.status}: ${preview}`,
      );
    }

    return new Response(responseBody, {
      status: upstream.status,
      statusText: upstream.statusText,
      headers: responseHeaders,
    });
  } catch (err) {
    console.error(`[proxy] fetch failed: ${request.method} ${target}`, err);
    return new Response(
      JSON.stringify({ detail: "バックエンドに接続できません" }),
      {
        status: 502,
        headers: { "Content-Type": "application/json" },
      },
    );
  }
}

export const GET = handler;
export const POST = handler;
export const PUT = handler;
export const PATCH = handler;
export const DELETE = handler;
export const HEAD = handler;
export const OPTIONS = handler;

export const runtime = "edge";
