import React, { useEffect, useState } from 'react';
import {
  Stethoscope,
  Plus,
  X,
  CheckCircle2,
  AlertTriangle,
  ShieldAlert,
  Briefcase,
  ChevronDown,
  ChevronUp,
  Edit,
  Trash2,
  Eye,
  RefreshCw,
  ClipboardList,
  Info,
  Search
} from 'lucide-react';
import { api } from '../services/api';

const TIPOS_ASO = ['Admissional', 'Periódico', 'Demissional', 'Retorno ao Trabalho', 'Mudança de Risco'];
const RESULTADOS_ASO = ['Apto', 'Inapto', 'Apto com Restrições'];
const GRAUS_INSALUBRIDADE = ['Mínimo (10%)', 'Médio (20%)', 'Máximo (40%)'];

const CAMPO_FLAG_POR_TIPO = {
  Admissional: 'obrigatorio_admissional',
  Periódico: 'obrigatorio_periodico',
  Demissional: 'obrigatorio_demissional',
  'Retorno ao Trabalho': 'obrigatorio_retorno_trabalho',
  'Mudança de Risco': 'obrigatorio_mudanca_risco'
};

const estadoInicialAso = {
  colaborador_id: '',
  tipo_exame: 'Periódico',
  data_exame: new Date().toISOString().split('T')[0],
  resultado: 'Apto',
  medico_crm: '',
  observacoes: ''
};

const estadoInicialFuncao = {
  nome_funcao: '',
  riscos_identificados: '',
  tem_insalubridade: false,
  grau_insalubridade: 'Médio (20%)',
  tem_periculosidade: false,
  percentual_periculosidade: 30,
  observacoes: ''
};

const estadoInicialExame = {
  nome_exame: '',
  periodicidade_meses: 12,
  obrigatorio_admissional: true,
  obrigatorio_periodico: true,
  obrigatorio_demissional: true,
  obrigatorio_retorno_trabalho: false,
  obrigatorio_mudanca_risco: true
};

const formatarDataBR = (dataString) => {
  if (!dataString) return '—';
  const partes = dataString.split('T')[0].split('-');
  if (partes.length !== 3) return dataString;
  return `${partes[2]}/${partes[1]}/${partes[0]}`;
};

const somarMesesPreview = (dataISO, meses) => {
  if (!dataISO || !meses) return null;
  const [ano, mes, dia] = dataISO.split('-').map(Number);
  if (!ano || !mes || !dia) return null;
  const totalMeses = mes - 1 + Number(meses);
  const novoAno = ano + Math.floor(totalMeses / 12);
  const novoMes = (totalMeses % 12) + 1;
  const diasNoMes = new Date(novoAno, novoMes, 0).getDate();
  const novoDia = Math.min(dia, diasNoMes);
  const data = new Date(novoAno, novoMes - 1, novoDia);
  return data.toLocaleDateString('pt-BR');
};

