import React, { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Check, ChevronsUpDown, Store, X } from "lucide-react";
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
import { Badge } from "@/components/ui/badge";
import { Shop } from "@/lib/types/shop";
import { getShops } from "@/lib/api/shop";

interface ShopSelectorProps {
  selectedShopId: number | undefined;
  onSelectShop: (shopId: number | undefined) => void;
  label?: string;
  onlyActive?: boolean;
  categoryId?: number;
  className?: string;
}

export const ShopSelector: React.FC<ShopSelectorProps> = ({
  selectedShopId,
  onSelectShop,
  label,
  onlyActive = true,
  categoryId,
  className,
}) => {
  const { t } = useTranslation(['common', 'shop']);
  const defaultLabel = t('shop:select_shop');
  const [open, setOpen] = useState(false);
  const [shops, setShops] = useState<Shop[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchShops = async () => {
      setLoading(true);
      try {
        const params: {
          isActive?: boolean;
          categoryId?: number;
        } = {};

        if (onlyActive) {
          params.isActive = true;
        }

        if (categoryId) {
          params.categoryId = categoryId;
        }

        const data = await getShops(params);
        setShops(data || []);
      } catch (error) {
        console.error("Failed to fetch shops:", error);
        setShops([]);
      } finally {
        setLoading(false);
      }
    };

    fetchShops();
  }, [onlyActive, categoryId]);

  useEffect(() => {
    if (selectedShopId && shops.length > 0 && !shops.some(shop => shop.id === selectedShopId)) {
      onSelectShop(undefined);
    }
  }, [shops, selectedShopId, onSelectShop]);

  const selectedShop = shops.find((shop) => shop.id === selectedShopId);

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
            {selectedShop ? (
              <div className="flex items-center">
                <Store className="mr-2 h-4 w-4" />
                {selectedShop.name}
              </div>
            ) : (
              <span className="text-muted-foreground">{t('shop:select_shop')}</span>
            )}
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[300px] p-0">
          <Command>
            <CommandInput placeholder={t('shop:search_shop')} />
            <CommandEmpty>
              {loading ? t('shop:loading') : t('shop:no_shop_found')}
            </CommandEmpty>
            <CommandGroup className="max-h-64 overflow-y-auto">
              {shops.map((shop) => (
                <CommandItem
                  key={shop.id}
                  value={shop.name}
                  onSelect={() => {
                    onSelectShop(shop.id === selectedShopId ? undefined : shop.id);
                    setOpen(false);
                  }}
                >
                  <Check
                    className={cn(
                      "mr-2 h-4 w-4",
                      selectedShopId === shop.id ? "opacity-100" : "opacity-0"
                    )}
                  />
                  {shop.name}
                </CommandItem>
              ))}
            </CommandGroup>
          </Command>
        </PopoverContent>
      </Popover>
    </div>
  );
};

interface MultiShopSelectorProps {
  selectedShopIds: number[];
  onSelectShops: (shopIds: number[]) => void;
  label?: string;
  onlyActive?: boolean;
  categoryId?: number;
  className?: string;
}

export const MultiShopSelector: React.FC<MultiShopSelectorProps> = ({
  selectedShopIds,
  onSelectShops,
  label,
  onlyActive = true,
  categoryId,
  className,
}) => {
  const { t } = useTranslation(['common', 'shop']);
  const defaultLabel = t('shop:select_shop');
  const [open, setOpen] = useState(false);
  const [shops, setShops] = useState<Shop[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchShops = async () => {
      setLoading(true);
      try {
        const params: {
          isActive?: boolean;
          categoryId?: number;
        } = {};

        if (onlyActive) {
          params.isActive = true;
        }

        if (categoryId) {
          params.categoryId = categoryId;
        }

        const data = await getShops(params);
        setShops(data || []);
      } catch (error) {
        console.error("Failed to fetch shops:", error);
        setShops([]);
      } finally {
        setLoading(false);
      }
    };

    fetchShops();
  }, [onlyActive, categoryId]);

  const selectedShops = shops.filter((shop) => selectedShopIds.includes(shop.id));

  const toggleShop = (shopId: number) => {
    const newSelectedShopIds = selectedShopIds.includes(shopId)
      ? selectedShopIds.filter((id) => id !== shopId)
      : [...selectedShopIds, shopId];

    onSelectShops(newSelectedShopIds);
  };

  const removeShop = (shopId: number) => {
    onSelectShops(selectedShopIds.filter((id) => id !== shopId));
  };

  return (
    <div className={cn("flex flex-col space-y-1", className)}>
      {label && <span className="text-sm font-medium">{label}</span>}
      <div className="flex flex-col space-y-2">
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              role="combobox"
              aria-expanded={open}
              className="w-full justify-between"
              disabled={loading}
            >
              <span className={cn(!selectedShops.length && "text-muted-foreground")}>
                {selectedShops.length > 0
                  ? t('shop:shops_selected', { count: selectedShops.length })
                  : t('shop:select_shop')}
              </span>
              <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-[300px] p-0">
            <Command>
              <CommandInput placeholder={t('shop:search_shop')} />
              <CommandEmpty>
                {loading ? t('shop:loading') : t('shop:no_shop_found')}
              </CommandEmpty>
              <CommandGroup className="max-h-64 overflow-y-auto">
                {shops.map((shop) => (
                  <CommandItem
                    key={shop.id}
                    value={shop.name}
                    onSelect={() => toggleShop(shop.id)}
                  >
                    <div className="flex items-center w-full">
                      <Check
                        className={cn(
                          "mr-2 h-4 w-4",
                          selectedShopIds.includes(shop.id) ? "opacity-100" : "opacity-0"
                        )}
                      />
                      {shop.name}
                    </div>
                  </CommandItem>
                ))}
              </CommandGroup>
            </Command>
          </PopoverContent>
        </Popover>

        {selectedShops.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-2">
            {selectedShops.map((shop) => (
              <Badge key={shop.id} variant="secondary" className="flex items-center gap-1">
                {shop.name}
                <X
                  className="h-3 w-3 cursor-pointer"
                  onClick={() => removeShop(shop.id)}
                />
              </Badge>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ShopSelector; 