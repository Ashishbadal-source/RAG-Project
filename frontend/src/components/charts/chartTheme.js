// Shared Recharts theme and config
export const chartColors = {
  accent: '#3B82F6',
  secondary: '#10B981',
  tertiary: '#8B5CF6',
  muted: '#9CA3AF',
  warning: '#F59E0B',
  error: '#EF4444',
  grid: '#374151',
  text: '#9CA3AF'
};

export const defaultAxisProps = {
  stroke: chartColors.grid,
  tick: { fill: chartColors.text, fontSize: 12 },
  tickLine: false,
  axisLine: false,
};

export const defaultTooltipProps = {
  contentStyle: { 
    backgroundColor: '#1F2937', 
    border: '1px solid #374151',
    borderRadius: '8px',
    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.3)' 
  },
  itemStyle: { fontSize: 13, fontWeight: 500, color: '#F3F4F6' },
  labelStyle: { fontSize: 12, color: chartColors.text, marginBottom: 4 }
};
