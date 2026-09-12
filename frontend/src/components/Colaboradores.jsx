import React, { useEffect, useState } from 'react';
import { Users, Plus, Building2, X, Truck, Edit, UserX, UserCheck, Eye, FileText } from 'lucide-react';
import { api } from '../services/api';

const formatarCPF = (value) => {
  if (!value) return '';
  return value
    .replace(/\D/g, '')
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d{1,2})$/, '$1-$2')
    .slice(0, 14);
};

const validarCPF = (cpf) => {
  if (!cpf) return false;
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

const formatarDataExibicao = (dataStr) => {
  if (!dataStr) return '-';
  if (dataStr.includes('/')) return dataStr;
  try {
    const data = new Date(dataStr);
    return isNaN(data.getTime()) ? dataStr : data.toLocaleDateString('pt-BR');
  } catch {
    return dataStr;
  }
};

const formatarDataParaInput = (dataStr) => {
  if (!dataStr) return '';
  if (dataStr.includes('-')) return dataStr.split('T')[0];
  const partes = dataStr.split('/');
  if (partes.length === 3) {
    return `${partes[2]}-${partes[1].padStart(2, '0')}-${partes[0].padStart(2, '0')}`;
  }
  return dataStr;
};

const estadoInicialColaborador = {
  nome: '',
  cpf: '',
  matricula: '',
  data_nascimento: '',
  data_admissao: '',
  endereco: '',
  cargo: '',
  funcao_opcional: '',
  observacoes_contrato: '',
  data_afastamento: '',
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

const estadoInicialDesligamento = {
  data_demissao: new Date().toISOString().split('T')[0],
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
  const [salvando, setSalvando] = useState(false);

  const [novoColaborador, setNovoColaborador] = useState(estadoInicialColaborador);
  const [dadosDesligamento, setDadosDesligamento] = useState(estadoInicialDesligamento);
  const [novoSetor, setNovoSetor] = useState({ nome: '', descricao: '' });

  const carregarDados = async () => {
    try {
      const [resColab, resSetores] = await Promise.all([
        api.get('/colaboradores'),
        api.get('/setores')
      ]);

      const listaColab = Array.isArray(resColab.data) ? resColab.data : [];
      const listaSetores = Array.isArray(resSetores.data) ? resSetores.data : [];

      setColaboradores(listaColab);
      setSetores(listaSetores);
    } catch (err) {
      console.error('Erro ao carregar dados do backend:', err);
    }
  };

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

  const handleEditar = (colaborador) => {
    setEditingId(colaborador.id);
    setNovoColaborador({
      nome: colaborador.nome || '',
      cpf: colaborador.cpf ? formatarCPF(colaborador.cpf) : '',
      matricula: colaborador.matricula || '',
      data_nascimento: formatarDataParaInput(colaborador.data_nascimento),
      data_admissao: formatarDataParaInput(colaborador.data_admissao),
      cargo: colaborador.cargo || '',
      funcao_opcional: colaborador.funcao_opcional || '',
      observacoes_contrato: colaborador.observacoes_contrato || '',
      data_afastamento: formatarDataParaInput(colaborador.data_afastamento),
      setor_id: colaborador.setor_id || '',
      endereco: colaborador.endereco || '',
      is_motorista: Boolean(colaborador.is_motorista),
      tipo_veiculo: colaborador.tipo_veiculo || 'Basculante',
      cnh_numero: colaborador.cnh_numero || '',
      cnh_categoria: colaborador.cnh_categoria || 'D',
      cnh_validade: formatarDataParaInput(colaborador.cnh_validade),
      status: colaborador.status || 'Ativo',
      data_demissao: formatarDataParaInput(colaborador.data_demissao),
      motivo_demissao: colaborador.motivo_demissao || 'Sem Justa Causa',
      observacao_demissao: colaborador.observacao_demissao || '',
      aso_demissional_concluido: Boolean(colaborador.aso_demissional_concluido),
      exames_demissionais_obs: colaborador.exames_demissionais_obs || ''
    });
    setModalColaboradorOpen(true);
  };

  const handleAcaoStatus = (colaborador) => {
    const isCurrentlyInativo = String(colaborador.status).toLowerCase() === 'inativo';
    if (isCurrentlyInativo) {
      if (window.confirm(`Deseja reativar o colaborador ${colaborador.nome}?`)) {
        reativarColaborador(colaborador.id);
      }
    } else {
      setColaboradorParaDesligar(colaborador);
      setDadosDesligamento(estadoInicialDesligamento);
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
      alert('Erro ao reativar colaborador: ' + (err.response?.data?.detail || err.message));
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
      alert('Erro ao desativar colaborador: ' + (err.response?.data?.detail || err.message));
    }
  };

  const handleCadastrarColaborador = async (e) => {
    e.preventDefault();

    if (!validarCPF(novoColaborador.cpf)) {
      alert('CPF inválido! Verifique os números digitados.');
      return;
    }

    if (!novoColaborador.nome.trim() || !novoColaborador.cargo.trim() || !novoColaborador.data_admissao) {
      alert('Preencha nome, função/cargo e data de admissão.');
      return;
    }

    if (novoColaborador.is_motorista) {
      if (novoColaborador.cnh_numero && novoColaborador.cnh_numero.length !== 11) {
        alert('O número da CNH deve ter exatamente 11 dígitos.');
        return;
      }
      if (!novoColaborador.cnh_validade) {
        alert('Preencha a validade da CNH.');
        return;
      }
    }

    const payload = {
      nome: novoColaborador.nome.trim(),
      cpf: novoColaborador.cpf ? novoColaborador.cpf.replace(/\D/g, '') : '',
      matricula: novoColaborador.matricula || null,
      data_nascimento: novoColaborador.data_nascimento || null,
      data_admissao: novoColaborador.data_admissao || null,
      cargo: novoColaborador.cargo.trim(),
      funcao_opcional: novoColaborador.funcao_opcional || null,
      observacoes_contrato: novoColaborador.observacoes_contrato || null,
      data_afastamento: novoColaborador.data_afastamento || null,
      endereco: novoColaborador.endereco || null,
      setor_id: novoColaborador.setor_id ? parseInt(novoColaborador.setor_id, 10) : null,
      is_motorista: Boolean(novoColaborador.is_motorista),
      tipo_veiculo: novoColaborador.is_motorista ? novoColaborador.tipo_veiculo : null,
      cnh_numero: novoColaborador.is_motorista ? novoColaborador.cnh_numero : null,
      cnh_categoria: novoColaborador.is_motorista ? novoColaborador.cnh_categoria : null,
      cnh_validade: novoColaborador.is_motorista ? novoColaborador.cnh_validade : null,
      status: novoColaborador.status || 'Ativo'
    };

    setSalvando(true);
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
    } catch (err) {
      console.error('Erro detalhado no salvamento:', err.response || err);
      alert('Erro ao salvar colaborador: ' + (err.response?.data?.detail || err.message));
    } finally {
      setSalvando(false);
    }
  };

  const handleCadastrarSetor = async (e) => {
    e.preventDefault();
    if (!novoSetor.nome.trim()) {
      alert('O nome do setor é obrigatório.');
      return;
    }
    try {
      await api.post('/setores', novoSetor);
      setModalSetorOpen(false);
      setNovoSetor({ nome: '', descricao: '' });
      carregarDados();
    } catch (err) {
      alert('Erro ao cadastrar setor: ' + (err.response?.data?.detail || err.message));
    }
  };

  const colaboradoresExibidos = colaboradores.filter((c) => {
    if (filtroStatus === 'Todos') return true;
    const statusColab = String(c.status || 'ativo').toLowerCase();
    const statusFiltro = String(filtroStatus).toLowerCase();
    return statusColab === statusFiltro;
  });

  return (
    <div className="space-y-6 bg-slate-50 min-h-screen p-6 text-slate-800">
      {/* Cabeçalho */}
      <div className="flex flex-wrap justify-between items-center bg-white p-5 rounded-xl border border-slate-200 shadow-sm gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 uppercase flex items-center gap-2">
            <Users className="text-rose-600" size={24} /> Controle de Funcionários
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Total exibido: <strong className="text-slate-700">{colaboradoresExibidos.length}</strong> funcionário(s)
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="bg-slate-100 p-1 rounded-lg border border-slate-200 flex items-center gap-1">
            <button
              onClick={() => setFiltroStatus('Ativo')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all ${
                filtroStatus === 'Ativo' ? 'bg-slate-900 text-white shadow' : 'text-slate-600 hover:text-slate-900'
              }`}>
              Ativos
            </button>
            <button
              onClick={() => setFiltroStatus('Inativo')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all ${
                filtroStatus === 'Inativo' ? 'bg-slate-900 text-white shadow' : 'text-slate-600 hover:text-slate-900'
              }`}>
              Inativos / Arquivados
            </button>
            <button
              onClick={() => setFiltroStatus('Todos')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all ${
                filtroStatus === 'Todos' ? 'bg-slate-900 text-white shadow' : 'text-slate-600 hover:text-slate-900'
              }`}>
              Todos
            </button>
          </div>

          <button
            onClick={() => setModalSetorOpen(true)}
            className="bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold px-4 py-2.5 rounded-lg flex items-center gap-2 transition-all border border-slate-300 shadow-sm">
            <Building2 size={16} /> Cadastrar Setor
          </button>

          <button
            onClick={handleAbrirModalNovo}
            className="bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold px-4 py-2.5 rounded-lg flex items-center gap-2 shadow transition-all">
            <Plus size={16} /> Novo Funcionário
          </button>
        </div>
      </div>

      {/* Tabela de Colaboradores */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-700">
            <thead className="bg-slate-100 text-slate-600 font-bold uppercase text-[11px] border-b border-slate-200">
              <tr>
                <th className="p-4">Matrícula</th>
                <th className="p-4">Funcionário</th>
                <th className="p-4">CPF</th>
                <th className="p-4">Função / Opcional</th>
                <th className="p-4">Setor / Equipe</th>
                <th className="p-4">Observação / Contrato</th>
                {filtroStatus === 'Inativo' ? (
                  <>
                    <th className="p-4">Data Demissão</th>
                    <th className="p-4">Motivo</th>
                    <th className="p-4">ASO</th>
                  </>
                ) : (
                  <th className="p-4">CNH / Veículo</th>
                )}
                <th className="p-4">Status</th>
                <th className="p-4 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {colaboradoresExibidos.length === 0 ? (
                <tr>
                  <td colSpan="9" className="p-6 text-center text-slate-400 text-xs">
                    Nenhum funcionário encontrado para este filtro.
                  </td>
                </tr>
              ) : (
                colaboradoresExibidos.map((c) => {
                  const isInativo = String(c.status).toLowerCase() === 'inativo';
                  const nomeSetor = c.setor_nome || setores.find((s) => s.id === c.setor_id)?.nome || '-';
                  const cargoOuFuncao = c.cargo || '-';

                  return (
                    <tr key={c.id} className={`hover:bg-slate-50 ${isInativo ? 'bg-slate-50/60 opacity-70' : ''}`}>
                      <td className="p-4 text-slate-500 font-mono text-xs">{c.matricula || '-'}</td>
                      <td className="p-4 font-semibold text-slate-900">
                        {c.nome}
                        {c.data_admissao && (
                          <span className="block text-[11px] font-normal text-slate-500">
                            Adm: {formatarDataExibicao(c.data_admissao)}
                          </span>
                        )}
                      </td>
                      <td className="p-4 text-slate-600 font-mono text-xs">{c.cpf ? formatarCPF(c.cpf) : '-'}</td>
                      <td className="p-4 text-slate-800">
                        <div className="font-medium">{cargoOuFuncao}</div>
                        {c.funcao_opcional && (
                          <span className="block text-[11px] text-slate-500 font-normal">
                            Alt: {c.funcao_opcional}
                          </span>
                        )}
                      </td>
                      <td className="p-4 text-slate-600">{nomeSetor}</td>
                      <td className="p-4 text-xs text-slate-600 max-w-[200px]">
                        {c.observacoes_contrato || '-'}
                        {c.data_afastamento && (
                          <span className="block text-rose-600 font-semibold text-[11px] mt-0.5">
                            Afastado: {formatarDataExibicao(c.data_afastamento)}
                          </span>
                        )}
                      </td>

                      {filtroStatus === 'Inativo' ? (
                        <>
                          <td className="p-4 text-rose-600 font-mono text-xs">
                            {c.data_demissao ? formatarDataExibicao(c.data_demissao) : '-'}
                          </td>
                          <td className="p-4 text-xs font-medium text-slate-700">
                            {c.motivo_demissao || '-'}
                          </td>
                          <td className="p-4">
                            <span
                              className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                c.aso_demissional_concluido
                                  ? 'bg-slate-100 text-slate-700 border border-slate-300'
                                  : 'bg-rose-100 text-rose-800 border border-rose-200'
                              }`}>
                              {c.aso_demissional_concluido ? 'OK' : 'Pendente'}
                            </span>
                          </td>
                        </>
                      ) : (
                        <td className="p-4 text-slate-700">
                          {c.cnh_numero ? (
                            <span className="flex items-center gap-1 text-xs text-slate-700 font-semibold">
                              <Truck size={14} className="text-slate-500" /> Cat. {c.cnh_categoria} - {c.cnh_numero}
                            </span>
                          ) : (
                            <span className="text-slate-400">-</span>
                          )}
                        </td>
                      )}

                      <td className="p-4">
                        <span
                          className={`px-2.5 py-1 rounded-full text-[10px] font-bold border ${
                            isInativo
                              ? 'bg-rose-100 text-rose-800 border-rose-200'
                              : 'bg-slate-100 text-slate-700 border-slate-300'
                          }`}>
                          {c.status || 'Ativo'}
                        </span>
                      </td>
                      <td className="p-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {isInativo && (
                            <button
                              onClick={() => {
                                setColaboradorDetalhado(c);
                                setModalDetalhesInativoOpen(true);
                              }}
                              title="Ver Detalhes"
                              className="p-1.5 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                            >
                              <Eye size={15} />
                            </button>
                          )}
                          <button
                            onClick={() => handleEditar(c)}
                            title="Editar"
                            className="p-1.5 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                          >
                            <Edit size={15} />
                          </button>
                          <button
                            onClick={() => handleAcaoStatus(c)}
                            title={isInativo ? 'Reativar' : 'Desativar'}
                            className={`p-1.5 rounded-lg transition-colors ${
                              isInativo ? 'text-slate-700 hover:bg-slate-100' : 'text-rose-600 hover:bg-rose-50'
                            }`}
                          >
                            {isInativo ? <UserCheck size={15} /> : <UserX size={15} />}
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
      </div>

      {/* MODAL DESLIGAMENTO */}
      {modalDesligamentoOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex justify-center items-center p-4 z-50">
          <div className="bg-white border border-slate-200 rounded-xl w-full max-w-lg p-6 space-y-4 shadow-xl">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <h3 className="text-lg font-bold text-rose-600 flex items-center gap-2">
                <UserX size={20} /> Desligamento de Funcionário
              </h3>
              <button onClick={() => setModalDesligamentoOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X size={20} />
              </button>
            </div>

            <p className="text-xs text-slate-600">
              Você está desativando <strong className="text-slate-900">{colaboradorParaDesligar?.nome}</strong>. Preencha os dados rescisórios:
            </p>

            <form onSubmit={handleConfirmarDesligamento} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Data de Demissão *</label>
                  <input
                    type="date"
                    required
                    className="w-full border border-slate-300 rounded-lg p-2 text-sm text-slate-800 focus:outline-none focus:border-rose-500"
                    value={dadosDesligamento.data_demissao}
                    onChange={(e) => setDadosDesligamento({ ...dadosDesligamento, data_demissao: e.target.value })}
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Motivo *</label>
                  <select
                    required
                    className="w-full border border-slate-300 rounded-lg p-2 text-sm text-slate-800 focus:outline-none focus:border-rose-500"
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

              <div className="p-3 bg-rose-50 rounded-lg border border-rose-200 space-y-2">
                <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-slate-700">
                  <input
                    type="checkbox"
                    className="rounded accent-rose-600 w-4 h-4"
                    checked={dadosDesligamento.aso_demissional_concluido}
                    onChange={(e) => setDadosDesligamento({ ...dadosDesligamento, aso_demissional_concluido: e.target.checked })}
                  />
                  <span>ASO Demissional Concluído?</span>
                </label>

                <div>
                  <label className="block text-[11px] text-slate-500 mb-1">Obs. Exames</label>
                  <input
                    type="text"
                    placeholder="Ex: Apto sem restrições"
                    className="w-full border border-rose-200 rounded-lg p-2 text-xs text-slate-800 focus:outline-none focus:border-rose-500"
                    value={dadosDesligamento.exames_demissionais_obs}
                    onChange={(e) => setDadosDesligamento({ ...dadosDesligamento, exames_demissionais_obs: e.target.value })}
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Observações Internas</label>
                <textarea
                  rows="3"
                  className="w-full border border-slate-300 rounded-lg p-2 text-sm text-slate-800 focus:outline-none focus:border-rose-500"
                  value={dadosDesligamento.observacao_demissao}
                  onChange={(e) => setDadosDesligamento({ ...dadosDesligamento, observacao_demissao: e.target.value })}
                ></textarea>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setModalDesligamentoOpen(false)}
                  className="px-4 py-2 border border-slate-300 hover:bg-slate-50 text-slate-600 text-xs font-semibold rounded-lg">
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold rounded-lg shadow-sm">
                  Confirmar Desligamento
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL DETALHES INATIVO */}
      {modalDetalhesInativoOpen && colaboradorDetalhado && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex justify-center items-center p-4 z-50">
          <div className="bg-white border border-slate-200 rounded-xl w-full max-w-lg p-6 space-y-4 shadow-xl">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                <FileText className="text-rose-600" size={20} /> Histórico do Funcionário
              </h3>
              <button onClick={() => setModalDetalhesInativoOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X size={20} />
              </button>
            </div>

            <div className="space-y-3 text-xs text-slate-700">
              <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                <p className="text-sm font-bold text-slate-900 mb-1">{colaboradorDetalhado.nome}</p>
                <p><strong>Cargo:</strong> {colaboradorDetalhado.cargo || '-'}</p>
                <p><strong>CPF:</strong> {colaboradorDetalhado.cpf ? formatarCPF(colaboradorDetalhado.cpf) : '-'}</p>
                <p><strong>Admissão:</strong> {colaboradorDetalhado.data_admissao ? formatarDataExibicao(colaboradorDetalhado.data_admissao) : '-'}</p>
              </div>

              <div className="p-3 bg-rose-50 rounded-lg border border-rose-200 space-y-1">
                <p className="text-rose-800 font-bold">Informações do Desligamento</p>
                <p><strong>Data de Saída:</strong> {colaboradorDetalhado.data_demissao ? formatarDataExibicao(colaboradorDetalhado.data_demissao) : '-'}</p>
                <p><strong>Motivo:</strong> {colaboradorDetalhado.motivo_demissao || '-'}</p>
                <p><strong>ASO Demissional:</strong> {colaboradorDetalhado.aso_demissional_concluido ? 'Concluído' : 'Pendente'}</p>
                <p><strong>Obs. Exames:</strong> {colaboradorDetalhado.exames_demissionais_obs || 'Nenhuma.'}</p>
                <p><strong>Observações:</strong> {colaboradorDetalhado.observacao_demissao || 'Nenhuma.'}</p>
              </div>
            </div>

            <div className="flex justify-end pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setModalDetalhesInativoOpen(false)}
                className="px-4 py-2 border border-slate-300 hover:bg-slate-50 text-slate-600 text-xs font-semibold rounded-lg">
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL CADASTRAR / EDITAR FUNCIONÁRIO */}
      {modalColaboradorOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex justify-center items-center p-4 z-50">
          <div className="bg-white border border-slate-200 rounded-xl w-full max-w-2xl p-6 space-y-4 max-h-[90vh] overflow-y-auto shadow-xl">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <h3 className="text-lg font-bold text-slate-900">
                {editingId ? 'Editar Funcionário' : 'Cadastrar Novo Funcionário'}
              </h3>
              <button onClick={() => setModalColaboradorOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleCadastrarColaborador} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div className="md:col-span-2">
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Nome Completo *</label>
                  <input
                    type="text"
                    required
                    placeholder="Ex: Emerson Luan Ribeiro"
                    className="w-full border border-slate-300 rounded-lg p-2 text-sm text-slate-800 focus:outline-none focus:border-slate-500"
                    value={novoColaborador.nome}
                    onChange={(e) => setNovoColaborador({ ...novoColaborador, nome: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Matrícula *</label>
                  <input
                    type="text"
                    required
                    placeholder="Ex: 540"
                    className="w-full border border-slate-300 rounded-lg p-2 text-sm text-slate-800 focus:outline-none focus:border-slate-500"
                    value={novoColaborador.matricula}
                    onChange={(e) => setNovoColaborador({ ...novoColaborador, matricula: e.target.value })}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">CPF *</label>
                  <input
                    type="text"
                    required
                    placeholder="000.000.000-00"
                    maxLength={14}
                    className="w-full border border-slate-300 rounded-lg p-2 text-sm font-mono text-slate-800 focus:outline-none focus:border-slate-500"
                    value={novoColaborador.cpf}
                    onChange={handleCPFChange}
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Data de Nascimento</label>
                  <input
                    type="date"
                    className="w-full border border-slate-300 rounded-lg p-2 text-sm text-slate-800 focus:outline-none focus:border-slate-500"
                    value={novoColaborador.data_nascimento}
                    onChange={(e) => setNovoColaborador({ ...novoColaborador, data_nascimento: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Data de Admissão *</label>
                  <input
                    type="date"
                    required
                    className="w-full border border-slate-300 rounded-lg p-2 text-sm text-slate-800 focus:outline-none focus:border-slate-500"
                    value={novoColaborador.data_admissao}
                    onChange={(e) => setNovoColaborador({ ...novoColaborador, data_admissao: e.target.value })}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Função / Cargo *</label>
                  <input
                    type="text"
                    required
                    placeholder="Ex: Assistente Administrativo"
                    className="w-full border border-slate-300 rounded-lg p-2 text-sm text-slate-800 focus:outline-none focus:border-slate-500"
                    value={novoColaborador.cargo}
                    onChange={(e) => handleCargoChange(e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Função Opcional</label>
                  <input
                    type="text"
                    placeholder="Ex: Auxiliar de Escritório"
                    className="w-full border border-slate-300 rounded-lg p-2 text-sm text-slate-800 focus:outline-none focus:border-slate-500"
                    value={novoColaborador.funcao_opcional}
                    onChange={(e) => setNovoColaborador({ ...novoColaborador, funcao_opcional: e.target.value })}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Setor / Equipe</label>
                  <select
                    className="w-full border border-slate-300 rounded-lg p-2 text-sm text-slate-800 focus:outline-none focus:border-slate-500"
                    value={novoColaborador.setor_id}
                    onChange={(e) => setNovoColaborador({ ...novoColaborador, setor_id: e.target.value })}
                  >
                    <option value="">Selecione o Setor</option>
                    {setores.map((s) => (
                      <option key={s.id} value={s.id}>{s.nome}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Data Afastamento INSS (se houver)</label>
                  <input
                    type="date"
                    className="w-full border border-slate-300 rounded-lg p-2 text-sm text-slate-800 focus:outline-none focus:border-slate-500"
                    value={novoColaborador.data_afastamento}
                    onChange={(e) => setNovoColaborador({ ...novoColaborador, data_afastamento: e.target.value })}
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Endereço</label>
                <input
                  type="text"
                  placeholder="Ex: Rua das Palmeiras, 123 - Centro"
                  className="w-full border border-slate-300 rounded-lg p-2 text-sm text-slate-800 focus:outline-none focus:border-slate-500"
                  value={novoColaborador.endereco}
                  onChange={(e) => setNovoColaborador({ ...novoColaborador, endereco: e.target.value })}
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Observação / Status do Contrato</label>
                <input
                  type="text"
                  placeholder="Ex: Contrato prorrogado 90 dias ou R$ 267,00 Gratificação"
                  className="w-full border border-slate-300 rounded-lg p-2 text-sm text-slate-800 focus:outline-none focus:border-slate-500"
                  value={novoColaborador.observacoes_contrato}
                  onChange={(e) => setNovoColaborador({ ...novoColaborador, observacoes_contrato: e.target.value })}
                />
              </div>

              {/* HABILITAÇÃO MOTORISTA */}
              <div className="pt-2 border-t border-slate-200">
                <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-slate-700 mb-3">
                  <input
                    type="checkbox"
                    className="rounded accent-slate-900 w-4 h-4"
                    checked={novoColaborador.is_motorista}
                    onChange={(e) => setNovoColaborador({ ...novoColaborador, is_motorista: e.target.checked })}
                  />
                  <span>É Motorista? (Adiciona dados de CNH)</span>
                </label>

                {novoColaborador.is_motorista && (
                  <div className="space-y-3 bg-slate-50 p-4 rounded-xl border border-slate-200">
                    <div>
                      <label className="block text-xs text-slate-700 mb-1 font-semibold">Tipo do Veículo</label>
                      <select
                        className="w-full border border-slate-300 rounded-lg p-2 text-sm text-slate-800 focus:outline-none focus:border-slate-500"
                        value={novoColaborador.tipo_veiculo}
                        onChange={(e) => setNovoColaborador({ ...novoColaborador, tipo_veiculo: e.target.value })}
                      >
                        <option value="Basculante">Motorista de Basculante</option>
                        <option value="Caminhão Pipa">Motorista de Caminhão Pipa</option>
                        <option value="Carreta / Eixo Pesado">Motorista de Carreta / Eixo Pesado</option>
                        <option value="Betoneira">Motorista de Betoneira</option>
                        <option value="Outros">Outros Veículos</option>
                      </select>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                      <div>
                        <label className="block text-xs text-slate-700 mb-1 font-semibold">Número CNH</label>
                        <input
                          type="text"
                          maxLength={11}
                          className="w-full border border-slate-300 rounded-lg p-2 text-sm font-mono text-slate-800 focus:outline-none focus:border-slate-500"
                          value={novoColaborador.cnh_numero}
                          onChange={handleCNHChange}
                        />
                      </div>
                      <div>
                        <label className="block text-xs text-slate-700 mb-1 font-semibold">Categoria</label>
                        <select
                          className="w-full border border-slate-300 rounded-lg p-2 text-sm text-slate-800 focus:outline-none focus:border-slate-500"
                          value={novoColaborador.cnh_categoria}
                          onChange={(e) => setNovoColaborador({ ...novoColaborador, cnh_categoria: e.target.value })}
                        >
                          <option value="B">B</option>
                          <option value="C">C</option>
                          <option value="D">D</option>
                          <option value="E">E</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs text-slate-700 mb-1 font-semibold">Validade CNH</label>
                        <input
                          type="date"
                          className="w-full border border-slate-300 rounded-lg p-2 text-sm text-slate-800 focus:outline-none focus:border-slate-500"
                          value={novoColaborador.cnh_validade}
                          onChange={(e) => setNovoColaborador({ ...novoColaborador, cnh_validade: e.target.value })}
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setModalColaboradorOpen(false)}
                  className="px-4 py-2 border border-slate-300 hover:bg-slate-50 text-slate-600 text-xs font-semibold rounded-lg">
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={salvando}
                  className="px-4 py-2 bg-slate-900 hover:bg-slate-800 disabled:opacity-60 disabled:cursor-not-allowed text-white text-xs font-semibold rounded-lg shadow-sm">
                  {salvando ? 'Salvando...' : editingId ? 'Atualizar' : 'Salvar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL NOVO SETOR */}
      {modalSetorOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex justify-center items-center p-4 z-50">
          <div className="bg-white border border-slate-200 rounded-xl w-full max-w-md p-6 space-y-4 shadow-xl">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                <Building2 size={20} className="text-slate-700" /> Cadastrar Novo Setor
              </h3>
              <button onClick={() => setModalSetorOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleCadastrarSetor} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Nome do Setor / Equipe *</label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Administração, Oficina das Máquinas, Equipe Asfalto"
                  className="w-full border border-slate-300 rounded-lg p-2 text-sm text-slate-800 focus:outline-none focus:border-slate-500"
                  value={novoSetor.nome}
                  onChange={(e) => setNovoSetor({ ...novoSetor, nome: e.target.value })}
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Descrição</label>
                <textarea
                  rows="3"
                  className="w-full border border-slate-300 rounded-lg p-2 text-sm text-slate-800 focus:outline-none focus:border-slate-500"
                  value={novoSetor.descricao}
                  onChange={(e) => setNovoSetor({ ...novoSetor, descricao: e.target.value })}
                ></textarea>
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setModalSetorOpen(false)}
                  className="px-4 py-2 border border-slate-300 hover:bg-slate-50 text-slate-600 text-xs font-semibold rounded-lg">
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold rounded-lg shadow-sm">
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