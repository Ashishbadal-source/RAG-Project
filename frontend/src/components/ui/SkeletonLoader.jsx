export default function SkeletonLoader({ type = 'card', count = 1 }) {
  const skeletons = Array(count).fill(0);

  if (type === 'table') {
    return (
      <div className="w-full animate-pulse space-y-4">
        <div className="h-10 bg-border/50 rounded w-full"></div>
        {skeletons.map((_, i) => (
          <div key={i} className="h-16 bg-cardHover rounded w-full"></div>
        ))}
      </div>
    );
  }

  return (
    <>
      {skeletons.map((_, i) => (
        <div key={i} className="card p-6 animate-pulse">
          <div className="h-4 bg-border/50 rounded w-1/3 mb-4"></div>
          <div className="h-8 bg-border/50 rounded w-1/2"></div>
        </div>
      ))}
    </>
  );
}
