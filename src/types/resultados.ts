export interface ResultadosRow {
  cliente: string;        // sanitized (no CNPJ)
  clienteRaw: string;     // original with CNPJ for modal
  data: string;
  lt: number | null;
  faturamentoP: number | null;
  faturamentoR: number | null;
  investimentoP: number | null;
  investimentoR: number | null;
  roiP: number | null;
  roiR: number | null;
  cacP: number | null;
  cacR: number | null;
  vendasP: number | null;
  vendasR: number | null;
  ticketP: number | null;
  ticketR: number | null;
  gestor: string;
  mc: number | null;
}
