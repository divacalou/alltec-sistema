import React, { useEffect, useState } from 'react';
import {
  ShieldCheck,
  Plus,
  AlertTriangle,
  X,
  Search,
  PackageCheck,
  ArrowDownLeft,
  RefreshCw,
  UserCheck,
  Trash2,
  Printer,
  FileText,
  History,
  Boxes
} from 'lucide-react';
import { api } from '../services/api';

export default function Epis() {
  const [activeSubTab, setActiveSubTab] = useState('estoque'); // 'estoque' | 'relatorios'

  const [epis, setEpis] = useState([]);
  const [colaboradores, setColaboradores] = useState([]);
  const [historicoEntregas, setHistoricoEntregas] = useState([]);

  const [busca, setBusca] = useState('');
  const [filtroRelatorio, setFiltroRelatorio] = useState({ busca: '', dataInicio: '', dataFim: '' });
  const [loading, setLoading] = useState(false);

  // Modais
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEntradaModalOpen, setIsEntradaModalOpen] = useState(false);
  const [isEntregaModalOpen, setIsEntregaModalOpen] = useState(false);
  const [epiSelecionado, setEpiSelecionado] = useState(null);

  // Forms
  const [novoEpi, setNovoEpi] = useState({
    nome: '',
    ca: '',
    validade_ca: '',
    quantidade_estoque: 0,
    quantidade_minima: 5,
    descricao: ''
  });

  const [qtdEntrada, setQtdEntrada] = useState(1);

  const [entregaForm, setEntregaForm] = useState({
    colaborador_id: '',
    data_entrega: new Date().toISOString().split('T')[0],
    itens: []
  });

  const [termoImpressao, setTermoImpressao] = useState(null);

  // Helper para formatar data AAAA-MM-DD para DD/MM/AAAA
  const formatarDataBR = (dataString) => {
    if (!dataString) return '—';
    const partes = dataString.split('T')[0].split('-');
    if (partes.length !== 3) return dataString;
    return `${partes[2]}/${partes[1]}/${partes[0]}`;
  };

  useEffect(() => {
    carregarEpis();
    carregarColaboradores();
    carregarHistoricoEntregas();
  }, []);

  const carregarEpis = async () => {
    setLoading(true);
    try {
      const res = await api.get('/epis');
      setEpis(res.data || []);
    } catch (err) {
      console.error('Erro ao carregar EPIs', err);
    } finally {
      setLoading(false);
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

  const carregarHistoricoEntregas = async () => {
    try {
      const res = await api.get('/epis/entrega');
      setHistoricoEntregas(res.data || []);
    } catch (err) {
      console.error('Erro ao carregar histórico de entregas', err);
    }
  };

  const handleCadastrar = async (e) => {
    e.preventDefault();
    if (!novoEpi.nome.trim() || !novoEpi.ca.trim() || !novoEpi.validade_ca) {
      alert('Preencha nome, número do C.A. e validade do C.A.');
      return;
    }
    try {
      await api.post('/epis', novoEpi);
      setIsModalOpen(false);
      setNovoEpi({ nome: '', ca: '', validade_ca: '', quantidade_estoque: 0, quantidade_minima: 5, descricao: '' });
      carregarEpis();
    } catch (err) {
      alert('Erro ao cadastrar EPI: ' + (err.response?.data?.detail || err.message));
    }
  };

  const handleAdicionarEstoque = async (e) => {
    e.preventDefault();
    if (!epiSelecionado) return;

    try {
      const qtdAdicional = Number(qtdEntrada);
      const novaQtd = Number(epiSelecionado.quantidade_estoque || 0) + qtdAdicional;

      await api.patch(`/epis/${epiSelecionado.id}`, { quantidade_estoque: novaQtd });

      setIsEntradaModalOpen(false);
      setEpiSelecionado(null);
      setQtdEntrada(1);
      carregarEpis();
    } catch (err) {
      alert('Erro ao atualizar estoque: ' + (err.response?.data?.detail || err.message));
    }
  };

  const adicionarItemAEntrega = () => {
    if (epis.length === 0) return;
    setEntregaForm((prev) => ({
      ...prev,
      itens: [
        ...prev.itens,
        { epi_id: epis[0].id, quantidade: 1, motivo_troca: 'ENTREGA INICIAL' }
      ]
    }));
  };

  const removerItemDaEntrega = (index) => {
    setEntregaForm((prev) => ({
      ...prev,
      itens: prev.itens.filter((_, i) => i !== index)
    }));
  };

  const atualizarItemEntrega = (index, campo, valor) => {
    setEntregaForm((prev) => {
      const novosItens = [...prev.itens];
      novosItens[index][campo] = valor;
      return { ...prev, itens: novosItens };
    });
  };

  const handleConfirmarEntrega = async (e) => {
    e.preventDefault();
    if (!entregaForm.colaborador_id) {
      alert('Selecione um colaborador.');
      return;
    }
    if (entregaForm.itens.length === 0) {
      alert('Adicione pelo menos um EPI à lista.');
      return;
    }

    try {
      const colab = colaboradores.find((c) => Number(c.id) === Number(entregaForm.colaborador_id));

      const itensDetalhados = entregaForm.itens.map((item) => {
        const epiInfo = epis.find((ep) => Number(ep.id) === Number(item.epi_id));
        return {
          ...item,
          nome: epiInfo?.nome || 'EPI não especificado',
          ca: epiInfo?.ca || '—'
        };
      });

      for (const item of entregaForm.itens) {
        await api.post('/epis/entrega', {
          colaborador_id: Number(entregaForm.colaborador_id),
          epi_id: Number(item.epi_id),
          quantidade: Number(item.quantidade),
          data_entrega: entregaForm.data_entrega,
          motivo_troca: item.motivo_troca
        });
      }

      setTermoImpressao({
        colaborador: colab,
        data_entrega: entregaForm.data_entrega,
        itens: itensDetalhados
      });

      setIsEntregaModalOpen(false);
      carregarEpis();
      carregarHistoricoEntregas();
    } catch (err) {
      alert('Erro ao processar entrega: ' + (err.response?.data?.detail || err.message));
    }
  };

  const handleImprimir = () => {
    window.print();
  };

  // Reabrir o termo/documento para um relatório do histórico
  const visualizarTermoHistorico = (entrega) => {
    const colab = colaboradores.find((c) => Number(c.id) === Number(entrega.colaborador_id)) || {
      nome: entrega.colaborador_nome,
      cargo: entrega.colaborador_cargo,
      id: entrega.colaborador_id
    };
    const epiInfo = epis.find((ep) => Number(ep.id) === Number(entrega.epi_id));

    setTermoImpressao({
      colaborador: colab,
      data_entrega: entrega.data_entrega,
      itens: [
        {
          nome: entrega.epi_nome || epiInfo?.nome || 'EPI',
          ca: entrega.ca || epiInfo?.ca || '—',
          quantidade: entrega.quantidade || 1,
          motivo_troca: entrega.motivo_troca || 'ENTREGA'
        }
      ]
    });
  };

  const totalTipos = epis.length;
  const totalUnidades = epis.reduce((acc, curr) => acc + Number(curr.quantidade_estoque || 0), 0);
  const itensCriticos = epis.filter((e) => Number(e.quantidade_estoque || 0) <= Number(e.quantidade_minima || 5)).length;

  const episFiltrados = epis.filter(
    (e) =>
      e.nome?.toLowerCase().includes(busca.toLowerCase()) ||
      (e.ca && e.ca.toString().toLowerCase().includes(busca.toLowerCase()))
  );

  const entregasFiltradas = historicoEntregas.filter((ent) => {
    const termo = filtroRelatorio.busca.toLowerCase();
    const nomeColab = ent.colaborador_nome?.toLowerCase() || '';
    const nomeEpi = ent.epi_nome?.toLowerCase() || '';
    const ca = ent.ca?.toString().toLowerCase() || '';

    const combinaTexto = nomeColab.includes(termo) || nomeEpi.includes(termo) || ca.includes(termo);

    let combinaData = true;
    if (filtroRelatorio.dataInicio) {
      combinaData = combinaData && ent.data_entrega >= filtroRelatorio.dataInicio;
    }
    if (filtroRelatorio.dataFim) {
      combinaData = combinaData && ent.data_entrega <= filtroRelatorio.dataFim;
    }

    return combinaTexto && combinaData;
  });

  return (
    <div className="p-6 bg-slate-50 min-h-screen space-y-6 text-slate-800">
      <style>{`
        @media print {
          body * { visibility: hidden; }
          #termo-impressao, #termo-impressao * { visibility: visible; }
          #termo-impressao {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            padding: 20px;
            background: white;
            color: black;
          }
          .no-print { display: none !important; }
        }
      `}</style>

      {/* Cabeçalho */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center bg-white p-5 rounded-xl border border-slate-200 shadow-sm gap-4 no-print">
        <div>
          <h1 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <ShieldCheck className="text-rose-600" size={24} /> Gestão & Controle de EPIs
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Módulo integrado para controle de saldos, reabastecimento e relatórios de entrega.
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => {
              setEntregaForm({
                colaborador_id: '',
                data_entrega: new Date().toISOString().split('T')[0],
                itens: epis.length > 0 ? [{ epi_id: epis[0].id, quantidade: 1, motivo_troca: 'ENTREGA INICIAL' }] : []
              });
              setIsEntregaModalOpen(true);
            }}
            className="bg-white hover:bg-slate-50 border-2 border-slate-900 text-slate-900 text-xs font-bold px-4 py-2.5 rounded-lg flex items-center gap-2 transition-all"
          >
            <UserCheck size={16} /> REGISTRAR ENTREGA DE EPI
          </button>

          <button
            onClick={() => setIsModalOpen(true)}
            className="bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold px-4 py-2.5 rounded-lg flex items-center gap-2 shadow-sm transition-all"
          >
            <Plus size={16} /> NOVO EPI
          </button>
        </div>
      </div>

      {/* Navegação entre Sub-abas */}
      <div className="flex border-b border-slate-200 gap-4 no-print">
        <button
          onClick={() => setActiveSubTab('estoque')}
          className={`pb-3 text-xs font-bold flex items-center gap-2 border-b-2 transition-all ${
            activeSubTab === 'estoque'
              ? 'border-slate-900 text-slate-900'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Boxes size={16} /> Estoque Atual de EPIs
        </button>

        <button
          onClick={() => setActiveSubTab('relatorios')}
          className={`pb-3 text-xs font-bold flex items-center gap-2 border-b-2 transition-all ${
            activeSubTab === 'relatorios'
              ? 'border-slate-900 text-slate-900'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <History size={16} /> Relatórios & Histórico de Entregas
        </button>
      </div>

      {/* ABA 1: ESTOQUE */}
      {activeSubTab === 'estoque' && (
        <div className="space-y-6 no-print">
          {/* Métricas */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
              <div>
                <span className="text-xs font-semibold text-slate-500 uppercase">Tipos Cadastrados</span>
                <h3 className="text-2xl font-bold text-slate-900 mt-1">{totalTipos}</h3>
              </div>
              <div className="p-3 bg-slate-100 rounded-lg text-slate-600">
                <ShieldCheck size={20} />
              </div>
            </div>

            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
              <div>
                <span className="text-xs font-semibold text-slate-500 uppercase">Saldo Total no Estoque</span>
                <h3 className="text-2xl font-bold text-slate-900 mt-1">{totalUnidades} un</h3>
              </div>
              <div className="p-3 bg-slate-100 rounded-lg text-slate-600">
                <PackageCheck size={20} />
              </div>
            </div>

            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
              <div>
                <span className="text-xs font-semibold text-slate-500 uppercase">Estoque Crítico / Alerta</span>
                <h3 className={`text-2xl font-bold mt-1 ${itensCriticos > 0 ? 'text-rose-600' : 'text-slate-700'}`}>
                  {itensCriticos}
                </h3>
              </div>
              <div
                className={`p-3 rounded-lg border ${
                  itensCriticos > 0
                    ? 'bg-rose-50 text-rose-600 border-rose-100'
                    : 'bg-slate-100 text-slate-500 border-slate-200'
                }`}
              >
                <AlertTriangle size={20} />
              </div>
            </div>
          </div>

          {/* Tabela de Estoque */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden space-y-4 p-4">
            <div className="flex justify-between items-center gap-3">
              <div className="relative w-full max-w-xs">
                <Search className="absolute left-3 top-2.5 text-slate-400" size={16} />
                <input
                  type="text"
                  placeholder="Buscar por EPI ou Nº C.A..."
                  value={busca}
                  onChange={(e) => setBusca(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg pl-9 pr-3 py-2 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-500/20"
                />
              </div>

              <button
                onClick={carregarEpis}
                className="p-2 bg-slate-100 border border-slate-200 hover:bg-slate-200 text-slate-600 rounded-lg transition-all"
                title="Atualizar Tabela"
              >
                <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
              </button>
            </div>

            <div className="overflow-x-auto border border-slate-200 rounded-lg">
              <table className="w-full text-left text-sm text-slate-700">
                <thead className="bg-slate-50 text-slate-600 font-bold uppercase text-[11px] border-b border-slate-200">
                  <tr>
                    <th className="p-3.5">EPI</th>
                    <th className="p-3.5">Nº C.A.</th>
                    <th className="p-3.5">Validade C.A.</th>
                    <th className="p-3.5">Qtd Estoque</th>
                    <th className="p-3.5 text-right">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {loading ? (
                    <tr>
                      <td colSpan="5" className="p-4 text-center text-slate-500 text-xs">Carregando dados...</td>
                    </tr>
                  ) : episFiltrados.length === 0 ? (
                    <tr>
                      <td colSpan="5" className="p-4 text-center text-slate-500 text-xs">Nenhum EPI encontrado.</td>
                    </tr>
                  ) : (
                    episFiltrados.map((e) => {
                      const estMin = Number(e.quantidade_minima || 5);
                      const estAtual = Number(e.quantidade_estoque || 0);
                      const isBaixo = estAtual <= estMin;

                      return (
                        <tr key={e.id} className="hover:bg-slate-50 transition-all">
                          <td className="p-3.5 font-semibold text-slate-900">{e.nome}</td>
                          <td className="p-3.5 text-slate-600 font-mono text-xs">{e.ca || '—'}</td>
                          <td className="p-3.5 text-slate-600 text-xs">{formatarDataBR(e.validade_ca)}</td>
                          <td className="p-3.5 font-bold">
                            <span className={isBaixo ? 'text-rose-600 flex items-center gap-1 font-bold' : 'text-slate-700 font-bold'}>
                              {isBaixo && <AlertTriangle size={14} />}
                              {estAtual} un
                            </span>
                          </td>
                          <td className="p-3.5 text-right">
                            <button
                              onClick={() => {
                                setEpiSelecionado(e);
                                setQtdEntrada(1);
                                setIsEntradaModalOpen(true);
                              }}
                              className="bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300 text-xs font-bold px-3 py-1.5 rounded-lg transition-all inline-flex items-center gap-1"
                            >
                              <ArrowDownLeft size={13} /> + Reabastecer
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

      {/* ABA 2: RELATÓRIOS E HISTÓRICO DE ENTREGAS */}
      {activeSubTab === 'relatorios' && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 space-y-4 no-print">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 pb-3 border-b border-slate-200">
            <div>
              <h3 className="text-base font-bold text-slate-900">Relatório Geral de Entregas Realizadas</h3>
              <p className="text-xs text-slate-500">Histórico completo de baixas e fornecimentos aos colaboradores.</p>
            </div>
            <button
              onClick={carregarHistoricoEntregas}
              className="p-2 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-lg text-xs font-bold flex items-center gap-1.5"
            >
              <RefreshCw size={14} /> Atualizar Lista
            </button>
          </div>

          {/* Filtros por Nome / EPI / Período */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 bg-slate-50 p-3 rounded-lg border border-slate-200">
            <div>
              <label className="block text-[11px] font-bold text-slate-600 mb-1">Buscar por Colaborador / EPI / C.A.</label>
              <input
                type="text"
                placeholder="Digite o nome, EPI ou Nº C.A..."
                value={filtroRelatorio.busca}
                onChange={(e) => setFiltroRelatorio({ ...filtroRelatorio, busca: e.target.value })}
                className="w-full bg-white border border-slate-300 rounded-lg p-2 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-500/20"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-600 mb-1">Data Inicial</label>
              <input
                type="date"
                value={filtroRelatorio.dataInicio}
                onChange={(e) => setFiltroRelatorio({ ...filtroRelatorio, dataInicio: e.target.value })}
                className="w-full bg-white border border-slate-300 rounded-lg p-2 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-500/20"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-600 mb-1">Data Final</label>
              <input
                type="date"
                value={filtroRelatorio.dataFim}
                onChange={(e) => setFiltroRelatorio({ ...filtroRelatorio, dataFim: e.target.value })}
                className="w-full bg-white border border-slate-300 rounded-lg p-2 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-500/20"
              />
            </div>
          </div>

          {/* Tabela de Relatórios */}
          <div className="overflow-x-auto border border-slate-200 rounded-lg">
            <table className="w-full text-left text-sm text-slate-700">
              <thead className="bg-slate-50 text-slate-600 font-bold uppercase text-[11px] border-b border-slate-200">
                <tr>
                  <th className="p-3.5">Data Entrega</th>
                  <th className="p-3.5">Colaborador</th>
                  <th className="p-3.5">EPI Entregue</th>
                  <th className="p-3.5">Nº C.A.</th>
                  <th className="p-3.5 text-center">Qtd</th>
                  <th className="p-3.5">Motivo / Tipo</th>
                  <th className="p-3.5 text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {entregasFiltradas.length === 0 ? (
                  <tr>
                    <td colSpan="7" className="p-4 text-center text-slate-500 text-xs">Nenhum registro de entrega encontrado.</td>
                  </tr>
                ) : (
                  entregasFiltradas.map((ent, idx) => (
                    <tr key={ent.id || idx} className="hover:bg-slate-50 transition-all">
                      <td className="p-3.5 font-semibold text-slate-800">{formatarDataBR(ent.data_entrega)}</td>
                      <td className="p-3.5 font-bold text-slate-900">{ent.colaborador_nome || `ID #${ent.colaborador_id}`}</td>
                      <td className="p-3.5 font-medium">{ent.epi_nome || `EPI #${ent.epi_id}`}</td>
                      <td className="p-3.5 font-mono text-xs text-slate-600">{ent.ca || '—'}</td>
                      <td className="p-3.5 text-center font-bold text-slate-800">{ent.quantidade} un</td>
                      <td className="p-3.5 text-xs text-slate-500 uppercase">{ent.motivo_troca || 'ENTREGA'}</td>
                      <td className="p-3.5 text-right">
                        <button
                          onClick={() => visualizarTermoHistorico(ent)}
                          className="bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold px-3 py-1.5 rounded-lg border border-slate-300 inline-flex items-center gap-1.5 transition-all"
                        >
                          <Printer size={13} /> Recibo PDF
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TERMO DE ENTREGA / DOCUMENTO IMPRESSÃO */}
      {termoImpressao && (
        <div id="termo-impressao" className="bg-white p-6 rounded-xl border border-slate-300 shadow-md space-y-4">
          <div className="flex justify-between items-center border-b border-slate-300 pb-4 no-print">
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <FileText className="text-rose-600" size={20} />
              Documento de Entrega Gerado
            </h2>
            <div className="flex gap-2">
              <button
                onClick={handleImprimir}
                className="bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold px-3.5 py-2 rounded-lg flex items-center gap-1.5 shadow-sm transition-all"
              >
                <Printer size={15} /> Imprimir / Exportar PDF
              </button>
              <button
                onClick={() => setTermoImpressao(null)}
                className="bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold px-3 py-2 rounded-lg"
              >
                Fechar
              </button>
            </div>
          </div>

          <div className="border border-slate-800 p-5 space-y-4 text-slate-900 font-sans text-xs">
            <div className="flex justify-between items-center border-b-2 border-slate-800 pb-3">
              <div>
                <h1 className="text-base font-black tracking-wider text-slate-900">PLANNA RH & SST</h1>
                <p className="text-[10px] text-slate-600 uppercase font-semibold">PLANNA EDIFICAÇÕES / OBRA VIA DE LIGAÇÃO 1 - DISTRITO INDUSTRIAL</p>
              </div>
              <div className="text-right">
                <h2 className="text-xs font-extrabold uppercase border border-slate-800 px-2 py-1">
                  TERMO DE CONTROLE E ENTREGA DE E.P.I´S
                </h2>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 bg-slate-50 p-3 border border-slate-300">
              <div>
                <span className="block text-[9px] font-bold text-slate-500 uppercase">COLABORADOR</span>
                <span className="font-bold text-xs uppercase">{termoImpressao.colaborador?.nome || '—'}</span>
              </div>
              <div>
                <span className="block text-[9px] font-bold text-slate-500 uppercase">FUNÇÃO / CARGO</span>
                <span className="font-semibold text-xs uppercase">{termoImpressao.colaborador?.cargo || '—'}</span>
              </div>
              <div>
                <span className="block text-[9px] font-bold text-slate-500 uppercase">REGISTRO / MATRÍCULA</span>
                <span className="font-semibold text-xs">
                  {termoImpressao.colaborador?.matricula || termoImpressao.colaborador?.id || '—'}
                </span>
              </div>
              <div>
                <span className="block text-[9px] font-bold text-slate-500 uppercase">DATA DA EMISSÃO</span>
                <span className="font-semibold text-xs">{formatarDataBR(termoImpressao.data_entrega)}</span>
              </div>
            </div>

            <div className="text-[10px] leading-relaxed text-slate-700 border border-slate-300 p-3 bg-slate-50 space-y-1.5 text-justify">
              <p className="font-bold text-slate-900">TERMO DE COMPROMISSO:</p>
              <p>
                Declaro que recebi orientação sobre o uso correto do EPI fornecido pela empresa e que estou ciente da legislação abaixo discriminada, comprometendo-me a cumpri-la: Portaria 3214, de 08/06/78, do MTE, NR-1 item 1.8 e NR 6 item 6.7 e a CLT art 462 e 482.
              </p>
              <p>
                <strong>NR 1, item 1.8:</strong> Cabe ao empregado cumprir as disposições legais e regulamentares sobre Segurança e Medicina do Trabalho; usar o EPI fornecido pelo empregador exclusivamente para a finalidade a que se destina e submeter-se aos exames médicos previstos.
              </p>
              <p>
                <strong>NR 6.7.1:</strong> Cabe ao empregado responsabilizar-se pela guarda e conservação e comunicar ao empregador qualquer alteração que o torne impróprio para o uso.
              </p>
              <p>
                <strong>CLT Art. 462 §1º & Art. 482:</strong> Em caso de dano causado por dolo ou mau uso, o desconto será lícito. O não uso do EPI sujeita o empregado a sanções disciplinares, advertência por escrito, suspensão e rescisão contratual por justa causa.
              </p>
            </div>

            <table className="w-full text-left border-collapse border border-slate-800 text-[11px]">
              <thead>
                <tr className="bg-slate-200 text-slate-900 uppercase font-bold border-b border-slate-800">
                  <th className="border border-slate-800 p-2">DESCRIÇÃO DO EPI</th>
                  <th className="border border-slate-800 p-2 text-center w-20">C.A.</th>
                  <th className="border border-slate-800 p-2 text-center w-12">QDE</th>
                  <th className="border border-slate-800 p-2 text-center w-28">RECEBIMENTO</th>
                  <th className="border border-slate-800 p-2 text-center w-28">RUBRICA</th>
                  <th className="border border-slate-800 p-2 text-center w-24">DEVOLUÇÃO</th>
                  <th className="border border-slate-800 p-2 text-center w-28">MOTIVO TROCA</th>
                </tr>
              </thead>
              <tbody>
                {termoImpressao.itens.map((item, idx) => (
                  <tr key={idx} className="border-b border-slate-800">
                    <td className="border border-slate-800 p-2 font-bold uppercase">{item.nome}</td>
                    <td className="border border-slate-800 p-2 text-center font-mono">{item.ca}</td>
                    <td className="border border-slate-800 p-2 text-center font-bold">{item.quantidade}</td>
                    <td className="border border-slate-800 p-2 text-center">{formatarDataBR(termoImpressao.data_entrega)}</td>
                    <td className="border border-slate-800 p-2 text-center bg-slate-50"></td>
                    <td className="border border-slate-800 p-2 text-center">/ /</td>
                    <td className="border border-slate-800 p-2 text-center text-[10px] uppercase">{item.motivo_troca || 'ENTREGA'}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            <div className="pt-10 grid grid-cols-2 gap-8 text-center">
              <div>
                <div className="border-t border-slate-800 pt-1 text-xs font-bold uppercase">
                  {termoImpressao.colaborador?.nome || 'ASSINATURA DO EMPREGADO'}
                </div>
                <span className="text-[10px] text-slate-500">Assinatura do Empregado</span>
              </div>
              <div>
                <div className="border-t border-slate-800 pt-1 text-xs font-bold uppercase">
                  PLANNA EDIFICAÇÕES / RH & SST
                </div>
                <span className="text-[10px] text-slate-500">Emissão / TST Responsável</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL DE ENTREGA DE EPIs */}
      {isEntregaModalOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex justify-center items-center p-4 z-50 no-print">
          <div className="bg-white border border-slate-200 rounded-xl w-full max-w-2xl p-6 space-y-4 max-h-[90vh] flex flex-col shadow-xl">
            <div className="flex justify-between items-center border-b border-slate-200 pb-3">
              <div>
                <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <UserCheck className="text-slate-700" size={20} />
                  Ficha de Entrega de EPIs
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">Selecione o colaborador e os EPIs a serem entregues.</p>
              </div>
              <button onClick={() => setIsEntregaModalOpen(false)} className="text-slate-400 hover:text-slate-600"><X size={20} /></button>
            </div>

            <form onSubmit={handleConfirmarEntrega} className="space-y-4 overflow-y-auto flex-1 pr-1">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-slate-700 mb-1">Colaborador *</label>
                  <select
                    required
                    value={entregaForm.colaborador_id}
                    onChange={(e) => setEntregaForm({ ...entregaForm, colaborador_id: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2.5 text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-500/20"
                  >
                    <option value="">Selecione o funcionário...</option>
                    {colaboradores.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.nome} {c.cargo ? `— ${c.cargo}` : ''}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Data da Entrega</label>
                  <input
                    type="date"
                    required
                    value={entregaForm.data_entrega}
                    onChange={(e) => setEntregaForm({ ...entregaForm, data_entrega: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-500/20"
                  />
                </div>
              </div>

              <div className="space-y-3 pt-2">
                <div className="flex justify-between items-center">
                  <label className="text-xs font-bold text-slate-700 uppercase">Itens da Entrega</label>
                  <button
                    type="button"
                    onClick={adicionarItemAEntrega}
                    className="text-xs text-slate-700 hover:bg-slate-200 font-bold flex items-center gap-1 bg-slate-100 border border-slate-300 px-3 py-1 rounded-md transition-all"
                  >
                    <Plus size={14} /> Adicionar EPI
                  </button>
                </div>

                {entregaForm.itens.length === 0 ? (
                  <div className="p-4 text-center border border-dashed border-slate-300 rounded-lg text-slate-400 text-xs">
                    Nenhum EPI adicionado. Clique no botão acima para adicionar itens.
                  </div>
                ) : (
                  entregaForm.itens.map((item, index) => {
                    const epiInfo = epis.find((e) => Number(e.id) === Number(item.epi_id));
                    const saldoEstoque = epiInfo ? Number(epiInfo.quantidade_estoque) : 0;

                    return (
                      <div key={index} className="flex flex-col sm:flex-row items-center gap-2 bg-slate-50 p-3 rounded-lg border border-slate-200">
                        <div className="flex-1 w-full">
                          <label className="block text-[10px] text-slate-500 font-bold mb-1">Equipamento (EPI)</label>
                          <select
                            value={item.epi_id}
                            onChange={(e) => atualizarItemEntrega(index, 'epi_id', e.target.value)}
                            className="w-full bg-white border border-slate-300 rounded-lg p-2 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-500/20"
                          >
                            {epis.map((e) => (
                              <option key={e.id} value={e.id}>
                                {e.nome} (CA: {e.ca || 'N/A'}) — Saldo: {e.quantidade_estoque}
                              </option>
                            ))}
                          </select>
                        </div>

                        <div className="w-full sm:w-24">
                          <label className="block text-[10px] text-slate-500 font-bold mb-1">Qtd</label>
                          <input
                            type="number"
                            min="1"
                            max={saldoEstoque || 1}
                            value={item.quantidade}
                            onChange={(e) => atualizarItemEntrega(index, 'quantidade', e.target.value)}
                            className="w-full bg-white border border-slate-300 rounded-lg p-2 text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-500/20"
                          />
                        </div>

                        <div className="w-full sm:w-36">
                          <label className="block text-[10px] text-slate-500 font-bold mb-1">Motivo</label>
                          <input
                            type="text"
                            value={item.motivo_troca}
                            onChange={(e) => atualizarItemEntrega(index, 'motivo_troca', e.target.value)}
                            placeholder="Ex: Primeiras luvas / Troca"
                            className="w-full bg-white border border-slate-300 rounded-lg p-2 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-500/20"
                          />
                        </div>

                        <div className="pt-4 sm:pt-3">
                          <button
                            type="button"
                            onClick={() => removerItemDaEntrega(index)}
                            className="p-2 text-slate-400 hover:text-rose-600 transition-colors"
                            title="Remover Item"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setIsEntregaModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-lg transition-all"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-lg shadow-sm transition-all"
                >
                  Gerar Termo de Entrega ({entregaForm.itens.length})
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL CADASTRAR EPI */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex justify-center items-center p-4 z-50 no-print">
          <div className="bg-white border border-slate-200 rounded-xl w-full max-w-md p-6 space-y-4 shadow-xl">
            <div className="flex justify-between items-center border-b border-slate-200 pb-3">
              <h3 className="text-base font-bold text-slate-900">Cadastrar Novo EPI</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600"><X size={20} /></button>
            </div>

            <form onSubmit={handleCadastrar} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Nome do Equipamento</label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Luva Pigmentada / Capacetes"
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2.5 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-500/20"
                  value={novoEpi.nome}
                  onChange={(e) => setNovoEpi({ ...novoEpi, nome: e.target.value })}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Número do C.A.</label>
                  <input
                    type="text"
                    required
                    placeholder="Ex: 34491"
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2.5 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-500/20"
                    value={novoEpi.ca}
                    onChange={(e) => setNovoEpi({ ...novoEpi, ca: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Validade do C.A.</label>
                  <input
                    type="date"
                    required
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2.5 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-500/20"
                    value={novoEpi.validade_ca}
                    onChange={(e) => setNovoEpi({ ...novoEpi, validade_ca: e.target.value })}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Estoque Inicial</label>
                  <input
                    type="number"
                    required
                    min="0"
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2.5 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-500/20"
                    value={novoEpi.quantidade_estoque}
                    onChange={(e) => setNovoEpi({ ...novoEpi, quantidade_estoque: parseInt(e.target.value, 10) || 0 })}
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Qtd Mínima Alerta</label>
                  <input
                    type="number"
                    required
                    min="0"
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2.5 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-500/20"
                    value={novoEpi.quantidade_minima}
                    onChange={(e) => setNovoEpi({ ...novoEpi, quantidade_minima: parseInt(e.target.value, 10) || 0 })}
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Descrição / Observações</label>
                <textarea
                  rows="2"
                  placeholder="Ex: Uso obrigatório em áreas de risco de queda"
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2.5 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-500/20"
                  value={novoEpi.descricao}
                  onChange={(e) => setNovoEpi({ ...novoEpi, descricao: e.target.value })}
                ></textarea>
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t border-slate-200">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 bg-slate-100 text-slate-700 text-xs font-bold rounded-lg">Cancelar</button>
                <button type="submit" className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-lg shadow-sm">Salvar EPI</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL REABASTECER */}
      {isEntradaModalOpen && epiSelecionado && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex justify-center items-center p-4 z-50 no-print">
          <div className="bg-white border border-slate-200 rounded-xl w-full max-w-sm p-6 space-y-4 shadow-xl">
            <div className="flex justify-between items-center border-b border-slate-200 pb-3">
              <div>
                <h3 className="text-base font-bold text-slate-900">Reabastecer Estoque</h3>
                <p className="text-xs text-slate-500">{epiSelecionado.nome}</p>
              </div>
              <button onClick={() => setIsEntradaModalOpen(false)} className="text-slate-400 hover:text-slate-600"><X size={20} /></button>
            </div>

            <form onSubmit={handleAdicionarEstoque} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Quantidade Adicionada</label>
                <input
                  type="number"
                  min="1"
                  required
                  value={qtdEntrada}
                  onChange={(e) => setQtdEntrada(parseInt(e.target.value, 10) || 1)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2.5 text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-500/20"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-200">
                <button type="button" onClick={() => setIsEntradaModalOpen(false)} className="px-4 py-2 bg-slate-100 text-slate-700 text-xs font-bold rounded-lg">Cancelar</button>
                <button type="submit" className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-lg shadow-sm">Adicionar ao Saldo</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}