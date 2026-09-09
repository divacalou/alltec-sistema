import React from 'react';
import { 
  LayoutDashboard, 
  Users, 
  Package, 
  ShieldCheck, 
  Stethoscope, 
  AlertTriangle, 
  FileSpreadsheet, 
  Settings 
} from 'lucide-react';

export default function Sidebar({ activeTab, setActiveTab }) {
  const menuItems = [
    { id: 'dashboard', name: 'Dashboard', icon: LayoutDashboard },
    { id: 'colaboradores', name: 'Colaboradores', icon: Users },
    { id: 'epis', name: 'Estoque de EPIs', icon: Package },
    { id: 'sst', name: 'Entrega de EPIs', icon: ShieldCheck },
    { id: 'pcmso', name: 'PCMSO / ASOs', icon: Stethoscope },
    { id: 'pendencias', name: 'Central de Pendências', icon: AlertTriangle },
    { id: 'relatorios', name: 'Relatórios', icon: FileSpreadsheet },
    { id: 'configuracoes', name: 'Configurações', icon: Settings },
  ];

  return (
    <aside className="w-64 bg-[#0d1117] text-gray-300 flex flex-col border-r border-gray-800">
      {/* Logo Header */}
      <div className="p-6 flex items-center gap-3 border-b border-gray-800/60">
        <div className="bg-red-600 text-white font-black text-xl w-10 h-10 rounded-xl flex items-center justify-center shadow-lg shadow-red-900/40">
          P
        </div>
        <div>
          <h2 className="text-lg font-black tracking-wider text-white">PLANNA</h2>
          <p className="text-[10px] text-gray-500 font-semibold tracking-widest uppercase">RH & SST</p>
        </div>
      </div>

      {/* Menu Navigation */}
      <nav className="flex-1 p-4 space-y-1.5 overflow-y-auto">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id || activeTab === item.name;

          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-center gap-3.5 px-4 py-3 rounded-xl text-xs font-bold transition-all duration-200 ${
                isActive
                  ? 'bg-red-600 text-white shadow-md shadow-red-900/30 font-extrabold'
                  : 'text-gray-400 hover:bg-gray-800/40 hover:text-white'
              }`}
            >
              <Icon size={18} className={isActive ? 'text-white' : 'text-gray-400'} />
              <span>{item.name}</span>
            </button>
          );
        })}
      </nav>
    </aside>
  );
}