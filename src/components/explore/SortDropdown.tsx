import { useState } from 'react';
import { ArrowUpDown, TrendingUp, Clock, DollarSign, Star } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';

export type SortOption = 'relevance' | 'newest' | 'price_low' | 'price_high' | 'rating';

interface SortDropdownProps {
  value: SortOption;
  onChange: (value: SortOption) => void;
}

const sortOptions: { value: SortOption; label: string; icon: React.ReactNode }[] = [
  { value: 'relevance', label: 'Relevansi', icon: <TrendingUp className="h-3.5 w-3.5" /> },
  { value: 'newest', label: 'Terbaru', icon: <Clock className="h-3.5 w-3.5" /> },
  { value: 'price_low', label: 'Harga Terendah', icon: <DollarSign className="h-3.5 w-3.5" /> },
  { value: 'price_high', label: 'Harga Tertinggi', icon: <DollarSign className="h-3.5 w-3.5" /> },
  { value: 'rating', label: 'Rating Tertinggi', icon: <Star className="h-3.5 w-3.5" /> },
];

export function SortDropdown({ value, onChange }: SortDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const selectedOption = sortOptions.find(o => o.value === value) || sortOptions[0];

  const isDefault = value === 'relevance';

  return (
    <div className="relative">
      <Tooltip>
        <TooltipTrigger asChild>
          <button
            onClick={() => setIsOpen(!isOpen)}
            className={cn(
              "relative flex items-center justify-center w-9 h-9 rounded-xl border transition-all",
              !isDefault
                ? "bg-primary text-primary-foreground border-primary"
                : "bg-background text-muted-foreground border-border hover:border-primary/50 hover:text-foreground"
            )}
          >
            <ArrowUpDown className="h-4 w-4" />
          </button>
        </TooltipTrigger>
        <TooltipContent side="bottom" className="text-xs">
          Urutkan: {selectedOption.label}
        </TooltipContent>
      </Tooltip>

      <AnimatePresence>
        {isOpen && (
          <>
            <div 
              className="fixed inset-0 z-40" 
              onClick={() => setIsOpen(false)} 
            />
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="absolute top-full right-0 mt-2 bg-card border border-border rounded-xl shadow-lg z-50 min-w-[160px] overflow-hidden"
            >
              {sortOptions.map((option) => (
                <button
                  key={option.value}
                  onClick={() => {
                    onChange(option.value);
                    setIsOpen(false);
                  }}
                  className={cn(
                    "flex items-center gap-2 w-full px-3 py-2.5 text-xs font-medium transition-colors",
                    option.value === value
                      ? "bg-primary/10 text-primary"
                      : "text-foreground hover:bg-secondary"
                  )}
                >
                  {option.icon}
                  {option.label}
                </button>
              ))}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
