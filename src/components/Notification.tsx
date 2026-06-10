import React, { useEffect } from 'react';
import { Check, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface NotificationProps {
  message: string;
  type?: 'success' | 'error' | 'info';
  onClose: () => void;
}

export default function Notification({ message, type = 'success', onClose }: NotificationProps) {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
    }, 3000);
    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 50, scale: 0.9 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 20, scale: 0.95 }}
      className="fixed bottom-24 left-1/2 -translate-x-1/2 z-[100] w-[90%] max-w-sm"
    >
      <div className="glass-card rounded-2xl p-4 shadow-xl flex items-center justify-between border border-white/15 bg-slate-900/90 gap-3">
        <div className="flex items-center gap-3">
          <div className={`p-2 rounded-full ${type === 'success' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400'}`}>
            {type === 'success' ? <Check size={18} /> : <AlertCircle size={18} />}
          </div>
          <span className="text-sm font-medium text-white text-right leading-tight">{message}</span>
        </div>
        <button onClick={onClose} className="text-gray-400 hover:text-white text-xs px-2 py-1">
          إغلاق
        </button>
      </div>
    </motion.div>
  );
}
