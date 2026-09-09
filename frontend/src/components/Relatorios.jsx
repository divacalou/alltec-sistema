import React, { useState } from 'react';
import { BarChart3, FileSpreadsheet, FileText, Download, Filter } from 'lucide-react';

export default function Relatorios() {
  const [tipoRelatorio, setTipoRelatorio] = useState('ficha_epi');

  return (
    <div className="space-y-6">
      {/* Cabeçalho */}
      <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm flex justify-between items-center">
        <div>
          <h1 className="text-xl font-bold text-gray-900 flex items-center gap-2">
            <BarChart3 className="text-red-600" size={24} /> Emissão de Relatórios
          </h1>
          <p className="text-xs text-gray-500 mt-1">
            Gere fichas individuais, extratos de entrega de EPIs, controle de ASOs e exportações.
          </p>
        </div>
      </div>

      {/* Seletor de Tipo e Filtros */}
      <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm space-y-4">
        <h2 className="text-sm font-semibold text-gray-800 uppercase tracking-wider flex items-center gap-2">
          <Filter size={16} className="text-red-600" /> Parâmetros do Relatório
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">Tipo de Relatório</label>
            <select
              value={tipoRelatorio}
              onChange={(e) => setTipoRelatorio(e.target.value)}
              className="w-full bg-gray-50 border border-gray-300 rounded-lg p-2.5 text-sm text-gray-800 focus:ring-2 focus:ring-red-500 focus:outline-none"
            >
              <option value="ficha_epi">Ficha Individual de EPI (Assinatura)</option>
              <option value="extrato_asos">Extrato de ASOs / PCMSO</option>
              <option value="ocorrencias_setor">Ocorrências por Setor</option>
              <option value="estoque_critico">Posição de Estoque de EPIs</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">Setor</label>
            <select className="w-full bg-gray-50 border border-gray-300 rounded-lg p-2.5 text-sm text-gray-800 focus:ring-2 focus:ring-red-500 focus:outline-none">
              <option value="">Todos os Setores</option>
              <option value="producao">Produção / Asfalto</option>
              <option value="manutencao">Manutenção</option>
              <option value="administrativo">Administrativo</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">Período</label>
            <input
              type="month"
              className="w-full bg-gray-50 border border-gray-300 rounded-lg p-2 text-sm text-gray-800 focus:ring-2 focus:ring-red-500 focus:outline-none"
            />
          </div>
        </div>

        {/* Botões de Ação */}
        <div className="flex gap-3 pt-2">
          <button className="bg-red-600 hover:bg-red-700 text-white text-xs font-bold px-4 py-2.5 rounded-lg flex items-center gap-2 transition-all shadow-sm">
            <FileText size={16} /> Gerar PDF
          </button>
          <button className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold px-4 py-2.5 rounded-lg flex items-center gap-2 transition-all shadow-sm">
            <FileSpreadsheet size={16} /> Exportar Excel (.xlsx)
          </button>
        </div>
      </div>

      {/* Pré-visualização de Documentos */}
      <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm space-y-3">
        <h3 className="text-sm font-bold text-gray-800">Relatórios Recentes & Modelos Rápidos</h3>
        <div className="divide-y divide-gray-100">
          <div className="py-3 flex justify-between items-center">
            <div className="flex items-center gap-3">
              <FileText className="text-red-600" size={20} />
              <div>
                <p className="text-sm font-semibold text-gray-800">Ficha_EPI_Carlos_Eduardo.pdf</p>
                <p className="text-xs text-gray-500">Gerado em 08/09/2026 às 14:30</p>
              </div>
            </div>
            <button className="text-gray-600 hover:text-red-600 p-2">
              <Download size={18} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}