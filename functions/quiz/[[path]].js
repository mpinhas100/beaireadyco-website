// Serves the BeAIReadyCo Quiz Center at beaireadyco.com/quiz by fetching the
// Emergent quiz generator and returning its response under our own address.
const UPSTREAM = "https://quiz-forge-99.preview.emergentagent.com";
const PUBLIC_BASE = "https://www.beaireadyco.com/quiz";

export async function onRequest(context) {
  const incoming = new URL(context.request.url);
  const rest = incoming.pathname.replace(/^\/quiz/, "") || "/";
  const target = new URL(rest + incoming.search, UPSTREAM);

  if (rest === "/__debug") {
    const probe = await fetch("https://app.emergent.sh/loading-preview?host=quiz-forge-99.preview.emergentagent.com", { redirect: "manual" });
    const hs = {};
    probe.headers.forEach((v, k) => (hs[k] = v));
    const body = (await probe.text()).slice(0, 3000);
    return new Response(JSON.stringify({ status: probe.status, headers: hs, body }, null, 2), {
      headers: { "content-type": "application/json" },
    });
  }

  const headers = new Headers(context.request.headers);
  headers.set("host", target.host);
  headers.delete("cf-connecting-ip");

  const hasBody = !["GET", "HEAD"].includes(context.request.method);
  const upstream = await fetch(target, {
    method: context.request.method,
    headers,
    body: hasBody ? context.request.body : undefined,
    redirect: "manual",
  });

  const responseHeaders = new Headers(upstream.headers);
  // fetch() already decoded the body, so drop the encoding headers that describe the original bytes.
  responseHeaders.delete("content-encoding");
  responseHeaders.delete("content-length");
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
