import { motion, AnimatePresence } from "framer-motion";

interface DeleteConfirmDialogProps {
  open: boolean;
  count: number;
  onConfirm: () => void;
  onCancel: () => void;
}

export function DeleteConfirmDialog({ open, count, onConfirm, onCancel }: DeleteConfirmDialogProps) {
  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.15 }}
          className="fixed inset-0 z-[400] flex items-center justify-center"
          onClick={onCancel}
        >
          <div
            className="absolute inset-0"
            style={{
              backdropFilter: "blur(8px) brightness(0.5)",
              WebkitBackdropFilter: "blur(8px) brightness(0.5)",
            }}
          />
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            transition={{ type: "spring", damping: 22, stiffness: 350 }}
            className="relative rounded-2xl overflow-hidden border border-white/20 p-6 max-w-[300px] w-[90vw]"
            style={{
              background: "rgba(30,40,55,0.95)",
              backdropFilter: "blur(24px)",
              WebkitBackdropFilter: "blur(24px)",
              boxShadow: "0 16px 48px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.1)",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-white font-semibold text-lg mb-2">Удалить сообщения</h3>
            <p className="text-white/60 text-sm mb-6">
              Удалить {count} {count === 1 ? "сообщение" : count < 5 ? "сообщения" : "сообщений"}?
              Это действие нельзя отменить.
            </p>
            <div className="flex gap-3">
              <button
                onClick={onCancel}
                className="flex-1 py-2.5 rounded-xl text-white/70 text-sm font-medium hover:bg-white/10 transition-colors border border-white/10"
              >
                Отмена
              </button>
              <button
                onClick={onConfirm}
                className="flex-1 py-2.5 rounded-xl bg-red-500/80 text-white text-sm font-medium hover:bg-red-500 transition-colors"
              >
                Удалить
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
