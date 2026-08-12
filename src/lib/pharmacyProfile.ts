// Campos de perfil de farmacia — fase 1 (decisión 12-08-2026): solo captura,
// sin lógica de recomendación todavía (eso es fase 2). Compartido entre el
// onboarding y Perfil > Personal para no duplicar las listas de opciones.

export interface ProfileOption {
  value: string;
  label: string;
}

export const EMPLOYEES_COUNT_OPTIONS: ProfileOption[] = [
  { value: 'solo_yo', label: 'Solo yo' },
  { value: '2_3', label: '2-3 personas' },
  { value: '4_6', label: '4-6 personas' },
  { value: '7_10', label: '7-10 personas' },
  { value: 'mas_10', label: 'Más de 10 personas' },
];

export const SPECIALTY_OPTIONS: ProfileOption[] = [
  { value: 'dermocosmetica', label: 'Dermocosmética' },
  { value: 'ortopedia', label: 'Ortopedia' },
  { value: 'nutricion', label: 'Nutrición y dietética' },
  { value: 'veterinaria', label: 'Veterinaria' },
  { value: 'homeopatia', label: 'Homeopatía y naturales' },
  { value: 'optica', label: 'Óptica' },
];

export const getEmployeesCountLabel = (value?: string | null): string | undefined =>
  EMPLOYEES_COUNT_OPTIONS.find((o) => o.value === value)?.label;

export const getSpecialtyLabel = (value: string): string =>
  SPECIALTY_OPTIONS.find((o) => o.value === value)?.label ?? value;
