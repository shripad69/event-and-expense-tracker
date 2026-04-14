const SkeletonLoader = ({ count = 3, type = 'card' }) => {
  if (type === 'stat') {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="glass-card p-5">
            <div className="flex items-center justify-between mb-3">
              <div className="w-10 h-10 rounded-xl skeleton" />
              <div className="w-20 h-7 rounded-lg skeleton" />
            </div>
            <div className="w-20 h-3 rounded skeleton" />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="glass-card p-5">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <div className="w-48 h-4 rounded skeleton mb-2.5" />
              <div className="w-32 h-3 rounded skeleton" />
            </div>
            <div className="flex gap-2">
              <div className="w-20 h-8 rounded-xl skeleton" />
              <div className="w-16 h-8 rounded-xl skeleton" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default SkeletonLoader;
