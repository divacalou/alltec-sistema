import React from 'react';
import { LayoutDashboard, Users, ShieldAlert, Stethoscope, AlertTriangle, Clock, HardHat, FileText, BarChart3, Settings } from 'lucide-react';

export function Sidebar({ activeTab, setActiveTab }) {
  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'colaboradores', label: 'Colaboradores', icon: Users },
    { id: 'sst', label: 'SST', icon: ShieldAlert },
    { id: 'medicina', label: 'Medicina Ocupacional', icon: Stethoscope },
    { id: 'ocorrencias', label: 'Ocorrências', icon: AlertTriangle },
    { id: 'pendencias', label: 'Pendências', icon: Clock, badge: '12' },
    { id: 'epis', label: "EPI's", icon: HardHat },
    { id: 'pcmso', label: 'PCMSO', icon: FileText },
    { id: 'relatorios', label: 'Relatórios', icon: BarChart3 },
    { id: 'configuracoes', label: 'Configurações', icon: Settings },
  ];

  return (
    <aside className="w-64 bg-[#1a1f26] text-gray-300 flex flex-col justify-between h-full border-r border-gray-800 shadow-xl">
      <div>
        {/* Topo com Identidade Visual do Asfalto */}
        <div className="p-5 border-b border-gray-800 bg-[#14181f] flex flex-col items-center justify-center">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-2xl font-black text-red-600 tracking-tighter">PLANNA</span>
            <span className="text-xs bg-amber-500 text-black font-extrabold px-1.5 py-0.5 rounded">ASFALTO</span>
          </div>
          <span className="text-[10px] font-bold tracking-widest text-gray-400 uppercase">
            Planna RH
          </span>
        </div>

        {/* Links de Navegação */}
        <nav className="p-3 space-y-1">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`w-full flex items-center justify-between px-4 py-2.5 rounded-lg text-sm font-medium transition-all ${
                  isActive
                    ? 'bg-red-600 text-white font-semibold shadow-md shadow-red-900/40'
                    : 'text-gray-400 hover:bg-gray-800/60 hover:text-white'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon size={18} className={isActive ? 'text-white' : 'text-gray-400'} />
                  <span>{item.label}</span>
                </div>
                {item.badge && (
                  <span className="bg-amber-500 text-gray-950 font-bold text-[11px] px-2 py-0.5 rounded-full">
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Slogan no Rodapé do Menu */}
      <div className="p-4 border-t border-gray-800 bg-[#14181f] text-center">
        <p className="text-[11px] text-gray-400 font-medium">
          Pessoas seguras, empresas mais fortes.
        </p>
        <p className="text-[10px] font-bold text-red-500 mt-0.5 uppercase tracking-wider">
          Planna RH
        </p>
      </div>
    </aside>
  );
}

export default Sidebar;