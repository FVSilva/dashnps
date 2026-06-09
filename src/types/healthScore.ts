export interface HealthScoreRow {
  cliente: string;        // sanitized (no CNPJ)
  clienteRaw: string;     // original with CNPJ
  lt: number | null;
  data: string;           // e.g. "2026-mai."
  healthScore: number | null;
  healthScoreRaw: string | null;  // "Erro" or numeric string
  faturamento: number | null;
  roi: number | null;
  fatorGravidade: number | null;
  nivelConsciencia: number | null;
  profundidadeRelacionamento: number | null;
  nps: number | null;
  csat: number | null;
  touchCS: number | null;
  pulsacaoAccount: number | null;
  pontualidadePagamentos: number | null;
  historicoRenovacoes: number | null;
  gp: string;
}