export default function Pcmso() {
  const [activeSubTab, setActiveSubTab] = useState('asos'); // 'asos' | 'matriz'

  // --- Dados gerais ---
  const [asos, setAsos] = useState([]);
  const [colaboradores, setColaboradores] = useState([]);
  const [funcoesPgr, setFuncoesPgr] = useState([]);

  const [loadingAsos, setLoadingAsos] = useState(false);
  const [loadingMatriz, setLoadingMatriz] = useState(false);

  // --- Filtros da aba ASOs ---
  const [busca, setBusca] = useState('');
  const [filtroTipo, setFiltroTipo] = useState('Todos');

  // --- Modal Lançar ASO ---
  const [modalAsoOpen, setModalAsoOpen] = useState(false);
  const [asoForm, setAsoForm] = useState(estadoInicialAso);
  const [matrizFuncaoAtual, setMatrizFuncaoAtual] = useState(null);
  const [carregandoMatrizModal, setCarregandoMatrizModal] = useState(false);
  const [examesSelecionados, setExamesSelecionados] = useState([]);
  const [salvandoAso, setSalvandoAso] = useState(false);

  // --- Modal Detalhes do ASO ---
  const [modalDetalhesOpen, setModalDetalhesOpen] = useState(false);
  const [asoDetalhado, setAsoDetalhado] = useState(null);

  // --- Modal Cadastrar/Editar Função PGR ---
  const [modalFuncaoOpen, setModalFuncaoOpen] = useState(false);
  const [editingFuncaoId, setEditingFuncaoId] = useState(null);
  const [funcaoForm, setFuncaoForm] = useState(estadoInicialFuncao);

  // --- Exames dentro de uma função (inline na Matriz) ---
  const [funcaoExpandidaId, setFuncaoExpandidaId] = useState(null);
  const [novoExameForm, setNovoExameForm] = useState(estadoInicialExame);
  const [editingExameId, setEditingExameId] = useState(null);

  useEffect(() => {
    carregarAsos();
    carregarColaboradores();
    carregarFuncoesPgr();
  }, []);

  const carregarAsos = async () => {
    setLoadingAsos(true);
    try {
      const res = await api.get('/pcmso/exames');
      setAsos(res.data || []);
    } catch (err) {
      console.error('Erro ao carregar ASOs', err);
    } finally {
      setLoadingAsos(false);
    }
  };

  const carregarColaboradores = async () => {
    try {
      const res = await api.get('/colaboradores');
      setColaboradores(res.data || []);
    } catch (err) {
      console.error('Erro ao carregar colaboradores', err);
    }
  };

  const carregarFuncoesPgr = async () => {
    setLoadingMatriz(true);
    try {
      const res = await api.get('/pgr/funcoes');
      setFuncoesPgr(res.data || []);
    } catch (err) {
      console.error('Erro ao carregar matriz PGR', err);
    } finally {
      setLoadingMatriz(false);
    }
  };

  // ----------------------------------------------------------------------
  // MODAL LANÇAR ASO — automação PGR/PCMSO
  // ----------------------------------------------------------------------
  const resetAsoForm = () => {
    setAsoForm(estadoInicialAso);
    setMatrizFuncaoAtual(null);
    setExamesSelecionados([]);
  };

  const handleAbrirModalAso = () => {
    resetAsoForm();
    setModalAsoOpen(true);
  };

  const carregarMatrizPorCargo = async (cargo) => {
    setCarregandoMatrizModal(true);
    try {
      const res = await api.get('/pgr/funcoes/mapa', { params: { cargo } });
      setMatrizFuncaoAtual(res.data || null);
    } catch (err) {
      console.error('Erro ao carregar matriz da função', err);
      setMatrizFuncaoAtual(null);
    } finally {
      setCarregandoMatrizModal(false);
    }
  };

  const handleColaboradorAsoChange = (colaboradorId) => {
    setAsoForm((prev) => ({ ...prev, colaborador_id: colaboradorId }));

    const colaborador = colaboradores.find((c) => Number(c.id) === Number(colaboradorId));
    if (colaborador && colaborador.cargo) {
      carregarMatrizPorCargo(colaborador.cargo);
    } else {
      setMatrizFuncaoAtual(null);
      setExamesSelecionados([]);
    }
  };

  // Sempre que a matriz carregada ou o tipo de ASO mudar, reconstrói a lista de
  // exames sugeridos, marcando como selecionados os que se aplicam àquele tipo.
  useEffect(() => {
    if (!matrizFuncaoAtual || !Array.isArray(matrizFuncaoAtual.exames)) {
      setExamesSelecionados([]);
      return;
    }
    const campoFlag = CAMPO_FLAG_POR_TIPO[asoForm.tipo_exame];
    const selecionados = matrizFuncaoAtual.exames.map((ex) => ({
      nome_exame: ex.nome_exame,
      periodicidade_meses: ex.periodicidade_meses,
      selecionado: campoFlag ? Boolean(ex[campoFlag]) : true,
      origemMatriz: true
    }));
    setExamesSelecionados(selecionados);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [matrizFuncaoAtual, asoForm.tipo_exame]);

  const toggleExameSelecionado = (index) => {
    setExamesSelecionados((prev) =>
      prev.map((ex, i) => (i === index ? { ...ex, selecionado: !ex.selecionado } : ex))
    );
  };

  const atualizarPeriodicidadeExame = (index, valor) => {
    setExamesSelecionados((prev) =>
      prev.map((ex, i) => (i === index ? { ...ex, periodicidade_meses: parseInt(valor, 10) || null } : ex))
    );
  };

  const atualizarNomeExameManual = (index, valor) => {
    setExamesSelecionados((prev) =>
      prev.map((ex, i) => (i === index ? { ...ex, nome_exame: valor } : ex))
    );
  };

  const adicionarExameManualNaLista = () => {
    setExamesSelecionados((prev) => [
      ...prev,
      { nome_exame: '', periodicidade_meses: 12, selecionado: true, origemMatriz: false }
    ]);
  };

  const removerExameDaLista = (index) => {
    setExamesSelecionados((prev) => prev.filter((_, i) => i !== index));
  };

  const examesAtivos = examesSelecionados.filter((ex) => ex.selecionado && ex.nome_exame && ex.nome_exame.trim());
  const periodicidadesAtivas = examesAtivos.map((ex) => Number(ex.periodicidade_meses)).filter(Boolean);
  const periodicidadeBasePreview = periodicidadesAtivas.length > 0 ? Math.min(...periodicidadesAtivas) : 12;
  const proximaDataPreview =
    asoForm.tipo_exame !== 'Demissional' ? somarMesesPreview(asoForm.data_exame, periodicidadeBasePreview) : null;

  const handleLancarAso = async (e) => {
    e.preventDefault();

    if (!asoForm.colaborador_id) {
      alert('Selecione um colaborador.');
      return;
    }
    if (!asoForm.data_exame) {
      alert('Informe a data do exame.');
      return;
    }
    if (!asoForm.resultado) {
      alert('Informe o resultado do exame.');
      return;
    }

    const examesParaEnviar = examesSelecionados
      .filter((ex) => ex.selecionado && ex.nome_exame && ex.nome_exame.trim())
      .map((ex) => ({
        nome_exame: ex.nome_exame.trim(),
        periodicidade_meses: ex.periodicidade_meses ? Number(ex.periodicidade_meses) : null
      }));

    const payload = {
      colaborador_id: Number(asoForm.colaborador_id),
      tipo_exame: asoForm.tipo_exame,
      data_exame: asoForm.data_exame,
      resultado: asoForm.resultado,
      medico_crm: asoForm.medico_crm || null,
      observacoes: asoForm.observacoes || null,
      funcao_pgr_id: matrizFuncaoAtual?.id || null,
      tem_insalubridade: Boolean(matrizFuncaoAtual?.tem_insalubridade),
      grau_insalubridade: matrizFuncaoAtual?.grau_insalubridade || null,
      tem_periculosidade: Boolean(matrizFuncaoAtual?.tem_periculosidade),
      percentual_periculosidade: matrizFuncaoAtual?.percentual_periculosidade || null,
      exames_realizados: examesParaEnviar
    };

    setSalvandoAso(true);
    try {
      await api.post('/pcmso/exames', payload);
      setModalAsoOpen(false);
      resetAsoForm();
      carregarAsos();
    } catch (err) {
      alert('Erro ao registrar ASO: ' + (err.response?.data?.detail || err.message));
    } finally {
      setSalvandoAso(false);
    }
  };

  const handleVerDetalhes = (aso) => {
    setAsoDetalhado(aso);
    setModalDetalhesOpen(true);
  };

  // ----------------------------------------------------------------------
  // MATRIZ DE RISCO / PGR POR FUNÇÃO
  // ----------------------------------------------------------------------
  const handleAbrirModalNovaFuncao = () => {
    setEditingFuncaoId(null);
    setFuncaoForm(estadoInicialFuncao);
    setModalFuncaoOpen(true);
  };

  const handleEditarFuncao = (funcao) => {
    setEditingFuncaoId(funcao.id);
    setFuncaoForm({
      nome_funcao: funcao.nome_funcao || '',
      riscos_identificados: funcao.riscos_identificados || '',
      tem_insalubridade: Boolean(funcao.tem_insalubridade),
      grau_insalubridade: funcao.grau_insalubridade || 'Médio (20%)',
      tem_periculosidade: Boolean(funcao.tem_periculosidade),
      percentual_periculosidade: funcao.percentual_periculosidade || 30,
      observacoes: funcao.observacoes || ''
    });
    setModalFuncaoOpen(true);
  };

  const handleSalvarFuncao = async (e) => {
    e.preventDefault();
    if (!funcaoForm.nome_funcao.trim()) {
      alert('O nome da função é obrigatório.');
      return;
    }

    const payload = {
      nome_funcao: funcaoForm.nome_funcao.trim(),
      riscos_identificados: funcaoForm.riscos_identificados || null,
      tem_insalubridade: funcaoForm.tem_insalubridade,
      grau_insalubridade: funcaoForm.tem_insalubridade ? funcaoForm.grau_insalubridade : null,
      tem_periculosidade: funcaoForm.tem_periculosidade,
      percentual_periculosidade: funcaoForm.tem_periculosidade ? Number(funcaoForm.percentual_periculosidade) : null,
      observacoes: funcaoForm.observacoes || null
    };

    try {
      if (editingFuncaoId) {
        await api.put(`/pgr/funcoes/${editingFuncaoId}`, payload);
      } else {
        await api.post('/pgr/funcoes', payload);
      }
      setModalFuncaoOpen(false);
      setEditingFuncaoId(null);
      setFuncaoForm(estadoInicialFuncao);
      carregarFuncoesPgr();
    } catch (err) {
      alert('Erro ao salvar função: ' + (err.response?.data?.detail || err.message));
    }
  };

  const handleExcluirFuncao = async (funcao) => {
    if (!window.confirm(`Remover a função "${funcao.nome_funcao}" da matriz PGR? Todos os exames vinculados a ela serão removidos.`)) {
      return;
    }
    try {
      await api.delete(`/pgr/funcoes/${funcao.id}`);
      carregarFuncoesPgr();
    } catch (err) {
      alert('Erro ao remover função: ' + (err.response?.data?.detail || err.message));
    }
  };

  const toggleExpandirFuncao = (funcaoId) => {
    setFuncaoExpandidaId((prev) => (prev === funcaoId ? null : funcaoId));
    setEditingExameId(null);
    setNovoExameForm(estadoInicialExame);
  };

  const handleEditarExame = (funcaoId, exame) => {
    setFuncaoExpandidaId(funcaoId);
    setEditingExameId(exame.id);
    setNovoExameForm({
      nome_exame: exame.nome_exame || '',
      periodicidade_meses: exame.periodicidade_meses || 12,
      obrigatorio_admissional: Boolean(exame.obrigatorio_admissional),
      obrigatorio_periodico: Boolean(exame.obrigatorio_periodico),
      obrigatorio_demissional: Boolean(exame.obrigatorio_demissional),
      obrigatorio_retorno_trabalho: Boolean(exame.obrigatorio_retorno_trabalho),
      obrigatorio_mudanca_risco: Boolean(exame.obrigatorio_mudanca_risco)
    });
  };

  const handleCancelarExame = () => {
    setEditingExameId(null);
    setNovoExameForm(estadoInicialExame);
  };

  const handleSalvarExame = async (funcaoId, e) => {
    e.preventDefault();
    if (!novoExameForm.nome_exame.trim()) {
      alert('Informe o nome do exame.');
      return;
    }

    try {
      if (editingExameId) {
        await api.put(`/pgr/exames/${editingExameId}`, novoExameForm);
      } else {
        await api.post(`/pgr/funcoes/${funcaoId}/exames`, novoExameForm);
      }
      setNovoExameForm(estadoInicialExame);
      setEditingExameId(null);
      carregarFuncoesPgr();
    } catch (err) {
      alert('Erro ao salvar exame: ' + (err.response?.data?.detail || err.message));
    }
  };

  const handleExcluirExame = async (exameId) => {
    if (!window.confirm('Remover este exame da matriz?')) return;
    try {
      await api.delete(`/pgr/exames/${exameId}`);
      carregarFuncoesPgr();
    } catch (err) {
      alert('Erro ao remover exame: ' + (err.response?.data?.detail || err.message));
    }
  };

  // ----------------------------------------------------------------------
  // Filtros / métricas
  // ----------------------------------------------------------------------
  const em30dias = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
  const totalAsos = asos.length;
  const vencendo30 = asos.filter((a) => a.tipo_exame !== 'Demissional' && a.data_proximo_exame && a.data_proximo_exame <= em30dias).length;
  const totalInaptos = asos.filter((a) => a.resultado === 'Inapto').length;

  const asosFiltrados = asos.filter((a) => {
    const termo = busca.toLowerCase();
    const combinaBusca =
      !termo ||
      (a.colaborador_nome || '').toLowerCase().includes(termo) ||
      (a.cargo || '').toLowerCase().includes(termo);
    const combinaTipo = filtroTipo === 'Todos' || a.tipo_exame === filtroTipo;
    return combinaBusca && combinaTipo;
  });

  return (
    <div className="space-y-6 bg-slate-50 min-h-screen p-6 text-slate-800">
      {/* Cabeçalho */}
      <div className="flex flex-wrap justify-between items-center bg-white p-5 rounded-xl border border-slate-200 shadow-sm gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <Stethoscope className="text-rose-600" size={24} /> PCMSO & Exames (ASO)
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Controle de exames ocupacionais integrado à matriz de risco (PGR) por função.
          </p>
        </div>

        {activeSubTab === 'asos' ? (
          <button
            onClick={handleAbrirModalAso}
            className="bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold px-4 py-2.5 rounded-lg flex items-center gap-2 shadow-sm transition-all"
          >
            <Plus size={16} /> LANÇAR ASO
          </button>
        ) : (
          <button
            onClick={handleAbrirModalNovaFuncao}
            className="bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold px-4 py-2.5 rounded-lg flex items-center gap-2 shadow-sm transition-all"
          >
            <Plus size={16} /> NOVA FUNÇÃO NA MATRIZ
          </button>
        )}
      </div>

      {/* Navegação entre Sub-abas */}
      <div className="flex border-b border-slate-200 gap-4">
        <button
          onClick={() => setActiveSubTab('asos')}
          className={`pb-3 text-xs font-bold flex items-center gap-2 border-b-2 transition-all ${
            activeSubTab === 'asos' ? 'border-slate-900 text-slate-900' : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <ClipboardList size={16} /> ASOs Lançados
        </button>
        <button
          onClick={() => setActiveSubTab('matriz')}
          className={`pb-3 text-xs font-bold flex items-center gap-2 border-b-2 transition-all ${
            activeSubTab === 'matriz' ? 'border-slate-900 text-slate-900' : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <ShieldAlert size={16} /> Matriz de Risco / PGR por Função
        </button>
      </div>

      {/* ==================== ABA 1: ASOs LANÇADOS ==================== */}
      {activeSubTab === 'asos' && (
        <div className="space-y-6">
          {/* Métricas */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
              <div>
                <span className="text-xs font-semibold text-slate-500 uppercase">ASOs Registrados</span>
                <h3 className="text-2xl font-bold text-slate-900 mt-1">{totalAsos}</h3>
              </div>
              <div className="p-3 bg-slate-100 rounded-lg text-slate-600">
                <ClipboardList size={20} />
              </div>
            </div>

            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
              <div>
                <span className="text-xs font-semibold text-slate-500 uppercase">Vencendo em 30 dias</span>
                <h3 className={`text-2xl font-bold mt-1 ${vencendo30 > 0 ? 'text-rose-600' : 'text-slate-700'}`}>{vencendo30}</h3>
              </div>
              <div className={`p-3 rounded-lg border ${vencendo30 > 0 ? 'bg-rose-50 text-rose-600 border-rose-100' : 'bg-slate-100 text-slate-500 border-slate-200'}`}>
                <AlertTriangle size={20} />
              </div>
            </div>

            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
              <div>
                <span className="text-xs font-semibold text-slate-500 uppercase">Resultado Inapto</span>
                <h3 className={`text-2xl font-bold mt-1 ${totalInaptos > 0 ? 'text-rose-600' : 'text-slate-700'}`}>{totalInaptos}</h3>
              </div>
              <div className={`p-3 rounded-lg border ${totalInaptos > 0 ? 'bg-rose-50 text-rose-600 border-rose-100' : 'bg-slate-100 text-slate-500 border-slate-200'}`}>
                <ShieldAlert size={20} />
              </div>
            </div>
          </div>

          {/* Tabela */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden space-y-4 p-4">
            <div className="flex flex-col sm:flex-row justify-between items-center gap-3">
              <div className="relative w-full sm:max-w-xs">
                <Search className="absolute left-3 top-2.5 text-slate-400" size={16} />
                <input
                  type="text"
                  placeholder="Buscar por colaborador ou cargo..."
                  value={busca}
                  onChange={(e) => setBusca(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg pl-9 pr-3 py-2 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-500/20"
                />
              </div>

              <div className="flex items-center gap-2 w-full sm:w-auto">
                <select
                  value={filtroTipo}
                  onChange={(e) => setFiltroTipo(e.target.value)}
                  className="w-full sm:w-auto bg-slate-50 border border-slate-300 rounded-lg p-2 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-500/20"
                >
                  <option value="Todos">Todos os tipos</option>
                  {TIPOS_ASO.map((tipo) => (
                    <option key={tipo} value={tipo}>{tipo}</option>
                  ))}
                </select>

                <button
                  onClick={carregarAsos}
                  className="p-2 bg-slate-100 border border-slate-200 hover:bg-slate-200 text-slate-600 rounded-lg transition-all shrink-0"
                  title="Atualizar Tabela"
                >
                  <RefreshCw size={16} className={loadingAsos ? 'animate-spin' : ''} />
                </button>
              </div>
            </div>

            <div className="overflow-x-auto border border-slate-200 rounded-lg">
              <table className="w-full text-left text-sm text-slate-700">
                <thead className="bg-slate-50 text-slate-600 font-bold uppercase text-[11px] border-b border-slate-200">
                  <tr>
                    <th className="p-3.5">Colaborador</th>
                    <th className="p-3.5">Tipo de ASO</th>
                    <th className="p-3.5">Data Exame</th>
                    <th className="p-3.5">Próximo Exame</th>
                    <th className="p-3.5">Risco da Função</th>
                    <th className="p-3.5">Resultado</th>
                    <th className="p-3.5 text-right">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {loadingAsos ? (
                    <tr><td colSpan="7" className="p-4 text-center text-slate-500 text-xs">Carregando dados...</td></tr>
                  ) : asosFiltrados.length === 0 ? (
                    <tr><td colSpan="7" className="p-4 text-center text-slate-500 text-xs">Nenhum ASO encontrado.</td></tr>
                  ) : (
                    asosFiltrados.map((a) => {
                      const isVencendo = a.tipo_exame !== 'Demissional' && a.data_proximo_exame && a.data_proximo_exame <= em30dias;
                      return (
                        <tr key={a.id} className="hover:bg-slate-50 transition-all">
                          <td className="p-3.5 font-semibold text-slate-900">
                            {a.colaborador_nome}
                            <span className="block text-[11px] font-normal text-slate-500">{a.cargo}</span>
                          </td>
                          <td className="p-3.5 text-slate-700">{a.tipo_exame}</td>
                          <td className="p-3.5 text-slate-600 text-xs">{formatarDataBR(a.data_exame)}</td>
                          <td className="p-3.5 text-xs">
                            {a.tipo_exame === 'Demissional' ? (
                              <span className="text-slate-400">—</span>
                            ) : (
                              <span className={isVencendo ? 'text-rose-600 font-bold flex items-center gap-1' : 'text-slate-700 font-semibold'}>
                                {isVencendo && <AlertTriangle size={13} />}
                                {formatarDataBR(a.data_proximo_exame)}
                              </span>
                            )}
                          </td>
                          <td className="p-3.5">
                            <div className="flex flex-wrap gap-1">
                              {a.tem_insalubridade ? (
                                <span className="bg-slate-100 text-slate-700 border border-slate-300 text-[10px] font-bold px-2 py-0.5 rounded">
                                  Insalub. {a.grau_insalubridade || ''}
                                </span>
                              ) : null}
                              {a.tem_periculosidade ? (
                                <span className="bg-slate-100 text-slate-700 border border-slate-300 text-[10px] font-bold px-2 py-0.5 rounded">
                                  Pericul. {a.percentual_periculosidade ? `${a.percentual_periculosidade}%` : ''}
                                </span>
                              ) : null}
                              {!a.tem_insalubridade && !a.tem_periculosidade && (
                                <span className="text-slate-400 text-[11px]">—</span>
                              )}
                            </div>
                          </td>
                          <td className="p-3.5">
                            <span
                              className={`text-xs px-2.5 py-1 rounded-md font-bold inline-flex items-center gap-1 border ${
                                a.resultado === 'Inapto'
                                  ? 'bg-rose-100 text-rose-800 border-rose-200'
                                  : 'bg-slate-100 text-slate-700 border-slate-300'
                              }`}
                            >
                              {a.resultado === 'Inapto' ? <AlertTriangle size={13} /> : <CheckCircle2 size={13} />}
                              {a.resultado?.toUpperCase()}
                            </span>
                          </td>
                          <td className="p-3.5 text-right">
                            <button
                              onClick={() => handleVerDetalhes(a)}
                              title="Ver Detalhes"
                              className="p-1.5 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                            >
                              <Eye size={15} />
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ==================== ABA 2: MATRIZ DE RISCO / PGR ==================== */}
      {activeSubTab === 'matriz' && (
        <div className="space-y-4">
          {loadingMatriz ? (
            <div className="bg-white p-6 rounded-xl border border-slate-200 text-center text-slate-500 text-xs">
              Carregando matriz de risco...
            </div>
          ) : funcoesPgr.length === 0 ? (
            <div className="bg-white p-8 rounded-xl border border-dashed border-slate-300 text-center space-y-2">
              <ShieldAlert className="mx-auto text-slate-300" size={32} />
              <p className="text-sm font-semibold text-slate-600">Nenhuma função cadastrada na matriz PGR ainda.</p>
              <p className="text-xs text-slate-400">
                Cadastre as funções e seus exames exigidos para que o modal "Lançar ASO" carregue tudo automaticamente.
              </p>
            </div>
          ) : (
            funcoesPgr.map((funcao) => {
              const expandida = funcaoExpandidaId === funcao.id;
              return (
                <div key={funcao.id} className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                  <div className="p-4 flex flex-wrap justify-between items-start gap-3">
                    <button
                      onClick={() => toggleExpandirFuncao(funcao.id)}
                      className="flex items-start gap-3 text-left flex-1 min-w-[220px]"
                    >
                      <div className="p-2.5 bg-slate-100 rounded-lg text-slate-600 mt-0.5">
                        <Briefcase size={18} />
                      </div>
                      <div>
                        <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                          {funcao.nome_funcao}
                          {expandida ? <ChevronUp size={15} className="text-slate-400" /> : <ChevronDown size={15} className="text-slate-400" />}
                        </h3>
                        <p className="text-xs text-slate-500 mt-0.5 max-w-2xl">
                          {funcao.riscos_identificados || 'Nenhum risco descrito.'}
                        </p>
                        <div className="flex flex-wrap gap-1.5 mt-2">
                          {funcao.tem_insalubridade && (
                            <span className="bg-slate-100 text-slate-700 border border-slate-300 text-[10px] font-bold px-2 py-0.5 rounded">
                              Insalubridade: {funcao.grau_insalubridade || 'Não especificado'}
                            </span>
                          )}
                          {funcao.tem_periculosidade && (
                            <span className="bg-slate-100 text-slate-700 border border-slate-300 text-[10px] font-bold px-2 py-0.5 rounded">
                              Periculosidade: {funcao.percentual_periculosidade ? `${funcao.percentual_periculosidade}%` : 'Não especificado'}
                            </span>
                          )}
                          <span className="bg-white text-slate-500 border border-slate-200 text-[10px] font-bold px-2 py-0.5 rounded">
                            {funcao.exames?.length || 0} exame(s) cadastrado(s)
                          </span>
                        </div>
                      </div>
                    </button>

                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => handleEditarFuncao(funcao)}
                        title="Editar Função"
                        className="p-1.5 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                      >
                        <Edit size={15} />
                      </button>
                      <button
                        onClick={() => handleExcluirFuncao(funcao)}
                        title="Excluir Função"
                        className="p-1.5 text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </div>

                  {expandida && (
                    <div className="border-t border-slate-200 bg-slate-50 p-4 space-y-3">
                      {funcao.exames && funcao.exames.length > 0 && (
                        <div className="overflow-x-auto border border-slate-200 rounded-lg bg-white">
                          <table className="w-full text-left text-xs text-slate-700">
                            <thead className="bg-slate-100 text-slate-600 font-bold uppercase text-[10px] border-b border-slate-200">
                              <tr>
                                <th className="p-2.5">Exame</th>
                                <th className="p-2.5">Periodicidade</th>
                                <th className="p-2.5">Aplicável a</th>
                                <th className="p-2.5 text-right">Ações</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                              {funcao.exames.map((exame) => {
                                const aplicaveis = [
                                  exame.obrigatorio_admissional && 'Admissional',
                                  exame.obrigatorio_periodico && 'Periódico',
                                  exame.obrigatorio_demissional && 'Demissional',
                                  exame.obrigatorio_retorno_trabalho && 'Retorno ao Trabalho',
                                  exame.obrigatorio_mudanca_risco && 'Mudança de Risco'
                                ].filter(Boolean);
                                return (
                                  <tr key={exame.id} className="hover:bg-slate-50">
                                    <td className="p-2.5 font-semibold text-slate-900">{exame.nome_exame}</td>
                                    <td className="p-2.5 text-slate-600">{exame.periodicidade_meses} meses</td>
                                    <td className="p-2.5 text-slate-500">
                                      {aplicaveis.length > 0 ? aplicaveis.join(', ') : '—'}
                                    </td>
                                    <td className="p-2.5 text-right">
                                      <div className="flex items-center justify-end gap-1">
                                        <button
                                          onClick={() => handleEditarExame(funcao.id, exame)}
                                          className="p-1 text-slate-500 hover:bg-slate-100 rounded"
                                          title="Editar"
                                        >
                                          <Edit size={13} />
                                        </button>
                                        <button
                                          onClick={() => handleExcluirExame(exame.id)}
                                          className="p-1 text-rose-600 hover:bg-rose-50 rounded"
                                          title="Excluir"
                                        >
                                          <Trash2 size={13} />
                                        </button>
                                      </div>
                                    </td>
                                  </tr>
                                );
                              })}
                            </tbody>
                          </table>
                        </div>
                      )}

                      {/* Formulário de adicionar/editar exame */}
                      <form
                        onSubmit={(e) => handleSalvarExame(funcao.id, e)}
                        className="bg-white border border-slate-200 rounded-lg p-3 space-y-3"
                      >
                        <p className="text-[11px] font-bold text-slate-600 uppercase">
                          {editingExameId ? 'Editar Exame' : 'Adicionar Exame a Esta Função'}
                        </p>

                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                          <div className="sm:col-span-2">
                            <input
                              type="text"
                              placeholder="Ex: Audiometria, Hemograma, Espirometria..."
                              className="w-full border border-slate-300 rounded-lg p-2 text-xs text-slate-800 focus:outline-none focus:border-slate-500"
                              value={novoExameForm.nome_exame}
                              onChange={(e) => setNovoExameForm({ ...novoExameForm, nome_exame: e.target.value })}
                            />
                          </div>
                          <div>
                            <input
                              type="number"
                              min="1"
                              placeholder="Periodicidade (meses)"
                              className="w-full border border-slate-300 rounded-lg p-2 text-xs text-slate-800 focus:outline-none focus:border-slate-500"
                              value={novoExameForm.periodicidade_meses}
                              onChange={(e) => setNovoExameForm({ ...novoExameForm, periodicidade_meses: parseInt(e.target.value, 10) || 12 })}
                            />
                          </div>
                        </div>

                        <div className="flex flex-wrap gap-3 pt-1">
                          {[
                            ['obrigatorio_admissional', 'Admissional'],
                            ['obrigatorio_periodico', 'Periódico'],
                            ['obrigatorio_demissional', 'Demissional'],
                            ['obrigatorio_retorno_trabalho', 'Retorno ao Trabalho'],
                            ['obrigatorio_mudanca_risco', 'Mudança de Risco']
                          ].map(([campo, label]) => (
                            <label key={campo} className="flex items-center gap-1.5 text-[11px] font-semibold text-slate-600 cursor-pointer">
                              <input
                                type="checkbox"
                                className="accent-slate-900 w-3.5 h-3.5"
                                checked={novoExameForm[campo]}
                                onChange={(e) => setNovoExameForm({ ...novoExameForm, [campo]: e.target.checked })}
                              />
                              {label}
                            </label>
                          ))}
                        </div>

                        <div className="flex justify-end gap-2 pt-1">
                          {editingExameId && (
                            <button
                              type="button"
                              onClick={handleCancelarExame}
                              className="px-3 py-1.5 border border-slate-300 text-slate-600 hover:bg-slate-50 text-[11px] font-bold rounded-lg"
                            >
                              Cancelar
                            </button>
                          )}
                          <button
                            type="submit"
                            className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white text-[11px] font-bold rounded-lg"
                          >
                            {editingExameId ? 'Salvar Alterações' : 'Adicionar Exame'}
                          </button>
                        </div>
                      </form>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      )}

      {/* ==================== MODAL: LANÇAR ASO (inteligente) ==================== */}
      {modalAsoOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex justify-center items-center p-4 z-50">
          <div className="bg-white border border-slate-200 rounded-xl w-full max-w-2xl p-6 space-y-4 max-h-[90vh] overflow-y-auto shadow-xl">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <Stethoscope className="text-slate-700" size={20} /> Lançar ASO
              </h3>
              <button onClick={() => setModalAsoOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleLancarAso} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Colaborador *</label>
                  <select
                    required
                    className="w-full border border-slate-300 rounded-lg p-2 text-sm text-slate-800 focus:outline-none focus:border-slate-500"
                    value={asoForm.colaborador_id}
                    onChange={(e) => handleColaboradorAsoChange(e.target.value)}
                  >
                    <option value="">Selecione o colaborador...</option>
                    {colaboradores.map((c) => (
                      <option key={c.id} value={c.id}>{c.nome} {c.cargo ? `— ${c.cargo}` : ''}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Tipo de ASO *</label>
                  <select
                    required
                    className="w-full border border-slate-300 rounded-lg p-2 text-sm text-slate-800 focus:outline-none focus:border-slate-500"
                    value={asoForm.tipo_exame}
                    onChange={(e) => setAsoForm({ ...asoForm, tipo_exame: e.target.value })}
                  >
                    {TIPOS_ASO.map((tipo) => (
                      <option key={tipo} value={tipo}>{tipo}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Painel de automação PGR/PCMSO */}
              {carregandoMatrizModal ? (
                <div className="text-xs text-slate-500 flex items-center gap-2 p-3 bg-slate-50 border border-slate-200 rounded-lg">
                  <RefreshCw size={14} className="animate-spin" /> Carregando matriz de risco da função...
                </div>
              ) : asoForm.colaborador_id && !matrizFuncaoAtual ? (
                <div className="text-xs text-slate-600 flex items-start gap-2 p-3 bg-slate-50 border border-dashed border-slate-300 rounded-lg">
                  <Info size={15} className="text-slate-400 mt-0.5 shrink-0" />
                  <span>
                    Nenhuma função cadastrada na matriz PGR para este cargo. Adicione os exames manualmente abaixo, ou
                    cadastre a função na aba "Matriz de Risco / PGR por Função".
                  </span>
                </div>
              ) : matrizFuncaoAtual ? (
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg space-y-2">
                  <p className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                    <ShieldAlert size={14} className="text-slate-500" /> Riscos da função: {matrizFuncaoAtual.nome_funcao}
                  </p>
                  {matrizFuncaoAtual.riscos_identificados && (
                    <p className="text-xs text-slate-600">{matrizFuncaoAtual.riscos_identificados}</p>
                  )}
                  <div className="flex flex-wrap gap-1.5">
                    {matrizFuncaoAtual.tem_insalubridade && (
                      <span className="bg-white text-slate-700 border border-slate-300 text-[10px] font-bold px-2 py-0.5 rounded">
                        Insalubridade: {matrizFuncaoAtual.grau_insalubridade || 'Não especificado'}
                      </span>
                    )}
                    {matrizFuncaoAtual.tem_periculosidade && (
                      <span className="bg-white text-slate-700 border border-slate-300 text-[10px] font-bold px-2 py-0.5 rounded">
                        Periculosidade: {matrizFuncaoAtual.percentual_periculosidade ? `${matrizFuncaoAtual.percentual_periculosidade}%` : 'Não especificado'}
                      </span>
                    )}
                    {!matrizFuncaoAtual.tem_insalubridade && !matrizFuncaoAtual.tem_periculosidade && (
                      <span className="text-slate-400 text-[11px]">Sem adicionais de insalubridade/periculosidade.</span>
                    )}
                  </div>
                </div>
              ) : null}

              {/* Checklist de exames complementares */}
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <label className="text-xs font-bold text-slate-700 uppercase">Exames Complementares desta Bateria</label>
                  <button
                    type="button"
                    onClick={adicionarExameManualNaLista}
                    className="text-[11px] text-slate-700 hover:bg-slate-200 font-bold flex items-center gap-1 bg-slate-100 border border-slate-300 px-2.5 py-1 rounded-md transition-all"
                  >
                    <Plus size={13} /> Adicionar Exame Manual
                  </button>
                </div>

                {examesSelecionados.length === 0 ? (
                  <div className="p-4 text-center border border-dashed border-slate-300 rounded-lg text-slate-400 text-xs">
                    Nenhum exame na lista. Selecione um colaborador com função cadastrada na matriz, ou adicione manualmente.
                  </div>
                ) : (
                  <div className="space-y-2">
                    {examesSelecionados.map((exame, index) => (
                      <div key={index} className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-lg p-2.5">
                        <input
                          type="checkbox"
                          className="accent-slate-900 w-4 h-4 shrink-0"
                          checked={exame.selecionado}
                          onChange={() => toggleExameSelecionado(index)}
                        />
                        {exame.origemMatriz ? (
                          <span className="flex-1 text-xs font-semibold text-slate-800">{exame.nome_exame}</span>
                        ) : (
                          <input
                            type="text"
                            placeholder="Nome do exame"
                            className="flex-1 bg-white border border-slate-300 rounded-lg p-1.5 text-xs text-slate-800 focus:outline-none focus:border-slate-500"
                            value={exame.nome_exame}
                            onChange={(e) => atualizarNomeExameManual(index, e.target.value)}
                          />
                        )}
                        <div className="flex items-center gap-1 shrink-0">
                          <input
                            type="number"
                            min="1"
                            className="w-16 bg-white border border-slate-300 rounded-lg p-1.5 text-xs text-slate-800 text-center focus:outline-none focus:border-slate-500"
                            value={exame.periodicidade_meses || ''}
                            onChange={(e) => atualizarPeriodicidadeExame(index, e.target.value)}
                          />
                          <span className="text-[10px] text-slate-500">meses</span>
                        </div>
                        <button
                          type="button"
                          onClick={() => removerExameDaLista(index)}
                          className="p-1 text-slate-400 hover:text-rose-600 transition-colors shrink-0"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                {proximaDataPreview && (
                  <p className="text-[11px] text-slate-500">
                    Próximo exame previsto: <strong className="text-slate-700">{proximaDataPreview}</strong> (com base na menor periodicidade marcada)
                  </p>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Data do Exame *</label>
                  <input
                    type="date"
                    required
                    className="w-full border border-slate-300 rounded-lg p-2 text-sm text-slate-800 focus:outline-none focus:border-slate-500"
                    value={asoForm.data_exame}
                    onChange={(e) => setAsoForm({ ...asoForm, data_exame: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Resultado *</label>
                  <select
                    required
                    className="w-full border border-slate-300 rounded-lg p-2 text-sm text-slate-800 focus:outline-none focus:border-slate-500"
                    value={asoForm.resultado}
                    onChange={(e) => setAsoForm({ ...asoForm, resultado: e.target.value })}
                  >
                    {RESULTADOS_ASO.map((r) => (
                      <option key={r} value={r}>{r}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Médico / CRM</label>
                  <input
                    type="text"
                    placeholder="Ex: Dr. João Silva - CRM 12345"
                    className="w-full border border-slate-300 rounded-lg p-2 text-sm text-slate-800 focus:outline-none focus:border-slate-500"
                    value={asoForm.medico_crm}
                    onChange={(e) => setAsoForm({ ...asoForm, medico_crm: e.target.value })}
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Observações</label>
                <textarea
                  rows="2"
                  className="w-full border border-slate-300 rounded-lg p-2 text-sm text-slate-800 focus:outline-none focus:border-slate-500"
                  value={asoForm.observacoes}
                  onChange={(e) => setAsoForm({ ...asoForm, observacoes: e.target.value })}
                ></textarea>
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setModalAsoOpen(false)}
                  className="px-4 py-2 border border-slate-300 hover:bg-slate-50 text-slate-600 text-xs font-semibold rounded-lg"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={salvandoAso}
                  className="px-4 py-2 bg-slate-900 hover:bg-slate-800 disabled:opacity-60 disabled:cursor-not-allowed text-white text-xs font-semibold rounded-lg shadow-sm"
                >
                  {salvandoAso ? 'Salvando...' : 'Registrar ASO'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ==================== MODAL: DETALHES DO ASO ==================== */}
      {modalDetalhesOpen && asoDetalhado && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex justify-center items-center p-4 z-50">
          <div className="bg-white border border-slate-200 rounded-xl w-full max-w-lg p-6 space-y-4 shadow-xl">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <h3 className="text-lg font-bold text-slate-900">Detalhes do ASO</h3>
              <button onClick={() => setModalDetalhesOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X size={20} />
              </button>
            </div>

            <div className="space-y-3 text-xs text-slate-700">
              <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                <p className="text-sm font-bold text-slate-900">{asoDetalhado.colaborador_nome}</p>
                <p className="text-slate-500">{asoDetalhado.cargo}</p>
                <div className="grid grid-cols-2 gap-2 mt-2">
                  <p><strong>Tipo de ASO:</strong> {asoDetalhado.tipo_exame}</p>
                  <p><strong>Resultado:</strong> {asoDetalhado.resultado}</p>
                  <p><strong>Data do Exame:</strong> {formatarDataBR(asoDetalhado.data_exame)}</p>
                  <p><strong>Próximo Exame:</strong> {asoDetalhado.tipo_exame === 'Demissional' ? '—' : formatarDataBR(asoDetalhado.data_proximo_exame)}</p>
                  <p><strong>Médico/CRM:</strong> {asoDetalhado.medico_crm || '—'}</p>
                </div>
              </div>

              {(asoDetalhado.tem_insalubridade || asoDetalhado.tem_periculosidade) && (
                <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 space-y-1">
                  <p className="font-bold text-slate-700">Adicionais de Risco (registrados nesta bateria)</p>
                  {asoDetalhado.tem_insalubridade && <p>Insalubridade: {asoDetalhado.grau_insalubridade || 'Não especificado'}</p>}
                  {asoDetalhado.tem_periculosidade && <p>Periculosidade: {asoDetalhado.percentual_periculosidade ? `${asoDetalhado.percentual_periculosidade}%` : 'Não especificado'}</p>}
                </div>
              )}

              <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                <p className="font-bold text-slate-700 mb-1.5">Exames Complementares Realizados</p>
                {asoDetalhado.exames_realizados && asoDetalhado.exames_realizados.length > 0 ? (
                  <ul className="space-y-1">
                    {asoDetalhado.exames_realizados.map((ex) => (
                      <li key={ex.id} className="flex justify-between border-b border-slate-100 pb-1 last:border-0">
                        <span>{ex.nome_exame}</span>
                        <span className="text-slate-500">{ex.periodicidade_meses ? `${ex.periodicidade_meses} meses` : '—'}</span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-slate-400">Nenhum exame complementar registrado.</p>
                )}
              </div>

              {asoDetalhado.observacoes && (
                <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                  <p className="font-bold text-slate-700 mb-1">Observações</p>
                  <p>{asoDetalhado.observacoes}</p>
                </div>
              )}
            </div>

            <div className="flex justify-end pt-2 border-t border-slate-100">
              <button
                onClick={() => setModalDetalhesOpen(false)}
                className="px-4 py-2 border border-slate-300 hover:bg-slate-50 text-slate-600 text-xs font-semibold rounded-lg"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ==================== MODAL: CADASTRAR/EDITAR FUNÇÃO PGR ==================== */}
      {modalFuncaoOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex justify-center items-center p-4 z-50">
          <div className="bg-white border border-slate-200 rounded-xl w-full max-w-lg p-6 space-y-4 max-h-[90vh] overflow-y-auto shadow-xl">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <h3 className="text-lg font-bold text-slate-900">
                {editingFuncaoId ? 'Editar Função na Matriz PGR' : 'Cadastrar Função na Matriz PGR'}
              </h3>
              <button onClick={() => setModalFuncaoOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSalvarFuncao} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Nome da Função / Cargo *</label>
                <input
                  type="text"
                  required
                  placeholder="Deve corresponder ao campo Função/Cargo do colaborador"
                  className="w-full border border-slate-300 rounded-lg p-2 text-sm text-slate-800 focus:outline-none focus:border-slate-500"
                  value={funcaoForm.nome_funcao}
                  onChange={(e) => setFuncaoForm({ ...funcaoForm, nome_funcao: e.target.value })}
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Riscos Identificados (PGR)</label>
                <textarea
                  rows="3"
                  placeholder="Ex: Ruído acima do limite de tolerância, exposição a poeira mineral, risco de queda de altura..."
                  className="w-full border border-slate-300 rounded-lg p-2 text-sm text-slate-800 focus:outline-none focus:border-slate-500"
                  value={funcaoForm.riscos_identificados}
                  onChange={(e) => setFuncaoForm({ ...funcaoForm, riscos_identificados: e.target.value })}
                ></textarea>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 space-y-2">
                  <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-slate-700">
                    <input
                      type="checkbox"
                      className="rounded accent-slate-900 w-4 h-4"
                      checked={funcaoForm.tem_insalubridade}
                      onChange={(e) => setFuncaoForm({ ...funcaoForm, tem_insalubridade: e.target.checked })}
                    />
                    Adicional de Insalubridade
                  </label>
                  {funcaoForm.tem_insalubridade && (
                    <select
                      className="w-full border border-slate-300 rounded-lg p-2 text-xs text-slate-800 focus:outline-none focus:border-slate-500"
                      value={funcaoForm.grau_insalubridade}
                      onChange={(e) => setFuncaoForm({ ...funcaoForm, grau_insalubridade: e.target.value })}
                    >
                      {GRAUS_INSALUBRIDADE.map((g) => (
                        <option key={g} value={g}>{g}</option>
                      ))}
                    </select>
                  )}
                </div>

                <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 space-y-2">
                  <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-slate-700">
                    <input
                      type="checkbox"
                      className="rounded accent-slate-900 w-4 h-4"
                      checked={funcaoForm.tem_periculosidade}
                      onChange={(e) => setFuncaoForm({ ...funcaoForm, tem_periculosidade: e.target.checked })}
                    />
                    Adicional de Periculosidade
                  </label>
                  {funcaoForm.tem_periculosidade && (
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        step="0.1"
                        className="w-full border border-slate-300 rounded-lg p-2 text-xs text-slate-800 focus:outline-none focus:border-slate-500"
                        value={funcaoForm.percentual_periculosidade}
                        onChange={(e) => setFuncaoForm({ ...funcaoForm, percentual_periculosidade: e.target.value })}
                      />
                      <span className="text-xs text-slate-500 font-bold">%</span>
                    </div>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Observações</label>
                <textarea
                  rows="2"
                  className="w-full border border-slate-300 rounded-lg p-2 text-sm text-slate-800 focus:outline-none focus:border-slate-500"
                  value={funcaoForm.observacoes}
                  onChange={(e) => setFuncaoForm({ ...funcaoForm, observacoes: e.target.value })}
                ></textarea>
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setModalFuncaoOpen(false)}
                  className="px-4 py-2 border border-slate-300 hover:bg-slate-50 text-slate-600 text-xs font-semibold rounded-lg"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold rounded-lg shadow-sm"
                >
                  {editingFuncaoId ? 'Atualizar' : 'Salvar Função'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}