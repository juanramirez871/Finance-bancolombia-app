export const PHASES = {
  starting: "Preparando importacion...",
  importing: "Importando movimientos...",
  finalizing: "Finalizando y cargando movimientos...",
} as const;

export type Phase = keyof typeof PHASES;
