/**
 * Catch-all API proxy route handler.
 *
 * Replaces Next.js rewrites() so we get full control over the response,
 * especially Set-Cookie headers and redirect responses (Google OAuth).
 * Runs on the Edge runtime for minimal latency.
 */

const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

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

  // Forward body for state-changing methods
  if (!["GET", "HEAD", "OPTIONS"].includes(request.method)) {
    init.body = request.body;
    // @ts-expect-error duplex required for streaming request body
    init.duplex = "half";
  }

  try {
    const upstream = await fetch(target, init);

    // Return upstream response as-is (status, headers including Set-Cookie, body)
    return new Response(upstream.body, {
      status: upstream.status,
      statusText: upstream.statusText,
      headers: upstream.headers,
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
