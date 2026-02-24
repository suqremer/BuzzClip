/**
 * Catch-all API proxy route handler.
 *
 * Replaces Next.js rewrites() so we get full control over the response,
 * especially Set-Cookie headers and redirect responses (Google OAuth).
 * Runs on the Edge runtime for minimal latency.
 */

const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

/**
 * Request headers to skip when forwarding to the backend.
 * - host: backend has its own hostname
 * - connection: hop-by-hop header, not forwarded
 * - accept-encoding: let the proxy handle decompression
 */
const SKIP_REQ_HEADERS = new Set([
  "host",
  "connection",
  "accept-encoding",
]);

/**
 * Response headers to strip before forwarding to the browser.
 * Edge Runtime may decompress the body, making these stale.
 */
const STRIP_RES_HEADERS = new Set([
  "content-encoding",
  "transfer-encoding",
  "content-length",
]);

async function handler(
  request: Request,
  { params }: { params: Promise<{ path: string[] }> },
) {
  const { path } = await params;
  const url = new URL(request.url);
  const target = `${BACKEND_URL}/api/${path.join("/")}${url.search}`;

  // Build forwarded request headers using a plain object.
  // Headers.forEach() yields lowercase keys per the spec.
  const fwdHeaders: Record<string, string> = {};
  request.headers.forEach((value, key) => {
    if (!SKIP_REQ_HEADERS.has(key)) {
      fwdHeaders[key] = value;
    }
  });

  // Read and forward body for state-changing methods.
  let bodyBuf: ArrayBuffer | null = null;
  if (!["GET", "HEAD", "OPTIONS"].includes(request.method)) {
    bodyBuf = await request.arrayBuffer();
    if (bodyBuf.byteLength > 0) {
      // Explicitly set content-length to match the actual body size.
      // This prevents mismatch when Edge Runtime re-encodes the body.
      fwdHeaders["content-length"] = String(bodyBuf.byteLength);
    } else {
      bodyBuf = null;
      delete fwdHeaders["content-length"];
    }
  } else {
    delete fwdHeaders["content-length"];
  }

  console.log(
    `[proxy] → ${request.method} ${target} body=${bodyBuf?.byteLength ?? 0}B ct=${fwdHeaders["content-type"] ?? "none"}`,
  );

  try {
    const upstream = await fetch(target, {
      method: request.method,
      headers: fwdHeaders,
      body: bodyBuf,
      redirect: "manual",
    });

    // Read entire body as ArrayBuffer to avoid stream-forwarding issues.
    const resBody = await upstream.arrayBuffer();

    const resCT = upstream.headers.get("content-type") ?? "none";
    console.log(
      `[proxy] ← ${upstream.status} ${resCT} ${resBody.byteLength}B`,
    );

    // Log body preview for non-2xx responses (errors, redirects).
    if (upstream.status < 200 || upstream.status >= 300) {
      const preview = new TextDecoder()
        .decode(resBody)
        .substring(0, 500);
      console.error(`[proxy] non-2xx body: ${preview}`);
    }

    // Build response with Headers object (not plain object) to preserve
    // multiple Set-Cookie headers. A plain object would overwrite duplicates.
    const res = new Response(resBody, {
      status: upstream.status,
      statusText: upstream.statusText,
    });
    upstream.headers.forEach((value, key) => {
      if (!STRIP_RES_HEADERS.has(key)) {
        res.headers.append(key, value);
      }
    });
    return res;
  } catch (err) {
    console.error(`[proxy] fetch error: ${request.method} ${target}`, err);
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
