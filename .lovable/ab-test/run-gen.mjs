// Prueba de tamaños NATIVOS sin fotos (/images/generations) con la función nueva (sin desplegar).
// Ejecutar: node .lovable/ab-test/run-gen.mjs   (lee LOVABLE_API_KEY del entorno)
import fs from "node:fs";
import path from "node:path";
const DIR = path.dirname(new URL(import.meta.url).pathname);
const KEY = process.env.LOVABLE_API_KEY;
if (!KEY) { console.error("Falta LOVABLE_API_KEY"); process.exit(1); }
const SCENARIOS = [
 {
  "id": "H1",
  "body": {
   "model": "openai/gpt-image-2",
   "prompt": "Marketing image for a Spanish retail pharmacy (parafarmacia): Producto de temporada. Topic of the piece (in Spanish): \"refuerzo de defensas en otoño\". Commercial, bright, professional aesthetic; suitable for social media or in-store poster. Format: social media feed post, balanced composition with headroom for a headline. Style hint: vivid. Target size: 1080x1350. Art direction: Flat warm autumn color field with falling leaves and hard shadows. The composition must feel finished and full: treat the entire background (color field, texture, pattern or scene) and balance the layout so there are no large empty dead zones. The image MUST render the following Spanish text EXACTLY as written, with perfect spelling and accents, no paraphrasing, no translation, no autocorrect, no truncation. Main headline (place, size and weight it according to the art direction): \"Refuerza tus defensas este otoño\". Also include these 3 short supporting items, laid out according to the art direction: 1. \"Vitamina C, selenio y zinc\" 2. \"Para toda la familia\" 3. \"Pide consejo en el mostrador\". All rendered text must be perfectly legible with a single clean sans-serif typography and high contrast. Do not add any other text besides the headline, these items and the signature. At the very bottom of the piece, render this exact small signature line, spelled EXACTLY as written, in small clean sans-serif text, single line, no icons, no logo: \"Farmacia Rocío Tobajas · Zaragoza\". Guardrails: no real medication packaging or medical brand logos; no health claims or therapeutic promises; no recognizable people or faces. Generic product categories are fine (sun care, skincare/dermocosmetics, vitamins, baby care, oral care). STRICTLY FORBIDDEN: do NOT invent, draw, imagine or render any logo, brand mark, wordmark, isotype, symbol, URL, website address, domain, \"www.\", \".com\", \".es\", email address, phone number, QR code, social media handle (@...), Instagram/Facebook/TikTok/Twitter/X icons, or any social media username. No fictional pharmacy logo. If a signature is provided below, render ONLY that exact text — nothing else.",
   "n": 1,
   "size": "1024x1280",
   "quality": "medium"
  }
 },
 {
  "id": "H2",
  "body": {
   "model": "openai/gpt-image-2",
   "prompt": "Marketing image for a Spanish retail pharmacy (parafarmacia): Producto de temporada. Topic of the piece (in Spanish): \"hidratación de la piel en invierno\". Commercial, bright, professional aesthetic; suitable for social media or in-store poster. Format: social media feed post, balanced composition with headroom for a headline. Style hint: vivid. Target size: 1920x1080. Art direction: Cool winter color field with soft snow texture. The composition must feel finished and full: treat the entire background (color field, texture, pattern or scene) and balance the layout so there are no large empty dead zones. The image MUST render the following Spanish text EXACTLY as written, with perfect spelling and accents, no paraphrasing, no translation, no autocorrect, no truncation. Main headline (place, size and weight it according to the art direction): \"Cuida tu piel este invierno\". Also include these 3 short supporting items, laid out according to the art direction: 1. \"Hidratación diaria\" 2. \"Labios y manos\" 3. \"Pide consejo en el mostrador\". All rendered text must be perfectly legible with a single clean sans-serif typography and high contrast. Do not add any other text besides the headline, these items and the signature. At the very bottom of the piece, render this exact small signature line, spelled EXACTLY as written, in small clean sans-serif text, single line, no icons, no logo: \"Farmacia Rocío Tobajas · Zaragoza\". Guardrails: no real medication packaging or medical brand logos; no health claims or therapeutic promises; no recognizable people or faces. Generic product categories are fine (sun care, skincare/dermocosmetics, vitamins, baby care, oral care). STRICTLY FORBIDDEN: do NOT invent, draw, imagine or render any logo, brand mark, wordmark, isotype, symbol, URL, website address, domain, \"www.\", \".com\", \".es\", email address, phone number, QR code, social media handle (@...), Instagram/Facebook/TikTok/Twitter/X icons, or any social media username. No fictional pharmacy logo. If a signature is provided below, render ONLY that exact text — nothing else.",
   "n": 1,
   "size": "2048x1152",
   "quality": "medium"
  }
 }
];
fs.mkdirSync(path.join(DIR, "jpg-gen"), { recursive: true });
const out = [];
for (const s of SCENARIOS) {
  const t0 = Date.now();
  const res = await fetch("https://ai.gateway.lovable.dev/v1/images/generations", { method: "POST", headers: { Authorization: `Bearer ${KEY}`, "Content-Type": "application/json" }, body: JSON.stringify(s.body) });
  const txt = await res.text();
  const r = { id: s.id, size: s.body.size, status: res.status, latency_ms: Date.now() - t0 };
  if (!res.ok) { r.error = txt.slice(0, 600); } else {
    const j = JSON.parse(txt);
    r.usage = j.usage ?? null;
    const b64 = j.data?.[0]?.b64_json;
    if (b64) fs.writeFileSync(path.join(DIR, "jpg-gen", `${s.id}.png`), Buffer.from(b64, "base64")); else r.error = "sin b64: " + txt.slice(0, 300);
  }
  out.push(r); console.log(JSON.stringify(r));
}
fs.writeFileSync(path.join(DIR, "results-gen.json"), JSON.stringify(out, null, 2));
