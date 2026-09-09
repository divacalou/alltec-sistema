import React, { useEffect, useState } from 'react';
import { AlertTriangle, ShieldAlert, Stethoscope } from 'lucide-react';
import { api } from '../services/api';

export default function Pendencias() {
  const [pendencias, setPendencias] = useState({ asos_criticos: [], epis_estoque_baixo: [] });

  useEffect(() => {
    api.get('/pendencias')
      .then(res => setPendencias(res.data))
      .catch(err => console.error("Erro ao buscar pendências", err));
  }, []);

  return (
    <div className="space-y-6">
      <div className="bg-[#1a1f26] p-5 rounded-xl border border-gray-800">
        <h1 className="text-xl font-black text-white uppercase flex items-center gap-2">
          <AlertTriangle className="text-amber-500" size={24} /> Central de Pendências
        </h1>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* EPIs com Estoque Baixo */}
        <div className="bg-[#1a1f26] p-5 rounded-xl border border-gray-800">
          <h2 className="text-sm font-bold text-gray-400 uppercase flex items-center gap-2 mb-4">
            <ShieldAlert className="text-red-500" size={18} /> EPIs Críticos / Reposição
          </h2>
          {pendencias.epis_estoque_baixo.length === 0 ? (
            <p className="text-xs text-gray-500">Nenhum EPI em nível crítico.</p>
          ) : (
            pendencias.epis_estoque_baixo.map(e => (
              <div key={e.id} className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg flex justify-between items-center mb-2">
                <span className="text-sm font-bold text-white">{e.nome}</span>
                <span className="text-xs font-bold text-red-400">Saldo: {e.quantidade_estoque} un</span>
              </div>
            ))
          )}
        </div>

        {/* Exames ASO Vencendo */}
        <div className="bg-[#1a1f26] p-5 rounded-xl border border-gray-800">
          <h2 className="text-sm font-bold text-gray-400 uppercase flex items-center gap-2 mb-4">
            <Stethoscope className="text-amber-500" size={18} /> ASOs Vencendo
          </h2>
          {pendencias.asos_criticos.length === 0 ? (
            <p className="text-xs text-gray-500">Nenhum exame vencendo nos próximos 30 dias.</p>
          ) : (
            pendencias.asos_criticos.map(a => (
              <div key={a.id} className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-lg flex justify-between items-center mb-2">
                <span className="text-sm font-bold text-white">{a.colaborador_nome}</span>
                <span className="text-xs font-bold text-amber-400">Vence: {a.data_proximo_exame}</span>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}