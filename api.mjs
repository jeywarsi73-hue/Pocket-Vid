import { getStore } from "@netlify/blobs";
const J = (d, s = 200) => new Response(JSON.stringify(d), { status: s, headers: { "content-type": "application/json" } });
export default async (req) => {
  const store = getStore("pocketvid");
  const a = new URL(req.url).searchParams.get("a");
  const vids = (await store.get("videos", { type: "json" })) || [];
  const set = (await store.get("settings", { type: "json" })) || {};
  const pin = process.env.ADMIN_PIN;
  const admin = !!pin && req.headers.get("x-admin") === pin;
  const b = req.method === "POST" ? await req.json().catch(() => ({})) : {};

  if (a === "list") {
    const { premiumPin, ...pub } = set;
    return J({ set: pub, vids: vids.map(v => v.access === "premium" ? { ...v, url: "" } : v) });
  }
  if (a === "unlock") {
    const v = vids.find(x => x.id === b.id);
    if (v && set.premiumPin && String(b.pin) === String(set.premiumPin)) return J({ url: v.url });
    return J({ error: "Wrong PIN" }, 403);
  }
  if (!admin) return J({ error: "Unauthorized" }, 401);
  if (a === "login") return J({ ok: true });
  if (a === "admin") return J({ set, vids });
  if (a === "save") {
    await store.setJSON("videos", b.vids || []);
    await store.setJSON("settings", b.set || {});
    return J({ ok: true });
  }
  return J({ error: "Bad request" }, 400);
};
