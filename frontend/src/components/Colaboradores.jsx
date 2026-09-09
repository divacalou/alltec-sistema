import React, { useEffect, useState } from 'react';
import { Users, Plus, Building2, X, Truck, Edit, UserX, UserCheck, Eye, FileText } from 'lucide-react';
import { api } from '../services/api';

const formatarCPF = (value) => {
  return value
    .replace(/\D/g, '')
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d{1,2})$/, '$1-$2')
    .slice(0, 14);
};

const validarCPF = (cpf) => {
  const cleanCPF = cpf.replace(/\D/g, '');
  if (cleanCPF.length !== 11 || /^(\d)\1{10}$/.test(cleanCPF)) return false;

  let soma = 0;
  let resto;

  for (let i = 1; i <= 9; i++) {
    soma += parseInt(cleanCPF.substring(i - 1, i)) * (11 - i);
  }
  resto = (soma * 10) % 11;
  if (resto === 10 || resto === 11) resto = 0;
  if (resto !== parseInt(cleanCPF.substring(9, 10))) return false;

  soma = 0;
  for (let i = 1; i <= 10; i++) {
    soma += parseInt(cleanCPF.substring(i - 1, i)) * (12 - i);
  }
  resto = (soma * 10) % 11;
  if (resto === 10 || resto === 11) resto = 0;
  if (resto !== parseInt(cleanCPF.substring(10, 11))) return false;

  return true;
};

const estadoInicialColaborador = {
  nome: '',
  cpf: '',
  matricula: '',
  data_nascimento: '',
  data_admissao: '',
  endereco: '',
  cargo: '',
  setor_id: '',
  is_motorista: false,
  tipo_veiculo: 'Basculante',
  cnh_numero: '',
  cnh_categoria: 'D',
  cnh_validade: '',
  status: 'Ativo',
  data_demissao: '',
  motivo_demissao: 'Sem Justa Causa',
  observacao_demissao: '',
  aso_demissional_concluido: false,
  exames_demissionais_obs: ''
};

