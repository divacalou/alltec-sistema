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

const API_BASE = "http://localhost:8000/api";

export default function Configuracoes() {
  const [activeTab, setActiveTab] = useState('setores');
  
  // Parâmetros Globais
  const [diasAlertaAso, setDiasAlertaAso] = useState(30);
  const [diasAlertaEpi, setDiasAlertaEpi] = useState(15);

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
      const res = await fetch(`${API_BASE}/setores`);
      if (res.ok) {
        const data = await res.json();
        setSetores(data);
      }
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
      const res = await fetch(`${API_BASE}/setores`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(novoSetor)
      });

      if (res.ok) {
        showFeedback('sucesso', 'Setor cadastrado com sucesso!');
        setNovoSetor({ nome: '', descricao: '' });
        setIsModalOpen(false);
        carregarSetores();
      } else {
        showFeedback('erro', 'Erro ao salvar novo setor.');
      }
    } catch (err) {
      showFeedback('erro', 'Erro de conexão com o servidor.');
    }
  };

  // --- FUNÇÕES DE PERMISSÕES ---
  const carregarColaboradoresPermissoes = async () => {
    setLoadingColabs(true);
    try {
      const res = await fetch(`${API_BASE}/colaboradores`);
      if (res.ok) {
        const data = await res.json();
        setColaboradoresLista(data);
      }
    } catch (err) {
      showFeedback('erro', 'Erro ao carregar colaboradores.');
    } finally {
      setLoadingColabs(false);
    }
  };

  const handleAlterarPerfil = async (colaboradorId, novoPerfil) => {
    try {
      const res = await fetch(`${API_BASE}/colaboradores/${colaboradorId}/permissao`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ perfil_acesso: novoPerfil })
      });

      if (res.ok) {
        showFeedback('sucesso', 'Nível de acesso alterado!');
        carregarColaboradoresPermissoes();
      } else {
        showFeedback('erro', 'Erro ao alterar nível de acesso.');
      }
    } catch (err) {
      showFeedback('erro', 'Erro de conexão com o servidor.');
    }
  };

  const setoresFiltrados = setores.filter(s => 
    s.nome.toLowerCase().includes(buscaSetor.toLowerCase()) ||
    (s.descricao && s.descricao.toLowerCase().includes(buscaSetor.toLowerCase()))
  );

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Cabeçalho */}
      <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm flex justify-between items-center">
        <div>
          <h1 className="text-xl font-bold text-gray-900 flex items-center gap-2">
            <Settings className="text-red-600" size={24} /> Configurações do Sistema
          </h1>
          <p className="text-xs text-gray-500 mt-1">
            Gerencie cadastros auxiliares de setores, parâmetros globais de alerta e permissões.
          </p>
        </div>
      </div>

      {/* Alertas */}
      {mensagem.texto && (
        <div className={`p-4 rounded-xl flex items-center gap-3 border text-sm font-medium ${
          mensagem.tipo === 'sucesso' 
            ? 'bg-emerald-50 text-emerald-800 border-emerald-200' 
            : 'bg-rose-50 text-rose-800 border-rose-200'
        }`}>
          {mensagem.tipo === 'sucesso' ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />}
          {mensagem.texto}
        </div>
      )}

      {/* Navegação por Abas */}
      <div className="flex border-b border-gray-200 gap-6">
        <button
          onClick={() => setActiveTab('setores')}
          className={`pb-3 text-xs font-bold uppercase tracking-wider flex items-center gap-2 border-b-2 transition-all ${
            activeTab === 'setores' ? 'border-red-600 text-red-600' : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          <Building2 size={16} /> Setores & Departamentos
        </button>
        <button
          onClick={() => setActiveTab('parametros')}
          className={`pb-3 text-xs font-bold uppercase tracking-wider flex items-center gap-2 border-b-2 transition-all ${
            activeTab === 'parametros' ? 'border-red-600 text-red-600' : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          <Bell size={16} /> Regras de Alerta
        </button>
        <button
          onClick={() => setActiveTab('acessos')}
          className={`pb-3 text-xs font-bold uppercase tracking-wider flex items-center gap-2 border-b-2 transition-all ${
            activeTab === 'acessos' ? 'border-red-600 text-red-600' : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          <ShieldCheck size={16} /> Níveis de Acesso
        </button>
        <button
          onClick={() => setActiveTab('logs')}
          className={`pb-3 text-xs font-bold uppercase tracking-wider flex items-center gap-2 border-b-2 transition-all ${
            activeTab === 'logs' ? 'border-red-600 text-red-600' : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          <History size={16} /> Logs de Auditoria
        </button>
      </div>

      {/* ABA: SETORES */}
      {activeTab === 'setores' && (
        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm space-y-4">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div className="relative w-full sm:w-72">
              <Search className="absolute left-3 top-2.5 text-gray-400" size={16} />
              <input
                type="text"
                placeholder="Buscar setor..."
                value={buscaSetor}
                onChange={(e) => setBuscaSetor(e.target.value)}
                className="w-full pl-9 pr-3 py-2 bg-gray-50 border border-gray-300 rounded-lg text-xs focus:ring-2 focus:ring-red-500 focus:outline-none"
              />
            </div>

            <div className="flex gap-2 w-full sm:w-auto">
              <button 
                onClick={carregarSetores} 
                className="p-2 border border-gray-300 rounded-lg hover:bg-gray-50 text-gray-600"
                title="Atualizar"
              >
                <RefreshCw size={16} className={loadingSetores ? 'animate-spin' : ''} />
              </button>
              <button 
                onClick={() => setIsModalOpen(true)}
                className="bg-red-600 hover:bg-red-700 text-white text-xs font-bold px-4 py-2 rounded-lg flex items-center gap-2 shadow-sm transition-all"
              >
                <Plus size={16} /> Novo Setor
              </button>
            </div>
          </div>

          <div className="overflow-x-auto border border-gray-100 rounded-lg">
            <table className="w-full text-left text-xs text-gray-700">
              <thead className="bg-gray-50 uppercase text-gray-500 border-b border-gray-200">
                <tr>
                  <th className="p-3">ID</th>
                  <th className="p-3">Nome do Setor</th>
                  <th className="p-3">Descrição</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {loadingSetores ? (
                  <tr><td colSpan="3" className="p-4 text-center text-gray-400">Carregando...</td></tr>
                ) : setoresFiltrados.length === 0 ? (
                  <tr><td colSpan="3" className="p-4 text-center text-gray-400">Nenhum setor encontrado.</td></tr>
                ) : (
                  setoresFiltrados.map((setor) => (
                    <tr key={setor.id} className="hover:bg-gray-50">
                      <td className="p-3 font-mono text-gray-400">#{setor.id}</td>
                      <td className="p-3 font-semibold text-gray-900">{setor.nome}</td>
                      <td className="p-3 text-gray-500">{setor.descricao || '—'}</td>
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
        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm max-w-2xl space-y-4">
          <h2 className="text-sm font-bold text-gray-800 uppercase tracking-wider flex items-center gap-2">
            <Bell size={18} className="text-amber-500" /> Prazos Globais de Notificação
          </h2>

          <div className="space-y-4 pt-2">
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                Alerta de Vencimento de ASO (dias antes)
              </label>
              <input
                type="number"
                value={diasAlertaAso}
                onChange={(e) => setDiasAlertaAso(e.target.value)}
                className="w-full bg-gray-50 border border-gray-300 rounded-lg p-2.5 text-xs text-gray-800 focus:ring-2 focus:ring-red-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                Alerta de Substituição de EPI (dias antes)
              </label>
              <input
                type="number"
                value={diasAlertaEpi}
                onChange={(e) => setDiasAlertaEpi(e.target.value)}
                className="w-full bg-gray-50 border border-gray-300 rounded-lg p-2.5 text-xs text-gray-800 focus:ring-2 focus:ring-red-500 focus:outline-none"
              />
            </div>

            <button 
              onClick={() => showFeedback('sucesso', 'Parâmetros salvos com sucesso!')}
              className="bg-red-600 hover:bg-red-700 text-white text-xs font-bold px-4 py-2.5 rounded-lg flex items-center gap-2 shadow-sm transition-all"
            >
              <Save size={16} /> Salvar Parâmetros
            </button>
          </div>
        </div>
      )}

      {/* ABA: PERFIS E PERMISSÕES */}
      {activeTab === 'acessos' && (
        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm space-y-6">
          <div className="border-b pb-4 border-gray-100">
            <h2 className="text-sm font-bold text-gray-800 uppercase tracking-wider flex items-center gap-2">
              <UserCheck size={18} className="text-blue-600" /> Controle de Permissões e Perfis de Acesso
            </h2>
            <p className="text-xs text-gray-500 mt-1">
              Defina os privilégios dos usuários para controlar as permissões de edição e visualização no sistema.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 border border-red-100 bg-red-50/50 rounded-xl space-y-1">
              <span className="text-xs font-bold text-red-600 uppercase">Administrador</span>
              <p className="text-xs text-gray-600">Acesso irrestrito a configurações, parametrização, exclusões e relatórios estratégicos.</p>
            </div>
            <div className="p-4 border border-blue-100 bg-blue-50/50 rounded-xl space-y-1">
              <span className="text-xs font-bold text-blue-600 uppercase">Técnico SST</span>
              <p className="text-xs text-gray-600">Registros operacionais (entrega de EPIs, cadastros de colaboradores e exames ASO).</p>
            </div>
            <div className="p-4 border border-emerald-100 bg-emerald-50/50 rounded-xl space-y-1">
              <span className="text-xs font-bold text-emerald-600 uppercase">Consultor / Leitura</span>
              <p className="text-xs text-gray-600">Apenas consulta e exportação de dashboards, pendências e fichas individuais.</p>
            </div>
          </div>

          <div className="space-y-3 pt-2">
            <div className="flex justify-between items-center">
              <h3 className="text-xs font-bold text-gray-700 uppercase">Atribuição Individual por Usuário</h3>
              <button 
                onClick={carregarColaboradoresPermissoes} 
                className="text-xs text-gray-500 hover:text-gray-700 flex items-center gap-1 font-semibold"
              >
                <RefreshCw size={14} className={loadingColabs ? 'animate-spin' : ''} /> Atualizar Lista
              </button>
            </div>

            <div className="overflow-x-auto border border-gray-200 rounded-lg">
              <table className="w-full text-left text-xs text-gray-700">
                <thead className="bg-gray-50 uppercase text-gray-500 border-b border-gray-200">
                  <tr>
                    <th className="p-3">Usuário / Colaborador</th>
                    <th className="p-3">Cargo</th>
                    <th className="p-3">Perfil de Acesso Atual</th>
                    <th className="p-3 text-right">Ação</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {colaboradoresLista.length === 0 ? (
                    <tr><td colSpan="4" className="p-4 text-center text-gray-400">Nenhum usuário cadastrado.</td></tr>
                  ) : (
                    colaboradoresLista.map((colab) => (
                      <tr key={colab.id} className="hover:bg-gray-50">
                        <td className="p-3 font-semibold text-gray-900">{colab.nome}</td>
                        <td className="p-3 text-gray-500">{colab.cargo}</td>
                        <td className="p-3">
                          <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase ${
                            colab.perfil_acesso === 'Administrador' ? 'bg-red-100 text-red-700' :
                            colab.perfil_acesso === 'Consultor / Leitura' ? 'bg-emerald-100 text-emerald-700' :
                            'bg-blue-100 text-blue-700'
                          }`}>
                            {colab.perfil_acesso || 'Técnico SST'}
                          </span>
                        </td>
                        <td className="p-3 text-right">
                          <select
                            value={colab.perfil_acesso || 'Técnico SST'}
                            onChange={(e) => handleAlterarPerfil(colab.id, e.target.value)}
                            className="bg-gray-50 border border-gray-300 rounded-md p-1.5 text-xs text-gray-700 font-medium focus:ring-2 focus:ring-red-500 focus:outline-none"
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
        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm space-y-4">
          <h2 className="text-sm font-bold text-gray-800 uppercase tracking-wider flex items-center gap-2">
            <History size={18} className="text-gray-600" /> Registro de Atividades Recentes
          </h2>
          <div className="border border-gray-100 rounded-lg divide-y divide-gray-100 text-xs">
            <div className="p-3 flex justify-between items-center">
              <span><strong>SISTEMA:</strong> Inicialização do Banco de Dados concluída</span>
              <span className="text-gray-400 font-mono">10/09/2026 08:30</span>
            </div>
            <div className="p-3 flex justify-between items-center">
              <span><strong>USUÁRIO (Admin):</strong> Cadastro de novo colaborador executado</span>
              <span className="text-gray-400 font-mono">10/09/2026 10:15</span>
            </div>
          </div>
        </div>
      )}

      {/* MODAL CADASTRAR SETOR */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6 space-y-4">
            <div className="flex justify-between items-center border-b pb-3">
              <h3 className="text-sm font-bold text-gray-900 flex items-center gap-2">
                <Building2 className="text-red-600" size={18} /> Novo Setor
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-600">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleCadastrarSetor} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Nome do Setor *</label>
                <input
                  type="text"
                  required
                  value={novoSetor.nome}
                  onChange={(e) => setNovoSetor({ ...novoSetor, nome: e.target.value })}
                  placeholder="Ex: Laboratório de Asfalto"
                  className="w-full bg-gray-50 border border-gray-300 rounded-lg p-2.5 text-xs focus:ring-2 focus:ring-red-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Descrição</label>
                <textarea
                  rows={3}
                  value={novoSetor.descricao}
                  onChange={(e) => setNovoSetor({ ...novoSetor, descricao: e.target.value })}
                  placeholder="Opcional..."
                  className="w-full bg-gray-50 border border-gray-300 rounded-lg p-2.5 text-xs focus:ring-2 focus:ring-red-500 focus:outline-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 border rounded-lg text-xs font-semibold text-gray-600 hover:bg-gray-50"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-xs font-bold shadow-sm"
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