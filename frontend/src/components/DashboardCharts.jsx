import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, PieChart, Pie, Cell } from 'recharts';

const dataLinha = [
  { mes: 'Mar', colaboradores: 30 },
  { mes: 'Abr', colaboradores: 38 },
  { mes: 'Mai', colaboradores: 40 },
  { mes: 'Jun', colaboradores: 43 },
  { mes: 'Jul', colaboradores: 48 },
  { mes: 'Ago', colaboradores: 52 },
];

const COLORS = ['#dc2626', '#1e293b', '#eab308', '#2563eb', '#16a34a', '#9333ea'];

export function DashboardCharts() {
  const [dataRosca, setDataRosca] = useState([]);
  const [total, setTotal] = useState(0);

  useEffect(() => {
    axios.get('http://127.0.0.1:8000/api/colaboradores/setores')
      .then((res) => {
        const formatado = res.data.map((item, index) => ({
          name: item.setor,
          value: item.quantidade,
          color: COLORS[index % COLORS.length]
        }));
        setDataRosca(formatado);

        const soma = formatado.reduce((acc, curr) => acc + curr.value, 0);
        setTotal(soma);
      })
      .catch((err) => console.error('Erro ao carregar setores:', err));
  }, []);

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
      <div className="flex justify-between items-center mb-6 border-b border-gray-100 pb-4">
        <div>
          <h2 className="text-base font-bold text-gray-900">Evolução e Distribuição por Setor</h2>
          <p className="text-xs text-gray-500">Acompanhamento operacional dos colaboradores</p>
        </div>
        <span className="text-xs font-semibold text-red-600 bg-red-50 border border-red-100 px-3 py-1 rounded-full">
          Dados em tempo real
        </span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-center">
        <div className="lg:col-span-2 h-72">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={dataLinha}>
              <XAxis dataKey="mes" stroke="#9ca3af" fontSize={12} tickLine={false} />
              <YAxis stroke="#9ca3af" fontSize={12} tickLine={false} axisLine={false} />
              <Tooltip contentStyle={{ backgroundColor: '#ffffff', borderColor: '#e5e7eb', borderRadius: '8px', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }} />
              <Line type="monotone" dataKey="colaboradores" stroke="#dc2626" strokeWidth={3} dot={{ fill: '#dc2626', r: 5 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="flex flex-col items-center justify-center border-l border-gray-100 pl-4">
          <div className="w-48 h-48 relative">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={dataRosca.length > 0 ? dataRosca : [{ name: 'Sem dados', value: 1, color: '#e5e7eb' }]} innerRadius={60} outerRadius={80} paddingAngle={4} dataKey="value">
                  {dataRosca.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-3xl font-extrabold text-gray-900">{total}</span>
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Total</span>
            </div>
          </div>

          <div className="w-full space-y-2 mt-4">
            {dataRosca.map((item) => (
              <div key={item.name} className="flex justify-between items-center text-xs">
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-md" style={{ backgroundColor: item.color }}></span>
                  <span className="text-gray-600 font-medium">{item.name}</span>
                </div>
                <span className="font-bold text-gray-900">{item.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export default DashboardCharts;