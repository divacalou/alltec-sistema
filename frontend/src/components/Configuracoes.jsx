import React, { useState, useEffect } from 'react';
import {
  Settings,
  Plus,
  Save,
  Bell,
  Building2,
  RefreshCw,
  ShieldCheck,
  History,
  Search,
  CheckCircle2,
  AlertCircle,
  X,
  UserCheck
} from 'lucide-react';
import { api } from '../services/api';

export default function Configuracoes() {
  const [activeTab, setActiveTab] = useState('setores');

  // Parâmetros Globais (persistidos em /api/configuracoes)
  const [diasAlertaAso, setDiasAlertaAso] = useState(30);
  const [diasAlertaEpi, setDiasAlertaEpi] = useState(15);
  const [salvandoParametros, setSalvandoParametros] = useState(false);

  // Estados de Setores
  const [setores, setSetores] = useState([]);
  const [buscaSetor, setBuscaSetor] = useState('');
  const [loadingSetores, setLoadingSetores] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [novoSetor, setNovoSetor] = useState({ nome: '', descricao: '' });

  // Estados de Permissões/Acessos
  const [colaboradoresLista, setColaboradoresLista] = useState([]);
  const [loadingColabs, setLoadingColabs] = useState(false);

  // Feedback
  const [mensagem, setMensagem] = useState({ tipo: '', texto: '' });

  useEffect(() => {
    carregarSetores();
    carregarConfiguracoes();
  }, []);

  useEffect(() => {
    if (activeTab === 'acessos') {
      carregarColaboradoresPermissoes();
    }
  }, [activeTab]);

  const showFeedback = (tipo, texto) => {
    setMensagem({ tipo, texto });
    setTimeout(() => setMensagem({ tipo: '', texto: '' }), 4000);
  };

  // --- FUNÇÕES DE SETORES ---
  const carregarSetores = async () => {
    setLoadingSetores(true);
    try {
      const res = await api.get('/setores');
      setSetores(res.data || []);
    } catch (err) {
      showFeedback('erro', 'Erro ao carregar setores da API.');
    } finally {
      setLoadingSetores(false);
    }
  };

  const handleCadastrarSetor = async (e) => {
    e.preventDefault();
    if (!novoSetor.nome.trim()) {
      showFeedback('erro', 'Nome do setor é obrigatório.');
      return;
    }

    try {
      await api.post('/setores', novoSetor);
      showFeedback('sucesso', 'Setor cadastrado com sucesso!');
      setNovoSetor({ nome: '', descricao: '' });
      setIsModalOpen(false);
      carregarSetores();
    } catch (err) {
      showFeedback('erro', 'Erro ao salvar novo setor: ' + (err.response?.data?.detail || err.message));
    }
  };

  // --- FUNÇÕES DE PARÂMETROS GLOBAIS ---
  const carregarConfiguracoes = async () => {
    try {
      const res = await api.get('/configuracoes');
      if (res.data?.dias_alerta_aso) setDiasAlertaAso(Number(res.data.dias_alerta_aso));
      if (res.data?.dias_alerta_epi) setDiasAlertaEpi(Number(res.data.dias_alerta_epi));
    } catch (err) {
      console.error('Erro ao carregar configurações:', err);
    }
  };

  const handleSalvarParametros = async () => {
    setSalvandoParametros(true);
    try {
      await api.post('/configuracoes', {
        dias_alerta_aso: Number(diasAlertaAso) || 30,
        dias_alerta_epi: Number(diasAlertaEpi) || 15
      });
      showFeedback('sucesso', 'Parâmetros salvos com sucesso!');
    } catch (err) {
      showFeedback('erro', 'Erro ao salvar parâmetros: ' + (err.response?.data?.detail || err.message));
    } finally {
      setSalvandoParametros(false);
    }
  };

  // --- FUNÇÕES DE PERMISSÕES ---
  const carregarColaboradoresPermissoes = async () => {
    setLoadingColabs(true);
    try {
      const res = await api.get('/colaboradores');
      setColaboradoresLista(res.data || []);
    } catch (err) {
      showFeedback('erro', 'Erro ao carregar colaboradores.');
    } finally {
      setLoadingColabs(false);
    }
  };

  const handleAlterarPerfil = async (colaboradorId, novoPerfil) => {
    try {
      await api.patch(`/colaboradores/${colaboradorId}/permissao`, { perfil_acesso: novoPerfil });
      showFeedback('sucesso', 'Nível de acesso alterado!');
      setColaboradoresLista((prev) =>
        prev.map((c) => (c.id === colaboradorId ? { ...c, perfil_acesso: novoPerfil } : c))
      );
    } catch (err) {
      showFeedback('erro', 'Erro ao alterar nível de acesso: ' + (err.response?.data?.detail || err.message));
    }
  };

  const setoresFiltrados = setores.filter(
    (s) =>
      s.nome.toLowerCase().includes(buscaSetor.toLowerCase()) ||
      (s.descricao && s.descricao.toLowerCase().includes(buscaSetor.toLowerCase()))
  );

  const badgePerfilClasses = (perfil) => {
    if (perfil === 'Administrador') return 'bg-rose-100 text-rose-800';
    if (perfil === 'Consultor / Leitura') return 'bg-slate-100 text-slate-500';
    return 'bg-slate-200 text-slate-800';
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto bg-slate-50 min-h-screen p-6 text-slate-800">
      {/* Cabeçalho */}
      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex justify-between items-center">
        <div>
          <h1 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <Settings className="text-rose-600" size={24} /> Configurações do Sistema
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Gerencie cadastros auxiliares de setores, parâmetros globais de alerta e permissões.
          </p>
        </div>
      </div>

      {/* Alertas de Feedback */}
      {mensagem.texto && (
        <div
          className={`p-4 rounded-xl flex items-center gap-3 border text-sm font-medium ${
            mensagem.tipo === 'sucesso'
              ? 'bg-slate-100 text-slate-800 border-slate-300'
              : 'bg-rose-50 text-rose-800 border-rose-200'
          }`}
        >
          {mensagem.tipo === 'sucesso' ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />}
          {mensagem.texto}
        </div>
      )}

      {/* Navegação por Abas */}
      <div className="flex border-b border-slate-200 gap-6 overflow-x-auto">
        <button
          onClick={() => setActiveTab('setores')}
          className={`pb-3 text-xs font-bold uppercase tracking-wider flex items-center gap-2 border-b-2 transition-all whitespace-nowrap ${
            activeTab === 'setores' ? 'border-slate-900 text-slate-900' : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          <Building2 size={16} /> Setores & Departamentos
        </button>
        <button
          onClick={() => setActiveTab('parametros')}
          className={`pb-3 text-xs font-bold uppercase tracking-wider flex items-center gap-2 border-b-2 transition-all whitespace-nowrap ${
            activeTab === 'parametros' ? 'border-slate-900 text-slate-900' : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          <Bell size={16} /> Regras de Alerta
        </button>
        <button
          onClick={() => setActiveTab('acessos')}
          className={`pb-3 text-xs font-bold uppercase tracking-wider flex items-center gap-2 border-b-2 transition-all whitespace-nowrap ${
            activeTab === 'acessos' ? 'border-slate-900 text-slate-900' : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          <ShieldCheck size={16} /> Níveis de Acesso
        </button>
        <button
          onClick={() => setActiveTab('logs')}
          className={`pb-3 text-xs font-bold uppercase tracking-wider flex items-center gap-2 border-b-2 transition-all whitespace-nowrap ${
            activeTab === 'logs' ? 'border-slate-900 text-slate-900' : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          <History size={16} /> Logs de Auditoria
        </button>
      </div>

      {/* ABA: SETORES */}
      {activeTab === 'setores' && (
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-4">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div className="relative w-full sm:w-72">
              <Search className="absolute left-3 top-2.5 text-slate-400" size={16} />
              <input
                type="text"
                placeholder="Buscar setor..."
                value={buscaSetor}
                onChange={(e) => setBuscaSetor(e.target.value)}
                className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-slate-500/20 focus:outline-none"
              />
            </div>

            <div className="flex gap-2 w-full sm:w-auto">
              <button
                onClick={carregarSetores}
                className="p-2 border border-slate-300 rounded-lg hover:bg-slate-50 text-slate-600"
                title="Atualizar"
              >
                <RefreshCw size={16} className={loadingSetores ? 'animate-spin' : ''} />
              </button>
              <button
                onClick={() => setIsModalOpen(true)}
                className="bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold px-4 py-2 rounded-lg flex items-center gap-2 shadow-sm transition-all"
              >
                <Plus size={16} /> Novo Setor
              </button>
            </div>
          </div>

          <div className="overflow-x-auto border border-slate-200 rounded-lg">
            <table className="w-full text-left text-xs text-slate-700">
              <thead className="bg-slate-50 uppercase text-slate-500 border-b border-slate-200">
                <tr>
                  <th className="p-3">ID</th>
                  <th className="p-3">Nome do Setor</th>
                  <th className="p-3">Descrição</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {loadingSetores ? (
                  <tr><td colSpan="3" className="p-4 text-center text-slate-400">Carregando...</td></tr>
                ) : setoresFiltrados.length === 0 ? (
                  <tr><td colSpan="3" className="p-4 text-center text-slate-400">Nenhum setor encontrado.</td></tr>
                ) : (
                  setoresFiltrados.map((setor) => (
                    <tr key={setor.id} className="hover:bg-slate-50">
                      <td className="p-3 font-mono text-slate-400">#{setor.id}</td>
                      <td className="p-3 font-semibold text-slate-900">{setor.nome}</td>
                      <td className="p-3 text-slate-500">{setor.descricao || '—'}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ABA: PARÂMETROS DE ALERTA */}
      {activeTab === 'parametros' && (
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm max-w-2xl space-y-4">
          <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
            <Bell size={18} className="text-slate-500" /> Prazos Globais de Notificação
          </h2>

          <div className="space-y-4 pt-2">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Alerta de Vencimento de ASO (dias antes)
              </label>
              <input
                type="number"
                min="1"
                value={diasAlertaAso}
                onChange={(e) => setDiasAlertaAso(e.target.value)}
                className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2.5 text-xs text-slate-800 focus:ring-2 focus:ring-slate-500/20 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Alerta de Substituição de EPI (dias antes)
              </label>
              <input
                type="number"
                min="1"
                value={diasAlertaEpi}
                onChange={(e) => setDiasAlertaEpi(e.target.value)}
                className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2.5 text-xs text-slate-800 focus:ring-2 focus:ring-slate-500/20 focus:outline-none"
              />
            </div>

            <button
              onClick={handleSalvarParametros}
              disabled={salvandoParametros}
              className="bg-slate-900 hover:bg-slate-800 disabled:opacity-60 disabled:cursor-not-allowed text-white text-xs font-bold px-4 py-2.5 rounded-lg flex items-center gap-2 shadow-sm transition-all"
            >
              <Save size={16} /> {salvandoParametros ? 'Salvando...' : 'Salvar Parâmetros'}
            </button>
          </div>
        </div>
      )}

      {/* ABA: PERFIS E PERMISSÕES */}
      {activeTab === 'acessos' && (
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-6">
          <div className="border-b pb-4 border-slate-100">
            <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
              <UserCheck size={18} className="text-slate-600" /> Controle de Permissões e Perfis de Acesso
            </h2>
            <p className="text-xs text-slate-500 mt-1">
              Defina os privilégios dos usuários para controlar as permissões de edição e visualização no sistema.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 border border-rose-200 bg-rose-50/50 rounded-xl space-y-1">
              <span className="text-xs font-bold text-rose-700 uppercase">Administrador</span>
              <p className="text-xs text-slate-600">Acesso irrestrito a configurações, parametrização, exclusões e relatórios estratégicos.</p>
            </div>
            <div className="p-4 border border-slate-300 bg-slate-100/60 rounded-xl space-y-1">
              <span className="text-xs font-bold text-slate-800 uppercase">Técnico SST</span>
              <p className="text-xs text-slate-600">Registros operacionais (entrega de EPIs, cadastros de colaboradores e exames ASO).</p>
            </div>
            <div className="p-4 border border-slate-200 bg-slate-50 rounded-xl space-y-1">
              <span className="text-xs font-bold text-slate-500 uppercase">Consultor / Leitura</span>
              <p className="text-xs text-slate-600">Apenas consulta e exportação de dashboards, pendências e fichas individuais.</p>
            </div>
          </div>

          <div className="space-y-3 pt-2">
            <div className="flex justify-between items-center">
              <h3 className="text-xs font-bold text-slate-700 uppercase">Atribuição Individual por Usuário</h3>
              <button
                onClick={carregarColaboradoresPermissoes}
                className="text-xs text-slate-500 hover:text-slate-700 flex items-center gap-1 font-semibold"
              >
                <RefreshCw size={14} className={loadingColabs ? 'animate-spin' : ''} /> Atualizar Lista
              </button>
            </div>

            <div className="overflow-x-auto border border-slate-200 rounded-lg">
              <table className="w-full text-left text-xs text-slate-700">
                <thead className="bg-slate-50 uppercase text-slate-500 border-b border-slate-200">
                  <tr>
                    <th className="p-3">Usuário / Colaborador</th>
                    <th className="p-3">Cargo</th>
                    <th className="p-3">Perfil de Acesso Atual</th>
                    <th className="p-3 text-right">Ação</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {colaboradoresLista.length === 0 ? (
                    <tr><td colSpan="4" className="p-4 text-center text-slate-400">Nenhum usuário cadastrado.</td></tr>
                  ) : (
                    colaboradoresLista.map((colab) => (
                      <tr key={colab.id} className="hover:bg-slate-50">
                        <td className="p-3 font-semibold text-slate-900">{colab.nome}</td>
                        <td className="p-3 text-slate-500">{colab.cargo}</td>
                        <td className="p-3">
                          <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase ${badgePerfilClasses(colab.perfil_acesso)}`}>
                            {colab.perfil_acesso || 'Técnico SST'}
                          </span>
                        </td>
                        <td className="p-3 text-right">
                          <select
                            value={colab.perfil_acesso || 'Técnico SST'}
                            onChange={(e) => handleAlterarPerfil(colab.id, e.target.value)}
                            className="bg-slate-50 border border-slate-300 rounded-md p-1.5 text-xs text-slate-700 font-medium focus:ring-2 focus:ring-slate-500/20 focus:outline-none"
                          >
                            <option value="Administrador">Administrador</option>
                            <option value="Técnico SST">Técnico SST</option>
                            <option value="Consultor / Leitura">Consultor / Leitura</option>
                          </select>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ABA: LOGS DE AUDITORIA */}
      {activeTab === 'logs' && (
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-4">
          <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
            <History size={18} className="text-slate-600" /> Registro de Atividades Recentes
          </h2>
          <p className="text-xs text-slate-400">
            Este módulo ainda não persiste logs reais no backend — exibindo dados ilustrativos até a implementação
            de uma tabela de auditoria dedicada.
          </p>
          <div className="border border-slate-100 rounded-lg divide-y divide-slate-100 text-xs">
            <div className="p-3 flex justify-between items-center">
              <span><strong>SISTEMA:</strong> Inicialização do Banco de Dados concluída</span>
              <span className="text-slate-400 font-mono">10/09/2026 08:30</span>
            </div>
            <div className="p-3 flex justify-between items-center">
              <span><strong>USUÁRIO (Admin):</strong> Cadastro de novo colaborador executado</span>
              <span className="text-slate-400 font-mono">10/09/2026 10:15</span>
            </div>
          </div>
        </div>
      )}

      {/* MODAL CADASTRAR SETOR */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6 space-y-4">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Building2 className="text-slate-700" size={18} /> Novo Setor
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleCadastrarSetor} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Nome do Setor *</label>
                <input
                  type="text"
                  required
                  value={novoSetor.nome}
                  onChange={(e) => setNovoSetor({ ...novoSetor, nome: e.target.value })}
                  placeholder="Ex: Laboratório de Asfalto"
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2.5 text-xs focus:ring-2 focus:ring-slate-500/20 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Descrição</label>
                <textarea
                  rows={3}
                  value={novoSetor.descricao}
                  onChange={(e) => setNovoSetor({ ...novoSetor, descricao: e.target.value })}
                  placeholder="Opcional..."
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2.5 text-xs focus:ring-2 focus:ring-slate-500/20 focus:outline-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 border border-slate-300 rounded-lg text-xs font-semibold text-slate-600 hover:bg-slate-50"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-bold shadow-sm"
                >
                  Salvar Setor
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}