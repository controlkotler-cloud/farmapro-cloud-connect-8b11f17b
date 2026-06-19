// =====================================================================
// Validación de identificadores fiscales españoles: NIF/DNI, NIE y CIF.
// Uso: en el registro, para descartar CIF/NIF inventados (formato + dígito
// de control). NO confirma que la empresa EXISTA de verdad —para eso hace
// falta un servicio externo (p.ej. VIES de la UE para el IVA, o una API de
// datos de empresa). Esa verificación de existencia se conecta con el
// registro/Stripe; aquí solo validamos formato + dígito de control.
// =====================================================================

const DNI_LETTERS = 'TRWAGMYFPDXBNJZSQVHLCKE';
const CIF_CONTROL_LETTERS = 'JABCDEFGHI';

export type FiscalIdType = 'nif' | 'nie' | 'cif';

export interface FiscalIdResult {
  valid: boolean;
  type: FiscalIdType | null;
  /** Valor normalizado (mayúsculas, sin espacios ni guiones). */
  normalized: string;
}

function normalize(value: string): string {
  return (value || '').toUpperCase().replace(/[\s-]/g, '');
}

// NIF persona física: 8 dígitos + letra de control.
function validateNif(v: string): boolean {
  if (!/^[0-9]{8}[A-Z]$/.test(v)) return false;
  const number = parseInt(v.slice(0, 8), 10);
  return DNI_LETTERS[number % 23] === v[8];
}

// NIE: X/Y/Z + 7 dígitos + letra (X=0, Y=1, Z=2 y luego como el NIF).
function validateNie(v: string): boolean {
  if (!/^[XYZ][0-9]{7}[A-Z]$/.test(v)) return false;
  const prefix = { X: '0', Y: '1', Z: '2' }[v[0] as 'X' | 'Y' | 'Z'];
  const number = parseInt(prefix + v.slice(1, 8), 10);
  return DNI_LETTERS[number % 23] === v[8];
}

// CIF entidad jurídica: letra de organización + 7 dígitos + control (dígito o letra).
function validateCifOnly(v: string): boolean {
  if (!/^[ABCDEFGHJNPQRSUVW][0-9]{7}[0-9A-J]$/.test(v)) return false;
  const orgLetter = v[0];
  const digits = v.slice(1, 8);
  const control = v[8];
  let sumEven = 0;
  let sumOdd = 0;
  for (let i = 0; i < 7; i++) {
    const n = parseInt(digits[i], 10);
    if (i % 2 === 0) {
      // posiciones impares (1ª, 3ª...): se doblan y se suman sus dígitos
      const d = n * 2;
      sumOdd += Math.floor(d / 10) + (d % 10);
    } else {
      sumEven += n;
    }
  }
  const unit = (10 - ((sumEven + sumOdd) % 10)) % 10;
  const controlDigit = String(unit);
  const controlLetter = CIF_CONTROL_LETTERS[unit];
  // Según la letra de organización, el control es número, letra, o cualquiera.
  if ('ABEH'.includes(orgLetter)) return control === controlDigit; // solo número
  if ('KPQRSNW'.includes(orgLetter)) return control === controlLetter; // solo letra
  return control === controlDigit || control === controlLetter; // ambos válidos
}

/** Valida un identificador fiscal español (NIF, NIE o CIF). */
export function validateFiscalId(value: string): FiscalIdResult {
  const v = normalize(value);
  if (validateNif(v)) return { valid: true, type: 'nif', normalized: v };
  if (validateNie(v)) return { valid: true, type: 'nie', normalized: v };
  if (validateCifOnly(v)) return { valid: true, type: 'cif', normalized: v };
  return { valid: false, type: null, normalized: v };
}

/** Helper booleano para formularios/validaciones rápidas. */
export function isValidFiscalId(value: string): boolean {
  return validateFiscalId(value).valid;
}
