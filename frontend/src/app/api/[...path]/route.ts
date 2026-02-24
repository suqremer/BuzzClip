/**
 * Catch-all API proxy route handler.
 *
 * Replaces Next.js rewrites() so we get full control over the response,
 * especially Set-Cookie headers and redirect responses (Google OAuth).
 * Runs on the Edge runtime for minimal latency.
 */

const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

/**
 * Hop-by-hop and encoding headers that must NOT be forwarded verbatim.
 *
 * The Edge Runtime's fetch() automatically decompresses gzip/br responses,
 * but the original content-encoding and content-length headers remain on
 * the Response object.  Forwarding them causes the browser to either
 * truncate or double-decompress the body, breaking JSON parsing.
 */
const STRIP_RESPONSE_HEADERS = [
  "content-encoding",
  "transfer-encoding",
  "content-length",
];

async function handler(
  request: Request,
  { params }: { params: Promise<{ path: string[] }> },
) {
  const { path } = await params;
  const url = new URL(request.url);
  const target = `${BACKEND_URL}/api/${path.join("/")}${url.search}`;

  // Forward request headers (drop host — the backend has its own)
  const headers = new Headers(request.headers);
  headers.delete("host");

  const init: RequestInit = {
    method: request.method,
    headers,
    redirect: "manual", // Don't follow redirects — forward them to the browser
  };

  // Forward body for state-changing methods.
  // Consume as ArrayBuffer to avoid ReadableStream forwarding issues
  // in the Edge Runtime (stream can only be consumed once).
  if (!["GET", "HEAD", "OPTIONS"].includes(request.method)) {
    const body = await request.arrayBuffer();
    if (body.byteLength > 0) {
      init.body = body;
    }
  }

  try {
    const upstream = await fetch(target, init);

    // Clone headers and strip encoding/length headers that the Edge
    // Runtime already processed — prevents content-length mismatch.
    const responseHeaders = new Headers(upstream.headers);
    for (const h of STRIP_RESPONSE_HEADERS) {
      responseHeaders.delete(h);
    }

    return new Response(upstream.body, {
      status: upstream.status,
      statusText: upstream.statusText,
      headers: responseHeaders,
    });
  } catch {
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
