import React, { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Check, ChevronsUpDown, Truck } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Courier, getCouriers } from "@/lib/api/courier";

interface CourierSelectorProps {
  selectedCourierId: number | undefined;
  onSelectCourier: (courierId: number | undefined) => void;
  label?: string;
  onlyActive?: boolean;
  className?: string;
}

export const CourierSelector: React.FC<CourierSelectorProps> = ({
  selectedCourierId,
  onSelectCourier,
  label,
  onlyActive = true,
  className,
}) => {
  const { t } = useTranslation(['common', 'shop']);
  const defaultLabel = t('shop:select_courier');
  const [open, setOpen] = useState(false);
  const [couriers, setCouriers] = useState<Courier[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchCouriers = async () => {
      setLoading(true);
      try {
        const data = await getCouriers(onlyActive);
        setCouriers(data || []);
      } catch (error) {
        console.error("Failed to fetch couriers:", error);
        setCouriers([]);
      } finally {
        setLoading(false);
      }
    };

    fetchCouriers();
  }, [onlyActive]);

  const selectedCourier = couriers.find((courier) => courier.id === selectedCourierId);

  return (
    <div className={cn("flex flex-col space-y-1", className)}>
      {label && <span className="text-sm font-medium">{label}</span>}
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className="w-full justify-between"
            disabled={loading}
          >
            {selectedCourier ? (
              <div className="flex items-center">
                <Truck className="mr-2 h-4 w-4" />
                {selectedCourier.name}
              </div>
            ) : (
              <span className="text-muted-foreground">{t('shop:select_courier')}</span>
            )}
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[300px] p-0">
          <Command>
            <CommandInput placeholder={t('shop:search_courier')} />
            <CommandEmpty>
              {loading ? t('shop:loading') : t('shop:no_courier_found')}
            </CommandEmpty>
            <CommandGroup className="max-h-64 overflow-y-auto">
              {couriers.map((courier) => (
                <CommandItem
                  key={courier.id}
                  value={courier.name}
                  onSelect={() => {
                    onSelectCourier(courier.id === selectedCourierId ? undefined : courier.id);
                    setOpen(false);
                  }}
                >
                  <Check
                    className={cn(
                      "mr-2 h-4 w-4",
                      selectedCourierId === courier.id ? "opacity-100" : "opacity-0"
                    )}
                  />
                  {courier.name}
                </CommandItem>
              ))}
            </CommandGroup>
          </Command>
        </PopoverContent>
      </Popover>
    </div>
  );
};

export default CourierSelector; 