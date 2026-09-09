import React, { useEffect, useState } from 'react';
import { ShieldCheck, Plus, AlertTriangle, X } from 'lucide-react';
import { api } from '../services/api';

export default function Epis() {
  const [epis, setEpis] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  // Estado do formulário
  const [novoEpi, setNovoEpi] = useState({
    nome: '',
    ca: '',
    validade_ca: '',
    quantidade_estoque: 0,
    quantidade_minima: 5,
    descricao: ''
  });

  const carregarEpis = async () => {
    try {
      const res = await api.get('/epis');
      setEpis(res.data);
    } catch (err) {
      console.error("Erro ao carregar EPIs", err);
    }
  };

  useEffect(() => {
    carregarEpis();
  }, []);

  // Cadastrar novo EPI no Backend
  const handleCadastrar = async (e) => {
    e.preventDefault();
    try {
      await api.post('/epis', novoEpi);
      setIsModalOpen(false);
      setNovoEpi({ nome: '', ca: '', validade_ca: '', quantidade_estoque: 0, quantidade_minima: 5, descricao: '' });
      carregarEpis(); // Recarrega a tabela automaticamente
    } catch (err) {
      alert("Erro ao cadastrar EPI: " + (err.response?.data?.detail || err.message));
    }
  };

  // Dar baixa no estoque
  const darBaixa = async (epiId) => {
    try {
      await api.post('/epis/entrega', {
        colaborador_id: 1,
        epi_id: epiId,
        quantidade: 1,
        data_entrega: new Date().toISOString().split('T')[0],
        dias_validade_troca: 180
      });
      carregarEpis();
    } catch (err) {
      alert(err.response?.data?.detail || "Erro ao dar baixa");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center bg-[#1a1f26] p-5 rounded-xl border border-gray-800">
        <h1 className="text-xl font-black text-white uppercase flex items-center gap-2">
          <ShieldCheck className="text-red-600" size={24} /> Controle de EPIs
        </h1>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="bg-red-600 hover:bg-red-700 text-white text-xs font-bold px-4 py-2.5 rounded-lg flex items-center gap-2 shadow-md transition-all">
          <Plus size={16} /> NOVO EPI
        </button>
      </div>

      <div className="bg-[#1a1f26] rounded-xl border border-gray-800 overflow-hidden">
        <table className="w-full text-left text-sm text-gray-300">
          <thead className="bg-[#14181f] text-gray-400 font-bold uppercase text-[11px] border-b border-gray-800">
            <tr>
              <th className="p-4">EPI</th>
              <th className="p-4">Nº CA</th>
              <th className="p-4">Validade CA</th>
              <th className="p-4">Qtd Estoque</th>
              <th className="p-4 text-right">Ação</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-800/60">
            {epis.length === 0 ? (
              <tr>
                <td colSpan="5" className="p-4 text-center text-gray-500 text-xs">
                  Nenhum EPI cadastrado. Clique no botão "NOVO EPI" para adicionar.
                </td>
              </tr>
            ) : (
              epis.map((e) => (
                <tr key={e.id} className="hover:bg-gray-800/30">
                  <td className="p-4 font-bold text-white">{e.nome}</td>
                  <td className="p-4 text-gray-400">{e.ca}</td>
                  <td className="p-4 text-gray-400">{e.validade_ca}</td>
                  <td className="p-4 font-bold">
                    <span className={e.quantidade_estoque <= e.quantidade_minima ? "text-red-500 flex items-center gap-1" : "text-emerald-500"}>
                      {e.quantidade_estoque <= e.quantidade_minima && <AlertTriangle size={14} />}
                      {e.quantidade_estoque} un
                    </span>
                  </td>
                  <td className="p-4 text-right">
                    <button 
                      onClick={() => darBaixa(e.id)}
                      className="bg-red-600/20 hover:bg-red-600 text-red-400 hover:text-white border border-red-600/30 text-xs font-bold px-3 py-1.5 rounded-lg transition-all">
                      Dar Baixa (-1)
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* MODAL DE CADASTRO */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex justify-center items-center p-4 z-50">
          <div className="bg-[#1a1f26] border border-gray-800 rounded-xl w-full max-w-md p-6 space-y-4">
            <div className="flex justify-between items-center border-b border-gray-800 pb-3">
              <h3 className="text-lg font-bold text-white">Cadastrar Novo EPI</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-white">
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleCadastrar} className="space-y-4">
              <div>
                <label className="block text-xs text-gray-400 mb-1">Nome do Equipamento</label>
                <input 
                  type="text" 
                  required
                  placeholder="Ex: Luva de Raspa"
                  className="w-full bg-[#14181f] border border-gray-800 rounded-lg p-2.5 text-sm text-white focus:outline-none focus:border-red-600"
                  value={novoEpi.nome}
                  onChange={(e) => setNovoEpi({...novoEpi, nome: e.target.value})}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-gray-400 mb-1">Número do C.A.</label>
                  <input 
                    type="text" 
                    required
                    placeholder="Ex: 38291"
                    className="w-full bg-[#14181f] border border-gray-800 rounded-lg p-2.5 text-sm text-white focus:outline-none focus:border-red-600"
                    value={novoEpi.ca}
                    onChange={(e) => setNovoEpi({...novoEpi, ca: e.target.value})}
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-400 mb-1">Validade do C.A.</label>
                  <input 
                    type="date" 
                    required
                    className="w-full bg-[#14181f] border border-gray-800 rounded-lg p-2.5 text-sm text-white focus:outline-none focus:border-red-600"
                    value={novoEpi.validade_ca}
                    onChange={(e) => setNovoEpi({...novoEpi, validade_ca: e.target.value})}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-gray-400 mb-1">Quantidade Inicial</label>
                  <input 
                    type="number" 
                    required
                    min="1"
                    className="w-full bg-[#14181f] border border-gray-800 rounded-lg p-2.5 text-sm text-white focus:outline-none focus:border-red-600"
                    value={novoEpi.quantidade_estoque}
                    onChange={(e) => setNovoEpi({...novoEpi, quantidade_estoque: parseInt(e.target.value) || 0})}
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-400 mb-1">Qtd. Mínima Alerta</label>
                  <input 
                    type="number" 
                    required
                    className="w-full bg-[#14181f] border border-gray-800 rounded-lg p-2.5 text-sm text-white focus:outline-none focus:border-red-600"
                    value={novoEpi.quantidade_minima}
                    onChange={(e) => setNovoEpi({...novoEpi, quantidade_minima: parseInt(e.target.value) || 0})}
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t border-gray-800">
                <button 
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 bg-gray-800 hover:bg-gray-700 text-gray-300 text-xs font-bold rounded-lg">
                  Cancelar
                </button>
                <button 
                  type="submit"
                  className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-xs font-bold rounded-lg">
                  Salvar EPI
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}