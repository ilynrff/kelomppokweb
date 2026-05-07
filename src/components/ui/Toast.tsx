import { useEffect } from 'react';

export function Toast({ isOpen, message, type = 'success', onClose }: { isOpen: boolean, message: string, type?: 'success'|'error', onClose: () => void }) {
  useEffect(() => {
    if (!isOpen) return;
    const t = setTimeout(() => onClose(), 3000);
    return () => clearTimeout(t);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const bg = type === 'success' ? 'bg-emerald-500' : 'bg-red-500';

  return (
    <div className="fixed top-24 left-1/2 transform -translate-x-1/2 z-[100] animate-in slide-in-from-top-4 fade-in duration-300">
      <div className={`${bg} text-white px-6 py-4 rounded-full shadow-2xl font-bold flex items-center gap-3`}>
        {type === 'success' ? (
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><polyline points="20 6 9 17 4 12"></polyline></svg>
        ) : (
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
        )}
        {message}
      </div>
    </div>
  );
}
