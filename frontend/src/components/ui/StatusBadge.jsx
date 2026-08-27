export default function StatusBadge({ status }) {
  const styles = {
    queued: 'bg-gray-800 text-gray-300 border-gray-700',
    running: 'bg-blue-900/30 text-blue-400 border-blue-500/30 animate-pulse',
    paused: 'bg-yellow-900/30 text-yellow-400 border-yellow-500/30',
    completed: 'bg-green-900/30 text-green-400 border-green-500/30',
    failed: 'bg-red-900/30 text-red-400 border-red-500/30',
    cancelled: 'bg-gray-800 text-gray-400 border-gray-700',
  };

  const style = styles[status] || styles.queued;

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${style} capitalize shadow-sm`}>
      {status}
    </span>
  );
}
