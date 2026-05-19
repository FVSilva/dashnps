import React, { useMemo, useState } from 'react';
import './index.css';

import { useSheets } from './hooks/useSheets';
import { useFilters } from './hooks/useFilters';
import { FilterBar } from './components/filters/FilterBar';
import { KPICard } from './components/kpis/KPICard';
import { VerticalCard } from './components/kpis/VerticalCard';
import { EvaluationTable } from './components/table/EvaluationTable';
import { RelatoriosPage } from './components/relatorios/RelatoriosPage';

import {
  calcNPS, calcCSATGeral, calcCSATVertical,
  calcTotalRespostas, calcLTMedio, withDelta,
} from './utils/calculations';
import { CSAT_VERTICALS } from './types';
import { formatPeriodo } from './utils/dateUtils';
import { sortPeriodos } from './utils/dateUtils';

type Page = 'nps-csat' | 'relatorios';

const NAV_ITEMS: { icon: string; label: string; page: Page }[] = [
  { icon: '⭐', label: 'NPS & CSAT',  page: 'nps-csat' },
  { icon: '📋', label: 'Relatórios',  page: 'relatorios' },
];

export default function App() {
  const [currentPage, setCurrentPage] = useState<Page>('nps-csat');

  const { data, loading, error, lastUpdated, refresh, dataSource } = useSheets(
    import.meta.env.VITE_SPREADSHEET_ID ? {
      spreadsheetId: import.meta.env.VITE_SPREADSHEET_ID,
      apiKey: import.meta.env.VITE_SHEETS_API_KEY,
      sheetName: import.meta.env.VITE_SHEET_NAME ?? 'Satisfação_BD',
    } : undefined
  );

  const {
    filters, filteredData, previousPeriodData, hasPreviousPeriod,
    options, setPeriodos, setFuncoes, setSquad, setClientes,
  } = useFilters(data);

  // Calcula período anterior label para tooltips
  const prevPeriodoLabel = useMemo(() => {
    if (!hasPreviousPeriod || !previousPeriodData.length) return undefined;
    const sorted = sortPeriodos([...new Set(previousPeriodData.map(r => r.periodo))]);
    return sorted[sorted.length - 1];
  }, [hasPreviousPeriod, previousPeriodData]);

  // KPIs do período atual
  const npsData   = useMemo(() => calcNPS(filteredData), [filteredData]);
  const csatData  = useMemo(() => calcCSATGeral(filteredData), [filteredData]);
  const respData  = useMemo(() => calcTotalRespostas(filteredData), [filteredData]);
  const ltData    = useMemo(() => calcLTMedio(filteredData), [filteredData]);

  // KPIs do período anterior
  const npsDataPrev  = useMemo(() => calcNPS(previousPeriodData), [previousPeriodData]);
  const csatDataPrev = useMemo(() => calcCSATGeral(previousPeriodData), [previousPeriodData]);
  const respDataPrev = useMemo(() => calcTotalRespostas(previousPeriodData), [previousPeriodData]);
  const ltDataPrev   = useMemo(() => calcLTMedio(previousPeriodData), [previousPeriodData]);

  // KPIs com delta
  const npsWithDelta  = useMemo(() => withDelta(npsData, npsDataPrev, hasPreviousPeriod), [npsData, npsDataPrev, hasPreviousPeriod]);
  const csatWithDelta = useMemo(() => withDelta(csatData, csatDataPrev, hasPreviousPeriod), [csatData, csatDataPrev, hasPreviousPeriod]);
  const respWithDelta = useMemo(() => withDelta(respData, respDataPrev, hasPreviousPeriod), [respData, respDataPrev, hasPreviousPeriod]);
  const ltWithDelta   = useMemo(() => withDelta(ltData, ltDataPrev, hasPreviousPeriod), [ltData, ltDataPrev, hasPreviousPeriod]);

  // Verticais com delta
  const verticaisData = useMemo(() =>
    CSAT_VERTICALS.map(v => {
      const curr = calcCSATVertical(filteredData, v.key);
      const prev = calcCSATVertical(previousPeriodData, v.key);
      return { ...v, kpi: withDelta(curr, prev, hasPreviousPeriod) };
    }),
    [filteredData, previousPeriodData, hasPreviousPeriod]
  );

  // Período selecionado para exibição no cabeçalho
  const periodoDisplay = filters.periodos.length === 0
    ? 'Todos os períodos'
    : filters.periodos.length === 1
    ? formatPeriodo(filters.periodos[0])
    : `${filters.periodos.length} períodos`;

  return (
    <div className="shell">
      {/* Sidebar eKyte */}
      <aside className="sidebar">
        <div className="sidebar-logo">
          <div className="sidebar-logo-text">V4</div>
          <div className="sidebar-logo-sub">eKyte · {filters.squad}</div>
        </div>
        <nav className="sidebar-nav">
          {NAV_ITEMS.map(item => (
            <a
              key={item.label}
              className={`sidebar-nav-item ${currentPage === item.page ? 'active' : ''}`}
              onClick={() => setCurrentPage(item.page)}
              style={{ cursor: 'pointer' }}
            >
              <span className="sidebar-nav-icon">{item.icon}</span>
              <span>{item.label}</span>
            </a>
          ))}
        </nav>
        <div className="sidebar-squad">{filters.squad}</div>
      </aside>

      {/* Conteúdo principal */}
      <main className="main-content">
        {/* Cabeçalho da página */}
        <div className="page-header">
          <div>
            <h1 className="page-title">
              {currentPage === 'nps-csat' && (<>NPS <span>&</span> CSAT</>)}
              {currentPage === 'relatorios' && 'Relatórios'}
            </h1>
            <p className="page-subtitle">{filters.squad}{currentPage === 'nps-csat' ? ` · ${periodoDisplay}` : ''}</p>
          </div>
          <span className={`data-source-badge ${dataSource === 'mock' ? 'mock' : ''}`}>
            {dataSource === 'mock' ? '⚠ Dados de demonstração' : '● Google Sheets'}
          </span>
        </div>

        {/* Página Relatórios */}
        {currentPage === 'relatorios' && <RelatoriosPage data={data} />}

        {/* Barra de filtros — apenas na página NPS & CSAT */}
        {currentPage === 'nps-csat' && (
          <FilterBar
            filters={filters}
            options={options}
            onPeriodosChange={setPeriodos}
            onFuncoesChange={setFuncoes}
            onSquadChange={setSquad}
            onClientesChange={setClientes}
            onRefresh={refresh}
            lastUpdated={lastUpdated}
            loading={loading}
          />
        )}

        {/* Corpo — apenas na página NPS & CSAT */}
        {currentPage === 'nps-csat' && <div className="page-body">
          {/* Estado de erro */}
          {error && (
            <div className="state-error">
              <div className="state-icon">⚠️</div>
              <div className="state-title">Erro ao carregar dados</div>
              <div className="state-msg">{error}</div>
              <button className="btn-refresh" onClick={refresh}>Tentar novamente</button>
            </div>
          )}

          {/* Estado vazio */}
          {!loading && !error && filteredData.length === 0 && (
            <div className="state-empty">
              <div className="state-icon">📭</div>
              <div className="state-title">Nenhuma avaliação encontrada</div>
              <div className="state-msg">Ajuste os filtros para visualizar dados.</div>
            </div>
          )}

          {/* KPIs principais */}
          {(loading || filteredData.length > 0) && (
            <>
              <div>
                <div className="section-title">Indicadores Principais</div>
                <div className="kpi-row">
                  <KPICard
                    variant="nps"
                    label="NPS Score"
                    kpi={npsWithDelta}
                    previousPeriodo={prevPeriodoLabel}
                    loading={loading}
                  />
                  <KPICard
                    variant="csat"
                    label="CSAT Geral"
                    kpi={csatWithDelta}
                    previousPeriodo={prevPeriodoLabel}
                    loading={loading}
                  />
                  <KPICard
                    variant="count"
                    label="Total de Respostas"
                    kpi={respWithDelta}
                    previousPeriodo={prevPeriodoLabel}
                    loading={loading}
                    icon={<span style={{ fontSize: 28 }}>👥</span>}
                  />
                  <KPICard
                    variant="lt"
                    label="LT Médio"
                    kpi={ltWithDelta}
                    previousPeriodo={prevPeriodoLabel}
                    loading={loading}
                  />
                </div>
              </div>

              {/* Verticais CSAT */}
              <div>
                <div className="section-title">CSAT por Vertical</div>
                <div className="vertical-row">
                  {verticaisData.map(v => (
                    <VerticalCard
                      key={v.key}
                      label={v.label}
                      kpi={v.kpi}
                      previousPeriodo={prevPeriodoLabel}
                      loading={loading}
                    />
                  ))}
                </div>
              </div>

              {/* Tabela auditável */}
              <div>
                <div className="section-title">Avaliações Individuais</div>
                <EvaluationTable rows={filteredData} loading={loading} />
              </div>
            </>
          )}
        </div>}
      </main>
    </div>
  );
}
