/**
 * App.jsx — casco principal do sistema Planna RH & SST.
 *
 * NOTA IMPORTANTE: o arquivo App.jsx original não foi enviado junto com os
 * demais arquivos do projeto, então este arquivo foi reconstruído do zero
 * com base nos padrões já confirmados no restante do código:
 *   - Navegação 100% por estado local (activeTab/setActiveTab), sem
 *     react-router-dom (não há essa dependência no package.json e nenhum
 *     arquivo usa <Routes>/<Route>).
 *   - TODAS as telas e componentes ficam centralizados em `src/components/`
 *     (confirmado pelo usuário — não há pasta `src/pages/` neste projeto).
 *   - api.js mora em `src/services/api.js` (as telas já importam
 *     `../services/api`, o que funciona de dentro de `src/components/`
 *     exatamente da mesma forma que funcionaria a partir de `src/pages/`).
 *
 * Se a estrutura de pastas real do seu projeto for diferente, ajuste apenas
 * os caminhos dos imports abaixo — a lógica de navegação permanece a mesma.
 */
import React, { useEffect, useState } from 'react';
import { LayoutDashboard, Plus, ChevronDown, Users, ShieldCheck, Stethoscope } from 'lucide-react';

import Sidebar from './components/Sidebar';
import KpiCards from './components/KpiCards';
import DashboardCharts from './components/DashboardCharts';

import Colaboradores from './components/Colaboradores';
import Epis from './components/Epis';
import Pcmso from './components/Pcmso';
import SstOcorrencias from './components/SstOcorrencias';
import Pendencias from './components/Pendencias';
import Relatorios from './components/Relatorios';
import Configuracoes from './components/Configuracoes';

import { api } from './services/api';

// Chaves que precisam bater exatamente com os `id` definidos em
// src/components/Sidebar.jsx — se adicionar uma tela nova, registre aqui também.
const ABAS_VALIDAS = [
  'dashboard',
  'colaboradores',
  'epis',
  'pcmso',
  'ocorrencias',
  'pendencias',
  'relatorios',
  'configuracoes'
];

// Ações rápidas do dropdown "+ Nova Ação" no header do Dashboard.
const ACOES_RAPIDAS = [
  { label: 'Cadastrar Colaborador', tab: 'colaboradores', icon: Users },
  { label: 'Emitir EPI', tab: 'epis', icon: ShieldCheck },
  { label: 'Lançar ASO', tab: 'pcmso', icon: Stethoscope }
];

export default function App() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [kpis, setKpis] = useState(null);
  const [loadingKpis, setLoadingKpis] = useState(false);
  const [menuAcoesAberto, setMenuAcoesAberto] = useState(false);

  useEffect(() => {
    if (activeTab === 'dashboard') {
      carregarKpis();
    }
  }, [activeTab]);

  const carregarKpis = async () => {
    setLoadingKpis(true);
    try {
      const res = await api.get('/kpis');
      setKpis(res.data);
    } catch (err) {
      console.error('Erro ao carregar KPIs do dashboard:', err);
    } finally {
      setLoadingKpis(false);
    }
  };

  // Garantia extra: se por algum motivo activeTab vier com uma chave que não
  // existe mais (ex.: versão antiga salva em algum lugar), cai no dashboard
  // em vez de deixar a tela em branco.
  const abaAtual = ABAS_VALIDAS.includes(activeTab) ? activeTab : 'dashboard';

  const renderConteudo = () => {
    switch (abaAtual) {
      case 'dashboard':
        return (
          <div className="space-y-6 bg-slate-50 min-h-screen p-6 text-slate-800">
            <div className="flex flex-wrap justify-between items-start gap-4">
              <div>
                <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
                  <LayoutDashboard className="text-rose-600" size={26} /> Dashboard Geral
                </h1>
                <p className="text-sm text-slate-500 mt-1">Visão consolidada de RH e SST em tempo real.</p>
              </div>

              <div className="relative">
                <button
                  onClick={() => setMenuAcoesAberto((prev) => !prev)}
                  className="bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold px-4 py-2.5 rounded-lg flex items-center gap-2 shadow-sm transition-all"
                >
                  <Plus size={16} /> Nova Ação
                  <ChevronDown size={14} className={`transition-transform ${menuAcoesAberto ? 'rotate-180' : ''}`} />
                </button>

                {menuAcoesAberto && (
                  <>
                    <div className="fixed inset-0 z-10" onClick={() => setMenuAcoesAberto(false)} />
                    <div className="absolute right-0 mt-2 w-60 bg-white border border-slate-200 rounded-xl shadow-lg overflow-hidden z-20">
                      {ACOES_RAPIDAS.map((acao) => (
                        <button
                          key={acao.tab}
                          onClick={() => {
                            setActiveTab(acao.tab);
                            setMenuAcoesAberto(false);
                          }}
                          className="w-full flex items-center gap-2.5 px-4 py-3 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors text-left"
                        >
                          <acao.icon size={15} className="text-rose-600 shrink-0" />
                          {acao.label}
                        </button>
                      ))}
                    </div>
                  </>
                )}
              </div>
            </div>

            <KpiCards kpis={kpis} loading={loadingKpis} />
            <DashboardCharts />
          </div>
        );
      case 'colaboradores':
        return <Colaboradores />;
      case 'epis':
        return <Epis />;
      case 'pcmso':
        return <Pcmso />;
      case 'ocorrencias':
        return <SstOcorrencias />;
      case 'pendencias':
        return <Pendencias />;
      case 'relatorios':
        return <Relatorios />;
      case 'configuracoes':
        return <Configuracoes />;
      default:
        return null;
    }
  };

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden">
      <Sidebar activeTab={abaAtual} setActiveTab={setActiveTab} />

      <main className="flex-1 overflow-y-auto">{renderConteudo()}</main>
    </div>
  );
}