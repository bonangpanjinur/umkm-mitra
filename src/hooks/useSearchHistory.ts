import { useState, useEffect, useCallback } from 'react';

const STORAGE_KEY = 'search_history';
const MAX_HISTORY = 10;

export function useSearchHistory() {
  const [history, setHistory] = useState<string[]>([]);

  // Load history from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        setHistory(JSON.parse(stored));
      }
    } catch (error) {
      console.error('Error loading search history:', error);
    }
  }, []);

  // Save to localStorage whenever history changes
  const saveHistory = useCallback((newHistory: string[]) => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(newHistory));
      setHistory(newHistory);
    } catch (error) {
      console.error('Error saving search history:', error);
    }
  }, []);

  const addToHistory = useCallback((query: string) => {
    const trimmed = query.trim().toLowerCase();
    if (!trimmed) return;

    setHistory(prev => {
      // Remove duplicate if exists
      const filtered = prev.filter(item => item.toLowerCase() !== trimmed);
      // Add to beginning and limit size
      const newHistory = [query.trim(), ...filtered].slice(0, MAX_HISTORY);
      saveHistory(newHistory);
      return newHistory;
    });
  }, [saveHistory]);

  const removeFromHistory = useCallback((query: string) => {
    setHistory(prev => {
      const newHistory = prev.filter(item => item !== query);
      saveHistory(newHistory);
      return newHistory;
    });
  }, [saveHistory]);

  const clearHistory = useCallback(() => {
    saveHistory([]);
  }, [saveHistory]);

  return {
    history,
    addToHistory,
    removeFromHistory,
    clearHistory,
  };
}
