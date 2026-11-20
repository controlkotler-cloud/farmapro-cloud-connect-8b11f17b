import { describe, expect, it } from 'vitest';
import { comprobarUrl, esIpPrivada } from './urlSegura.ts';
import { coloresDeCss, extraerDeHtml } from './extraerWeb.ts';
import { filtrarConCita, normalizar, quitarVetadas } from './citas.ts';
import type { Dato } from './tipos.ts';

const resolverA = (ips: string[]) => async () => ips;

describe('esIpPrivada', () => {
  it.each([
    '127.0.0.1', '10.1.2.3', '172.16.0.1', '172.31.255.255', '192.168.1.1',
    '169.254.169.254', '100.64.0.1', '0.0.0.0', '::1', 'fc00::1', 'fd12::1',
    'fe80::1', '::ffff:127.0.0.1', '::ffff:7f00:1', '::',
  ])('%s es privada', (ip) => expect(esIpPrivada(ip)).toBe(true));

  it.each(['93.184.216.34', '8.8.8.8', '172.32.0.1', '2606:4700::1111'])(
    '%s es pública', (ip) => expect(esIpPrivada(ip)).toBe(false),
  );
});

describe('comprobarUrl', () => {
  const pub = resolverA(['93.184.216.34']);
  it('rechaza localhost', async () => {
    expect((await comprobarUrl('http://localhost/', resolverA(['127.0.0.1']))).ok).toBe(false);
  });
  it('rechaza la IP de metadatos', async () => {
    expect((await comprobarUrl('http://169.254.169.254/', pub)).ok).toBe(false);
  });
  it('rechaza un dominio que resuelve a privada', async () => {
    expect((await comprobarUrl('https://farmacia.es/', resolverA(['10.0.0.5']))).ok).toBe(false);
  });
  it('rechaza si alguna IP resuelta es privada', async () => {
    expect((await comprobarUrl('https://farmacia.es/', resolverA(['93.184.216.34', '10.0.0.5']))).ok).toBe(false);
  });
  it('rechaza si no resuelve', async () => {
    expect((await comprobarUrl('https://farmacia.es/', resolverA([]))).ok).toBe(false);
  });
  it('acepta un dominio público', async () => {
    const r = await comprobarUrl('https://farmacia.es/', pub);
    expect(r.ok).toBe(true);
  });
  it('rechaza ftp', async () => {
    expect((await comprobarUrl('ftp://x.es', pub)).ok).toBe(false);
  });
  it('rechaza puertos raros', async () => {
    expect((await comprobarUrl('https://x.es:8080/', pub)).ok).toBe(false);
  });
  it('acepta puerto 443 explícito', async () => {
    expect((await comprobarUrl('https://x.es:443/', pub)).ok).toBe(true);
  });
  it('rechaza IPv4 mapeada en IPv6', async () => {
    expect((await comprobarUrl('http://[::ffff:127.0.0.1]/', pub)).ok).toBe(false);
  });
  it('rechaza usuario y contraseña en la URL', async () => {
    expect((await comprobarUrl('https://a:b@x.es/', pub)).ok).toBe(false);
  });
  it('rechaza basura', async () => {
    expect((await comprobarUrl('no es una url', pub)).ok).toBe(false);
  });
});

