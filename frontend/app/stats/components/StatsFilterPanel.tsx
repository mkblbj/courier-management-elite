import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ChevronDown, ChevronUp, Filter } from 'lucide-react';
import type { StatsDimension } from './ShopOutputStats';
import { Loader2 } from 'lucide-react';
import { MultiSelect, MultiSelectItem } from '@/components/ui/multi-select';
import { useTranslation } from 'react-i18next';

interface StatsFilterPanelProps {
      selectedDimension: StatsDimension;
      isLoading?: boolean;
      onFilterChange?: (filters: any) => void;
      onResetFilters?: () => void;
      courierTypes?: { id: string | number; name: string }[];
      shopCategories?: { id: string | number; name: string }[];
      shops?: { id: string | number; name: string; category_id?: string | number }[];
}

const StatsFilterPanel: React.FC<StatsFilterPanelProps> = ({
      selectedDimension,
      isLoading = false,
      onFilterChange,
      onResetFilters,
      courierTypes = [],
      shopCategories = [],
      shops = []
}) => {
      const { t } = useTranslation('stats'); // 使用'stats'命名空间
      const [isExpanded, setIsExpanded] = useState(true);
      const [courierTypeFilter, setCourierTypeFilter] = useState<string[]>([]);
      const [categoryFilter, setCategoryFilter] = useState<string[]>([]);
      const [shopFilter, setShopFilter] = useState<string[]>([]);

      const toggleExpanded = () => {
            setIsExpanded(!isExpanded);
      };

      // 处理应用筛选按钮点击
      const handleApplyFilter = () => {
            if (onFilterChange) {
                  onFilterChange({
                        courier_ids: courierTypeFilter.length > 0 ? courierTypeFilter : undefined,
                        category_ids: categoryFilter.length > 0 ? categoryFilter : undefined,
                        shop_ids: shopFilter.length > 0 ? shopFilter : undefined
                  });
            }
      };

      // 处理重置按钮点击
      const handleReset = () => {
            setCourierTypeFilter([]);
            setCategoryFilter([]);
            setShopFilter([]);
            if (onResetFilters) {
                  onResetFilters();
            }
      };

      return (
            <Card>
                  <div
                        className="flex items-center justify-between p-4 cursor-pointer border-b"
                        onClick={toggleExpanded}
                  >
                        <div className="flex items-center">
                              <Filter className="h-4 w-4 mr-2" />
                              <h3 className="font-medium">{t('筛选条件')}</h3>
                        </div>
                        <Button variant="ghost" size="sm" onClick={(e) => {
                              e.stopPropagation();
                              toggleExpanded();
                        }}>
                              {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                        </Button>
                  </div>

                  {isExpanded && (
                        <CardContent className="p-4 space-y-4">
                              {isLoading ? (
                                    <div className="flex justify-center items-center py-4">
                                          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                                    </div>
                              ) : (
                                    <>
                                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                                {/* 快递类型筛选器 - 对于所有维度都显示 */}
                                                <div className="space-y-2">
                                                      <label className="text-sm font-medium">{t('快递类型')}</label>
                                                      <MultiSelect
                                                            value={courierTypeFilter}
                                                            onChange={setCourierTypeFilter}
                                                            placeholder={t('选择快递类型')}
                                                      >
                                                            {courierTypes.length === 0 ? (
                                                                  // 使用示例数据
                                                                  <>
                                                                        <MultiSelectItem value="1">顺丰速运</MultiSelectItem>
                                                                        <MultiSelectItem value="2">中通快递</MultiSelectItem>
                                                                        <MultiSelectItem value="3">圆通速递</MultiSelectItem>
                                                                  </>
                                                            ) : (
                                                                  courierTypes.map((type) => (
                                                                        <MultiSelectItem key={type.id} value={type.id.toString()}>
                                                                              {type.name}
                                                                        </MultiSelectItem>
                                                                  ))
                                                            )}
                                                      </MultiSelect>
                                                </div>

                                                {/* 店铺类别筛选器 - 对于按店铺或按快递类型维度显示 */}
                                                {(selectedDimension === 'shop' || selectedDimension === 'courier') && (
                                                      <div className="space-y-2">
                                                            <label className="text-sm font-medium">{t('店铺类别')}</label>
                                                            <MultiSelect
                                                                  value={categoryFilter}
                                                                  onChange={setCategoryFilter}
                                                                  placeholder={t('选择店铺类别')}
                                                            >
                                                                  {shopCategories.length === 0 ? (
                                                                        // 使用示例数据
                                                                        <>
                                                                              <MultiSelectItem value="1">电商平台</MultiSelectItem>
                                                                              <MultiSelectItem value="2">实体门店</MultiSelectItem>
                                                                              <MultiSelectItem value="3">海外专营店</MultiSelectItem>
                                                                        </>
                                                                  ) : (
                                                                        shopCategories.map((category) => (
                                                                              <MultiSelectItem key={category.id} value={category.id.toString()}>
                                                                                    {category.name}
                                                                              </MultiSelectItem>
                                                                        ))
                                                                  )}
                                                            </MultiSelect>
                                                      </div>
                                                )}

                                                {/* 店铺筛选器 - 对于按快递类型维度显示 */}
                                                {selectedDimension === 'courier' && (
                                                      <div className="space-y-2">
                                                            <label className="text-sm font-medium">{t('店铺')}</label>
                                                            <MultiSelect
                                                                  value={shopFilter}
                                                                  onChange={setShopFilter}
                                                                  placeholder={t('选择店铺')}
                                                            >
                                                                  {shops.length === 0 ? (
                                                                        // 使用示例数据
                                                                        <>
                                                                              <MultiSelectItem value="1">东京旗舰店</MultiSelectItem>
                                                                              <MultiSelectItem value="2">大阪分店</MultiSelectItem>
                                                                              <MultiSelectItem value="3">名古屋分店</MultiSelectItem>
                                                                        </>
                                                                  ) : (
                                                                        shops.map((shop) => (
                                                                              <MultiSelectItem key={shop.id} value={shop.id.toString()}>
                                                                                    {shop.name}
                                                                              </MultiSelectItem>
                                                                        ))
                                                                  )}
                                                            </MultiSelect>
                                                      </div>
                                                )}
                                          </div>

                                          <div className="flex justify-end space-x-2">
                                                <Button variant="outline" size="sm" onClick={handleReset}>{t('重置')}</Button>
                                                <Button size="sm" onClick={handleApplyFilter}>{t('应用筛选')}</Button>
                                          </div>
                                    </>
                              )}
                        </CardContent>
                  )}
            </Card>
      );
};

export default StatsFilterPanel; 