import React, { useEffect, useState } from 'react';
import { ResponsiveContainer, BarChart, Bar, Cell as BarCell, XAxis, YAxis, Tooltip, PieChart, Pie, Cell } from 'recharts';
import { api } from '../services/api';

// Paleta de setores dentro da mesma família slate/rose do design system.
const CORES_SETORES = ['#0f172a', '#334155', '#64748b', '#94a3b8', '#cbd5e1', '#e11d48'];
const NOMES_MESES = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];

// Aceita tanto data_admissao no formato ISO (AAAA-MM-DD) quanto no formato
// legado DD/MM/AAAA (caso existam registros de antes desta refatoração).
const chaveMesDeData = (dataString) => {
  if (!dataString) return null;
  const bruta = dataString.split('T')[0];

  if (/^\d{4}-\d{2}-\d{2}$/.test(bruta)) {
    return bruta.slice(0, 7);
  }

  const partesBr = bruta.split('/');
  if (partesBr.length === 3) {
    return `${partesBr[2]}-${partesBr[1].padStart(2, '0')}`;
  }

  return null;
};

// O backend não expõe uma série histórica de headcount, então a evolução de
// admissões é computada aqui a partir da data_admissao real de cada
// colaborador (já retornada por /colaboradores).
const construirSerieAdmissoes = (colaboradores) => {
  const hoje = new Date();
  const meses = [];
  for (let i = 5; i >= 0; i--) {
    const d = new Date(hoje.getFullYear(), hoje.getMonth() - i, 1);
    meses.push({ chave: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`, mes: NOMES_MESES[d.getMonth()] });
  }
  return meses.map((m) => ({
    mes: m.mes,
    colaboradores: colaboradores.filter((c) => chaveMesDeData(c.data_admissao) === m.chave).length
  }));
};

export function DashboardCharts() {
  const [dataRosca, setDataRosca] = useState([]);
  const [dataAdmissoes, setDataAdmissoes] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState(false);

  useEffect(() => {
    carregarDados();
  }, []);

  const carregarDados = async () => {
    setLoading(true);
    setErro(false);
    try {
      const [resSetores, resColaboradores] = await Promise.all([
        api.get('/colaboradores/setores'),
        api.get('/colaboradores')
      ]);

      const setoresBrutos = Array.isArray(resSetores.data) ? resSetores.data : [];
      const formatado = setoresBrutos
        .map((item, index) => ({
          name: item.setor,
          value: Number(item.quantidade) || 0,
          color: CORES_SETORES[index % CORES_SETORES.length]
        }))
        .filter((item) => item.value > 0);

      setDataRosca(formatado);
      setTotal(formatado.reduce((acc, curr) => acc + curr.value, 0));
      setDataAdmissoes(construirSerieAdmissoes(Array.isArray(resColaboradores.data) ? resColaboradores.data : []));
    } catch (err) {
      console.error('Erro ao carregar dados do dashboard:', err);
      setErro(true);
      setDataRosca([]);
      setDataAdmissoes([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  };

  const totalAdmissoesPeriodo = dataAdmissoes.reduce((acc, m) => acc + m.colaboradores, 0);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Admissões — gráfico de barras (2 colunas) */}
      <div className="lg:col-span-2 bg-white border border-slate-200/70 rounded-2xl p-6 shadow-sm">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h2 className="text-base font-bold text-slate-900">Admissões (últimos 6 meses)</h2>
            <p className="text-xs text-slate-500">Novos colaboradores admitidos por mês</p>
          </div>
          <span className="text-xs font-semibold text-rose-700 bg-rose-50 border border-rose-100 px-3 py-1 rounded-full shrink-0">
            Tempo real
          </span>
        </div>

        {erro && (
          <p className="text-xs text-rose-600 mb-3">
            Não foi possível carregar os dados. Verifique o backend e atualize a página.
          </p>
        )}

        <div className="h-64">
          {loading ? (
            <div className="h-full flex items-center justify-center text-xs text-slate-400">Carregando gráfico...</div>
          ) : totalAdmissoesPeriodo === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center gap-1 border border-dashed border-slate-200 rounded-xl">
              <span className="text-sm font-semibold text-slate-400">Nenhuma admissão no período</span>
              <span className="text-xs text-slate-300">Os últimos 6 meses ainda não têm novos colaboradores cadastrados.</span>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={dataAdmissoes} barCategoryGap="30%">
                <XAxis dataKey="mes" stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} allowDecimals={false} width={28} />
                <Tooltip
                  cursor={{ fill: '#f8fafc' }}
                  contentStyle={{
                    backgroundColor: '#ffffff',
                    borderColor: '#e2e8f0',
                    borderRadius: '8px',
                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                  }}
                />
                <Bar dataKey="colaboradores" name="Admissões" radius={[6, 6, 0, 0]} maxBarSize={42}>
                  {dataAdmissoes.map((entry, index) => (
                    <BarCell key={`barra-${index}`} fill={index === dataAdmissoes.length - 1 ? '#e11d48' : '#334155'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* Distribuição por Setor — gráfico de rosca (1 coluna) */}
      <div className="bg-white border border-slate-200/70 rounded-2xl p-6 shadow-sm flex flex-col">
        <div className="mb-2">
          <h2 className="text-base font-bold text-slate-900">Distribuição por Setor</h2>
          <p className="text-xs text-slate-500">Colaboradores ativos por setor</p>
        </div>

        <div className="flex-1 flex flex-col items-center justify-center">
          <div className="w-40 h-40 relative">
            {loading ? (
              <div className="h-full flex items-center justify-center text-xs text-slate-400">Carregando...</div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={dataRosca.length > 0 ? dataRosca : [{ name: 'Sem dados', value: 1, color: '#e2e8f0' }]}
                    cx="50%"
                    cy="50%"
                    innerRadius={52}
                    outerRadius={72}
                    paddingAngle={dataRosca.length > 1 ? 4 : 0}
                    dataKey="value"
                    isAnimationActive={false}
                  >
                    {(dataRosca.length > 0 ? dataRosca : [{ color: '#e2e8f0' }]).map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
            )}
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <span className="text-2xl font-extrabold text-slate-900">{total}</span>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Total</span>
            </div>
          </div>

          <div className="w-full space-y-2 mt-5">
            {dataRosca.length === 0 && !loading ? (
              <p className="text-xs text-slate-400 text-center">
                Nenhum colaborador ativo com setor atribuído ainda. Associe um setor na tela de Colaboradores.
              </p>
            ) : (
              dataRosca.map((item) => (
                <div key={item.name} className="flex justify-between items-center text-xs">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: item.color }}></span>
                    <span className="text-slate-600 font-medium truncate">{item.name}</span>
                  </div>
                  <span className="font-bold text-slate-900 shrink-0 ml-2">{item.value}</span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default DashboardCharts;