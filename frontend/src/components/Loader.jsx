const Loader = () => (
  <div className="flex items-center justify-center min-h-[200px]">
    <div className="relative">
      <div className="w-12 h-12 rounded-full border-2 border-transparent border-t-accent-500 border-r-neon-purple animate-spin" />
      <div className="absolute inset-1 rounded-full border-2 border-transparent border-b-neon-cyan border-l-accent-400 animate-spin direction-reverse" style={{ animationDirection: 'reverse', animationDuration: '0.8s' }} />
    </div>
  </div>
);

export default Loader;