export default function Colaboradores() {
  const [colaboradores, setColaboradores] = useState([]);
  const [setores, setSetores] = useState([]);
  
  const [filtroStatus, setFiltroStatus] = useState('Ativo');

  const [modalColaboradorOpen, setModalColaboradorOpen] = useState(false);
  const [modalSetorOpen, setModalSetorOpen] = useState(false);
  const [modalDesligamentoOpen, setModalDesligamentoOpen] = useState(false);
  const [modalDetalhesInativoOpen, setModalDetalhesInativoOpen] = useState(false);

  const [editingId, setEditingId] = useState(null);
  const [colaboradorParaDesligar, setColaboradorParaDesligar] = useState(null);
  const [colaboradorDetalhado, setColaboradorDetalhado] = useState(null);

  const [novoColaborador, setNovoColaborador] = useState(estadoInicialColaborador);
  const [dadosDesligamento, setDadosDesligamento] = useState({
    data_demissao: new Date().toISOString().split('T')[0],
    motivo_demissao: 'Sem Justa Causa',
    observacao_demissao: '',
    aso_demissional_concluido: false,
    exames_demissionais_obs: ''
  });

  const [novoSetor, setNovoSetor] = useState({ nome: '', descricao: '' });

  const carregarDados = async () => {
    try {
      const [resColab, resSetores] = await Promise.all([
        api.get('/colaboradores'),
        api.get('/setores')
      ]);

      let listaColab = [];
      if (Array.isArray(resColab.data)) {
        listaColab = resColab.data;
      } else if (resColab.data && typeof resColab.data === 'object') {
        listaColab = resColab.data.colaboradores || [resColab.data];
      }

      let listaSetores = [];
      if (Array.isArray(resSetores.data)) {
        listaSetores = resSetores.data;
      } else if (resSetores.data && typeof resSetores.data === 'object') {
        listaSetores = resSetores.data.setores || [resSetores.data];
      }

      setColaboradores(listaColab);
      setSetores(listaSetores);
    } catch (err) {
      console.error("Erro ao carregar dados do backend:", err);
    }
  };

  // Garante o carregamento inicial da lista ao abrir o componente
  useEffect(() => {
    carregarDados();
  }, []);

  const handleCargoChange = (value) => {
    const eMotorista = value.toLowerCase().includes('motorista');
    setNovoColaborador((prev) => ({
      ...prev,
      cargo: value,
      is_motorista: eMotorista
    }));
  };

  const handleCPFChange = (e) => {
    const cpfFormatado = formatarCPF(e.target.value);
    setNovoColaborador((prev) => ({ ...prev, cpf: cpfFormatado }));
  };

  const handleCNHChange = (e) => {
    const apenasNumeros = e.target.value.replace(/\D/g, '').slice(0, 11);
    setNovoColaborador((prev) => ({ ...prev, cnh_numero: apenasNumeros }));
  };

  const handleAbrirModalNovo = () => {
    setEditingId(null);
    setNovoColaborador(estadoInicialColaborador);
    setModalColaboradorOpen(true);
  };

  const handleEditarColaborador = (colaborador) => {
    setEditingId(colaborador.id);
    setNovoColaborador({
      ...colaborador,
      cpf: colaborador.cpf ? formatarCPF(colaborador.cpf) : '',
      setor_id: colaborador.setor_id || '',
      cnh_numero: colaborador.cnh_numero || '',
      cnh_categoria: colaborador.cnh_categoria || 'D',
      cnh_validade: colaborador.cnh_validade || '',
      tipo_veiculo: colaborador.tipo_veiculo || 'Basculante'
    });
    setModalColaboradorOpen(true);
  };

  const handleAcaoStatus = (colaborador) => {
    if (colaborador.status === 'Inativo') {
      if (window.confirm(`Deseja reativar o colaborador ${colaborador.nome}?`)) {
        reativarColaborador(colaborador.id);
      }
    } else {
      setColaboradorParaDesligar(colaborador);
      setDadosDesligamento({
        data_demissao: new Date().toISOString().split('T')[0],
        motivo_demissao: 'Sem Justa Causa',
        observacao_demissao: '',
        aso_demissional_concluido: false,
        exames_demissionais_obs: ''
      });
      setModalDesligamentoOpen(true);
    }
  };

  const reativarColaborador = async (id) => {
    try {
      await api.patch(`/colaboradores/${id}`, { 
        status: 'Ativo',
        data_demissao: null,
        motivo_demissao: null,
        observacao_demissao: null,
        aso_demissional_concluido: false,
        exames_demissionais_obs: null
      });
      carregarDados();
    } catch (err) {
      alert("Erro ao reativar colaborador: " + (err.response?.data?.detail || err.message));
    }
  };

  const handleConfirmarDesligamento = async (e) => {
    e.preventDefault();
    try {
      await api.patch(`/colaboradores/${colaboradorParaDesligar.id}`, {
        status: 'Inativo',
        ...dadosDesligamento
      });
      setModalDesligamentoOpen(false);
      setColaboradorParaDesligar(null);
      carregarDados();
    } catch (err) {
      alert("Erro ao desativar colaborador: " + (err.response?.data?.detail || err.message));
    }
  };

  const handleCadastrarColaborador = async (e) => {
    e.preventDefault();

    if (!validarCPF(novoColaborador.cpf)) {
      alert("CPF inválido! Verifique os números digitados.");
      return;
    }

    if (novoColaborador.is_motorista) {
      if (novoColaborador.cnh_numero && novoColaborador.cnh_numero.length !== 11) {
        alert("O número da CNH deve ter exatamente 11 dígitos.");
        return;
      }
      if (!novoColaborador.cnh_validade) {
        alert("Preencha a validade da CNH.");
        return;
      }
    }

    const payload = {
      nome: novoColaborador.nome,
      cpf: novoColaborador.cpf ? novoColaborador.cpf.replace(/\D/g, '') : '',
      matricula: novoColaborador.matricula,
      data_nascimento: novoColaborador.data_nascimento || null,
      data_admissao: novoColaborador.data_admissao || null,
      endereco: novoColaborador.endereco || '',
      cargo: novoColaborador.cargo,
      setor_id: novoColaborador.setor_id ? parseInt(novoColaborador.setor_id) : null,
      is_motorista: Boolean(novoColaborador.is_motorista),
      tipo_veiculo: novoColaborador.is_motorista ? novoColaborador.tipo_veiculo : null,
      cnh_numero: novoColaborador.is_motorista ? novoColaborador.cnh_numero : null,
      cnh_categoria: novoColaborador.is_motorista ? novoColaborador.cnh_categoria : null,
      cnh_validade: novoColaborador.is_motorista ? novoColaborador.cnh_validade : null,
      status: novoColaborador.status || 'Ativo'
    };

    try {
      if (editingId) {
        await api.put(`/colaboradores/${editingId}`, payload);
      } else {
        await api.post('/colaboradores', payload);
      }

      setModalColaboradorOpen(false);
      setEditingId(null);
      setNovoColaborador(estadoInicialColaborador);
      carregarDados();
      alert("Salvo com sucesso!");
    } catch (err) {
      console.error("Erro detalhado no salvamento:", err.response || err);
      alert("Erro ao salvar colaborador: " + (err.response?.data?.detail || err.message));
    }
  };

  const handleCadastrarSetor = async (e) => {
    e.preventDefault();
    try {
      await api.post('/setores/', novoSetor);
      setModalSetorOpen(false);
      setNovoSetor({ nome: '', descricao: '' });
      carregarDados();
    } catch (err) {
      alert("Erro ao cadastrar setor: " + (err.response?.data?.detail || err.message));
    }
  };

  // Lógica de filtragem resiliente a caixa alta/baixa
  const colaboradoresExibidos = colaboradores.filter((c) => {
    if (filtroStatus === 'Todos') return true;
    const statusColab = String(c.status || 'Ativo').toLowerCase();
    const statusFiltro = String(filtroStatus).toLowerCase();
    return statusColab === statusFiltro;
  });

  return (
    <div className="space-y-6">
      {/* Cabeçalho */}
      <div className="flex flex-wrap justify-between items-center bg-[#1a1f26] p-5 rounded-xl border border-gray-800 gap-4">
        <h1 className="text-xl font-black text-white uppercase flex items-center gap-2">
          <Users className="text-red-600" size={24} /> Gestão de Colaboradores
        </h1>

        <div className="flex items-center gap-3">
          <div className="bg-[#14181f] p-1 rounded-lg border border-gray-800 flex items-center gap-1">
            <button
              onClick={() => setFiltroStatus('Ativo')}
              className={`px-3 py-1.5 text-xs font-bold rounded-md transition-all ${filtroStatus === 'Ativo' ? 'bg-red-600 text-white' : 'text-gray-400 hover:text-white'}`}>
              Ativos
            </button>
            <button
              onClick={() => setFiltroStatus('Inativo')}
              className={`px-3 py-1.5 text-xs font-bold rounded-md transition-all ${filtroStatus === 'Inativo' ? 'bg-red-600 text-white' : 'text-gray-400 hover:text-white'}`}>
              Inativos / Arquivados
            </button>
            <button
              onClick={() => setFiltroStatus('Todos')}
              className={`px-3 py-1.5 text-xs font-bold rounded-md transition-all ${filtroStatus === 'Todos' ? 'bg-red-600 text-white' : 'text-gray-400 hover:text-white'}`}>
              Todos
            </button>
          </div>

          <button
            onClick={() => setModalSetorOpen(true)}
            className="bg-gray-800 hover:bg-gray-700 text-gray-200 text-xs font-bold px-4 py-2.5 rounded-lg flex items-center gap-2 transition-all border border-gray-700">
            <Building2 size={16} /> Cadastrar Setor
          </button>

          <button
            onClick={handleAbrirModalNovo}
            className="bg-red-600 hover:bg-red-700 text-white text-xs font-bold px-4 py-2.5 rounded-lg flex items-center gap-2 shadow-md transition-all">
            <Plus size={16} /> Novo Colaborador
          </button>
        </div>
      </div>

      {/* Tabela de Colaboradores */}
      <div className="bg-[#1a1f26] rounded-xl border border-gray-800 overflow-hidden">
        <table className="w-full text-left text-sm text-gray-300">
          <thead className="bg-[#14181f] text-gray-400 font-bold uppercase text-[11px] border-b border-gray-800">
            <tr>
              <th className="p-4">Matrícula</th>
              <th className="p-4">Nome</th>
              <th className="p-4">CPF</th>
              <th className="p-4">Função / Cargo</th>
              <th className="p-4">Setor</th>
              {filtroStatus === 'Inativo' ? (
                <>
                  <th className="p-4">Data Demissão</th>
                  <th className="p-4">Motivo</th>
                  <th className="p-4">ASO Demissional</th>
                </>
              ) : (
                <th className="p-4">Detalhes CNH / Veículo</th>
              )}
              <th className="p-4">Status</th>
              <th className="p-4 text-right">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-800/60">
            {colaboradoresExibidos.length === 0 ? (
              <tr>
                <td colSpan="8" className="p-4 text-center text-gray-500 text-xs">
                  Nenhum colaborador encontrado neste filtro.
                </td>
              </tr>
            ) : (
              colaboradoresExibidos.map((c) => {
                const isInativo = c.status === 'Inativo';
                return (
                  <tr key={c.id} className={`hover:bg-gray-800/30 ${isInativo ? 'opacity-70 bg-gray-900/20' : ''}`}>
                    <td className="p-4 text-gray-400 font-mono text-xs">{c.matricula || '-'}</td>
                    <td className="p-4 font-bold text-white">{c.nome}</td>
                    <td className="p-4 text-gray-400">{c.cpf ? formatarCPF(c.cpf) : '-'}</td>
                    <td className="p-4 text-gray-300">
                      {c.cargo || c.funcão || c.funcao}
                      {c.tipo_veiculo && c.is_motorista && (
                        <span className="block text-[11px] text-amber-500 font-medium">
                          ({c.tipo_veiculo})
                        </span>
                      )}
                    </td>
                    <td className="p-4 text-gray-400">{c.setor || c.setor_nome || c.setor_id || '-'}</td>

                    {filtroStatus === 'Inativo' ? (
                      <>
                        <td className="p-4 text-rose-400 font-mono text-xs">
                          {c.data_demissao ? new Date(c.data_demissao).toLocaleDateString('pt-BR') : '-'}
                        </td>
                        <td className="p-4 text-xs font-semibold text-gray-300">
                          {c.motivo_demissao || '-'}
                        </td>
                        <td className="p-4">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${c.aso_demissional_concluido ? 'bg-emerald-500/20 text-emerald-400' : 'bg-rose-500/20 text-rose-400'}`}>
                            {c.aso_demissional_concluido ? 'OK / Feito' : 'Pendente'}
                          </span>
                        </td>
                      </>
                    ) : (
                      <td className="p-4 text-gray-300">
                        {c.cnh_numero ? (
                          <span className="flex items-center gap-1.5 text-xs text-amber-400 font-bold">
                            <Truck size={14} /> Cat. {c.cnh_categoria} - {c.cnh_numero}
                          </span>
                        ) : (
                          <span className="text-gray-600">-</span>
                        )}
                      </td>
                    )}

                    <td className="p-4">
                      <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold border ${isInativo
                        ? 'bg-rose-500/10 text-rose-400 border-rose-500/20'
                        : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                        }`}>
                        {c.status || 'Ativo'}
                      </span>
                    </td>
                    <td className="p-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        {isInativo && (
                          <button
                            onClick={() => {
                              setColaboradorDetalhado(c);
                              setModalDetalhesInativoOpen(true);
                            }}
                            title="Ver Detalhes da Demissão"
                            className="p-1.5 bg-gray-800 hover:bg-gray-700 text-blue-400 rounded-lg transition-colors"
                          >
                            <Eye size={14} />
                          </button>
                        )}
                        <button
                          onClick={() => handleEditarColaborador(c)}
                          title="Editar Colaborador"
                          className="p-1.5 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-lg transition-colors"
                        >
                          <Edit size={14} />
                        </button>
                        <button
                          onClick={() => handleAcaoStatus(c)}
                          title={isInativo ? "Reativar Colaborador" : "Desativar (Arquivar)"}
                          className={`p-1.5 rounded-lg transition-colors ${isInativo
                            ? 'bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400'
                            : 'bg-rose-500/10 hover:bg-rose-500/20 text-rose-400'
                            }`}
                        >
                          {isInativo ? <UserCheck size={14} /> : <UserX size={14} />}
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* MODAL QUESTIONÁRIO DE DESLIGAMENTO */}
      {modalDesligamentoOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex justify-center items-center p-4 z-50">
          <div className="bg-[#1a1f26] border border-gray-800 rounded-xl w-full max-w-lg p-6 space-y-4">
            <div className="flex justify-between items-center border-b border-gray-800 pb-3">
              <h3 className="text-lg font-bold text-rose-500 flex items-center gap-2">
                <UserX size={20} /> Desligamento de Colaborador
              </h3>
              <button onClick={() => setModalDesligamentoOpen(false)} className="text-gray-400 hover:text-white">
                <X size={20} />
              </button>
            </div>

            <p className="text-xs text-gray-300">
              Você está desativando <strong className="text-white">{colaboradorParaDesligar?.nome}</strong>. Preencha os dados rescisórios abaixo:
            </p>

            <form onSubmit={handleConfirmarDesligamento} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-gray-400 mb-1">Data de Demissão / Saída *</label>
                  <input
                    type="date"
                    required
                    className="w-full bg-[#14181f] border border-gray-800 rounded-lg p-2.5 text-sm text-white focus:outline-none focus:border-rose-500"
                    value={dadosDesligamento.data_demissao}
                    onChange={(e) => setDadosDesligamento({ ...dadosDesligamento, data_demissao: e.target.value })}
                  />
                </div>

                <div>
                  <label className="block text-xs text-gray-400 mb-1">Motivo do Desligamento *</label>
                  <select
                    required
                    className="w-full bg-[#14181f] border border-gray-800 rounded-lg p-2.5 text-sm text-white focus:outline-none focus:border-rose-500"
                    value={dadosDesligamento.motivo_demissao}
                    onChange={(e) => setDadosDesligamento({ ...dadosDesligamento, motivo_demissao: e.target.value })}
                  >
                    <option value="Sem Justa Causa">Sem Justa Causa</option>
                    <option value="Com Justa Causa">Com Justa Causa</option>
                    <option value="Pedido de Demissão">Pedido de Demissão</option>
                    <option value="Acordo Entre as Partes">Acordo Entre as Partes</option>
                    <option value="Abandono de Emprego">Abandono de Emprego</option>
                    <option value="Término de Contrato">Término de Contrato</option>
                    <option value="Outros">Outros</option>
                  </select>
                </div>
              </div>

              <div className="p-3 bg-[#14181f] rounded-lg border border-gray-800 space-y-2">
                <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-gray-200">
                  <input
                    type="checkbox"
                    className="rounded accent-emerald-500 w-4 h-4"
                    checked={dadosDesligamento.aso_demissional_concluido}
                    onChange={(e) => setDadosDesligamento({ ...dadosDesligamento, aso_demissional_concluido: e.target.checked })}
                  />
                  <span>ASO Demissional e Exames Realizados/Concluídos?</span>
                </label>

                <div>
                  <label className="block text-[11px] text-gray-400 mb-1">Observações dos Exames (Opcional)</label>
                  <input
                    type="text"
                    placeholder="Ex: Apto sem restrições, Exame realizado no lab X..."
                    className="w-full bg-[#1a1f26] border border-gray-800 rounded-lg p-2 text-xs text-white focus:outline-none focus:border-rose-500"
                    value={dadosDesligamento.exames_demissionais_obs}
                    onChange={(e) => setDadosDesligamento({ ...dadosDesligamento, exames_demissionais_obs: e.target.value })}
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs text-gray-400 mb-1">Observações do Motivo / Detalhes</label>
                <textarea
                  rows="3"
                  placeholder="Descreva o motivo detalhado ou observações internas..."
                  className="w-full bg-[#14181f] border border-gray-800 rounded-lg p-2.5 text-sm text-white focus:outline-none focus:border-rose-500"
                  value={dadosDesligamento.observacao_demissao}
                  onChange={(e) => setDadosDesligamento({ ...dadosDesligamento, observacao_demissao: e.target.value })}
                ></textarea>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-gray-800">
                <button
                  type="button"
                  onClick={() => setModalDesligamentoOpen(false)}
                  className="px-4 py-2 bg-gray-800 hover:bg-gray-700 text-gray-300 text-xs font-bold rounded-lg">
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-lg">
                  Confirmar Desligamento
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL DETALHES DE COLABORADOR INATIVO */}
      {modalDetalhesInativoOpen && colaboradorDetalhado && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex justify-center items-center p-4 z-50">
          <div className="bg-[#1a1f26] border border-gray-800 rounded-xl w-full max-w-lg p-6 space-y-4">
            <div className="flex justify-between items-center border-b border-gray-800 pb-3">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <FileText className="text-blue-500" size={20} /> Histórico Rescisório
              </h3>
              <button onClick={() => setModalDetalhesInativoOpen(false)} className="text-gray-400 hover:text-white">
                <X size={20} />
              </button>
            </div>

            <div className="space-y-3 text-xs text-gray-300">
              <div className="p-3 bg-[#14181f] rounded-lg border border-gray-800">
                <p className="text-sm font-bold text-white mb-1">{colaboradorDetalhado.nome}</p>
                <p><strong>Cargo:</strong> {colaboradorDetalhado.cargo || colaboradorDetalhado.funcão || colaboradorDetalhado.funcao}</p>
                <p><strong>CPF:</strong> {colaboradorDetalhado.cpf ? formatarCPF(colaboradorDetalhado.cpf) : '-'}</p>
                <p><strong>Data Admissão:</strong> {colaboradorDetalhado.data_admissao ? new Date(colaboradorDetalhado.data_admissao).toLocaleDateString('pt-BR') : '-'}</p>
              </div>

              <div className="p-3 bg-[#14181f] rounded-lg border border-rose-500/20 space-y-1.5">
                <p className="text-rose-400 font-bold">Informações da Demissão</p>
                <p><strong>Data de Saída:</strong> {colaboradorDetalhado.data_demissao ? new Date(colaboradorDetalhado.data_demissao).toLocaleDateString('pt-BR') : '-'}</p>
                <p><strong>Motivo:</strong> {colaboradorDetalhado.motivo_demissao || '-'}</p>
                <p><strong>Observações:</strong> {colaboradorDetalhado.observacao_demissao || 'Nenhuma observação informada.'}</p>
              </div>

              <div className="p-3 bg-[#14181f] rounded-lg border border-gray-800 space-y-1.5">
                <p className="text-amber-400 font-bold">Exames e ASO Demissional</p>
                <p><strong>Status ASO:</strong> {colaboradorDetalhado.aso_demissional_concluido ? '✅ Concluído / Apto' : '❌ Pendente'}</p>
                <p><strong>Obs. Exames:</strong> {colaboradorDetalhado.exames_demissionais_obs || '-'}</p>
              </div>
            </div>

            <div className="flex justify-end pt-2 border-t border-gray-800">
              <button
                type="button"
                onClick={() => setModalDetalhesInativoOpen(false)}
                className="px-4 py-2 bg-gray-800 hover:bg-gray-700 text-gray-300 text-xs font-bold rounded-lg">
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL CADASTRAR/EDITAR COLABORADOR */}
      {modalColaboradorOpen && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex justify-center items-center p-4 z-50">
          <div className="bg-[#1a1f26] border border-gray-800 rounded-xl w-full max-w-2xl p-6 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center border-b border-gray-800 pb-3">
              <h3 className="text-lg font-bold text-white">
                {editingId ? 'Editar Colaborador' : 'Cadastrar Novo Colaborador'}
              </h3>
              <button onClick={() => setModalColaboradorOpen(false)} className="text-gray-400 hover:text-white">
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleCadastrarColaborador} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div className="md:col-span-2">
                  <label className="block text-xs text-gray-400 mb-1">Nome Completo *</label>
                  <input
                    type="text"
                    required
                    placeholder="Ex: Carlos Silva"
                    className="w-full bg-[#14181f] border border-gray-800 rounded-lg p-2.5 text-sm text-white focus:outline-none focus:border-red-600"
                    value={novoColaborador.nome}
                    onChange={(e) => setNovoColaborador({ ...novoColaborador, nome: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-400 mb-1">Matrícula *</label>
                  <input
                    type="text"
                    required
                    placeholder="Ex: MAT-001"
                    className="w-full bg-[#14181f] border border-gray-800 rounded-lg p-2.5 text-sm text-white focus:outline-none focus:border-red-600"
                    value={novoColaborador.matricula}
                    onChange={(e) => setNovoColaborador({ ...novoColaborador, matricula: e.target.value })}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs text-gray-400 mb-1">CPF *</label>
                  <input
                    type="text"
                    required
                    placeholder="000.000.000-00"
                    maxLength={14}
                    className="w-full bg-[#14181f] border border-gray-800 rounded-lg p-2.5 text-sm text-white focus:outline-none focus:border-red-600 font-mono"
                    value={novoColaborador.cpf}
                    onChange={handleCPFChange}
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-400 mb-1">Data de Nascimento *</label>
                  <input
                    type="date"
                    required
                    className="w-full bg-[#14181f] border border-gray-800 rounded-lg p-2.5 text-sm text-white focus:outline-none focus:border-red-600"
                    value={novoColaborador.data_nascimento}
                    onChange={(e) => setNovoColaborador({ ...novoColaborador, data_nascimento: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-400 mb-1">Data de Admissão *</label>
                  <input
                    type="date"
                    required
                    className="w-full bg-[#14181f] border border-gray-800 rounded-lg p-2.5 text-sm text-white focus:outline-none focus:border-red-600"
                    value={novoColaborador.data_admissao}
                    onChange={(e) => setNovoColaborador({ ...novoColaborador, data_admissao: e.target.value })}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-gray-400 mb-1">Função / Cargo *</label>
                  <input
                    type="text"
                    required
                    placeholder="Ex: Motorista, Operador..."
                    className="w-full bg-[#14181f] border border-gray-800 rounded-lg p-2.5 text-sm text-white focus:outline-none focus:border-red-600"
                    value={novoColaborador.cargo}
                    onChange={(e) => handleCargoChange(e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-400 mb-1">Setor *</label>
                  <select
                    required
                    className="w-full bg-[#14181f] border border-gray-800 rounded-lg p-2.5 text-sm text-white focus:outline-none focus:border-red-600"
                    value={novoColaborador.setor_id}
                    onChange={(e) => setNovoColaborador({ ...novoColaborador, setor_id: e.target.value })}
                  >
                    <option value="">Selecione um Setor</option>
                    {setores.map((s) => (
                      <option key={s.id} value={s.id}>{s.nome}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs text-gray-400 mb-1">Endereço Completo</label>
                <input
                  type="text"
                  placeholder="Rua, Número, Bairro, Cidade - UF"
                  className="w-full bg-[#14181f] border border-gray-800 rounded-lg p-2.5 text-sm text-white focus:outline-none focus:border-red-600"
                  value={novoColaborador.endereco}
                  onChange={(e) => setNovoColaborador({ ...novoColaborador, endereco: e.target.value })}
                />
              </div>

              {/* SEÇÃO MOTORISTA */}
              <div className="pt-2 border-t border-gray-800">
                <label className="flex items-center gap-2 cursor-pointer text-xs text-gray-300 font-bold mb-3">
                  <input
                    type="checkbox"
                    className="rounded accent-red-600 w-4 h-4"
                    checked={novoColaborador.is_motorista}
                    onChange={(e) => setNovoColaborador({ ...novoColaborador, is_motorista: e.target.checked })}
                  />
                  <span>É Motorista? (Habilita CNH e Especialidade do Veículo)</span>
                </label>

                {novoColaborador.is_motorista && (
                  <div className="space-y-3 bg-[#14181f] p-4 rounded-xl border border-amber-500/20">
                    <div>
                      <label className="block text-xs text-amber-400 mb-1 font-bold">Tipo / Especialidade do Veículo</label>
                      <select
                        className="w-full bg-[#1a1f26] border border-gray-800 rounded-lg p-2.5 text-sm text-white focus:outline-none focus:border-amber-500"
                        value={novoColaborador.tipo_veiculo}
                        onChange={(e) => setNovoColaborador({ ...novoColaborador, tipo_veiculo: e.target.value })}
                      >
                        <option value="Basculante">Motorista de Basculante</option>
                        <option value="Caminhão Pipa">Motorista de Caminhão Pipa</option>
                        <option value="Carreta / Eixo Pesado">Motorista de Carreta / Eixo Pesado</option>
                        <option value="Betoneira">Motorista de Betoneira</option>
                        <option value="Comboio / Abastecimento">Motorista de Comboio / Abastecimento</option>
                        <option value="Munck / Guindaste">Motorista de Munck / Guindaste</option>
                        <option value="Veículo Leve / Van">Motorista de Veículo Leve / Van</option>
                        <option value="Outros">Outros Veículos</option>
                      </select>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-2 border-t border-gray-800/60">
                      <div>
                        <label className="block text-xs text-amber-400 mb-1">Número da CNH (11 dígitos)</label>
                        <input
                          type="text"
                          required={novoColaborador.is_motorista}
                          placeholder="00000000000"
                          maxLength={11}
                          className="w-full bg-[#1a1f26] border border-gray-800 rounded-lg p-2.5 text-sm text-white focus:outline-none focus:border-amber-500 font-mono"
                          value={novoColaborador.cnh_numero}
                          onChange={handleCNHChange}
                        />
                      </div>
                      <div>
                        <label className="block text-xs text-amber-400 mb-1">Categoria CNH</label>
                        <select
                          className="w-full bg-[#1a1f26] border border-gray-800 rounded-lg p-2.5 text-sm text-white focus:outline-none focus:border-amber-500"
                          value={novoColaborador.cnh_categoria}
                          onChange={(e) => setNovoColaborador({ ...novoColaborador, cnh_categoria: e.target.value })}
                        >
                          <option value="B">B</option>
                          <option value="C">C</option>
                          <option value="D">D</option>
                          <option value="E">E</option>
                          <option value="AB">AB</option>
                          <option value="AC">AC</option>
                          <option value="AD">AD</option>
                          <option value="AE">AE</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs text-amber-400 mb-1">Validade da CNH</label>
                        <input
                          type="date"
                          required={novoColaborador.is_motorista}
                          className="w-full bg-[#1a1f26] border border-gray-800 rounded-lg p-2.5 text-sm text-white focus:outline-none focus:border-amber-500"
                          value={novoColaborador.cnh_validade}
                          onChange={(e) => setNovoColaborador({ ...novoColaborador, cnh_validade: e.target.value })}
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t border-gray-800">
                <button
                  type="button"
                  onClick={() => setModalColaboradorOpen(false)}
                  className="px-4 py-2 bg-gray-800 hover:bg-gray-700 text-gray-300 text-xs font-bold rounded-lg">
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-xs font-bold rounded-lg">
                  {editingId ? 'Atualizar Colaborador' : 'Salvar Colaborador'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL CADASTRAR SETOR */}
      {modalSetorOpen && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex justify-center items-center p-4 z-50">
          <div className="bg-[#1a1f26] border border-gray-800 rounded-xl w-full max-w-md p-6 space-y-4">
            <div className="flex justify-between items-center border-b border-gray-800 pb-3">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <Building2 size={20} className="text-red-600" /> Cadastrar Novo Setor
              </h3>
              <button onClick={() => setModalSetorOpen(false)} className="text-gray-400 hover:text-white">
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleCadastrarSetor} className="space-y-4">
              <div>
                <label className="block text-xs text-gray-400 mb-1">Nome do Setor *</label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Logística, Produção, RH"
                  className="w-full bg-[#14181f] border border-gray-800 rounded-lg p-2.5 text-sm text-white focus:outline-none focus:border-red-600"
                  value={novoSetor.nome}
                  onChange={(e) => setNovoSetor({ ...novoSetor, nome: e.target.value })}
                />
              </div>

              <div>
                <label className="block text-xs text-gray-400 mb-1">Descrição / Observação</label>
                <textarea
                  rows="3"
                  placeholder="Descrição opcional..."
                  className="w-full bg-[#14181f] border border-gray-800 rounded-lg p-2.5 text-sm text-white focus:outline-none focus:border-red-600"
                  value={novoSetor.descricao}
                  onChange={(e) => setNovoSetor({ ...novoSetor, descricao: e.target.value })}
                ></textarea>
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t border-gray-800">
                <button
                  type="button"
                  onClick={() => setModalSetorOpen(false)}
                  className="px-4 py-2 bg-gray-800 hover:bg-gray-700 text-gray-300 text-xs font-bold rounded-lg">
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-xs font-bold rounded-lg">
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