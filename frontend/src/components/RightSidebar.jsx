import React, { useEffect, useState } from 'react';
import { UserPlus, AlertTriangle, FileBarChart, Stethoscope, HardHat, RefreshCw } from 'lucide-react';
import { api } from '../services/api';

// Cada ação aponta para o id de aba correspondente em Sidebar.jsx / App.jsx.
const acoes = [
  { label: 'Cadastrar colaborador', icon: UserPlus, tab: 'colaboradores' },
  { label: 'Registrar ocorrência', icon: AlertTriangle, tab: 'ocorrencias' },
  { label: 'Gerar relatório', icon: FileBarChart, tab: 'relatorios' },
  { label: 'Lançar exame médico', icon: Stethoscope, tab: 'pcmso' },
  { label: 'Emitir EPI', icon: HardHat, tab: 'epis' },
  { label: 'Atualizar PCMSO', icon: RefreshCw, tab: 'pcmso' }
];

const formatarDataBR = (dataString) => {
  if (!dataString) return '—';
  const iso = dataString.split('T')[0];
  const partes = iso.split('-');
  if (partes.length === 3) return `${partes[2]}/${partes[1]}/${partes[0]}`;
  return dataString;
};

export function RightSidebar({ setActiveTab }) {
  const [atividades, setAtividades] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    carregarAtividades();
  }, []);

  const carregarAtividades = async () => {
    setLoading(true);
    try {
      // A lista de ocorrências já vem ordenada por data/id decrescente no backend.
      const res = await api.get('/ocorrencias');
      const recentes = (res.data || []).slice(0, 5).map((o) => ({
        id: o.id,
        title: o.tipo || 'Ocorrência registrada',
        desc: o.colaborador_nome || 'Colaborador não informado',
        time: formatarDataBR(o.data)
      }));
      setAtividades(recentes);
    } catch (err) {
      console.error('Erro ao carregar atividades recentes:', err);
      setAtividades([]);
    } finally {
      setLoading(false);
    }
  };

  const handleAcaoClick = (tab) => {
    if (typeof setActiveTab === 'function') {
      setActiveTab(tab);
    }
  };

  return (
    <aside className="w-80 bg-white border-l border-slate-200 p-5 hidden xl:block space-y-6">
      <div>
        <h3 className="text-sm font-bold text-slate-900 mb-3">Ações rápidas</h3>
        <div className="grid grid-cols-2 gap-2">
          {acoes.map((item, i) => (
            <button
              key={i}
              onClick={() => handleAcaoClick(item.tab)}
              className="flex flex-col items-center justify-center p-3 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 shadow-sm transition-colors text-center group"
            >
              <item.icon className="w-5 h-5 text-rose-600 mb-2 group-hover:scale-110 transition-transform" />
              <span className="text-xs text-slate-700 leading-tight">{item.label}</span>
            </button>
          ))}
        </div>
      </div>

      <div>
        <div className="flex justify-between items-center mb-3">
          <h3 className="text-sm font-bold text-slate-900">Atividades recentes</h3>
          <button
            onClick={carregarAtividades}
            className="text-slate-400 hover:text-slate-600 transition-colors"
            title="Atualizar"
          >
            <RefreshCw size={13} className={loading ? 'animate-spin' : ''} />
          </button>
        </div>

        <div className="space-y-3">
          {loading ? (
            <p className="text-xs text-slate-400">Carregando...</p>
          ) : atividades.length === 0 ? (
            <p className="text-xs text-slate-400">Nenhuma atividade recente.</p>
          ) : (
            atividades.map((act) => (
              <div key={act.id} className="p-3 bg-white border border-slate-200 rounded-xl text-xs shadow-sm">
                <p className="font-semibold text-slate-800">{act.title}</p>
                <p className="text-slate-600 mt-0.5">{act.desc}</p>
                <span className="text-[10px] text-slate-400 mt-2 block">{act.time}</span>
              </div>
            ))
          )}
        </div>
      </div>
    </aside>
  );
}

export default RightSidebar;