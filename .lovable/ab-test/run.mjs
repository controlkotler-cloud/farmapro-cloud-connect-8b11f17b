// Prueba A/B interna. Ejecutar: node .lovable/ab-test/run.mjs  (lee LOVABLE_API_KEY del entorno)
import fs from "node:fs";
import path from "node:path";

const DIR = path.dirname(new URL(import.meta.url).pathname);
const KEY = process.env.LOVABLE_API_KEY;
if (!KEY) { console.error("Falta LOVABLE_API_KEY"); process.exit(1); }
const BASE = "https://ai.gateway.lovable.dev/v1";

const MODELS = [
  { slug: "gemini-flash", id: "google/gemini-3.1-flash-image", kind: "gemini", rate: 0.00024 },
  { slug: "gemini-pro", id: "google/gemini-3-pro-image", kind: "gemini", rate: 0.00048 },
  { slug: "gpt-sunburst", id: "openai/gpt-image-2.5-sunburst", kind: "openai", rate: 0.00012 },
];

const SIGN = "Farmacia Rocío Tobajas";
const SCENARIOS = [
  { id: "A", ratio: "1:1", format: "square 1:1 social media post", size: "1024x1024", refs: ["leotron.jpg"],
    headline: "Refuerza tus defensas este otoño", lines: ["1. Vitamina C, selenio y zinc", "2. 36+18 comprimidos gratis"] },
  { id: "B", ratio: "9:16", format: "vertical 9:16 Instagram story", size: "1024x1536", refs: ["propolis.jpg", "propolis-jengibre.jpg"],
    headline: "Alivio para tu garganta", lines: ["1. Própolis y jengibre", "2. Caramelos sin azúcar"] },
  { id: "C", ratio: "1:1", format: "square 1:1 social media post", size: "1024x1024", refs: ["cerave.jpg", "neutrogena.jpg"],
    headline: "Hidratación de invierno", lines: ["1. Cremas para piel seca", "2. Bálsamo labial reparador", "3. Pide consejo en el mostrador"] },
];

function prompt(s) {
  return `Marketing image for a Spanish community pharmacy. Format: ${s.format} (aspect ratio ${s.ratio}).
Use the products shown in the reference photo(s) faithfully: same packaging, colors, brand and packaging text. Do not invent or add any other products.
Clean, professional composition with studio lighting.
Write EXACTLY the following text, with correct Spanish accents, and add no other text:
Headline: "${s.headline}"
${s.lines.map((l) => `Line: "${l}"`).join("\n")}
Signature at the bottom: "${SIGN}"`;
}

const b64 = (f) => fs.readFileSync(path.join(DIR, "inputs", f)).toString("base64");

async function callGemini(m, s) {
  const endpoint = "/v1/chat/completions";
  const res = await fetch(`${BASE}/chat/completions`, {
    method: "POST",
    headers: { Authorization: `Bearer ${KEY}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      model: m.id, modalities: ["image", "text"],
      image_config: { aspect_ratio: s.ratio },
      messages: [{ role: "user", content: [
        { type: "text", text: prompt(s) },
        ...s.refs.map((f) => ({ type: "image_url", image_url: { url: `data:image/jpeg;base64,${b64(f)}` } })),
      ] }],
    }),
  });
  const txt = await res.text();
  if (!res.ok) throw Object.assign(new Error(`HTTP ${res.status}: ${txt.slice(0, 500)}`), { endpoint });
  const j = JSON.parse(txt);
  const url = j.choices?.[0]?.message?.images?.[0]?.image_url?.url;
  if (!url) throw Object.assign(new Error(`Sin imagen en respuesta: ${txt.slice(0, 300)}`), { endpoint, usage: j.usage });
  return { endpoint, usage: j.usage ?? null, data: url.split(",")[1] };
}

async function callOpenAI(m, s) {
  const endpoint = "/v1/images/edits";
  const form = new FormData();
  form.append("model", m.id);
  form.append("prompt", prompt(s));
  form.append("size", s.size);
  for (const f of s.refs) form.append("image[]", new Blob([fs.readFileSync(path.join(DIR, "inputs", f))], { type: "image/jpeg" }), f);
  const res = await fetch(`${BASE}/images/edits`, { method: "POST", headers: { Authorization: `Bearer ${KEY}` }, body: form });
  const txt = await res.text();
  if (!res.ok) throw Object.assign(new Error(`HTTP ${res.status}: ${txt.slice(0, 500)}`), { endpoint });
  const j = JSON.parse(txt);
  const data = j.data?.[0]?.b64_json;
  if (!data) throw Object.assign(new Error(`Sin imagen: ${txt.slice(0, 300)}`), { endpoint, usage: j.usage });
  return { endpoint, usage: j.usage ?? null, data };
}

const outTokens = (u) => u?.output_tokens ?? u?.completion_tokens ?? null;

const results = [];
const jobs = SCENARIOS.flatMap((s) => MODELS.map((m) => ({ s, m })));
await Promise.all(jobs.map(async ({ s, m }) => {
  const r = { scenario: s.id, model: m.id, file: `out/${s.id}-${m.slug}.png`, attempts: 0 };
  for (let a = 1; a <= 2; a++) {
    r.attempts = a;
    const t0 = Date.now();
    try {
      const out = await (m.kind === "gemini" ? callGemini(m, s) : callOpenAI(m, s));
      r.latency_ms = Date.now() - t0;
      r.endpoint = out.endpoint; r.usage = out.usage; r.error = null;
      const tok = outTokens(out.usage);
      r.output_tokens = tok;
      r.estimated_credits = tok != null ? +(tok * m.rate).toFixed(5) : null;
      fs.writeFileSync(path.join(DIR, r.file), Buffer.from(out.data, "base64"));
      break;
    } catch (e) {
      r.latency_ms = Date.now() - t0; r.endpoint = e.endpoint; r.usage = e.usage ?? null; r.error = e.message;
      if (a === 1) await new Promise((ok) => setTimeout(ok, 3000));
    }
  }
  results.push(r);
  console.log(r.scenario, m.slug, r.error ? "ERROR " + r.error.slice(0, 150) : "ok", r.latency_ms, r.output_tokens, r.estimated_credits);
}));
results.sort((a, b) => (a.scenario + a.model).localeCompare(b.scenario + b.model));
fs.writeFileSync(path.join(DIR, "results.json"), JSON.stringify(results, null, 2));
