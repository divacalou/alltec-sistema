import React from 'react';
import {
  LayoutDashboard,
  Users,
  ShieldCheck,
  Stethoscope,
  ShieldAlert,
  AlertTriangle,
  FileSpreadsheet,
  Settings
} from 'lucide-react';

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
  return (
    <aside className="w-64 bg-slate-900 text-slate-300 flex flex-col border-r border-slate-800 shrink-0">
      {/* Logo Header */}
      <div className="p-6 flex items-center gap-3 border-b border-slate-800">
        <div className="bg-rose-600 text-white font-black text-xl w-10 h-10 rounded-xl flex items-center justify-center shadow-lg shadow-rose-900/40">
          P
        </div>
        <div>
          <h2 className="text-lg font-black tracking-wider text-white">PLANNA</h2>
          <p className="text-[10px] text-slate-500 font-semibold tracking-widest uppercase">RH & SST</p>
        </div>
      </div>

      {/* Menu Navigation */}
      <nav className="flex-1 p-4 space-y-1.5 overflow-y-auto">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;

          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-center gap-3.5 px-4 py-3 rounded-xl text-xs font-bold transition-all duration-200 ${
                isActive
                  ? 'bg-rose-600 text-white shadow-md shadow-rose-900/30'
                  : 'text-slate-400 hover:bg-slate-800 hover:text-white'
              }`}
            >
              <Icon size={18} className={isActive ? 'text-white' : 'text-slate-400'} />
              <span>{item.name}</span>
            </button>
          );
        })}
      </nav>

      <div className="p-4 border-t border-slate-800">
        <p className="text-[10px] text-slate-600 text-center">Planna RH & SST © {new Date().getFullYear()}</p>
      </div>
    </aside>
  );
}