export interface HealthScoreRow {
  cliente: string;
  lt: number | null;
  data: string;
  healthScore: number | null;
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
