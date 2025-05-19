"use client";;
import { useTranslation } from "react-i18next";

import React, { useState, useEffect, useMemo } from "react";
import { format } from "date-fns";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import {
  Edit,
  Trash,
  RefreshCw,
  X,
  Clock,
  Calendar as CalendarIcon,
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { getShopOutputs } from "@/lib/api/shop-output";
import { ShopOutput, ShopOutputFilter } from "@/lib/types/shop-output";
import { DATE_FORMAT, DATETIME_FORMAT, FRIENDLY_DATETIME_FORMAT } from "@/lib/constants";
import { DateSelector } from "@/components/shop-output/DateSelector";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { getShops } from "@/lib/api/shop";
import { getShopCategories } from "@/lib/api/shop-category";
import { getCouriers } from "@/lib/api/courier";
import {
  dateToApiString,
  formatDisplayDate,
  getTodayInAppTimezone,
  apiStringToDate,
  APP_TIMEZONE
} from "@/lib/date-utils";
import { formatInTimeZone } from 'date-fns-tz';

// 扩展ShopOutputFilter类型，添加排序和分页相关属性
interface ExtendedShopOutputFilter extends ShopOutputFilter {
  sort?: string;
  order?: 'ASC' | 'DESC';
  courier_id?: number;
  shop_id?: number;
  category_id?: number;
  output_date?: string;
}

// 组件Props
interface OutputListProps {
  onEdit?: (output: ShopOutput) => void;
  onDelete?: (id: string | number) => void;
  selectedDate?: Date;
  onDateChange?: (date: Date) => void;
}

export default function OutputList({ onEdit, onDelete, selectedDate: propSelectedDate, onDateChange }: OutputListProps) {
  const { t } = useTranslation();

  // 状态定义
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [recentOutputs, setRecentOutputs] = useState<ShopOutput[]>([]);
  const [refreshKey, setRefreshKey] = useState(0);
  const [isVisible, setIsVisible] = useState(false);
  const [internalSelectedDate, setInternalSelectedDate] = useState<Date>(new Date());
  // 使用props的selectedDate或者内部状态
  const selectedDate = propSelectedDate || internalSelectedDate;
  const [courierTypeId, setCourierTypeId] = useState<number | undefined>(undefined);
  const [shopTypeId, setShopTypeId] = useState<number | undefined>(undefined);
  const [shopId, setShopId] = useState<number | undefined>(undefined);
  const [shops, setShops] = useState<{ id: number, name: string, category_id?: number, category_name?: string }[]>([]);
  const [categories, setCategories] = useState<{ id: number, name: string }[]>([]);
  const [couriers, setCouriers] = useState<{ id: number, name: string }[]>([]);

  // 加载商店、分类和快递类型数据
  useEffect(() => {
    const fetchData = async () => {
      try {
        // 获取店铺类别
        const categoriesData = await getShopCategories();
        setCategories(categoriesData.map(cat => ({
          id: cat.id,
          name: cat.name
        })));

        // 获取店铺（包含类别ID信息）
        const shopsData = await getShops({ isActive: true, withCategory: true });
        setShops(shopsData.map(shop => ({
          id: shop.id,
          name: shop.name,
          category_id: shop.category_id,
          category_name: shop.category_name
        })));

        // 获取快递类型
        const couriersData = await getCouriers(true);
        setCouriers(couriersData.map(courier => ({
          id: courier.id,
          name: courier.name
        })));
      } catch (err) {
        console.error("Failed to load reference data:", err);
        setError(t("加载基础数据失败，请刷新页面重试"));
      }
    };

    fetchData();
  }, [t]);

  // 加载数据的函数
  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      // 创建筛选条件对象
      const filter: ExtendedShopOutputFilter = {};

      // 使用日期工具函数处理日期
      if (selectedDate) {
        filter.output_date = dateToApiString(selectedDate);
        console.log("使用日期筛选:", filter.output_date);
      }

      // 添加快递类型过滤条件
      if (courierTypeId) {
        filter.courier_id = courierTypeId;
      }

      // 添加店铺类型过滤条件
      if (shopTypeId) {
        filter.category_id = shopTypeId;
      }

      // 添加具体店铺过滤条件
      if (shopId) {
        filter.shop_id = shopId;
      }

      console.log("Filter parameters:", filter);

      // 调用 API 获取数据
      let result = await getShopOutputs(filter);
      console.log("API response:", result);

      // 如果有类别筛选条件，在前端筛选（因为后端 API 可能不支持按类别筛选）
      if (filter.category_id && shops.length > 0) {
        // 创建店铺ID到类别ID的映射
        const shopCategoryMap: Record<number, number> = {};
        shops.forEach(shop => {
          if (shop.category_id) {
            shopCategoryMap[shop.id] = shop.category_id;
          }
        });

        // 筛选出符合类别条件的记录
        result = result.filter(output => {
          const shopCategoryId = shopCategoryMap[output.shop_id];
          return shopCategoryId === filter.category_id;
        });

        console.log("类别筛选后的记录数:", result.length);
      }

      // 处理结果，确保每个记录有完整信息
      const processedResults = result.map(output => {
        const shopInfo = shops.find(s => s.id === output.shop_id);
        const courierInfo = couriers.find(c => c.id === output.courier_id);

        return {
          ...output,
          shop_name: output.shop_name || (shopInfo ? shopInfo.name : '未知'),
          courier_name: output.courier_name || (courierInfo ? courierInfo.name : '未知')
        };
      });

      setRecentOutputs(processedResults);

      setTimeout(() => {
        setIsVisible(true);
      }, 100);
    } catch (err) {
      console.error("Failed to load recent outputs:", err);
      setError(t("加载数据失败，请重试"));
    } finally {
      setLoading(false);
    }
  };

  // 监听依赖变化重新加载数据
  useEffect(() => {
    if (shops.length > 0 && categories.length > 0 && couriers.length > 0) {
      loadData();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedDate, courierTypeId, shopTypeId, shopId, refreshKey, shops.length, categories.length, couriers.length, t]);

  // 处理日期变化
  const handleDateChange = (date: Date | undefined) => {
    if (date) {
      console.log("日期已更改为:", dateToApiString(date));

      if (onDateChange) {
        onDateChange(date);
      } else {
        setInternalSelectedDate(date);
      }
    }
  };

  // 处理快递类型变化
  const handleCourierTypeChange = (id: number | undefined) => {
    setCourierTypeId(id);
  };

  // 处理店铺类型变化
  const handleShopTypeChange = (id: number | undefined) => {
    setShopTypeId(id);
  };

  // 处理店铺变化
  const handleShopChange = (id: number | undefined) => {
    setShopId(id);
  };

  // 清除所有筛选条件
  const handleClearFilters = () => {
    // 重置所有筛选条件，包括将日期设置为今天
    const today = getTodayInAppTimezone();
    if (onDateChange) {
      onDateChange(today);
    } else {
      setInternalSelectedDate(today);
    }
    setCourierTypeId(undefined);
    setShopTypeId(undefined);
    setShopId(undefined);
  };

  // 刷新数据
  const handleRefresh = () => {
    setRefreshKey(prev => prev + 1);
  };

  // 获取筛选条件描述
  const getFilterDescription = () => {
    const filters = [];

    if (selectedDate) {
      filters.push(
        <Badge key="date" variant="default" className="bg-blue-500 text-white font-medium">{t("日期:")}{dateToApiString(selectedDate)}
        </Badge>
      );
    }

    if (courierTypeId) {
      const courierName = couriers.find(c => c.id === courierTypeId)?.name || courierTypeId;
      filters.push(
        <Badge key="courier" variant="default" className="bg-green-500 text-white font-medium">{t("快递类型:")}{courierName}
        </Badge>
      );
    }

    if (shopTypeId) {
      const categoryName = categories.find(c => c.id === shopTypeId)?.name || shopTypeId;
      filters.push(
        <Badge key="category" variant="default" className="bg-purple-500 text-white font-medium">{t("店铺类型:")}{categoryName}
        </Badge>
      );
    }

    if (shopId) {
      const shopName = shops.find(s => s.id === shopId)?.name || shopId;
      filters.push(
        <Badge key="shop" variant="default" className="bg-orange-500 text-white font-medium">{t("店铺:")}{shopName}
        </Badge>
      );
    }

    return filters.length > 0 ? filters : null;
  };

  // 按店铺类型分组的数据
  const groupedOutputs = useMemo(() => {
    if (!recentOutputs || recentOutputs.length === 0) return [];

    // 创建店铺ID到类别名称的映射
    const shopCategories: Record<number, string> = {};
    shops.forEach(shop => {
      if (shop.category_name) {
        shopCategories[shop.id] = shop.category_name;
      } else if (shop.category_id) {
        const category = categories.find(cat => cat.id === shop.category_id);
        if (category) {
          shopCategories[shop.id] = category.name;
        }
      }
    });

    // 按店铺类型分组
    const groups: { [key: string]: ShopOutput[] } = {};
    recentOutputs.forEach(output => {
      // 尝试从输出数据获取类别名称，如果不存在则查找店铺关联的类别
      let categoryName = (output as any).category_name;

      // 如果输出中没有category_name，尝试通过shop_id找到对应的类别
      if (!categoryName && output.shop_id && shopCategories[output.shop_id]) {
        categoryName = shopCategories[output.shop_id];
      }

      if (!categoryName) {
        categoryName = '未分类';
      }

      if (!groups[categoryName]) {
        groups[categoryName] = [];
      }
      groups[categoryName].push(output);
    });

    // 转换为数组格式并按类别名称排序
    return Object.entries(groups)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([category, outputs]) => ({
        category,
        outputs
      }));
  }, [recentOutputs, shops, categories]);

  return (
    (<div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <DateSelector
          date={selectedDate}
          onDateChange={handleDateChange}
          showQuickButtons={true}
          label=""
          className="w-auto min-w-[180px]"
        />
        <Select
          value={courierTypeId?.toString() || "all"}
          onValueChange={(value) => handleCourierTypeChange(value === "all" ? undefined : parseInt(value))}
        >
          <SelectTrigger className="w-auto min-w-[140px]">
            <SelectValue placeholder={t("选择快递类型")} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t("全部快递类型")}</SelectItem>
            {couriers.map((courier) => (
              <SelectItem key={courier.id} value={courier.id.toString()}>
                {courier.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select
          value={shopTypeId?.toString() || "all"}
          onValueChange={(value) => handleShopTypeChange(value === "all" ? undefined : parseInt(value))}
        >
          <SelectTrigger className="w-auto min-w-[140px]">
            <SelectValue placeholder={t("选择店铺类型")} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t("全部店铺类型")}</SelectItem>
            {categories.map((category) => (
              <SelectItem key={category.id} value={category.id.toString()}>
                {category.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select
          value={shopId?.toString() || "all"}
          onValueChange={(value) => handleShopChange(value === "all" ? undefined : parseInt(value))}
        >
          <SelectTrigger className="w-auto min-w-[140px]">
            <SelectValue placeholder={t("选择店铺")} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t("全部店铺")}</SelectItem>
            {shops.map((shop) => (
              <SelectItem key={shop.id} value={shop.id.toString()}>
                {shop.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <div className="flex items-center gap-2 ml-auto">
          <Button
            variant="outline"
            size="sm"
            onClick={handleClearFilters}
            disabled={loading}
          >
            <X className="h-4 w-4 mr-1" />{t("重置")}</Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            disabled={loading}
          >
            <RefreshCw className={cn("h-4 w-4 mr-1", { "animate-spin": loading })} />{t("刷新")}</Button>
        </div>
      </div>
      {getFilterDescription() && (
        <div className="flex flex-wrap gap-2 my-3 p-2 bg-muted dark:bg-gray-800/50 rounded-md border">
          <span className="text-sm font-medium">{t("筛选条件:")}</span>
          {getFilterDescription()}
        </div>
      )}
      <div className="rounded-md border overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t("日期")}</TableHead>
              <TableHead>{t("店铺名称")}</TableHead>
              <TableHead>{t("快递类型")}</TableHead>
              <TableHead className="text-right">{t("数量")}</TableHead>
              <TableHead>{t("备注")}</TableHead>
              <TableHead className="text-right">{t("操作")}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              Array.from({ length: 5 }).map((_, index) => (
                <TableRow key={index}>
                  <TableCell>
                    <Skeleton className="h-5 w-20" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-5 w-24" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-5 w-16" />
                  </TableCell>
                  <TableCell className="text-right">
                    <Skeleton className="h-5 w-10 ml-auto" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-5 w-40" />
                  </TableCell>
                  <TableCell className="text-right">
                    <Skeleton className="h-8 w-20 ml-auto" />
                  </TableCell>
                </TableRow>
              ))
            ) : groupedOutputs.length > 0 ? (
              groupedOutputs.map((group, groupIndex) => (
                <React.Fragment key={groupIndex}>
                  <TableRow className="bg-muted/50">
                    <TableCell colSpan={6} className="font-medium">
                      {group.category} ({group.outputs.length})
                    </TableCell>
                  </TableRow>
                  {group.outputs.map((output) => (
                    <TableRow key={output.id}>
                      <TableCell>
                        {output.output_date ? (
                          <div className="flex flex-col">
                            <div className="flex items-center text-sm font-medium">
                              <CalendarIcon className="mr-1 h-3 w-3 text-muted-foreground" />
                              {formatDisplayDate(output.output_date)}
                            </div>
                            {output.created_at && (
                              <div className="flex items-center text-xs text-muted-foreground mt-1">
                                <Clock className="mr-1 h-3 w-3" />
                                {formatInTimeZone(
                                  apiStringToDate(output.created_at),
                                  APP_TIMEZONE,
                                  'HH:mm:ss'
                                )}
                              </div>
                            )}
                          </div>
                        ) : (
                          "未知"
                        )}
                      </TableCell>
                      <TableCell>{output.shop_name || "未知"}</TableCell>
                      <TableCell>{output.courier_name || "未知"}</TableCell>
                      <TableCell className="text-right font-medium">{output.quantity}</TableCell>
                      <TableCell className="max-w-[200px] truncate">
                        {output.notes || "-"}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => onEdit?.(output)}
                            title={t("编辑")}
                          >
                            <Edit className="h-4 w-4" />
                            <span className="sr-only">{t("编辑")}</span>
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => onDelete?.(output.id)}
                            title={t("删除")}
                            className="text-destructive hover:text-destructive/90"
                          >
                            <Trash className="h-4 w-4" />
                            <span className="sr-only">{t("删除")}</span>
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </React.Fragment>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={6} className="h-24 text-center">{t("暂无数据")}</TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
      {error && (
        <div className="bg-destructive/10 text-destructive p-3 rounded-md text-sm">
          {error}
        </div>
      )}
    </div>)
  );
}