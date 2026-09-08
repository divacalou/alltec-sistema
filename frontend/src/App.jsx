import React, { useState, useEffect } from 'react';
import axios from 'axios';
import * as SidebarModule from './components/Sidebar';
import * as KpiCardsModule from './components/KpiCards';
import * as DashboardChartsModule from './components/DashboardCharts';
import * as ColaboradoresModule from './components/Colaboradores';
import SstOcorrencias from './components/SstOcorrencias';

const Sidebar = SidebarModule.default || SidebarModule.Sidebar;
const KpiCards = KpiCardsModule.default || KpiCardsModule.KpiCards;
const DashboardCharts = DashboardChartsModule.default || DashboardChartsModule.DashboardCharts;
const Colaboradores = ColaboradoresModule.default || ColaboradoresModule.Colaboradores;

export default function App() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [kpis, setKpis] = useState({
    total_colaboradores: 0,
    admissoes_mes: 0,
    afastamentos_mes: 0,
    ocorrencias_mes: 0
  });

  useEffect(() => {
    fetchKpis();
  }, []);

  const fetchKpis = async () => {
    try {
      const response = await axios.get('http://localhost:8000/api/kpis');
      setKpis(response.data);
    } catch (error) {
      console.error('Erro ao carregar KPIs do backend:', error);
    }
  };

  return (
    <div className="flex h-screen bg-gray-100 text-gray-800 overflow-hidden font-sans">
      {/* Menu Lateral com a nova identidade */}
      {Sidebar && <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />}

      <div className="flex-1 flex flex-col overflow-y-auto">
        <header className="flex items-center justify-between px-8 py-4 bg-white border-b border-gray-200 shadow-sm">
          <div>
            <h1 className="text-xl font-bold text-gray-900 tracking-tight">
              Planna <span className="text-red-600">RH</span>
            </h1>
            <p className="text-xs text-gray-500">Gestão de Pessoas & Segurança do Trabalho</p>
          </div>
          <div className="flex items-center gap-3">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
            <span className="text-sm font-semibold text-gray-700">Diva Calou</span>
          </div>
        </header>

        <main className="flex-1 p-8 bg-gray-50">
          {activeTab === 'dashboard' && (
            <div className="space-y-6">
              {KpiCards && <KpiCards kpis={kpis} />}
              {DashboardCharts && <DashboardCharts />}
            </div>
          )}

          {activeTab === 'colaboradores' && Colaboradores && (
            <Colaboradores />
          )}
        </main>
      </div>
    </div>
  );
}