import { AlertCircle } from 'lucide-react';

export default function EmptyState({ title, description, icon: Icon = AlertCircle, action }) {
  return (
    <div className="flex flex-col items-center justify-center p-12 text-center card bg-card/50">
      <div className="p-4 bg-cardHover rounded-full mb-4 ring-1 ring-border shadow-inner">
        <Icon className="h-8 w-8 text-muted" />
      </div>
      <h3 className="text-lg font-medium text-gray-100 mb-1">{title}</h3>
      <p className="text-sm text-muted max-w-sm mb-6">{description}</p>
      {action && <div>{action}</div>}
    </div>
  );
}
