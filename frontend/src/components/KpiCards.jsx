import React from 'react';
import { Users, UserPlus, UserMinus, AlertTriangle } from 'lucide-react';

export function KpiCards({ kpis, loading }) {
  const valor = (campo) => {
    if (loading || !kpis) return '—';
    return kpis[campo] ?? 0;
  };

  const cards = [
    {
      title: 'Total de Colaboradores',
      value: valor('total_colaboradores'),
      subtitle: 'ativos na empresa',
      icon: Users,
      alerta: false
    },
    {
      title: 'Admissões (mês)',
      value: valor('admissoes_mes'),
      subtitle: 'novos colaboradores este mês',
      icon: UserPlus,
      alerta: false
    },
    {
      title: 'Afastamentos (mês)',
      value: valor('afastamentos_mes'),
      subtitle: 'desligamentos registrados este mês',
      icon: UserMinus,
      alerta: Number(kpis?.afastamentos_mes || 0) > 0
    },
    {
      title: 'Ocorrências (mês)',
      value: valor('ocorrencias_mes'),
      subtitle: 'registradas este mês',
      icon: AlertTriangle,
      alerta: Number(kpis?.ocorrencias_mes || 0) > 0
    }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {cards.map((card, index) => {
        const Icon = card.icon;
        return (
          <div
            key={index}
            className="bg-white rounded-2xl p-5 border border-slate-200/70 shadow-sm hover:shadow-md transition-shadow"
          >
            <div className="flex items-start justify-between mb-4">
              <p className="text-slate-500 text-[11px] font-semibold uppercase tracking-wide leading-tight max-w-[68%]">
                {card.title}
              </p>
              <div className="bg-rose-50 text-rose-600 p-2.5 rounded-xl shrink-0">
                <Icon size={18} />
              </div>
            </div>

            <span className={`block text-3xl font-extrabold leading-none ${card.alerta ? 'text-rose-600' : 'text-slate-900'}`}>
              {card.value}
            </span>

            <p className="text-slate-400 text-xs mt-2 leading-snug">{card.subtitle}</p>
          </div>
        );
      })}
    </div>
  );
}

export default KpiCards;