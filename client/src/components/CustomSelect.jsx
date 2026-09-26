import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, Check } from 'lucide-react';
import { cn } from '../utils/cn';

const CustomSelect = ({
  options = [],
  value,
  onChange,
  placeholder = 'Select option...',
  label,
  className = '',
  disabled = false,
  icon: Icon
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef(null);

  // Normalize options array to { value, label, icon, description }
  const normalizedOptions = options.map(opt => {
    if (typeof opt === 'object' && opt !== null) {
      return {
        value: opt.value,
        label: opt.label || opt.value,
        icon: opt.icon,
        description: opt.description
      };
    }
    return { value: opt, label: opt };
  });

  const selectedOption = normalizedOptions.find(opt => opt.value === value);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelect = (val) => {
    if (disabled) return;
    onChange(val);
    setIsOpen(false);
  };

  return (
    <div className={cn("relative w-full text-left", className)} ref={containerRef}>
      {label && (
        <label className="block text-xs font-black uppercase tracking-widest text-slate-700 dark:text-gray-300 mb-2">
          {label}
        </label>
      )}

      <button
        type="button"
        disabled={disabled}
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "w-full flex items-center justify-between gap-3 px-4 py-3.5 rounded-2xl font-bold text-sm transition-all duration-300",
          "bg-white/80 dark:bg-dark-800/80 backdrop-blur-xl border border-slate-200 dark:border-white/10",
          "text-slate-900 dark:text-white shadow-sm hover:border-accent-violet/50 hover:shadow-glow-violet/20",
          "focus:outline-none focus:ring-2 focus:ring-accent-violet/40",
          isOpen && "border-accent-violet ring-2 ring-accent-violet/30 shadow-lg shadow-accent-violet/10",
          disabled && "opacity-50 cursor-not-allowed"
        )}
      >
        <div className="flex items-center gap-3 truncate min-w-0">
          {selectedOption?.icon ? (
            <span className="text-accent-violet shrink-0">{selectedOption.icon}</span>
          ) : Icon ? (
            <Icon className="w-4 h-4 text-accent-violet shrink-0" />
          ) : null}
          
          <span className={cn("truncate", !selectedOption && "text-slate-400 font-medium")}>
            {selectedOption ? selectedOption.label : placeholder}
          </span>
        </div>

        <ChevronDown 
          className={cn(
            "w-4 h-4 text-slate-400 shrink-0 transition-transform duration-300",
            isOpen && "rotate-180 text-accent-violet"
          )} 
        />
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -8, scale: 0.96 }}
            animate={{ opacity: 1, y: 4, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.96 }}
            transition={{ duration: 0.18, ease: "easeOut" }}
            className="absolute left-0 right-0 z-50 mt-1 max-h-60 overflow-y-auto rounded-2xl bg-white/95 dark:bg-slate-900/95 backdrop-blur-2xl border border-slate-200 dark:border-white/15 p-1.5 shadow-2xl custom-scrollbar"
          >
            {normalizedOptions.length === 0 ? (
              <div className="p-3 text-center text-xs font-bold text-slate-400">
                No options available
              </div>
            ) : (
              normalizedOptions.map((opt) => {
                const isSelected = opt.value === value;
                return (
                  <button
                    key={String(opt.value)}
                    type="button"
                    onClick={() => handleSelect(opt.value)}
                    className={cn(
                      "w-full flex items-center justify-between gap-3 px-3.5 py-2.5 rounded-xl font-bold text-xs transition-all duration-200 group text-left",
                      isSelected
                        ? "bg-accent-violet text-white shadow-md shadow-accent-violet/20"
                        : "text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-white/10 hover:text-accent-violet dark:hover:text-white"
                    )}
                  >
                    <div className="flex items-center gap-2.5 truncate min-w-0">
                      {opt.icon && (
                        <span className={cn("shrink-0", isSelected ? "text-white" : "text-slate-400 group-hover:text-accent-violet")}>
                          {opt.icon}
                        </span>
                      )}
                      <div className="flex flex-col truncate">
                        <span className="truncate">{opt.label}</span>
                        {opt.description && (
                          <span className={cn(
                            "text-[10px] font-normal truncate",
                            isSelected ? "text-white/80" : "text-slate-400"
                          )}>
                            {opt.description}
                          </span>
                        )}
                      </div>
                    </div>

                    {isSelected && (
                      <Check className="w-3.5 h-3.5 shrink-0 text-white" />
                    )}
                  </button>
                );
              })
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default CustomSelect;
