import React, { useState } from 'react';
import { Settings, Plus, Save, Bell, Building2, Briefcase } from 'lucide-react';

export default function Configuracoes() {
  const [diasAlertaAso, setDiasAlertaAso] = useState(30);
  const [diasAlertaEpi, setDiasAlertaEpi] = useState(15);

  return (
    <div className="space-y-6">
      {/* Cabeçalho */}
      <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
        <h1 className="text-xl font-bold text-gray-900 flex items-center gap-2">
          <Settings className="text-red-600" size={24} /> Configurações do Sistema
        </h1>
        <p className="text-xs text-gray-500 mt-1">
          Gerencie cadastros auxiliares de setores, funções e parâmetros globais de alertas.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Parâmetros de Alerta */}
        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm space-y-4">
          <h2 className="text-sm font-bold text-gray-800 uppercase tracking-wider flex items-center gap-2">
            <Bell size={18} className="text-amber-500" /> Prazos de Antecedência para Alerta
          </h2>

          <div className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                Alerta de Vencimento de ASO (dias antes)
              </label>
              <input
                type="number"
                value={diasAlertaAso}
                onChange={(e) => setDiasAlertaAso(e.target.value)}
                className="w-full bg-gray-50 border border-gray-300 rounded-lg p-2 text-sm text-gray-800 focus:ring-2 focus:ring-red-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                Alerta de Substituição de EPI (dias antes)
              </label>
              <input
                type="number"
                value={diasAlertaEpi}
                onChange={(e) => setDiasAlertaEpi(e.target.value)}
                className="w-full bg-gray-50 border border-gray-300 rounded-lg p-2 text-sm text-gray-800 focus:ring-2 focus:ring-red-500 focus:outline-none"
              />
            </div>

            <button className="bg-red-600 hover:bg-red-700 text-white text-xs font-bold px-4 py-2.5 rounded-lg flex items-center gap-2 shadow-sm transition-all">
              <Save size={16} /> Salvar Parâmetros
            </button>
          </div>
        </div>

        {/* Gerenciamento de Setores */}
        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-sm font-bold text-gray-800 uppercase tracking-wider flex items-center gap-2">
              <Building2 size={18} className="text-red-600" /> Cadastros de Setores
            </h2>
            <button className="text-red-600 hover:text-red-700 text-xs font-bold flex items-center gap-1">
              <Plus size={14} /> Novo Setor
            </button>
          </div>

          <div className="space-y-2">
            {['Operação / Asfalto', 'Manutenção Mecânica', 'Laboratório / Qualidade', 'Administrativo'].map((setor, index) => (
              <div key={index} className="flex justify-between items-center p-2.5 bg-gray-50 rounded-lg text-sm text-gray-700 border border-gray-200">
                <span>{setor}</span>
                <button className="text-xs text-red-600 hover:underline font-semibold">Editar</button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}