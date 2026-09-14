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
            className={`bg-white border border-slate-200 rounded-xl shadow-sm hover:shadow-md transition-shadow p-4 border-l-4 ${
              card.alerta ? 'border-l-rose-600' : 'border-l-slate-900'
            }`}
          >
            <div className="flex items-center gap-2.5 mb-3">
              <div className={`p-2 rounded-lg shrink-0 ${card.alerta ? 'bg-rose-50' : 'bg-slate-100'}`}>
                <Icon className={card.alerta ? 'text-rose-600' : 'text-slate-600'} size={18} />
              </div>
              <p className="text-slate-500 text-[11px] font-semibold uppercase tracking-wide leading-tight">
                {card.title}
              </p>
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