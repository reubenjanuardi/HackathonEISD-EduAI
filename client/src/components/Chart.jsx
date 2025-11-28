import React from 'react';
import { 
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer 
} from 'recharts';

export const BarChartComponent = ({ data, dataKey, xKey, color = '#4F46E5' }) => {
  return (
    <ResponsiveContainer width="100%" height={300}>
      <BarChart data={data}>
        <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
        <XAxis dataKey={xKey} stroke="#9CA3AF" />
        <YAxis stroke="#9CA3AF" />
        <Tooltip 
          contentStyle={{ backgroundColor: '#1F2937', border: '1px solid #374151', borderRadius: '8px' }}
          labelStyle={{ color: '#F3F4F6' }}
        />
        <Legend />
        <Bar dataKey={dataKey} fill={color} radius={[8, 8, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
};

export const LineChartComponent = ({ data, dataKey, xKey, color = '#6366F1' }) => {
  return (
    <ResponsiveContainer width="100%" height={300}>
      <LineChart data={data}>
        <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
        <XAxis dataKey={xKey} stroke="#9CA3AF" />
        <YAxis stroke="#9CA3AF" />
        <Tooltip 
          contentStyle={{ backgroundColor: '#1F2937', border: '1px solid #374151', borderRadius: '8px' }}
          labelStyle={{ color: '#F3F4F6' }}
        />
        <Legend />
        <Line type="monotone" dataKey={dataKey} stroke={color} strokeWidth={2} />
      </LineChart>
    </ResponsiveContainer>
  );
};

export const PieChartComponent = ({ data, dataKey, nameKey, colors = ['#4F46E5', '#6366F1', '#10B981', '#F59E0B', '#EF4444'] }) => {
  return (
    <ResponsiveContainer width="100%" height={300}>
      <PieChart>
        <Pie
          data={data}
          dataKey={dataKey}
          nameKey={nameKey}
          cx="50%"
          cy="50%"
          outerRadius={100}
          label
        >
          {data.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
          ))}
        </Pie>
        <Tooltip 
          contentStyle={{ backgroundColor: '#1F2937', border: '1px solid #374151', borderRadius: '8px' }}
          labelStyle={{ color: '#F3F4F6' }}
        />
        <Legend />
      </PieChart>
    </ResponsiveContainer>
  );
};
