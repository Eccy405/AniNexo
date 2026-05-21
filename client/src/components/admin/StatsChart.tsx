'use client';

import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from 'recharts';

interface StatsChartProps {
  data: any[];
  dataKey: string;
  color?: string;
  title: string;
}

export function StatsChart({ data, dataKey, color = "#00E5FF", title }: StatsChartProps) {
  return (
    <div style={{ width: '100%', height: '300px', marginTop: '20px' }}>
      <h4 style={{ marginBottom: '15px', color: '#888' }}>{title}</h4>
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data}>
          <defs>
            <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={color} stopOpacity={0.3}/>
              <stop offset="95%" stopColor={color} stopOpacity={0}/>
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
          <XAxis 
            dataKey="date" 
            stroke="#555" 
            fontSize={12} 
            tickFormatter={(val) => new Date(val).toLocaleDateString()} 
          />
          <YAxis stroke="#555" fontSize={12} />
          <Tooltip 
            contentStyle={{ backgroundColor: '#111', border: '1px solid #333', color: '#fff' }}
            itemStyle={{ color: color }}
          />
          <Area 
            type="monotone" 
            dataKey={dataKey} 
            stroke={color} 
            fillOpacity={1} 
            fill="url(#colorValue)" 
            strokeWidth={3}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
