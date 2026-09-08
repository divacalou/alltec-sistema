import React from 'react';
import { Users, UserPlus, UserMinus, AlertTriangle } from 'lucide-react';

export function KpiCards({ kpis }) {
  const cards = [
    {
      title: 'Total de Colaboradores',
      value: kpis?.total_colaboradores || 0,
      badge: '+2%',
      subtitle: 'ativos na empresa',
      icon: Users,
      iconColor: 'text-red-600',
      borderColor: 'border-l-4 border-l-red-600'
    },
    {
      title: 'Admissões (mês)',
      value: kpis?.admissoes_mes || 0,
      badge: '+50%',
      subtitle: 'novos colaboradores',
      icon: UserPlus,
      iconColor: 'text-emerald-600',
      borderColor: 'border-l-4 border-l-emerald-600'
    },
    {
      title: 'Afastamentos (mês)',
      value: kpis?.afastamentos_mes || 0,
      badge: '-33%',
      subtitle: 'licenças médicas',
      icon: UserMinus,
      iconColor: 'text-amber-600',
      borderColor: 'border-l-4 border-l-amber-500'
    },
    {
      title: 'Ocorrências (mês)',
      value: kpis?.ocorrencias_mes || 0,
      badge: '-44%',
      subtitle: 'registradas',
      icon: AlertTriangle,
      iconColor: 'text-gray-800',
      borderColor: 'border-l-4 border-l-gray-800'
    }
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
      {cards.map((card, index) => {
        const IconComponent = card.icon;
        return (
          <div
            key={index}
            className={`bg-white border border-gray-200 p-5 rounded-xl shadow-sm hover:shadow-md transition-shadow ${card.borderColor}`}
          >
            <div className="flex justify-between items-start">
              <div>
                <p className="text-gray-500 text-xs font-semibold uppercase tracking-wider">{card.title}</p>
                <div className="flex items-baseline gap-2 mt-2">
                  <span className="text-3xl font-extrabold text-gray-900">{card.value}</span>
                  <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">{card.badge}</span>
                </div>
              </div>
              <div className="p-2.5 bg-gray-50 rounded-lg">
                <IconComponent className={card.iconColor} size={22} />
              </div>
            </div>
            <p className="text-gray-400 text-xs mt-3">{card.subtitle}</p>
          </div>
        );
      })}
    </div>
  );
}

export default KpiCards;