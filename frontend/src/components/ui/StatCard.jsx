export default function StatCard({ title, value, icon: Icon, trend }) {
  return (
    <div className="card p-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-muted">{title}</p>
          <p className="mt-2 text-3xl font-semibold text-gray-100">{value}</p>
        </div>
        <div className="p-3 bg-accent/10 rounded-full text-accent">
          {Icon && <Icon className="h-6 w-6" />}
        </div>
      </div>
      {trend && (
        <div className="mt-4 flex items-center text-sm">
          <span className={trend.isPositive ? 'text-success' : 'text-error'}>
            {trend.value}
          </span>
          <span className="ml-2 text-muted">{trend.label}</span>
        </div>
      )}
    </div>
  );
}
