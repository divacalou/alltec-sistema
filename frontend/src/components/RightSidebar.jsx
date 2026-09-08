import React from 'react';
import { UserPlus, AlertTriangle, FileBarChart, Stethoscope, HardHat, RefreshCw } from 'lucide-react';

const acoes = [
  { label: 'Cadastrar colaborador', icon: UserPlus },
  { label: 'Registrar ocorrência', icon: AlertTriangle },
  { label: 'Gerar relatório', icon: FileBarChart },
  { label: 'Lançar exame médico', icon: Stethoscope },
  { label: 'Emitir EPI', icon: HardHat },
  { label: 'Atualizar PCMSO', icon: RefreshCw },
];

const atividades = [
  { title: 'Novo colaborador cadastrado', desc: 'Ana Souza', time: 'Hoje, 09:42' },
  { title: 'Exame admissional concluído', desc: 'Carlos Mendes', time: 'Hoje, 08:17' },
  { title: 'EPI entregue', desc: 'João Pereira', time: 'Ontem, 16:32' },
];

export function RightSidebar() {
  return (
    <aside className="w-80 bg-cardBg border-l border-cardBorder p-5 hidden xl:block space-y-6">
      <div>
        <h3 className="text-sm font-bold text-white mb-3">Ações rápidas</h3>
        <div className="grid grid-cols-2 gap-2">
          {acoes.map((item, i) => (
            <button key={i} className="flex flex-col items-center justify-center p-3 bg-darkBg border border-cardBorder rounded-xl hover:border-brandOrange transition-colors text-center group">
              <item.icon className="w-5 h-5 text-brandOrange mb-2 group-hover:scale-110 transition-transform" />
              <span className="text-xs text-gray-300 leading-tight">{item.label}</span>
            </button>
          ))}
        </div>
      </div>

      <div>
        <h3 className="text-sm font-bold text-white mb-3">Atividades recentes</h3>
        <div className="space-y-3">
          {atividades.map((act, i) => (
            <div key={i} className="p-3 bg-darkBg border border-cardBorder rounded-xl text-xs">
              <p className="font-semibold text-white">{act.title}</p>
              <p className="text-gray-400 mt-0.5">{act.desc}</p>
              <span className="text-[10px] text-gray-500 mt-2 block">{act.time}</span>
            </div>
          ))}
        </div>
      </div>
    </aside>
  );
}