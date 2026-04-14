import React, { useState, useEffect, useMemo } from 'react';
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';

const PALETTE = {
  primary: '#10b981',
  smile: '#3b82f6',
  eyebrow: '#f59e0b',
  eyeSqueeze: '#8b5cf6',
  pucker: '#ec4899',
  frown: '#06b6d4',
  text: '#374151',
  grid: '#e5e7eb',
  bg: '#f9fafb'
};

export default function Dashboard({ rawData = [], onRefresh }) {
  const [timeframe, setTimeframe] = useState('ALL');
  const [filteredData, setFilteredData] = useState([]);

  const flattenedData = useMemo(() => {
    return rawData
      .map(session => ({
        date: session.date, // Use full date-time to ensure distinct points
        displayDate: session.date.split(' ')[0], // Used for XAxis
        timestamp: new Date(session.date).getTime(),
        ...session.scores
      }))
      .sort((a, b) => a.timestamp - b.timestamp);
  }, [rawData]);

  useEffect(() => {
    if (flattenedData.length === 0) {
      setFilteredData([]);
      return;
    }

    if (timeframe === 'ALL') {
      setFilteredData(flattenedData);
      return;
    }

    const latestDate = flattenedData[flattenedData.length - 1].timestamp;
    const daysToSubtract = timeframe === '7D' ? 7 : 30;
    const cutoffDate = latestDate - (daysToSubtract * 24 * 60 * 60 * 1000);

    const newFiltered = flattenedData.filter(d => d.timestamp >= cutoffDate);
    setFilteredData(newFiltered);
  }, [timeframe, flattenedData]);

  if (!rawData || rawData.length === 0) {
    return (
      <div className="max-w-7xl mx-auto space-y-6 text-center mt-20">
        <div className="bg-white p-12 rounded-2xl shadow-sm border border-gray-100 flex flex-col items-center justify-center">
          <div className="bg-gray-100 rounded-full w-24 h-24 mb-6 flex items-center justify-center border-4 border-emerald-50 text-emerald-400 font-bold text-4xl">
             0
          </div>
          <h2 className="text-2xl font-extrabold text-gray-900 mb-2">No Past Progress Logged</h2>
          <p className="text-gray-500 mb-6 text-lg max-w-lg mx-auto">
            You must complete a live facial tracking session using the Bell's Palsy AI system to gather metrics. 
          </p>
          <button 
             onClick={onRefresh}
             className="px-6 py-2 text-sm text-gray-400 hover:text-emerald-500 border border-gray-200 rounded-full bg-gray-50 transition-all font-semibold shadow-sm hover:shadow"
          >
             Refresh Data Pool
          </button>
        </div>
      </div>
    );
  }

  const currentSession = filteredData.length > 0 ? filteredData[filteredData.length - 1] : null;
  const firstSession = filteredData.length > 0 ? filteredData[0] : null;
  
  const currentScore = currentSession ? currentSession['Overall Session Score'].toFixed(1) : '0.0';
  const improvement = (currentSession && firstSession) 
    ? (currentSession['Overall Session Score'] - firstSession['Overall Session Score']).toFixed(1)
    : '0.0';
  const isPositive = parseFloat(improvement) >= 0;

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Clinical Recovery Record</h1>
          <p className="text-sm text-gray-500 mt-1">Facial Landmark Kinematic Symmetry Analysis</p>
        </div>
        <div className="mt-4 md:mt-0 flex space-x-2 bg-gray-100 p-1.5 rounded-xl border border-gray-200">
          {['7D', '30D', 'ALL'].map(tf => (
            <button
              key={tf}
              onClick={() => setTimeframe(tf)}
              className={`px-5 py-2 text-sm font-semibold rounded-lg transition-all ${
                timeframe === tf 
                  ? 'bg-white text-emerald-600 shadow-sm border border-gray-200/50' 
                  : 'text-gray-500 hover:text-gray-800'
              }`}
            >
              {tf}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 flex flex-col justify-center transition-all hover:shadow-md">
          <p className="text-sm font-bold text-gray-400 uppercase tracking-widest">Current Overall Score</p>
          <div className="mt-4 flex items-baseline gap-2">
            <span className="text-6xl font-extrabold text-gray-900">{currentScore}%</span>
            <span className="text-sm font-medium text-gray-400">symmetry</span>
          </div>
        </div>
        
        <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 flex flex-col justify-center transition-all hover:shadow-md">
          <p className="text-sm font-bold text-gray-400 uppercase tracking-widest">Net Improvement ({timeframe})</p>
          <div className="mt-4 flex items-baseline gap-2">
            <span className={`text-6xl font-extrabold ${isPositive ? 'text-emerald-500' : 'text-rose-500'}`}>
              {isPositive ? '+' : ''}{improvement}%
            </span>
            <span className="text-sm font-medium text-gray-400">vs start of period</span>
          </div>
        </div>
      </div>

      <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100">
        <div className="mb-6">
          <h2 className="text-xl font-bold text-gray-900">Overall Recovery Trend</h2>
          <p className="text-sm font-medium text-gray-500 mt-1">Macro view of holistic facial symmetry over time.</p>
        </div>
        <div className="h-[22rem] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={filteredData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={PALETTE.grid} />
              <XAxis 
                dataKey="date" 
                tick={{ fill: PALETTE.text, fontSize: 12, fontWeight: 500 }} 
                axisLine={{ stroke: PALETTE.grid }}
                tickLine={false}
                dy={10}
                tickFormatter={(val) => val ? val.split(' ')[0] : ''}
              />
              <YAxis 
                domain={[0, 100]} 
                tick={{ fill: PALETTE.text, fontSize: 13, fontWeight: 600 }}
                axisLine={false}
                tickLine={false}
                tickFormatter={(val) => `${val}%`}
              />
              <Tooltip 
                contentStyle={{ borderRadius: '12px', border: '1px solid #e5e7eb', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                labelStyle={{ fontWeight: 'bold', color: PALETTE.text, marginBottom: '4px' }}
                itemStyle={{ fontWeight: 500 }}
                formatter={(value) => [Number(value).toFixed(1) + '%']}
                labelFormatter={(label, payload) => payload?.[0]?.payload?.date || label}
              />
              <Line 
                type="monotone" 
                dataKey="Overall Session Score" 
                stroke={PALETTE.primary} 
                strokeWidth={4}
                dot={{ r: 5, strokeWidth: 3, fill: '#fff' }}
                activeDot={{ r: 8, fill: PALETTE.primary, stroke: '#fff', strokeWidth: 3 }}
                isAnimationActive={true}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100">
        <div className="mb-6">
          <h2 className="text-xl font-bold text-gray-900">Discrete Muscle Symmetry Breakdown</h2>
          <p className="text-sm font-medium text-gray-500 mt-1">Micro view tracking individual muscle group symmetries.</p>
        </div>
        <div className="h-[26rem] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={filteredData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={PALETTE.grid} />
              <XAxis 
                dataKey="date" 
                tick={{ fill: PALETTE.text, fontSize: 12, fontWeight: 500 }} 
                axisLine={{ stroke: PALETTE.grid }}
                tickLine={false}
                dy={10}
                tickFormatter={(val) => val ? val.split(' ')[0] : ''}
              />
              <YAxis 
                domain={[0, 100]} 
                tick={{ fill: PALETTE.text, fontSize: 13, fontWeight: 600 }}
                axisLine={false}
                tickLine={false}
                tickFormatter={(val) => `${val}%`}
              />
              <Tooltip 
                cursor={{ fill: '#f3f4f6', opacity: 0.5 }}
                contentStyle={{ borderRadius: '12px', border: '1px solid #e5e7eb', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                formatter={(value) => [Number(value).toFixed(1) + '%']}
                labelFormatter={(label, payload) => payload?.[0]?.payload?.date || label}
              />
              <Legend 
                 wrapperStyle={{ paddingTop: '30px' }} 
                 iconType="circle" 
                 iconSize={10}
              />
              <Bar dataKey="Smile Symmetry" fill={PALETTE.smile} radius={[6, 6, 0, 0]} maxBarSize={45} />
              <Bar dataKey="Eyebrow Raise Symmetry" fill={PALETTE.eyebrow} radius={[6, 6, 0, 0]} maxBarSize={45} />
              <Bar dataKey="Eye Squeeze Symmetry" fill={PALETTE.eyeSqueeze} radius={[6, 6, 0, 0]} maxBarSize={45} />
              <Bar dataKey="Pucker Symmetry" fill={PALETTE.pucker} radius={[6, 6, 0, 0]} maxBarSize={45} />
              <Bar dataKey="Frown Symmetry" fill={PALETTE.frown} radius={[6, 6, 0, 0]} maxBarSize={45} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

    </div>
  );
}
