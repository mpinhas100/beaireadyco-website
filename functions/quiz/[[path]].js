// Serves the BeAIReadyCo Quiz Center at beaireadyco.com/quiz by fetching the
// Emergent quiz generator and returning its response under our own address.
const UPSTREAM = "https://quiz-forge-99.preview.emergentagent.com";
const PUBLIC_BASE = "https://www.beaireadyco.com/quiz";

function upstreamHeaders(source, target) {
  const out = new Headers();
  for (const [k, v] of source.entries()) {
    const key = k.toLowerCase();
    if (key.startsWith("cf-") || key.startsWith("x-forwarded") || key === "x-real-ip" || key === "cdn-loop") continue;
    if (["host", "cookie", "origin", "referer", "connection", "content-length"].includes(key)) continue;
    out.set(k, v);
  }
  out.set("host", target.host);
  out.set("origin", UPSTREAM);
  out.set("referer", UPSTREAM + "/");
  return out;
}

export async function onRequest(context) {
  const incoming = new URL(context.request.url);
  const rest = incoming.pathname.replace(/^\/quiz/, "") || "/";
  const target = new URL(rest + incoming.search, UPSTREAM);

  if (rest === "/__debug") {
    const probe = await fetch(target, {
      method: "GET",
      headers: upstreamHeaders(context.request.headers, target),
      redirect: "manual",
    });
    const hs = {};
    probe.headers.forEach((v, k) => (hs[k] = v));
    const body = (await probe.text()).slice(0, 1500);
    return new Response(JSON.stringify({ status: probe.status, headers: hs, body }, null, 2), {
      headers: { "content-type": "application/json" },
    });
  }

  const hasBody = !["GET", "HEAD"].includes(context.request.method);
  const upstream = await fetch(target, {
    method: context.request.method,
    headers: upstreamHeaders(context.request.headers, target),
    body: hasBody ? context.request.body : undefined,
    redirect: "manual",
  });

  const responseHeaders = new Headers(upstream.headers);
  responseHeaders.delete("content-encoding");
  responseHeaders.delete("content-length");
  responseHeaders.delete("content-security-policy");
  responseHeaders.delete("content-security-policy-report-only");
  responseHeaders.delete("set-cookie");
  const location = responseHeaders.get("location");
  if (location) {
    responseHeaders.set("location", location.replace(UPSTREAM, PUBLIC_BASE));
  }

  return new Response(upstream.body, {
    status: upstream.status,
    statusText: upstream.statusText,
    headers: responseHeaders,
  });
}
