import React, { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Check, ChevronsUpDown, Store, ChevronRight, Search } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
      Command,
      CommandEmpty,
      CommandGroup,
      CommandInput,
      CommandItem,
      CommandList,
      CommandSeparator,
} from "@/components/ui/command";
import {
      Popover,
      PopoverContent,
      PopoverTrigger,
} from "@/components/ui/popover";
import {
      HoverCard,
      HoverCardContent,
      HoverCardTrigger,
} from "@/components/ui/hover-card";
import { Shop, ShopCategory } from "@/lib/types/shop";
import { getShops } from "@/lib/api/shop";
import { getShopCategories } from "@/lib/api/shop-category";

interface CategoryShopSelectorProps {
      selectedShopId: number | undefined;
      onSelectShop: (shopId: number | undefined) => void;
      label?: string;
      onlyActive?: boolean;
      className?: string;
}

export const CategoryShopSelector: React.FC<CategoryShopSelectorProps> = ({
      selectedShopId,
      onSelectShop,
      label,
      onlyActive = true,
      className,
}) => {
      const { t } = useTranslation(['common', 'shop']);
      const [open, setOpen] = useState(false);
      const [categories, setCategories] = useState<ShopCategory[]>([]);
      const [shopsByCategory, setShopsByCategory] = useState<Record<number, Shop[]>>({});
      const [allShops, setAllShops] = useState<Shop[]>([]);
      const [loading, setLoading] = useState(false);
      const [searchTerm, setSearchTerm] = useState("");

      // 获取所有店铺类别
      useEffect(() => {
            const fetchCategories = async () => {
                  setLoading(true);
                  try {
                        const data = await getShopCategories({ sort: "sort_order" });
                        setCategories(data || []);
                  } catch (error) {
                        console.error("Failed to fetch shop categories:", error);
                        setCategories([]);
                  }
            };

            fetchCategories();
      }, []);

      // 获取所有店铺
      useEffect(() => {
            const fetchAllShops = async () => {
                  try {
                        // 确保在API调用中使用isActive参数
                        const params = onlyActive ? { isActive: true } : {};
                        const shops = await getShops(params);

                        // 如果onlyActive为true，进一步确保只有活跃的店铺被使用
                        const filteredShops = onlyActive
                              ? shops.filter(shop => shop.is_active)
                              : shops;

                        setAllShops(filteredShops || []);

                        // 按类别组织店铺
                        const shopsByCat: Record<number, Shop[]> = {};
                        filteredShops.forEach(shop => {
                              if (shop.category_id) {
                                    if (!shopsByCat[shop.category_id]) {
                                          shopsByCat[shop.category_id] = [];
                                    }
                                    shopsByCat[shop.category_id].push(shop);
                              }
                        });
                        setShopsByCategory(shopsByCat);
                  } catch (error) {
                        console.error("Failed to fetch shops:", error);
                        setAllShops([]);
                  } finally {
                        setLoading(false);
                  }
            };

            if (categories.length > 0) {
                  fetchAllShops();
            }
      }, [categories, onlyActive]);

      // 如果选中的店铺在当前筛选条件下不可用，清除选择
      useEffect(() => {
            if (selectedShopId && allShops.length > 0 && !allShops.some(shop => shop.id === selectedShopId)) {
                  onSelectShop(undefined);
            }
      }, [allShops, selectedShopId, onSelectShop]);

      const selectedShop = allShops.find((shop) => shop.id === selectedShopId);

      // 过滤搜索结果
      const filteredShops = searchTerm ?
            allShops.filter(shop => shop.name.toLowerCase().includes(searchTerm.toLowerCase())) :
            [];

      return (
            (<div className={cn("flex flex-col space-y-1", className)}>
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
                                                {selectedShop.category_name && (
                                                      <span className="ml-2 text-xs text-muted-foreground">
                                                            ({selectedShop.category_name})
                                                      </span>
                                                )}
                                          </div>
                                    ) : (
                                          <span className="text-muted-foreground">{t("选择店铺")}</span>
                                    )}
                                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                              </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-[320px] p-0" align="start">
                              <Command>
                                    <div className="flex items-center border-b px-3">
                                          <Search className="mr-2 h-4 w-4 shrink-0 opacity-50" />
                                          <CommandInput
                                                placeholder={t("搜索店铺...")}
                                                value={searchTerm}
                                                onValueChange={setSearchTerm}
                                                className="h-9 border-0 outline-none focus-visible:ring-0"
                                          />
                                    </div>

                                    <CommandList>
                                          {searchTerm ? (
                                                <>
                                                      <CommandEmpty>{t("未找到店铺")}</CommandEmpty>
                                                      <CommandGroup heading={t("搜索结果")}>
                                                            {filteredShops.map((shop) => (
                                                                  <CommandItem
                                                                        key={shop.id}
                                                                        value={shop.name}
                                                                        onSelect={() => {
                                                                              onSelectShop(shop.id === selectedShopId ? undefined : shop.id);
                                                                              setOpen(false);
                                                                              setSearchTerm("");
                                                                        }}
                                                                  >
                                                                        <Check
                                                                              className={cn(
                                                                                    "mr-2 h-4 w-4",
                                                                                    selectedShopId === shop.id ? "opacity-100" : "opacity-0"
                                                                              )}
                                                                        />
                                                                        <div className="flex flex-col">
                                                                              <span>{shop.name}</span>
                                                                              {shop.category_name && (
                                                                                    <span className="text-xs text-muted-foreground">
                                                                                          {shop.category_name}
                                                                                    </span>
                                                                              )}
                                                                        </div>
                                                                  </CommandItem>
                                                            ))}
                                                      </CommandGroup>
                                                </>
                                          ) : (
                                                <>
                                                      <CommandEmpty>{loading ? "加载中..." : "未找到店铺类别"}</CommandEmpty>
                                                      {categories.map((category) => {
                                                            const categoryShops = shopsByCategory[category.id] || [];
                                                            if (categoryShops.length === 0) return null;

                                                            return (
                                                                  (<div key={category.id}>
                                                                        <HoverCard openDelay={300} closeDelay={200}>
                                                                              <HoverCardTrigger asChild>
                                                                                    <CommandItem
                                                                                          value={category.name}
                                                                                          className="flex items-center justify-between cursor-default"
                                                                                          onSelect={() => { }} // 空函数，使类别项不可选择
                                                                                    >
                                                                                          <span className="font-medium">{category.name}</span>
                                                                                          <ChevronRight className="h-4 w-4 opacity-50" />
                                                                                    </CommandItem>
                                                                              </HoverCardTrigger>
                                                                              <HoverCardContent
                                                                                    side="right"
                                                                                    align="start"
                                                                                    className="w-[220px] p-0"
                                                                              >
                                                                                    <Command>
                                                                                          <CommandList>
                                                                                                <CommandGroup heading={`${category.name} - 店铺`}>
                                                                                                      {categoryShops.length > 0 ? (
                                                                                                            categoryShops.map((shop) => (
                                                                                                                  <CommandItem
                                                                                                                        key={shop.id}
                                                                                                                        value={shop.name}
                                                                                                                        onSelect={() => {
                                                                                                                              onSelectShop(shop.id);
                                                                                                                              setOpen(false);
                                                                                                                              setSearchTerm("");
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
                                                                                                            ))
                                                                                                      ) : (
                                                                                                            <CommandItem disabled>{t("没有可用店铺")}</CommandItem>
                                                                                                      )}
                                                                                                </CommandGroup>
                                                                                          </CommandList>
                                                                                    </Command>
                                                                              </HoverCardContent>
                                                                        </HoverCard>
                                                                  </div>)
                                                            );
                                                      })}

                                                      <CommandSeparator />

                                                      <CommandGroup heading={t("所有店铺")}>
                                                            {allShops.map((shop) => (
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
                                                                        <div className="flex flex-col">
                                                                              <span>{shop.name}</span>
                                                                              {shop.category_name && (
                                                                                    <span className="text-xs text-muted-foreground">
                                                                                          {shop.category_name}
                                                                                    </span>
                                                                              )}
                                                                        </div>
                                                                  </CommandItem>
                                                            ))}
                                                      </CommandGroup>
                                                </>
                                          )}
                                    </CommandList>
                              </Command>
                        </PopoverContent>
                  </Popover>
            </div>)
      );
};

export default CategoryShopSelector; 