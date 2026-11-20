// Comprobación de URLs antes de que la edge function las descargue (SSRF).
// Sin imports de Deno: el resolver DNS se inyecta.
//
// OJO para quien la use: esto valida UNA URL. Al descargar hay que pedir con
// redirect: 'manual' y volver a pasar por comprobarUrl cada salto.

function parseIpv4(ip: string): number[] | null {
  const m = /^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/.exec(ip);
  if (!m) return null;
  const o = m.slice(1).map(Number);
  return o.every((n) => n <= 255) ? o : null;
}

function ipv4Privada([a, b]: number[]): boolean {
  return (
    a === 0 || // 0.0.0.0/8
    a === 10 || // 10/8
    a === 127 || // loopback
    (a === 169 && b === 254) || // link-local y metadatos de nube
    (a === 172 && b >= 16 && b <= 31) || // 172.16/12
    (a === 192 && b === 168) || // 192.168/16
    (a === 100 && b >= 64 && b <= 127) || // 100.64/10 (CGNAT)
    (a === 192 && b === 0) || // 192.0.0.0/24 y 192.0.2.0/24 (IETF y documentación)
    (a === 198 && (b === 18 || b === 19)) || // 198.18/15 (pruebas de red)
    a >= 224 // multicast, reservadas y broadcast
  );
}

/** Expande una IPv6 a 8 grupos de 16 bits. null si no es válida. */
function expandirIpv6(ip: string): number[] | null {
  let s = ip.toLowerCase();
  // IPv4 incrustada al final (::ffff:127.0.0.1)
  const v4 = /(\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3})$/.exec(s);
  if (v4) {
    const o = parseIpv4(v4[1]);
    if (!o) return null;
    s = s.slice(0, -v4[1].length) +
      ((o[0] << 8) | o[1]).toString(16) + ':' + ((o[2] << 8) | o[3]).toString(16);
  }
  const partes = s.split('::');
  if (partes.length > 2) return null;
  const izq = partes[0] ? partes[0].split(':') : [];
  const der = partes.length === 2 && partes[1] ? partes[1].split(':') : [];
  const faltan = 8 - izq.length - der.length;
  if (partes.length === 1 ? faltan !== 0 : faltan < 1) return null;
  const grupos = [...izq, ...Array(partes.length === 2 ? faltan : 0).fill('0'), ...der];
  if (grupos.length !== 8 || !grupos.every((g) => /^[0-9a-f]{1,4}$/.test(g))) return null;
  return grupos.map((g) => parseInt(g, 16));
}

/** true si la IP no es pública. Una IP que no se entiende cuenta como privada. */
export function esIpPrivada(ip: string): boolean {
  const limpia = ip.replace(/^\[|\]$/g, '').split('%')[0];
  const v4 = parseIpv4(limpia);
  if (v4) return ipv4Privada(v4);

  const g = expandirIpv6(limpia);
  if (!g) return true;
  const ceros = (n: number) => g.slice(0, n).every((x) => x === 0);
  const v4De = (): number[] => [g[6] >> 8, g[6] & 255, g[7] >> 8, g[7] & 255];

  if (ceros(8)) return true; // ::
  if (ceros(7) && g[7] === 1) return true; // ::1
  if (ceros(5) && g[5] === 0xffff) return ipv4Privada(v4De()); // IPv4 mapeada
  if (ceros(6)) return ipv4Privada(v4De()); // IPv4 compatible (obsoleta)
  if (g[0] === 0x64 && g[1] === 0xff9b && g.slice(2, 6).every((x) => x === 0)) {
    return ipv4Privada(v4De()); // NAT64
  }
  if ((g[0] & 0xfe00) === 0xfc00) return true; // fc00::/7
  if ((g[0] & 0xffc0) === 0xfe80) return true; // fe80::/10
  if ((g[0] & 0xff00) === 0xff00) return true; // multicast
  return false;
}

const esIpLiteral = (host: string) => parseIpv4(host) !== null || host.includes(':');

export async function comprobarUrl(
  url: string,
  resolver: (host: string) => Promise<string[]>,
): Promise<{ ok: true; url: URL } | { ok: false; motivo: string }> {
  let u: URL;
  try {
    u = new URL(url);
  } catch {
    return { ok: false, motivo: 'URL no válida' };
  }
  if (u.protocol !== 'http:' && u.protocol !== 'https:') {
    return { ok: false, motivo: 'Solo http o https' };
  }
  if (u.port !== '' && u.port !== '80' && u.port !== '443') {
    return { ok: false, motivo: 'Puerto no permitido' };
  }
  if (u.username || u.password) {
    return { ok: false, motivo: 'La URL lleva usuario o contraseña' };
  }

  const host = u.hostname.replace(/^\[|\]$/g, '').toLowerCase();
  if (!host) return { ok: false, motivo: 'URL sin dominio' };
  if (esIpLiteral(host)) {
    return esIpPrivada(host) ? { ok: false, motivo: 'Dirección privada' } : { ok: true, url: u };
  }
  if (host === 'localhost' || /\.(localhost|local|internal|lan|home\.arpa)$/.test(host)) {
    return { ok: false, motivo: 'Dominio interno' };
  }

  let ips: string[];
  try {
    ips = await resolver(host);
  } catch {
    return { ok: false, motivo: 'El dominio no existe' };
  }
  if (ips.length === 0) return { ok: false, motivo: 'El dominio no existe' };
  if (ips.some(esIpPrivada)) return { ok: false, motivo: 'Dirección privada' };
  return { ok: true, url: u };
}
