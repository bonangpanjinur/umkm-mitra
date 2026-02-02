import { Filter, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { cn } from '@/lib/utils';

export interface TourismFilterOptions {
  status: 'all' | 'active' | 'inactive';
  facility: string | null;
}

interface TourismFiltersProps {
  filters: TourismFilterOptions;
  onFiltersChange: (filters: TourismFilterOptions) => void;
  availableFacilities: string[];
}

export function TourismFilters({ 
  filters, 
  onFiltersChange, 
  availableFacilities 
}: TourismFiltersProps) {
  const activeFilterCount = 
    (filters.status !== 'all' ? 1 : 0) + 
    (filters.facility ? 1 : 0);

  const handleReset = () => {
    onFiltersChange({ status: 'all', facility: null });
  };

  return (
    <div className="flex flex-wrap items-center gap-3 p-4 bg-secondary/30 rounded-xl border border-border">
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Filter className="h-4 w-4" />
        <span className="font-medium">Filter:</span>
      </div>

      {/* Status Filter */}
      <Select
        value={filters.status}
        onValueChange={(value: 'all' | 'active' | 'inactive') => 
          onFiltersChange({ ...filters, status: value })
        }
      >
        <SelectTrigger className="w-[140px] h-9 bg-background">
          <SelectValue placeholder="Status" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Semua Status</SelectItem>
          <SelectItem value="active">Aktif</SelectItem>
          <SelectItem value="inactive">Nonaktif</SelectItem>
        </SelectContent>
      </Select>

      {/* Facility Filter */}
      {availableFacilities.length > 0 && (
        <Select
          value={filters.facility || 'all'}
          onValueChange={(value) => 
            onFiltersChange({ ...filters, facility: value === 'all' ? null : value })
          }
        >
          <SelectTrigger className="w-[160px] h-9 bg-background">
            <SelectValue placeholder="Fasilitas" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Semua Fasilitas</SelectItem>
            {availableFacilities.map((facility) => (
              <SelectItem key={facility} value={facility}>
                {facility}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}

      {/* Active Filter Badges */}
      {activeFilterCount > 0 && (
        <div className="flex items-center gap-2 ml-auto">
          <Badge variant="secondary" className="gap-1">
            {activeFilterCount} filter aktif
          </Badge>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleReset}
            className="h-8 px-2 text-muted-foreground hover:text-foreground"
          >
            <X className="h-4 w-4 mr-1" />
            Reset
          </Button>
        </div>
      )}
    </div>
  );
}
