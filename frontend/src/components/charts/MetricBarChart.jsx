import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { chartColors, defaultAxisProps, defaultTooltipProps } from './chartTheme';

export default function MetricBarChart({ data, dataKey = "value", nameKey = "name", color = chartColors.accent }) {
  if (!data || data.length === 0) {
    return <div className="h-full w-full flex items-center justify-center text-muted text-sm">No data available</div>;
  }
  
  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={chartColors.grid} />
        <XAxis dataKey={nameKey} {...defaultAxisProps} />
        <YAxis {...defaultAxisProps} />
        <Tooltip {...defaultTooltipProps} cursor={{ fill: '#f3f4f6' }} />
        <Bar dataKey={dataKey} fill={color} radius={[4, 4, 0, 0]} maxBarSize={40} />
      </BarChart>
    </ResponsiveContainer>
  );
}