describe('extraerDeHtml', () => {
  const html = `<!doctype html><html><head>
    <meta name="theme-color" content="#1A7F5A">
    <link rel="stylesheet" href="/css/site.css">
    <link rel="apple-touch-icon" href="/apple.png">
    <meta property="og:image" content="https://cdn.farmacia.es/og.jpg">
    <style>.x{color:red}</style>
    </head><body>
    <img class="site-logo" src="/img/l.png" alt="Farmacia Pepa">
    <img src="/foto.jpg" alt="mostrador">
    <a href="https://www.instagram.com/p/abc123/">un post</a>
    <a href="https://www.instagram.com/farmaciapepa/">Instagram</a>
    <script>var secreto = "no debe salir";</script>
    <p>Servicio   de ortopedia
      infantil</p>
    </body></html>`;
  const r = extraerDeHtml(html, 'https://farmacia.es/');

  it('logo absoluto primero', () => {
    expect(r.logos[0]).toBe('https://farmacia.es/img/l.png');
    expect(r.logos).toContain('https://farmacia.es/apple.png');
    expect(r.logos).toContain('https://cdn.farmacia.es/og.jpg');
    expect(r.logos).not.toContain('https://farmacia.es/foto.jpg');
  });
  it('Instagram sin enlaces a posts', () => {
    expect(r.instagram).toBe('farmaciapepa');
  });
  it('texto sin scripts ni estilos y con espacios colapsados', () => {
    expect(r.texto).not.toContain('no debe salir');
    expect(r.texto).not.toContain('color:red');
    expect(r.texto).toContain('Servicio de ortopedia infantil');
  });
  it('color del theme-color', () => {
    expect(r.colores).toContain('#1a7f5a');
  });
  it('hoja CSS propia', () => {
    expect(r.hojaCss).toBe('https://farmacia.es/css/site.css');
  });
  it('texto máximo 12.000 caracteres', () => {
    const largo = extraerDeHtml(`<p>${'a '.repeat(20000)}</p>`, 'https://x.es/');
    expect(largo.texto.length).toBeLessThanOrEqual(12000);
  });
  it('sin Instagram devuelve null', () => {
    expect(extraerDeHtml('<p>hola</p>', 'https://x.es/').instagram).toBeNull();
  });
});

describe('coloresDeCss', () => {
  it('normaliza, ordena por frecuencia y quita blancos y negros', () => {
    const css = ':root{--p:#1A7F5A;--s:#f0a}a{color:#1a7f5a}b{color:#FFFFFF;background:#000}i{color:#fefefe}';
    const c = coloresDeCss(css);
    expect(c[0]).toBe('#1a7f5a');
    expect(c).toContain('#ff00aa');
    expect(c).not.toContain('#ffffff');
    expect(c).not.toContain('#000000');
    expect(c).not.toContain('#fefefe');
  });
  it('máximo 6', () => {
    const css = ['#110000', '#220000', '#330000', '#440000', '#550000', '#660000', '#770000', '#880000']
      .map((h) => `a{color:${h}}`).join('');
    expect(coloresDeCss(css).length).toBe(6);
  });
});

describe('citas', () => {
  it('normalizar quita acentos, mayúsculas y espacios', () => {
    expect(normalizar('  ORTOPEDÍA   Infantil ')).toBe('ortopedia infantil');
  });
  it('acepta cita con otros acentos y espacios', () => {
    const items: Dato<string>[] = [{ valor: 'Ortopedia', fuente: 'web', cita: 'ORTOPEDÍA  infantil' }];
    expect(filtrarConCita(items, { web: 'Servicio de ortopedia infantil' })).toHaveLength(1);
  });
  it('descarta cita inventada', () => {
    const items: Dato<string>[] = [{ valor: 'Dermo', fuente: 'web', cita: 'dermoestética avanzada' }];
    expect(filtrarConCita(items, { web: 'Servicio de ortopedia infantil' })).toHaveLength(0);
  });
  it('descarta sin cita', () => {
    const items: Dato<string>[] = [{ valor: 'Ortopedia', fuente: 'web' }];
    expect(filtrarConCita(items, { web: 'Servicio de ortopedia infantil' })).toHaveLength(0);
  });
  it('descarta si la fuente no tiene texto', () => {
    const items: Dato<string>[] = [{ valor: 'Ortopedia', fuente: 'instagram', cita: 'ortopedia' }];
    expect(filtrarConCita(items, { web: 'ortopedia' })).toHaveLength(0);
  });
  it('descarta cita vacía', () => {
    const items: Dato<string>[] = [{ valor: 'Ortopedia', fuente: 'web', cita: '   ' }];
    expect(filtrarConCita(items, { web: 'ortopedia' })).toHaveLength(0);
  });
  it('quitarVetadas', () => {
    const m = (valor: string): Dato<string> => ({ valor, fuente: 'web', cita: valor });
    const r = quitarVetadas([m('Robot Julia'), m('Celia'), m('Blíster Celia'), m('ISDIN'), m('blister celia'), m('Celiaquía Sin Gluten')])
      .map((d) => d.valor);
    expect(r).toEqual(['Blíster Celia', 'ISDIN', 'blister celia', 'Celiaquía Sin Gluten']);
  });
});
