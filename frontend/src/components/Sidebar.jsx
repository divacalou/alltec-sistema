import React, { useState } from 'react';
import {
  LayoutDashboard,
  Users,
  ShieldCheck,
  Stethoscope,
  ShieldAlert,
  AlertTriangle,
  FileSpreadsheet,
  Settings,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import logo from '../assets/logo_planna.png';

const menuItems = [
  { id: 'dashboard', name: 'Dashboard', icon: LayoutDashboard },
  { id: 'colaboradores', name: 'Colaboradores', icon: Users },
  { id: 'epis', name: 'EPIs & Estoque', icon: ShieldCheck },
  { id: 'pcmso', name: 'PCMSO / ASOs', icon: Stethoscope },
  { id: 'ocorrencias', name: 'Ocorrências / SST', icon: ShieldAlert },
  { id: 'pendencias', name: 'Central de Pendências', icon: AlertTriangle },
  { id: 'relatorios', name: 'Relatórios', icon: FileSpreadsheet },
  { id: 'configuracoes', name: 'Configurações', icon: Settings }
];

export default function Sidebar({ activeTab, setActiveTab }) {
  const [recolhida, setRecolhida] = useState(false);

  return (
    <aside
      className={`${
        recolhida ? 'w-20' : 'w-64'
      } bg-slate-900 text-slate-300 flex flex-col border-r border-slate-800 shrink-0 transition-all duration-300 relative`}
    >
      {/* Logo Header */}
      <div className={`flex items-center border-b border-slate-800 ${recolhida ? 'justify-center py-5' : 'justify-center py-6 px-4'}`}>
        <img
          src={logo}
          alt="All Tec"
          className={`object-contain transition-all duration-300 ${recolhida ? 'h-9 w-9' : 'h-14 w-auto max-w-full'}`}
        />
      </div>

      {/* Botão de recolher/expandir */}
      <button
        onClick={() => setRecolhida((prev) => !prev)}
        title={recolhida ? 'Expandir menu' : 'Recolher menu'}
        className="absolute -right-3 top-20 bg-slate-800 hover:bg-rose-600 text-slate-300 hover:text-white border border-slate-700 rounded-full p-1 shadow-md transition-colors z-10"
      >
        {recolhida ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
      </button>

      {/* Menu Navigation */}
      <nav className="flex-1 p-4 space-y-1.5 overflow-y-auto overflow-x-hidden">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;

          return (
            <div key={item.id} className="relative group">
              <button
                onClick={() => setActiveTab(item.id)}
                className={`w-full flex items-center gap-3.5 py-3 rounded-xl text-xs font-bold transition-all duration-200 ${
                  recolhida ? 'justify-center px-0' : 'px-4'
                } ${
                  isActive
                    ? 'bg-rose-600 text-white shadow-md shadow-rose-900/30'
                    : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                }`}
              >
                <Icon size={18} className={`shrink-0 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                {!recolhida && <span>{item.name}</span>}
              </button>

              {/* Tooltip exibido apenas quando a sidebar está recolhida */}
              {recolhida && (
                <span className="pointer-events-none absolute left-full top-1/2 -translate-y-1/2 ml-2 whitespace-nowrap bg-slate-800 text-white text-[11px] font-semibold px-2.5 py-1.5 rounded-md shadow-lg opacity-0 group-hover:opacity-100 transition-opacity z-50">
                  {item.name}
                </span>
              )}
            </div>
          );
        })}
      </nav>

      <div className="p-4 border-t border-slate-800">
        {!recolhida && <p className="text-[10px] text-slate-600 text-center">All Tec RH & SST © {new Date().getFullYear()}</p>}
      </div>
    </aside>
  );
}