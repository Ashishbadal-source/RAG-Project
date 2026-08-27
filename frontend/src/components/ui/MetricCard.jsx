export default function MetricCard({ title, value, description, highlight }) {
  return (
    <div className="card p-5 flex flex-col justify-between">
      <div>
        <h3 className="text-sm font-medium text-muted mb-1">{title}</h3>
        <div className="flex items-end space-x-2">
          <span className={`text-2xl font-bold ${highlight ? 'text-accent' : 'text-gray-100'}`}>
            {value}
          </span>
        </div>
      </div>
      {description && (
        <p className="text-xs text-muted mt-3 pt-3 border-t border-border">
          {description}
        </p>
      )}
    </div>
  );
}
