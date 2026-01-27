import { RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { usePWA } from '@/hooks/usePWA';

export function UpdatePrompt() {
  const { isUpdateAvailable, updateApp } = usePWA();

  if (!isUpdateAvailable) return null;

  return (
    <div className="fixed bottom-20 left-4 right-4 max-w-[480px] mx-auto z-50 animate-in slide-in-from-bottom-4 duration-300">
      <div className="bg-primary text-primary-foreground rounded-2xl shadow-lg p-4">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <RefreshCw className="h-5 w-5" />
            <div>
              <h3 className="font-semibold text-sm">Update Tersedia</h3>
              <p className="text-xs opacity-80">Klik refresh untuk update</p>
            </div>
          </div>
          <Button
            size="sm"
            variant="secondary"
            onClick={updateApp}
            className="text-xs"
          >
            Refresh
          </Button>
        </div>
      </div>
    </div>
  );
}
