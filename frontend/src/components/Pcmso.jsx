import React from 'react';
import { FileText, Plus, Stethoscope, CheckCircle2 } from 'lucide-react';

export default function Pcmso() {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center bg-[#1a1f26] p-5 rounded-xl border border-gray-800">
        <div>
          <h1 className="text-xl font-black text-white uppercase tracking-wide flex items-center gap-2">
            <FileText className="text-red-600" size={24} /> PCMSO & Exames (ASO)
          </h1>
          <p className="text-xs text-gray-400 mt-1">Acompanhamento do Programa de Controle Médico de Saúde Ocupacional.</p>
        </div>
        <button className="bg-red-600 hover:bg-red-700 text-white text-xs font-bold px-4 py-2.5 rounded-lg flex items-center gap-2 shadow-md shadow-red-900/30">
          <Plus size={16} /> LANÇAR ASO
        </button>
      </div>

      <div className="bg-[#1a1f26] rounded-xl border border-gray-800 overflow-hidden">
        <table className="w-full text-left text-sm text-gray-300">
          <thead className="bg-[#14181f] text-gray-400 font-bold uppercase text-[11px] border-b border-gray-800">
            <tr>
              <th className="p-4">Colaborador</th>
              <th className="p-4">Tipo de Exame</th>
              <th className="p-4">Data Exame</th>
              <th className="p-4">Próximo Exame</th>
              <th className="p-4">Resultado</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-800/60">
            <tr className="hover:bg-gray-800/30">
              <td className="p-4 font-bold text-white">Carlos Eduardo Souza</td>
              <td className="p-4 text-gray-400">Periódico (12 meses)</td>
              <td className="p-4 text-gray-400">10/01/2026</td>
              <td className="p-4 font-bold text-amber-500">10/01/2027</td>
              <td className="p-4">
                <span className="bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 text-xs px-2.5 py-1 rounded-md font-bold inline-flex items-center gap-1">
                  <CheckCircle2 size={13} /> APTO
                </span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}