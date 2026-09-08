import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { ShieldAlert, Plus, AlertTriangle, CheckCircle2, X } from 'lucide-react';

export function SstOcorrencias() {
  const [ocorrencias, setOcorrencias] = useState([]);
  const [colaboradores, setColaboradores] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalAberto, setModalAberto] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    colaborador_id: '',
    tipo: '',
    data: new Date().toISOString().split('T')[0],
    gravidade: 'Baixa',
    descricao: '',
  });

  useEffect(() => {
    carregarDados();
  }, []);

  const carregarDados = async () => {
    try {
      const [resOcorrencias, resColaboradores] = await Promise.all([
        axios.get('http://localhost:8000/api/ocorrencias'),
        axios.get('http://localhost:8000/api/colaboradores')
      ]);
      setOcorrencias(resOcorrencias.data);
      setColaboradores(resColaboradores.data);
    } catch (error) {
      console.error('Erro ao carregar dados de SST:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.colaborador_id || !formData.tipo) {
      alert('Preencha os campos obrigatórios!');
      return;
    }

    try {
      await axios.post('http://localhost:8000/api/ocorrencias', formData);
      setModalAberto(false);
      setFormData({
        colaborador_id: '',
        tipo: '',
        data: new Date().toISOString().split('T')[0],
        gravidade: 'Baixa',
        descricao: '',
      });
      carregarDados(); // Recarrega a tabela com a nova ocorrência
    } catch (error) {
      console.error('Erro ao salvar ocorrência:', error);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
        <div>
          <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
            <ShieldAlert className="text-red-600" size={24} />
            Gestão de SST & Ocorrências
          </h2>
          <p className="text-xs text-gray-500 mt-1">Registro de incidentes e condições de risco operacionais</p>
        </div>
        <button 
          onClick={() => setModalAberto(true)}
          className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg text-sm font-semibold flex items-center gap-2 shadow-sm transition-all"
        >
          <Plus size={16} /> Nova Ocorrência
        </button>
      </div>

      {/* Tabela */}
      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
        {loading ? (
          <div className="p-8 text-center text-gray-500 text-sm">Carregando dados do banco de dados...</div>
        ) : (
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200 text-[11px] font-bold text-gray-500 uppercase tracking-wider">
                <th className="p-4">Colaborador</th>
                <th className="p-4">Tipo de Ocorrência</th>
                <th className="p-4">Data</th>
                <th className="p-4">Gravidade</th>
                <th className="p-4">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 text-sm">
              {ocorrencias.length > 0 ? (
                ocorrencias.map((item) => (
                  <tr key={item.id} className="hover:bg-gray-50 transition-colors">
                    <td className="p-4 font-semibold text-gray-900">{item.colaborador_nome || 'Não Informado'}</td>
                    <td className="p-4 text-gray-600">{item.tipo}</td>
                    <td className="p-4 text-gray-500 text-xs">{item.data}</td>
                    <td className="p-4">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${
                        item.gravidade === 'Baixa' 
                          ? 'bg-amber-50 text-amber-700 border border-amber-200' 
                          : 'bg-red-50 text-red-700 border border-red-200'
                      }`}>
                        {item.gravidade}
                      </span>
                    </td>
                    <td className="p-4">
                      <span className={`flex items-center gap-1.5 text-xs font-semibold ${
                        item.status === 'Resolvido' ? 'text-emerald-600' : 'text-amber-600'
                      }`}>
                        {item.status === 'Resolvido' ? <CheckCircle2 size={14} /> : <AlertTriangle size={14} />}
                        {item.status}
                      </span>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="5" className="p-6 text-center text-gray-400 text-xs">
                    Nenhuma ocorrência cadastrada até o momento.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        )}
      </div>

      {/* Modal de Nova Ocorrência */}
      {modalAberto && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden">
            <div className="flex justify-between items-center p-5 border-b border-gray-100 bg-gray-50">
              <h3 className="font-bold text-gray-900">Registrar Ocorrência de SST</h3>
              <button onClick={() => setModalAberto(false)} className="text-gray-400 hover:text-gray-600">
                <X size={20} />
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-5 space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Colaborador</label>
                <select
                  className="w-full border border-gray-300 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-red-500 focus:outline-none"
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
                <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Tipo de Ocorrência</label>
                <input
                  type="text"
                  placeholder="Ex: Não uso de capacete, Incidente com veículo"
                  className="w-full border border-gray-300 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-red-500 focus:outline-none"
                  value={formData.tipo}
                  onChange={(e) => setFormData({ ...formData, tipo: e.target.value })}
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Data</label>
                  <input
                    type="date"
                    className="w-full border border-gray-300 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-red-500 focus:outline-none"
                    value={formData.data}
                    onChange={(e) => setFormData({ ...formData, data: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Gravidade</label>
                  <select
                    className="w-full border border-gray-300 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-red-500 focus:outline-none"
                    value={formData.gravidade}
                    onChange={(e) => setFormData({ ...formData, gravidade: e.target.value })}
                  >
                    <option value="Baixa">Baixa</option>
                    <option value="Média">Média</option>
                    <option value="Alta">Alta</option>
                  </select>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setModalAberto(false)}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-sm text-gray-700 hover:bg-gray-50"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm font-semibold shadow-sm"
                >
                  Salvar Ocorrência
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