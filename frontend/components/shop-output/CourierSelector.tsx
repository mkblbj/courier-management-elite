// @ts-ignore
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
  CommandList,
  CommandSeparator,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Courier, getCouriers } from "@/lib/api/courier";
import { api, CourierCategory } from "@/services/api";

// 扩展Courier接口，确保包含category_id属性
interface CourierWithCategory extends Courier {
  category_name?: string;
  category_id?: number | string;
}

interface GroupedCouriers {
  category: CourierCategory;
  couriers: CourierWithCategory[];
}

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
  const [open, setOpen] = useState(false);
  const [couriers, setCouriers] = useState<CourierWithCategory[]>([]);
  const [categories, setCategories] = useState<CourierCategory[]>([]);
  const [groupedCouriers, setGroupedCouriers] = useState<GroupedCouriers[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        // 获取所有快递类别
        const categoriesData = await api.getCourierCategories();
        setCategories(categoriesData || []);

        // 获取所有快递类型
        const couriersData = await getCouriers(onlyActive) as CourierWithCategory[];
        setCouriers(couriersData || []);

        // 按类别分组
        const grouped: GroupedCouriers[] = [];
        categoriesData.forEach(category => {
          const categoryCouriers = couriersData.filter(
            courier => Number(courier.category_id) === Number(category.id)
          );

          // 只有当类别下有活跃的快递类型时才添加到分组中
          if (categoryCouriers.length > 0) {
            grouped.push({
              category,
              couriers: categoryCouriers
            });
          }
        });

        setGroupedCouriers(grouped);
      } catch (error) {
        console.error("Failed to fetch data:", error);
        setCouriers([]);
        setCategories([]);
        setGroupedCouriers([]);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [onlyActive]);

  const selectedCourier = couriers.find((courier) => courier.id === selectedCourierId);
  const getSelectedCourierDisplay = () => {
    if (!selectedCourier) return t('shop:select_courier');

    // 显示快递类型名称，如果有类别则一并显示
    const category = categories.find(c => Number(c.id) === Number(selectedCourier.category_id));
    if (category && selectedCourier.name.includes(t("未指定"))) {
      return `${category.name}`;
    }
    return selectedCourier.name;
  };

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
            {selectedCourier ? (
              <div className="flex items-center">
                <Truck className="mr-2 h-4 w-4" />
                {getSelectedCourierDisplay()}
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
            <CommandList className="max-h-64 overflow-y-auto">
              {groupedCouriers.map((group) => (
                <React.Fragment key={`category-${group.category.id}`}>
                  <CommandGroup heading={group.category.name}>
                    {/* 只有当该类别下的"未指定"快递类型存在且活跃时才显示"未指定"选项 */}
                    {(() => {
                      // 查找该类别下的"未指定"快递类型
                      const unspecifiedCourier = couriers.find(
                        c => Number(c.category_id) === Number(group.category.id) &&
                          c.name.includes('未指定')
                      );

                      // 只有当找到了活跃的"未指定"快递类型时才显示该选项
                      return unspecifiedCourier ? (
                        <CommandItem
                          value={`${group.category.name}-未指定`}
                          onSelect={() => {
                            onSelectCourier(unspecifiedCourier.id);
                            setOpen(false);
                          }}
                        >
                          <Check
                            className={cn(
                              "mr-2 h-4 w-4",
                              selectedCourier &&
                                selectedCourier.category_id === group.category.id &&
                                selectedCourier.name.includes('未指定')
                                ? "opacity-100"
                                : "opacity-0"
                            )}
                          />
                          {group.category.name}{t("- 未指定")}
                        </CommandItem>
                      ) : null;
                    })()}

                    {/* 显示该类别下的具体快递类型 */}
                    {group.couriers
                      .filter(courier => !courier.name.includes('未指定'))
                      .map((courier) => (
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
                  <CommandSeparator />
                </React.Fragment>
              ))}
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
    </div>)
  );
};

export default CourierSelector; 