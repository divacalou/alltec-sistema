/**
 * App.jsx — casco principal do sistema Planna RH & SST.
 */

import React, { useEffect, useState } from 'react';
import { LayoutDashboard } from 'lucide-react';

import Sidebar from './components/Sidebar';
import RightSidebar from './components/RightSidebar';
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

export default function App() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [kpis, setKpis] = useState(null);
  const [loadingKpis, setLoadingKpis] = useState(false);

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
            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
              <h1 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                <LayoutDashboard className="text-rose-600" size={24} /> Dashboard Geral
              </h1>
              <p className="text-xs text-slate-500 mt-1">Visão consolidada de RH e SST em tempo real.</p>
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

      {abaAtual === 'dashboard' && <RightSidebar setActiveTab={setActiveTab} />}
    </div>
  );
}