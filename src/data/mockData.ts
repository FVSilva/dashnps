import type { EvaluationRow } from '../types';
import { periodoToIndex } from '../utils/dateUtils';
import { sanitizeClientName } from '../utils/sanitize';

const raw: Array<{
  cliente: string; lt: number; gp: string; gt: string; ds: string; cp: string;
  periodo: string; notaNPS: number | null; csatGeral: number | null;
  atendimento: number | null; campanhas: number | null; copys: number | null;
  designs: number | null; prazos: number | null; resultados: number | null;
}> = [
  // Março 2026
  { cliente: 'Cheirin Bão - 12.345.678/0001-90', lt: 14, gp: 'Thais', gt: 'Emanuel', ds: 'Carla', cp: 'Joana', periodo: '2026-mar.', notaNPS: 10, csatGeral: 4.8, atendimento: 5, campanhas: 5, copys: 4.5, designs: 5, prazos: 4.5, resultados: 5 },
  { cliente: 'Odonto Excellence', lt: 8, gp: 'Gabriella', gt: 'Rafael', ds: 'Beatriz', cp: 'Lucas', periodo: '2026-mar.', notaNPS: 9, csatGeral: 4.6, atendimento: 5, campanhas: 4, copys: 5, designs: 4.5, prazos: 4.5, resultados: 5 },
  { cliente: 'Studio Glow - 98.765.432/0001-11', lt: 5, gp: 'Camila', gt: 'Emanuel', ds: 'Carla', cp: 'Joana', periodo: '2026-mar.', notaNPS: 7, csatGeral: 3.8, atendimento: 4, campanhas: 3.5, copys: 4, designs: 4, prazos: 3.5, resultados: 4 },
  { cliente: 'Clinica Vida Plena', lt: 22, gp: 'Thais', gt: 'Rafael', ds: 'Beatriz', cp: 'Lucas', periodo: '2026-mar.', notaNPS: 6, csatGeral: 3.2, atendimento: 3, campanhas: 3, copys: 3, designs: 3, prazos: 3.5, resultados: 3.5 },
  { cliente: 'Academia FitForce', lt: 11, gp: 'Gabriella', gt: 'Emanuel', ds: 'Carla', cp: 'Joana', periodo: '2026-mar.', notaNPS: 10, csatGeral: 4.9, atendimento: 5, campanhas: 5, copys: 5, designs: 5, prazos: 4.5, resultados: 5 },
  { cliente: 'Restaurante Sabor & Arte', lt: 3, gp: 'Camila', gt: 'Rafael', ds: 'Beatriz', cp: 'Lucas', periodo: '2026-mar.', notaNPS: 8, csatGeral: 4.2, atendimento: 4, campanhas: 4, copys: 4.5, designs: 4, prazos: 4.5, resultados: 4 },
  { cliente: 'Construtora Horizonte', lt: 18, gp: 'Thais', gt: 'Emanuel', ds: 'Carla', cp: 'Joana', periodo: '2026-mar.', notaNPS: 5, csatGeral: 2.8, atendimento: 3, campanhas: 2.5, copys: 3, designs: 2.5, prazos: 3, resultados: 2.5 },
  { cliente: 'Pet Shop Amigo Fiel', lt: 7, gp: 'Gabriella', gt: 'Rafael', ds: 'Beatriz', cp: 'Lucas', periodo: '2026-mar.', notaNPS: 9, csatGeral: 4.5, atendimento: 5, campanhas: 4, copys: 5, designs: 4.5, prazos: 4, resultados: 4.5 },

  // Abril 2026
  { cliente: 'Cheirin Bão - 12.345.678/0001-90', lt: 15, gp: 'Thais', gt: 'Emanuel', ds: 'Carla', cp: 'Joana', periodo: '2026-abr.', notaNPS: 10, csatGeral: 4.9, atendimento: 5, campanhas: 5, copys: 5, designs: 5, prazos: 4.5, resultados: 5 },
  { cliente: 'Odonto Excellence', lt: 9, gp: 'Gabriella', gt: 'Rafael', ds: 'Beatriz', cp: 'Lucas', periodo: '2026-abr.', notaNPS: 10, csatGeral: 4.8, atendimento: 5, campanhas: 4.5, copys: 5, designs: 5, prazos: 4.5, resultados: 5 },
  { cliente: 'Studio Glow - 98.765.432/0001-11', lt: 6, gp: 'Camila', gt: 'Emanuel', ds: 'Carla', cp: 'Joana', periodo: '2026-abr.', notaNPS: 8, csatGeral: 4.1, atendimento: 4, campanhas: 4, copys: 4.5, designs: 4, prazos: 4, resultados: 4 },
  { cliente: 'Clinica Vida Plena', lt: 23, gp: 'Thais', gt: 'Rafael', ds: 'Beatriz', cp: 'Lucas', periodo: '2026-abr.', notaNPS: 7, csatGeral: 3.7, atendimento: 4, campanhas: 3.5, copys: 3.5, designs: 4, prazos: 3.5, resultados: 3.5 },
  { cliente: 'Academia FitForce', lt: 12, gp: 'Gabriella', gt: 'Emanuel', ds: 'Carla', cp: 'Joana', periodo: '2026-abr.', notaNPS: 10, csatGeral: 5.0, atendimento: 5, campanhas: 5, copys: 5, designs: 5, prazos: 5, resultados: 5 },
  { cliente: 'Restaurante Sabor & Arte', lt: 4, gp: 'Camila', gt: 'Rafael', ds: 'Beatriz', cp: 'Lucas', periodo: '2026-abr.', notaNPS: 9, csatGeral: 4.4, atendimento: 4.5, campanhas: 4, copys: 5, designs: 4, prazos: 4.5, resultados: 4.5 },
  { cliente: 'Construtora Horizonte', lt: 19, gp: 'Thais', gt: 'Emanuel', ds: 'Carla', cp: 'Joana', periodo: '2026-abr.', notaNPS: 6, csatGeral: 3.3, atendimento: 3.5, campanhas: 3, copys: 3.5, designs: 3, prazos: 3.5, resultados: 3 },
  { cliente: 'Pet Shop Amigo Fiel', lt: 8, gp: 'Gabriella', gt: 'Rafael', ds: 'Beatriz', cp: 'Lucas', periodo: '2026-abr.', notaNPS: 9, csatGeral: 4.7, atendimento: 5, campanhas: 4.5, copys: 5, designs: 4.5, prazos: 4.5, resultados: 5 },
  { cliente: 'Farmácia Saúde Total', lt: 2, gp: 'Camila', gt: 'Emanuel', ds: 'Carla', cp: 'Lucas', periodo: '2026-abr.', notaNPS: 8, csatGeral: 4.3, atendimento: 4.5, campanhas: 4, copys: null, designs: 4.5, prazos: 4, resultados: 4.5 },
  { cliente: 'Boutique Estilo & Cia', lt: 6, gp: 'Thais', gt: 'Rafael', ds: 'Beatriz', cp: 'Joana', periodo: '2026-abr.', notaNPS: 10, csatGeral: 4.6, atendimento: 5, campanhas: 4.5, copys: 5, designs: null, prazos: 4.5, resultados: 4.5 },

  // Maio 2026
  { cliente: 'Cheirin Bão - 12.345.678/0001-90', lt: 16, gp: 'Thais', gt: 'Emanuel', ds: 'Carla', cp: 'Joana', periodo: '2026-mai.', notaNPS: 9, csatGeral: 4.7, atendimento: 5, campanhas: 4.5, copys: 5, designs: 4.5, prazos: 4.5, resultados: 5 },
  { cliente: 'Odonto Excellence', lt: 10, gp: 'Gabriella', gt: 'Rafael', ds: 'Beatriz', cp: 'Lucas', periodo: '2026-mai.', notaNPS: 10, csatGeral: 4.9, atendimento: 5, campanhas: 5, copys: 5, designs: 5, prazos: 4.5, resultados: 5 },
  { cliente: 'Studio Glow - 98.765.432/0001-11', lt: 7, gp: 'Camila', gt: 'Emanuel', ds: 'Carla', cp: 'Joana', periodo: '2026-mai.', notaNPS: 9, csatGeral: 4.5, atendimento: 4.5, campanhas: 4.5, copys: 4.5, designs: 4.5, prazos: 4.5, resultados: 4.5 },
  { cliente: 'Clinica Vida Plena', lt: 24, gp: 'Thais', gt: 'Rafael', ds: 'Beatriz', cp: 'Lucas', periodo: '2026-mai.', notaNPS: 8, csatGeral: 4.0, atendimento: 4, campanhas: 4, copys: 4, designs: 4, prazos: 4, resultados: 4 },
  { cliente: 'Academia FitForce', lt: 13, gp: 'Gabriella', gt: 'Emanuel', ds: 'Carla', cp: 'Joana', periodo: '2026-mai.', notaNPS: 10, csatGeral: 4.9, atendimento: 5, campanhas: 5, copys: 5, designs: 5, prazos: 4.5, resultados: 5 },
  { cliente: 'Restaurante Sabor & Arte', lt: 5, gp: 'Camila', gt: 'Rafael', ds: 'Beatriz', cp: 'Lucas', periodo: '2026-mai.', notaNPS: 7, csatGeral: 3.9, atendimento: 4, campanhas: 3.5, copys: 4, designs: 4, prazos: 4, resultados: 4 },
  { cliente: 'Construtora Horizonte', lt: 20, gp: 'Thais', gt: 'Emanuel', ds: 'Carla', cp: 'Joana', periodo: '2026-mai.', notaNPS: 8, csatGeral: 4.2, atendimento: 4, campanhas: 4, copys: 4.5, designs: 4, prazos: 4.5, resultados: 4 },
  { cliente: 'Pet Shop Amigo Fiel', lt: 9, gp: 'Gabriella', gt: 'Rafael', ds: 'Beatriz', cp: 'Lucas', periodo: '2026-mai.', notaNPS: 10, csatGeral: 4.8, atendimento: 5, campanhas: 5, copys: 5, designs: 4.5, prazos: 4.5, resultados: 5 },
  { cliente: 'Farmácia Saúde Total', lt: 3, gp: 'Camila', gt: 'Emanuel', ds: 'Carla', cp: 'Lucas', periodo: '2026-mai.', notaNPS: 9, csatGeral: 4.5, atendimento: 4.5, campanhas: 4.5, copys: null, designs: 4.5, prazos: 4.5, resultados: 4.5 },
  { cliente: 'Boutique Estilo & Cia', lt: 7, gp: 'Thais', gt: 'Rafael', ds: 'Beatriz', cp: 'Joana', periodo: '2026-mai.', notaNPS: 10, csatGeral: 4.8, atendimento: 5, campanhas: 5, copys: 5, designs: null, prazos: 4.5, resultados: 5 },
  { cliente: 'Tech Soluções', lt: 1, gp: 'Gabriella', gt: 'Emanuel', ds: 'Carla', cp: 'Joana', periodo: '2026-mai.', notaNPS: 6, csatGeral: 3.0, atendimento: 3, campanhas: 3, copys: 3, designs: 3, prazos: 3, resultados: 3 },
];

export const MOCK_DATA: EvaluationRow[] = raw.map(r => ({
  ...r,
  cliente: sanitizeClientName(r.cliente),
  periodoIndex: periodoToIndex(r.periodo),
}));

export const MOCK_SQUADS = ['Squad Midas', 'Squad Alpha', 'Squad Omega'];
