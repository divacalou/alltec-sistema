import React, { useEffect, useState } from 'react';
import { AlertTriangle, ShieldAlert, Stethoscope, RefreshCw } from 'lucide-react';
import { api } from '../services/api';

const formatarDataBR = (dataString) => {
  if (!dataString) return '—';
  const partes = dataString.split('T')[0].split('-');
  if (partes.length !== 3) return dataString;
  return `${partes[2]}/${partes[1]}/${partes[0]}`;
};

export default function Pendencias() {
  const [pendencias, setPendencias] = useState({ asos_criticos: [], epis_estoque_baixo: [] });
  const [configuracoes, setConfiguracoes] = useState({ dias_alerta_aso: '30', dias_alerta_epi: '15' });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    carregarPendencias();
    carregarConfiguracoes();
  }, []);

  const carregarPendencias = async () => {
    setLoading(true);
    try {
      const res = await api.get('/pendencias');
      setPendencias(res.data || { asos_criticos: [], epis_estoque_baixo: [] });
    } catch (err) {
      console.error('Erro ao buscar pendências', err);
    } finally {
      setLoading(false);
    }
  };

  const carregarConfiguracoes = async () => {
    try {
      const res = await api.get('/configuracoes');
      setConfiguracoes(res.data || {});
    } catch (err) {
      console.error('Erro ao buscar configurações', err);
    }
  };

  const hojeISO = new Date().toISOString().split('T')[0];
  const totalAsos = pendencias.asos_criticos.length;
  const totalEpis = pendencias.epis_estoque_baixo.length;

  return (
    <div className="space-y-6 bg-slate-50 min-h-screen p-6 text-slate-800">
      {/* Cabeçalho */}
      <div className="flex flex-wrap justify-between items-center bg-white p-5 rounded-xl border border-slate-200 shadow-sm gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <AlertTriangle className="text-rose-600" size={24} /> Central de Pendências
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Itens que exigem atenção imediata: exames ocupacionais e estoque de EPIs.
          </p>
        </div>
        <button
          onClick={carregarPendencias}
          className="p-2 bg-slate-100 border border-slate-200 hover:bg-slate-200 text-slate-600 rounded-lg transition-all"
          title="Atualizar"
        >
          <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* EPIs Críticos / Reposição */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex justify-between items-center gap-3 mb-1">
            <h2 className="text-sm font-bold text-slate-700 uppercase flex items-center gap-2">
              <ShieldAlert className={totalEpis > 0 ? 'text-rose-600' : 'text-slate-400'} size={18} />
              EPIs Críticos / Reposição
            </h2>
            <span
              className={`text-xs font-bold px-2.5 py-1 rounded-full border shrink-0 ${
                totalEpis > 0 ? 'bg-rose-100 text-rose-800 border-rose-200' : 'bg-slate-100 text-slate-500 border-slate-200'
              }`}
            >
              {totalEpis} {totalEpis === 1 ? 'item' : 'itens'}
            </span>
          </div>
          <p className="text-[11px] text-slate-400 mb-4">Abaixo da quantidade mínima cadastrada.</p>

          {loading ? (
            <p className="text-xs text-slate-400">Carregando...</p>
          ) : pendencias.epis_estoque_baixo.length === 0 ? (
            <p className="text-xs text-slate-400">Nenhum EPI em nível crítico. Estoque sob controle.</p>
          ) : (
            <div className="space-y-2">
              {pendencias.epis_estoque_baixo.map((e) => {
                const esgotado = Number(e.quantidade_estoque) <= 0;
                return (
                  <div key={e.id} className="p-3 bg-rose-50 border border-rose-200 rounded-lg flex justify-between items-center gap-3">
                    <div>
                      <span className="text-sm font-bold text-slate-900 block">{e.nome}</span>
                      <span className="text-[11px] text-slate-500">
                        C.A. {e.ca || '—'} · Mínimo cadastrado: {e.quantidade_minima} un
                      </span>
                    </div>
                    <span
                      className={`text-[10px] font-bold px-2.5 py-1 rounded-full border whitespace-nowrap ${
                        esgotado ? 'bg-rose-600 text-white border-rose-600' : 'bg-rose-100 text-rose-800 border-rose-200'
                      }`}
                    >
                      {esgotado ? 'ESGOTADO' : `SALDO: ${e.quantidade_estoque} UN`}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* ASOs Vencendo */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex justify-between items-center gap-3 mb-1">
            <h2 className="text-sm font-bold text-slate-700 uppercase flex items-center gap-2">
              <Stethoscope className={totalAsos > 0 ? 'text-rose-600' : 'text-slate-400'} size={18} />
              ASOs Vencendo
            </h2>
            <span
              className={`text-xs font-bold px-2.5 py-1 rounded-full border shrink-0 ${
                totalAsos > 0 ? 'bg-rose-100 text-rose-800 border-rose-200' : 'bg-slate-100 text-slate-500 border-slate-200'
              }`}
            >
              {totalAsos} {totalAsos === 1 ? 'item' : 'itens'}
            </span>
          </div>
          <p className="text-[11px] text-slate-400 mb-4">
            Janela de alerta: {configuracoes.dias_alerta_aso || 30} dias.
          </p>

          {loading ? (
            <p className="text-xs text-slate-400">Carregando...</p>
          ) : pendencias.asos_criticos.length === 0 ? (
            <p className="text-xs text-slate-400">Nenhum exame vencendo no período configurado.</p>
          ) : (
            <div className="space-y-2">
              {pendencias.asos_criticos.map((a) => {
                const vencido = a.data_proximo_exame < hojeISO;
                return (
                  <div key={a.id} className="p-3 bg-rose-50 border border-rose-200 rounded-lg space-y-1.5">
                    <div className="flex justify-between items-start gap-3">
                      <div>
                        <span className="text-sm font-bold text-slate-900 block">{a.colaborador_nome}</span>
                        <span className="text-[11px] text-slate-500">{a.tipo_exame}</span>
                      </div>
                      <span
                        className={`text-[10px] font-bold px-2.5 py-1 rounded-full border whitespace-nowrap ${
                          vencido ? 'bg-rose-600 text-white border-rose-600' : 'bg-rose-100 text-rose-800 border-rose-200'
                        }`}
                      >
                        {vencido ? 'VENCIDO' : `VENCE: ${formatarDataBR(a.data_proximo_exame)}`}
                      </span>
                    </div>

                    {(a.tem_insalubridade || a.tem_periculosidade) && (
                      <div className="flex flex-wrap gap-1.5 pt-1.5 border-t border-rose-200/60">
                        {a.tem_insalubridade ? (
                          <span className="bg-white text-slate-700 border border-slate-300 text-[10px] font-bold px-2 py-0.5 rounded">
                            Insalub. {a.grau_insalubridade || 'Não especificado'}
                          </span>
                        ) : null}
                        {a.tem_periculosidade ? (
                          <span className="bg-white text-slate-700 border border-slate-300 text-[10px] font-bold px-2 py-0.5 rounded">
                            Pericul. {a.percentual_periculosidade ? `${a.percentual_periculosidade}%` : 'Não especificado'}
                          </span>
                        ) : null}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}