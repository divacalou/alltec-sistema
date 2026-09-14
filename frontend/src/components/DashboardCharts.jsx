import React, { useEffect, useState } from 'react';
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, PieChart, Pie, Cell } from 'recharts';
import { api } from '../services/api';

// Paleta de setores dentro da mesma família slate/rose do design system.
const CORES_SETORES = ['#0f172a', '#334155', '#64748b', '#94a3b8', '#cbd5e1', '#e11d48'];
const NOMES_MESES = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];

// Aceita tanto data_admissao no formato ISO (AAAA-MM-DD, o que o formulário
// atual de Colaboradores grava) quanto no formato legado DD/MM/AAAA (caso
// existam registros antigos no banco de uma versão anterior do sistema),
// evitando que o gráfico fique vazio por causa de um formato inesperado.
const chaveMesDeData = (dataString) => {
  if (!dataString) return null;
  const bruta = dataString.split('T')[0];

  if (/^\d{4}-\d{2}-\d{2}$/.test(bruta)) {
    return bruta.slice(0, 7); // "AAAA-MM"
  }

  const partesBr = bruta.split('/');
  if (partesBr.length === 3) {
    return `${partesBr[2]}-${partesBr[1].padStart(2, '0')}`;
  }

  return null;
};

// Como o backend não expõe um endpoint de série histórica de headcount,
// a série de "admissões" é computada aqui a partir da data_admissao real
// de cada colaborador (já retornada por /colaboradores).
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
  const [dataLinha, setDataLinha] = useState([]);
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
      setDataLinha(construirSerieAdmissoes(Array.isArray(resColaboradores.data) ? resColaboradores.data : []));
    } catch (err) {
      console.error('Erro ao carregar dados do dashboard:', err);
      setErro(true);
      setDataRosca([]);
      setDataLinha([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
      <div className="flex justify-between items-center mb-6 border-b border-slate-100 pb-4">
        <div>
          <h2 className="text-base font-bold text-slate-900">Admissões e Distribuição por Setor</h2>
          <p className="text-xs text-slate-500">Acompanhamento operacional dos colaboradores</p>
        </div>
        <span className="text-xs font-semibold text-rose-700 bg-rose-50 border border-rose-100 px-3 py-1 rounded-full">
          Dados em tempo real
        </span>
      </div>

      {erro && (
        <p className="text-xs text-rose-600 mb-4">
          Não foi possível carregar os dados do dashboard. Verifique se o backend está no ar e tente atualizar a página.
        </p>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-center">
        <div className="lg:col-span-2">
          <div className="h-72">
            {loading ? (
              <div className="h-full flex items-center justify-center text-xs text-slate-400">Carregando gráfico...</div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={dataLinha}>
                  <XAxis dataKey="mes" stroke="#94a3b8" fontSize={12} tickLine={false} />
                  <YAxis stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} allowDecimals={false} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#ffffff',
                      borderColor: '#e2e8f0',
                      borderRadius: '8px',
                      boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                    }}
                  />
                  <Line type="monotone" dataKey="colaboradores" name="Admissões" stroke="#0f172a" strokeWidth={3} dot={{ fill: '#0f172a', r: 5 }} />
                </LineChart>
              </ResponsiveContainer>
            )}
          </div>
          <p className="text-[11px] text-slate-400 text-center mt-1">Admissões registradas nos últimos 6 meses</p>
        </div>

        <div className="flex flex-col items-center justify-center border-l border-slate-100 pl-4">
          <div className="w-48 h-48 relative">
            {loading ? (
              <div className="h-full flex items-center justify-center text-xs text-slate-400">Carregando...</div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={dataRosca.length > 0 ? dataRosca : [{ name: 'Sem dados', value: 1, color: '#e2e8f0' }]}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
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
              <span className="text-3xl font-extrabold text-slate-900">{total}</span>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Total</span>
            </div>
          </div>

          <div className="w-full space-y-2 mt-4">
            {dataRosca.length === 0 && !loading ? (
              <p className="text-xs text-slate-400 text-center">
                Nenhum colaborador ativo com setor atribuído ainda. Associe um setor na tela de Colaboradores para
                este gráfico ser preenchido.
              </p>
            ) : (
              dataRosca.map((item) => (
                <div key={item.name} className="flex justify-between items-center text-xs">
                  <div className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-md shrink-0" style={{ backgroundColor: item.color }}></span>
                    <span className="text-slate-600 font-medium">{item.name}</span>
                  </div>
                  <span className="font-bold text-slate-900">{item.value}</span>
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