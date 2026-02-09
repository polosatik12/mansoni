import { motion } from "framer-motion";
import { Check } from "lucide-react";

interface SelectionCheckboxProps {
  checked: boolean;
  onClick: (e: React.MouseEvent) => void;
}

export function SelectionCheckbox({ checked, onClick }: SelectionCheckboxProps) {
  return (
    <motion.button
      initial={{ scale: 0, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      exit={{ scale: 0, opacity: 0 }}
      transition={{ type: "spring", damping: 20, stiffness: 400 }}
      onClick={onClick}
      className="flex-shrink-0 flex items-center justify-center"
    >
      <div
        className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all duration-200 ${
          checked
            ? "bg-[#3390ec] border-[#3390ec]"
            : "border-white/30 bg-transparent"
        }`}
      >
        {checked && (
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", damping: 15, stiffness: 500 }}
          >
            <Check className="w-3.5 h-3.5 text-white" strokeWidth={3} />
          </motion.div>
        )}
      </div>
    </motion.button>
  );
}
