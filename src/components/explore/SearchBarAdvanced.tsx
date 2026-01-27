import { useState, useRef, useEffect } from 'react';
import { Search, X, Clock, TrendingUp, ArrowUpRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';

interface SearchBarAdvancedProps {
  placeholder?: string;
  value?: string;
  onChange?: (value: string) => void;
  onSubmit?: (value: string) => void;
  history?: string[];
  onHistoryRemove?: (item: string) => void;
  onHistoryClear?: () => void;
  popularSearches?: string[];
}

export function SearchBarAdvanced({ 
  placeholder = 'Cari produk, desa, atau UMKM...', 
  value = '',
  onChange,
  onSubmit,
  history = [],
  onHistoryRemove,
  onHistoryClear,
  popularSearches = ['Kopi Arabika', 'Batik', 'Wisata Alam', 'Keripik', 'Anyaman'],
}: SearchBarAdvancedProps) {
  const [isFocused, setIsFocused] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Close suggestions when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && value.trim()) {
      onSubmit?.(value.trim());
      setShowSuggestions(false);
      inputRef.current?.blur();
    }
    if (e.key === 'Escape') {
      setShowSuggestions(false);
      inputRef.current?.blur();
    }
  };

  const handleSuggestionClick = (suggestion: string) => {
    onChange?.(suggestion);
    onSubmit?.(suggestion);
    setShowSuggestions(false);
  };

  const handleFocus = () => {
    setIsFocused(true);
    setShowSuggestions(true);
  };

  const handleClear = () => {
    onChange?.('');
    inputRef.current?.focus();
  };

  const shouldShowDropdown = showSuggestions && (history.length > 0 || popularSearches.length > 0);

  return (
    <div ref={containerRef} className="relative flex-1">
      <div className={cn(
        "relative group flex items-center",
        isFocused && "ring-2 ring-primary/50 rounded-xl"
      )}>
        <Search className="absolute left-3 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition pointer-events-none" />
        <input
          ref={inputRef}
          type="text"
          placeholder={placeholder}
          value={value}
          onChange={(e) => onChange?.(e.target.value)}
          onKeyDown={handleKeyDown}
          onFocus={handleFocus}
          onBlur={() => setIsFocused(false)}
          className="w-full bg-secondary border border-border rounded-xl pl-9 pr-8 py-2.5 text-xs focus:outline-none focus:border-primary transition placeholder:text-muted-foreground"
        />
        {value && (
          <button
            onClick={handleClear}
            className="absolute right-2 p-1 hover:bg-muted rounded-full transition"
          >
            <X className="h-3.5 w-3.5 text-muted-foreground" />
          </button>
        )}
      </div>

      {/* Suggestions Dropdown */}
      <AnimatePresence>
        {shouldShowDropdown && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="absolute top-full left-0 right-0 mt-2 bg-card border border-border rounded-xl shadow-lg z-50 overflow-hidden max-h-[60vh] overflow-y-auto"
          >
            {/* Recent Searches */}
            {history.length > 0 && (
              <div className="p-3 border-b border-border/50">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-1.5 text-muted-foreground">
                    <Clock className="h-3.5 w-3.5" />
                    <span className="text-[10px] font-medium uppercase tracking-wide">Pencarian Terakhir</span>
                  </div>
                  {onHistoryClear && (
                    <button 
                      onClick={onHistoryClear}
                      className="text-[10px] text-primary hover:underline"
                    >
                      Hapus Semua
                    </button>
                  )}
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {history.slice(0, 5).map((item, idx) => (
                    <div
                      key={idx}
                      className="group/item flex items-center gap-1 bg-secondary hover:bg-secondary/80 rounded-full px-2.5 py-1 transition cursor-pointer"
                    >
                      <span 
                        onClick={() => handleSuggestionClick(item)}
                        className="text-xs text-foreground"
                      >
                        {item}
                      </span>
                      {onHistoryRemove && (
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            onHistoryRemove(item);
                          }}
                          className="opacity-0 group-hover/item:opacity-100 transition"
                        >
                          <X className="h-3 w-3 text-muted-foreground hover:text-foreground" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Popular Searches */}
            {popularSearches.length > 0 && (
              <div className="p-3">
                <div className="flex items-center gap-1.5 text-muted-foreground mb-2">
                  <TrendingUp className="h-3.5 w-3.5" />
                  <span className="text-[10px] font-medium uppercase tracking-wide">Pencarian Populer</span>
                </div>
                <div className="space-y-1">
                  {popularSearches.map((item, idx) => (
                    <button
                      key={idx}
                      onClick={() => handleSuggestionClick(item)}
                      className="flex items-center justify-between w-full px-2 py-1.5 hover:bg-secondary rounded-lg transition group/popular"
                    >
                      <span className="text-xs text-foreground">{item}</span>
                      <ArrowUpRight className="h-3 w-3 text-muted-foreground opacity-0 group-hover/popular:opacity-100 transition" />
                    </button>
                  ))}
                </div>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
