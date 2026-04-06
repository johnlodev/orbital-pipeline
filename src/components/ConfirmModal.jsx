import { motion, AnimatePresence } from 'framer-motion';
import { WarningCircle } from '@phosphor-icons/react';

export default function ConfirmModal({ isOpen, title = 'Pipeline Portal 系統提示', message, onConfirm, onCancel }) {
  if (!isOpen) return null;
  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/30 backdrop-blur-[2px]"
          onClick={onCancel}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.92, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.92, y: 12 }}
            transition={{ type: 'spring', duration: 0.35, bounce: 0.15 }}
            className="bg-white rounded-2xl shadow-[var(--shadow-soft-lg)] border border-slate-100/80 w-full max-w-sm mx-4 overflow-hidden"
            onClick={e => e.stopPropagation()}
          >
            <div className="px-6 pt-6 pb-2">
              <div className="flex items-center gap-2.5 mb-3">
                <div className="w-9 h-9 rounded-xl bg-amber-50 flex items-center justify-center flex-shrink-0">
                  <WarningCircle weight="fill" className="text-amber-500 text-xl" />
                </div>
                <h3 className="text-sm font-semibold text-slate-800">{title}</h3>
              </div>
              <p className="text-sm text-slate-600 leading-relaxed">{message}</p>
            </div>
            <div className="flex items-center gap-3 px-6 py-4">
              <button
                onClick={onCancel}
                className="flex-1 px-4 py-2 text-sm font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors duration-200"
              >
                取消
              </button>
              <button
                onClick={onConfirm}
                className="flex-1 px-4 py-2 text-sm font-medium text-white bg-red-500 hover:bg-red-600 rounded-xl transition-colors duration-200 shadow-sm"
              >
                確認刪除
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
