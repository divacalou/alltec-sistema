import React, { useState, useEffect } from 'react';
import { 
  FileText, 
  Download, 
  Printer, 
  Filter, 
  ShieldAlert, 
  HeartPulse, 
  Users, 
  Search,
  RefreshCw
} from 'lucide-react';

const API_BASE = "http://localhost:8000/api";

export default function Relatorios() {
  const [tipoRelatorio, setTipoRelatorio] = useState('aso_vencer');
  const [dadosRelatorio, setDadosRelatorio] = useState([]);
  const [loading, setLoading] = useState(false);
  const [filtroTexto, setFiltroTexto] = useState('');

  useEffect(() => {
    carregarRelatorio();
  }, [tipoRelatorio]);

  const carregarRelatorio = async () => {
    setLoading(true);
    try {
      let endpoint = '';
      if (tipoRelatorio === 'aso_vencer') endpoint = `${API_BASE}/exames`;
      else if (tipoRelatorio === 'epis_entregues') endpoint = `${API_BASE}/epis`;
      else if (tipoRelatorio === 'colaboradores_setor') endpoint = `${API_BASE}/colaboradores`;

      const res = await fetch(endpoint);
      if (res.ok) {
        const data = await res.json();
        setDadosRelatorio(data);
      } else {
        setDadosRelatorio([]);
      }
    } catch (err) {
      console.error("Erro ao carregar relatório:", err);
      setDadosRelatorio([]);
    } finally {
      setLoading(false);
    }
  };

  const handleImprimir = () => {
    window.print();
  };

  const dadosFiltrados = dadosRelatorio.filter(item => {
    const busca = filtroTexto.toLowerCase();
    return (
      (item.nome && item.nome.toLowerCase().includes(busca)) ||
      (item.colaborador_nome && item.colaborador_nome.toLowerCase().includes(busca)) ||
      (item.cargo && item.cargo.toLowerCase().includes(busca))
    );
  });

  return (
    <div className="space-y-6 max-w-7xl mx-auto print:p-0">
      {/* Cabeçalho (Oculto na impressão) */}
      <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4 print:hidden">
        <div>
          <h1 className="text-xl font-bold text-gray-900 flex items-center gap-2">
            <FileText className="text-red-600" size={24} /> Relatórios Gerenciais & Auditoria SST
          </h1>
          <p className="text-xs text-gray-500 mt-1">
            Gere relatórios de conformidade para fiscalização, auditoria interna e controle operacional.
          </p>
        </div>

        <div className="flex gap-2">
          <button 
            onClick={carregarRelatorio}
            className="p-2 border border-gray-300 rounded-lg hover:bg-gray-50 text-gray-600"
            title="Atualizar Dados"
          >
            <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
          </button>
          <button 
            onClick={handleImprimir}
            className="bg-gray-800 hover:bg-gray-900 text-white text-xs font-bold px-4 py-2 rounded-lg flex items-center gap-2 shadow-sm transition-all"
          >
            <Printer size={16} /> Imprimir / Exportar PDF
          </button>
        </div>
      </div>

      {/* Seletor de Tipo de Relatório (Oculto na impressão) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 print:hidden">
        <button
          onClick={() => setTipoRelatorio('aso_vencer')}
          className={`p-4 rounded-xl border text-left transition-all flex items-start gap-3 ${
            tipoRelatorio === 'aso_vencer'
              ? 'border-red-600 bg-red-50/40 ring-2 ring-red-500/20'
              : 'border-gray-200 bg-white hover:border-gray-300'
          }`}
        >
          <HeartPulse className={tipoRelatorio === 'aso_vencer' ? 'text-red-600' : 'text-gray-400'} size={22} />
          <div>
            <h3 className="text-xs font-bold text-gray-900 uppercase">Controle de Exames (ASO)</h3>
            <p className="text-[11px] text-gray-500 mt-0.5">Status de exames periódicos, admissionais e demissionais.</p>
          </div>
        </button>

        <button
          onClick={() => setTipoRelatorio('epis_entregues')}
          className={`p-4 rounded-xl border text-left transition-all flex items-start gap-3 ${
            tipoRelatorio === 'epis_entregues'
              ? 'border-red-600 bg-red-50/40 ring-2 ring-red-500/20'
              : 'border-gray-200 bg-white hover:border-gray-300'
          }`}
        >
          <ShieldAlert className={tipoRelatorio === 'epis_entregues' ? 'text-red-600' : 'text-gray-400'} size={22} />
          <div>
            <h3 className="text-xs font-bold text-gray-900 uppercase">Inventário & Entregas de EPI</h3>
            <p className="text-[11px] text-gray-500 mt-0.5">Fichas de EPIs entregues, prazos de validade e substituições.</p>
          </div>
        </button>

        <button
          onClick={() => setTipoRelatorio('colaboradores_setor')}
          className={`p-4 rounded-xl border text-left transition-all flex items-start gap-3 ${
            tipoRelatorio === 'colaboradores_setor'
              ? 'border-red-600 bg-red-50/40 ring-2 ring-red-500/20'
              : 'border-gray-200 bg-white hover:border-gray-300'
          }`}
        >
          <Users className={tipoRelatorio === 'colaboradores_setor' ? 'text-red-600' : 'text-gray-400'} size={22} />
          <div>
            <h3 className="text-xs font-bold text-gray-900 uppercase">Quadro de Colaboradores</h3>
            <p className="text-[11px] text-gray-500 mt-0.5">Mapeamento por cargo, setor, motoristas e nível de acesso.</p>
          </div>
        </button>
      </div>

      {/* Área da Tabela / Visualização do Relatório */}
      <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm space-y-4 print:border-none print:shadow-none print:p-0">
        
        {/* Cabeçalho do Relatório para Impressão */}
        <div className="hidden print:block border-b pb-4 mb-4">
          <h1 className="text-lg font-bold text-gray-900">RELATÓRIO DE SEGURANÇA E SAÚDE NO TRABALHO</h1>
          <p className="text-xs text-gray-600">
            Tipo: <strong className="uppercase">{tipoRelatorio.replace('_', ' ')}</strong> | Gerado em: {new Date().toLocaleDateString('pt-BR')}
          </p>
        </div>

        {/* Filtro de Busca (Oculto na Impressão) */}
        <div className="flex justify-between items-center print:hidden">
          <div className="relative w-full sm:w-80">
            <Search className="absolute left-3 top-2.5 text-gray-400" size={16} />
            <input
              type="text"
              placeholder="Filtrar resultados..."
              value={filtroTexto}
              onChange={(e) => setFiltroTexto(e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-gray-50 border border-gray-300 rounded-lg text-xs focus:ring-2 focus:ring-red-500 focus:outline-none"
            />
          </div>
          <span className="text-xs text-gray-500 font-medium">
            Total de registros: <strong>{dadosFiltrados.length}</strong>
          </span>
        </div>

        {/* Tabela do Relatório */}
        <div className="overflow-x-auto border border-gray-200 rounded-lg print:border-gray-300">
          <table className="w-full text-left text-xs text-gray-700">
            <thead className="bg-gray-50 uppercase text-gray-500 border-b border-gray-200 print:bg-gray-100">
              {tipoRelatorio === 'aso_vencer' && (
                <tr>
                  <th className="p-3">Colaborador</th>
                  <th className="p-3">Tipo de Exame</th>
                  <th className="p-3">Data do Exame</th>
                  <th className="p-3">Próximo Vencimento</th>
                  <th className="p-3">Aptidão</th>
                </tr>
              )}
              {tipoRelatorio === 'epis_entregues' && (
                <tr>
                  <th className="p-3">Equipamento (EPI)</th>
                  <th className="p-3">C.A.</th>
                  <th className="p-3">Estoque Atual</th>
                  <th className="p-3">Validade C.A.</th>
                  <th className="p-3">Status</th>
                </tr>
              )}
              {tipoRelatorio === 'colaboradores_setor' && (
                <tr>
                  <th className="p-3">Matrícula</th>
                  <th className="p-3">Nome do Colaborador</th>
                  <th className="p-3">Cargo</th>
                  <th className="p-3">Status</th>
                  <th className="p-3">Perfil Acesso</th>
                </tr>
              )}
            </thead>
            <tbody className="divide-y divide-gray-100 print:divide-gray-200">
              {loading ? (
                <tr><td colSpan="5" className="p-4 text-center text-gray-400">Carregando relatório...</td></tr>
              ) : dadosFiltrados.length === 0 ? (
                <tr><td colSpan="5" className="p-4 text-center text-gray-400">Nenhum dado retornado para este relatório.</td></tr>
              ) : (
                dadosFiltrados.map((item, index) => (
                  <tr key={item.id || index} className="hover:bg-gray-50">
                    {tipoRelatorio === 'aso_vencer' && (
                      <>
                        <td className="p-3 font-semibold text-gray-900">{item.colaborador_nome || '—'}</td>
                        <td className="p-3">{item.tipo_exame || 'Periódico'}</td>
                        <td className="p-3">{item.data_realizacao || '—'}</td>
                        <td className="p-3 font-bold text-red-600">{item.data_vencimento || '—'}</td>
                        <td className="p-3">
                          <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded text-[10px] font-bold">
                            {item.resultado || 'Apto'}
                          </span>
                        </td>
                      </>
                    )}

                    {tipoRelatorio === 'epis_entregues' && (
                      <>
                        <td className="p-3 font-semibold text-gray-900">{item.nome}</td>
                        <td className="p-3 font-mono">{item.ca_numero || '—'}</td>
                        <td className="p-3 font-bold">{item.quantidade_estoque || 0} un</td>
                        <td className="p-3">{item.validade_ca || '—'}</td>
                        <td className="p-3">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            (item.quantidade_estoque || 0) < 5 ? 'bg-red-100 text-red-700' : 'bg-emerald-100 text-emerald-700'
                          }`}>
                            {(item.quantidade_estoque || 0) < 5 ? 'Estoque Baixo' : 'Ok'}
                          </span>
                        </td>
                      </>
                    )}

                    {tipoRelatorio === 'colaboradores_setor' && (
                      <>
                        <td className="p-3 font-mono text-gray-500">{item.matricula || '—'}</td>
                        <td className="p-3 font-semibold text-gray-900">{item.nome}</td>
                        <td className="p-3 text-gray-600">{item.cargo}</td>
                        <td className="p-3">
                          <span className="px-2 py-0.5 bg-blue-100 text-blue-700 rounded text-[10px] font-bold">
                            {item.status || 'Ativo'}
                          </span>
                        </td>
                        <td className="p-3 font-semibold">{item.perfil_acesso || 'Técnico SST'}</td>
                      </>
                    )}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}