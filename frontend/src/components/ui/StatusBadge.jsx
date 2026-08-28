export default function StatusBadge({ status }) {
  const styles = {
    queued: 'bg-[#FEF3C7] text-[#92400E] border-[#FCD34D]',
    running: 'bg-[#E0F2FE] text-[#0369A1] border-[#7DD3FC]',
    paused: 'bg-[#FEF3C7] text-[#92400E] border-[#FCD34D]',
    completed: 'bg-[#DCFCE7] text-[#047857] border-[#86EFAC]',
    failed: 'bg-[#FEE2E2] text-[#B91C1C] border-[#FCA5A5]',
    cancelled: 'bg-card-elevated text-slate-500 border-border',
  };

  const style = styles[status] || styles.queued;

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${style} capitalize shadow-sm`}>
      {status}
    </span>
  );
}
