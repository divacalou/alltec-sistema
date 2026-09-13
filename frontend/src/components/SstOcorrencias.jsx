import React, { useState, useEffect } from 'react';
import { ShieldAlert, Plus, AlertTriangle, CheckCircle2, RotateCcw, X, Search, RefreshCw } from 'lucide-react';
import { api } from '../services/api';

const formatarDataBR = (dataString) => {
  if (!dataString) return '—';
  const partes = dataString.split('T')[0].split('-');
  if (partes.length !== 3) return dataString;
  return `${partes[2]}/${partes[1]}/${partes[0]}`;
};

const estadoInicialForm = {
  colaborador_id: '',
  tipo: '',
  data: new Date().toISOString().split('T')[0],
  gravidade: 'Baixa',
  descricao: ''
};

const badgeGravidadeClasses = (gravidade) => {
  if (gravidade === 'Alta') return 'bg-rose-600 text-white border-rose-600';
  if (gravidade === 'Média') return 'bg-rose-100 text-rose-800 border-rose-200';
  return 'bg-slate-100 text-slate-700 border-slate-300';
};

export function SstOcorrencias() {
  const [ocorrencias, setOcorrencias] = useState([]);
  const [colaboradores, setColaboradores] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalAberto, setModalAberto] = useState(false);
  const [salvando, setSalvando] = useState(false);

  const [busca, setBusca] = useState('');
  const [filtroStatus, setFiltroStatus] = useState('Todas');

  const [formData, setFormData] = useState(estadoInicialForm);

  useEffect(() => {
    carregarDados();
  }, []);

  const carregarDados = async () => {
    setLoading(true);
    try {
      const [resOcorrencias, resColaboradores] = await Promise.all([
        api.get('/ocorrencias'),
        api.get('/colaboradores')
      ]);
      setOcorrencias(resOcorrencias.data || []);
      setColaboradores(resColaboradores.data || []);
    } catch (error) {
      console.error('Erro ao carregar dados de SST:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.colaborador_id || !formData.tipo.trim()) {
      alert('Preencha os campos obrigatórios!');
      return;
    }

    setSalvando(true);
    try {
      await api.post('/ocorrencias', formData);
      setModalAberto(false);
      setFormData(estadoInicialForm);
      carregarDados();
    } catch (error) {
      alert('Erro ao salvar ocorrência: ' + (error.response?.data?.detail || error.message));
    } finally {
      setSalvando(false);
    }
  };

  const handleAlternarStatus = async (ocorrencia) => {
    const statusAtual = ocorrencia.status || 'Pendente';
    const novoStatus = statusAtual === 'Resolvido' ? 'Pendente' : 'Resolvido';

    try {
      await api.patch(`/ocorrencias/${ocorrencia.id}`, { status: novoStatus });
      setOcorrencias((prev) =>
        prev.map((o) => (o.id === ocorrencia.id ? { ...o, status: novoStatus } : o))
      );
    } catch (error) {
      alert('Erro ao atualizar status: ' + (error.response?.data?.detail || error.message));
    }
  };

  const totalOcorrencias = ocorrencias.length;
  const totalPendentes = ocorrencias.filter((o) => (o.status || 'Pendente') === 'Pendente').length;
  const totalResolvidas = totalOcorrencias - totalPendentes;

  const ocorrenciasFiltradas = ocorrencias.filter((o) => {
    const statusAtual = o.status || 'Pendente';
    const combinaStatus = filtroStatus === 'Todas' || statusAtual === filtroStatus;

    const termo = busca.toLowerCase();
    const combinaBusca =
      !termo ||
      (o.colaborador_nome || '').toLowerCase().includes(termo) ||
      (o.tipo || '').toLowerCase().includes(termo);

    return combinaStatus && combinaBusca;
  });

  return (
    <div className="space-y-6 bg-slate-50 min-h-screen p-6 text-slate-800">
      {/* Header */}
      <div className="flex flex-wrap justify-between items-center bg-white p-5 rounded-xl border border-slate-200 shadow-sm gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <ShieldAlert className="text-rose-600" size={24} />
            Gestão de SST & Ocorrências
          </h2>
          <p className="text-xs text-slate-500 mt-1">Registro de incidentes e condições de risco operacionais.</p>
        </div>
        <button
          onClick={() => setModalAberto(true)}
          className="bg-slate-900 hover:bg-slate-800 text-white px-4 py-2.5 rounded-lg text-xs font-bold flex items-center gap-2 shadow-sm transition-all"
        >
          <Plus size={16} /> Nova Ocorrência
        </button>
      </div>

      {/* Métricas */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-slate-500 uppercase">Total de Ocorrências</span>
            <h3 className="text-2xl font-bold text-slate-900 mt-1">{totalOcorrencias}</h3>
          </div>
          <div className="p-3 bg-slate-100 rounded-lg text-slate-600">
            <ShieldAlert size={20} />
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-slate-500 uppercase">Pendentes</span>
            <h3 className={`text-2xl font-bold mt-1 ${totalPendentes > 0 ? 'text-rose-600' : 'text-slate-700'}`}>{totalPendentes}</h3>
          </div>
          <div className={`p-3 rounded-lg border ${totalPendentes > 0 ? 'bg-rose-50 text-rose-600 border-rose-100' : 'bg-slate-100 text-slate-500 border-slate-200'}`}>
            <AlertTriangle size={20} />
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-slate-500 uppercase">Resolvidas</span>
            <h3 className="text-2xl font-bold text-slate-700 mt-1">{totalResolvidas}</h3>
          </div>
          <div className="p-3 bg-slate-100 rounded-lg text-slate-500">
            <CheckCircle2 size={20} />
          </div>
        </div>
      </div>

      {/* Filtros */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col sm:flex-row justify-between items-center gap-3">
        <div className="relative w-full sm:max-w-xs">
          <Search className="absolute left-3 top-2.5 text-slate-400" size={16} />
          <input
            type="text"
            placeholder="Buscar por colaborador ou tipo..."
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            className="w-full bg-slate-50 border border-slate-300 rounded-lg pl-9 pr-3 py-2 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-500/20"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <div className="bg-slate-100 p-1 rounded-lg border border-slate-200 flex items-center gap-1">
            {['Pendente', 'Resolvido', 'Todas'].map((opcao) => (
              <button
                key={opcao}
                onClick={() => setFiltroStatus(opcao)}
                className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all ${
                  filtroStatus === opcao ? 'bg-slate-900 text-white shadow' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {opcao === 'Pendente' ? 'Pendentes' : opcao === 'Resolvido' ? 'Resolvidas' : 'Todas'}
              </button>
            ))}
          </div>

          <button
            onClick={carregarDados}
            className="p-2 bg-slate-100 border border-slate-200 hover:bg-slate-200 text-slate-600 rounded-lg transition-all shrink-0"
            title="Atualizar"
          >
            <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
          </button>
        </div>
      </div>

      {/* Tabela */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
        {loading ? (
          <div className="p-8 text-center text-slate-500 text-sm">Carregando dados do banco de dados...</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                  <th className="p-4">Colaborador</th>
                  <th className="p-4">Tipo de Ocorrência</th>
                  <th className="p-4">Data</th>
                  <th className="p-4">Gravidade</th>
                  <th className="p-4">Status</th>
                  <th className="p-4 text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm">
                {ocorrenciasFiltradas.length > 0 ? (
                  ocorrenciasFiltradas.map((item) => {
                    const statusAtual = item.status || 'Pendente';
                    const isPendente = statusAtual === 'Pendente';

                    return (
                      <tr key={item.id} className="hover:bg-slate-50 transition-colors">
                        <td className="p-4 font-semibold text-slate-900">{item.colaborador_nome || 'Não Informado'}</td>
                        <td className="p-4 text-slate-600">{item.tipo}</td>
                        <td className="p-4 text-slate-500 text-xs">{formatarDataBR(item.data)}</td>
                        <td className="p-4">
                          <span className={`px-2.5 py-1 rounded-full text-xs font-bold border ${badgeGravidadeClasses(item.gravidade)}`}>
                            {item.gravidade || 'Baixa'}
                          </span>
                        </td>
                        <td className="p-4">
                          <span
                            className={`flex items-center gap-1.5 text-xs font-semibold w-fit px-2.5 py-1 rounded-full border ${
                              isPendente
                                ? 'bg-rose-100 text-rose-800 border-rose-200'
                                : 'bg-slate-100 text-slate-700 border-slate-300'
                            }`}
                          >
                            {isPendente ? <AlertTriangle size={13} /> : <CheckCircle2 size={13} />}
                            {statusAtual}
                          </span>
                        </td>
                        <td className="p-4 text-right">
                          <button
                            onClick={() => handleAlternarStatus(item)}
                            className={`text-xs font-bold px-3 py-1.5 rounded-lg border inline-flex items-center gap-1.5 transition-all ${
                              isPendente
                                ? 'bg-slate-900 hover:bg-slate-800 text-white border-slate-900'
                                : 'bg-white hover:bg-slate-50 text-slate-600 border-slate-300'
                            }`}
                          >
                            {isPendente ? (
                              <>
                                <CheckCircle2 size={13} /> Marcar Resolvido
                              </>
                            ) : (
                              <>
                                <RotateCcw size={13} /> Reabrir
                              </>
                            )}
                          </button>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan="6" className="p-6 text-center text-slate-400 text-xs">
                      Nenhuma ocorrência encontrada para este filtro.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal de Nova Ocorrência */}
      {modalAberto && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden">
            <div className="flex justify-between items-center p-5 border-b border-slate-100 bg-slate-50">
              <h3 className="font-bold text-slate-900">Registrar Ocorrência de SST</h3>
              <button onClick={() => setModalAberto(false)} className="text-slate-400 hover:text-slate-600">
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-5 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Colaborador *</label>
                <select
                  className="w-full border border-slate-300 rounded-lg p-2.5 text-sm text-slate-800 focus:ring-2 focus:ring-slate-500/20 focus:outline-none"
                  value={formData.colaborador_id}
                  onChange={(e) => setFormData({ ...formData, colaborador_id: e.target.value })}
                  required
                >
                  <option value="">Selecione o colaborador...</option>
                  {colaboradores.map((c) => (
                    <option key={c.id} value={c.id}>{c.nome} ({c.cargo})</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Tipo de Ocorrência *</label>
                <input
                  type="text"
                  placeholder="Ex: Não uso de capacete, Incidente com veículo"
                  className="w-full border border-slate-300 rounded-lg p-2.5 text-sm text-slate-800 focus:ring-2 focus:ring-slate-500/20 focus:outline-none"
                  value={formData.tipo}
                  onChange={(e) => setFormData({ ...formData, tipo: e.target.value })}
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Data</label>
                  <input
                    type="date"
                    className="w-full border border-slate-300 rounded-lg p-2.5 text-sm text-slate-800 focus:ring-2 focus:ring-slate-500/20 focus:outline-none"
                    value={formData.data}
                    onChange={(e) => setFormData({ ...formData, data: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Gravidade</label>
                  <select
                    className="w-full border border-slate-300 rounded-lg p-2.5 text-sm text-slate-800 focus:ring-2 focus:ring-slate-500/20 focus:outline-none"
                    value={formData.gravidade}
                    onChange={(e) => setFormData({ ...formData, gravidade: e.target.value })}
                  >
                    <option value="Baixa">Baixa</option>
                    <option value="Média">Média</option>
                    <option value="Alta">Alta</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Descrição</label>
                <textarea
                  rows="3"
                  placeholder="Detalhes do que aconteceu..."
                  className="w-full border border-slate-300 rounded-lg p-2.5 text-sm text-slate-800 focus:ring-2 focus:ring-slate-500/20 focus:outline-none"
                  value={formData.descricao}
                  onChange={(e) => setFormData({ ...formData, descricao: e.target.value })}
                ></textarea>
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setModalAberto(false)}
                  className="px-4 py-2 border border-slate-300 rounded-lg text-sm text-slate-700 hover:bg-slate-50"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={salvando}
                  className="px-4 py-2 bg-slate-900 hover:bg-slate-800 disabled:opacity-60 disabled:cursor-not-allowed text-white rounded-lg text-sm font-semibold shadow-sm"
                >
                  {salvando ? 'Salvando...' : 'Salvar Ocorrência'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default SstOcorrencias;