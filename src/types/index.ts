export interface EvaluationRow {
  cliente: string;
  lt: number | null;
  gp: string;
  gt: string;
  ds: string;
  cp: string;
  periodo: string;       // raw: "2026-abr."
  periodoIndex: number;  // para ordenação: YYYYMM ex: 202604
  notaNPS: number | null;
  csatGeral: number | null;
  atendimento: number | null;
  campanhas: number | null;
  copys: number | null;
  designs: number | null;
  prazos: number | null;
  resultados: number | null;
}

export interface KPIData {
  value: number | null;
  stdDev: number | null;
  delta: number | null;
  deltaStdDev: number | null;
  previousValue: number | null;
  hasHistory: boolean;
}

export interface NPSData extends KPIData {
  promotores: number;
  neutros: number;
  detratores: number;
  totalRespostas: number;
}

export interface FilterState {
  periodos: string[];
  funcoes: FuncaoFilter[];
  squad: string;
  clientes: string[];
}

export interface FuncaoFilter {
  tipo: 'GP' | 'GT' | 'Ds' | 'Cp';
  nome: string;
}

export interface FilterOptions {
  periodos: string[];
  gps: string[];
  gts: string[];
  designers: string[];
  copywriters: string[];
  squads: string[];
  clientes: string[];
}

export type CSATVertical = 'atendimento' | 'campanhas' | 'copys' | 'designs' | 'prazos' | 'resultados';

export const CSAT_VERTICALS: { key: CSATVertical; label: string }[] = [
  { key: 'atendimento', label: 'Atendimento' },
  { key: 'campanhas', label: 'Campanhas' },
  { key: 'copys', label: 'Copys' },
  { key: 'designs', label: 'Designs' },
  { key: 'prazos', label: 'Prazos' },
  { key: 'resultados', label: 'Resultados' },
];

export type SortDirection = 'asc' | 'desc';

export interface SortConfig {
  column: keyof EvaluationRow | 'index';
  direction: SortDirection;
}
