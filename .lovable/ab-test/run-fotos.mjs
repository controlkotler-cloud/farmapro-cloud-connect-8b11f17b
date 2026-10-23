// Prueba de la petición NUEVA de ai-generate-image con fotos de producto (sin desplegar).
// Ejecutar: node .lovable/ab-test/run-fotos.mjs   (lee LOVABLE_API_KEY del entorno)
import fs from "node:fs";
import path from "node:path";
const DIR = path.dirname(new URL(import.meta.url).pathname);
const KEY = process.env.LOVABLE_API_KEY;
if (!KEY) { console.error("Falta LOVABLE_API_KEY"); process.exit(1); }
const COMMON_TAIL = " The composition must feel finished and full: treat the entire background (color field, texture, pattern or scene) and balance the layout so there are no large empty dead zones. The image MUST render the following Spanish text EXACTLY as written, with perfect spelling and accents, no paraphrasing, no translation, no autocorrect, no truncation.";
const GUARD = " All rendered text must be perfectly legible with a single clean sans-serif typography and high contrast. Do not add any other text besides the headline, these items and the signature. At the very bottom of the piece, render this exact small signature line, spelled EXACTLY as written, in small clean sans-serif text, single line, no icons, no logo: \"Farmacia Rocío Tobajas · Zaragoza\". Guardrails: the brand names and logos printed on the referenced products are allowed exactly as they appear in the photos; no health claims or therapeutic promises; no recognizable people or faces. Generic product categories are fine (sun care, skincare/dermocosmetics, vitamins, baby care, oral care). STRICTLY FORBIDDEN: do NOT invent, draw, imagine or render any logo, brand mark, wordmark, isotype, symbol, URL, website address, domain, \"www.\", \".com\", \".es\", email address, phone number, QR code, social media handle (@...), Instagram/Facebook/TikTok/Twitter/X icons, or any social media username. No fictional pharmacy logo. If a signature is provided below, render ONLY that exact text — nothing else. (Only exception: the brand names, logos and printed text on the referenced products, kept exactly as in the photos.)";
const head = (topic, photos) => `Marketing image for a Spanish retail pharmacy (parafarmacia): Producto de temporada. Topic of the piece (in Spanish): "${topic}". Commercial, bright, professional aesthetic; suitable for social media or in-store poster. Format: square social media post, balanced composition with headroom for a headline. Style hint: vivid. Target size: 1024x1024. PRODUCT REFERENCE PHOTOS: ${photos} Feature ${photos.startsWith("the attached image") ? "it" : "them"} as the hero of the piece, reproducing each product FAITHFULLY: same packaging shape, colors, brand name and printed text as in the photo — do not redesign, rename or relabel any of them. Place the products naturally in the composition (you may change angle, lighting and background, never the product itself). Do not add any other branded product.`;
const SCENARIOS = [
  { id: "F1", refs: ["leotron.jpg"],
    prompt: head("refuerzo de defensas en otoño", "the attached image shows the real product this pharmacy sells.") + " Art direction: Product floating over a flat warm autumn color field with hard shadow." + COMMON_TAIL + ' Main headline (place, size and weight it according to the art direction): "Refuerza tus defensas este otoño". Also include these 3 short supporting items, laid out according to the art direction: 1. "Vitamina C, selenio y zinc" 2. "Para toda la familia" 3. "Pide consejo en el mostrador".' + GUARD },
  { id: "F2", refs: ["cerave.jpg", "neutrogena.jpg"],
    prompt: head("hidratación de la piel en invierno", "the 2 attached images show the real products this pharmacy sells.") + " Art direction: Product floating over a flat cool winter color field with hard shadow." + COMMON_TAIL + ' Main headline (place, size and weight it according to the art direction): "Hidratación de invierno". Also include these 3 short supporting items, laid out according to the art direction: 1. "Cremas para piel seca" 2. "Bálsamo labial reparador" 3. "Pide consejo en el mostrador".' + GUARD },
];
fs.mkdirSync(path.join(DIR, "jpg-fotos"), { recursive: true });
const out = [];
for (const s of SCENARIOS) {
  const form = new FormData();
  form.append("model", "openai/gpt-image-2");
  form.append("prompt", s.prompt);
  form.append("n", "1");
  form.append("size", "1024x1024");
  form.append("quality", "medium");
  s.refs.forEach((f, i) => form.append("image[]", new Blob([fs.readFileSync(path.join(DIR, "inputs", f))], { type: "image/jpeg" }), `producto-${i + 1}.jpeg`));
  const t0 = Date.now();
  const res = await fetch("https://ai.gateway.lovable.dev/v1/images/edits", { method: "POST", headers: { Authorization: `Bearer ${KEY}` }, body: form });
  const txt = await res.text();
  const r = { id: s.id, status: res.status, latency_ms: Date.now() - t0 };
  if (!res.ok) { r.error = txt.slice(0, 600); } else {
    const j = JSON.parse(txt);
    r.usage = j.usage ?? null;
    const b64 = j.data?.[0]?.b64_json;
    if (b64) fs.writeFileSync(path.join(DIR, "jpg-fotos", `${s.id}.png`), Buffer.from(b64, "base64")); else r.error = "sin b64: " + txt.slice(0, 300);
  }
  out.push(r); console.log(JSON.stringify(r));
}
fs.writeFileSync(path.join(DIR, "results-fotos.json"), JSON.stringify(out, null, 2));
