import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Search, UserPlus, Filter } from 'lucide-react';

export default function Colaboradores() {
  const [colaboradores, setColaboradores] = useState([]);
  const [busca, setBusca] = useState('');
  const [setor, setSetor] = useState('');

  useEffect(() => {
    fetchColaboradores();
  }, [busca, setor]);

  const fetchColaboradores = async () => {
    try {
      const response = await axios.get(`http://localhost:8000/api/colaboradores`, {
        params: { busca, setor }
      });
      setColaboradores(response.data);
    } catch (error) {
      console.error('Erro ao carregar colaboradores:', error);
    }
  };

  return (
    <div className="p-6 space-y-6">
      {/* Cabeçalho e Ações */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Gestão de Colaboradores</h1>
          <p className="text-gray-400 text-sm">Visualize e gerencie a equipe cadastrada no sistema.</p>
        </div>
        <button className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition">
          <UserPlus size={18} /> Novo Colaborador
        </button>
      </div>

      {/* Barra de Filtros */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-gray-900 p-4 rounded-xl border border-gray-800">
        <div className="relative md:col-span-2">
          <Search className="absolute left-3 top-3 text-gray-500" size={18} />
          <input
            type="text"
            placeholder="Buscar por nome, CPF ou cargo..."
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            className="w-full bg-gray-800 border border-gray-700 rounded-lg pl-10 pr-4 py-2 text-white placeholder-gray-500 focus:outline-none focus:border-blue-500"
          />
        </div>
        <div className="flex items-center gap-2">
          <Filter className="text-gray-500" size={18} />
          <select
            value={setor}
            onChange={(e) => setSetor(e.target.value)}
            className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-blue-500"
          >
            <option value="">Todos os Setores</option>
            <option value="ADMINISTRAÇÃO">Administração</option>
            <option value="OPERAÇÕES">Operações</option>
            <option value="MANUTENÇÃO">Manutenção</option>
          </select>
        </div>
      </div>

      {/* Tabela de Dados */}
      <div className="bg-gray-900 rounded-xl border border-gray-800 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-gray-300">
            <thead className="bg-gray-800/50 text-gray-400 uppercase text-xs">
              <tr>
                <th className="px-6 py-3">Nome</th>
                <th className="px-6 py-3">CPF</th>
                <th className="px-6 py-3">Cargo</th>
                <th className="px-6 py-3">Setor</th>
                <th className="px-6 py-3">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800">
              {colaboradores.map((item) => (
                <tr key={item.id} className="hover:bg-gray-800/30 transition">
                  <td className="px-6 py-4 font-medium text-white">{item.nome}</td>
                  <td className="px-6 py-4">{item.cpf || 'N/A'}</td>
                  <td className="px-6 py-4">{item.cargo || 'N/A'}</td>
                  <td className="px-6 py-4">{item.setor || 'N/A'}</td>
                  <td className="px-6 py-4">
                    <span className="px-2 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                      Ativo
                    </span>
                  </td>
                </tr>
              ))}
              {colaboradores.length === 0 && (
                <tr>
                  <td colSpan="5" className="text-center py-8 text-gray-500">
                    Nenhum colaborador encontrado.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}