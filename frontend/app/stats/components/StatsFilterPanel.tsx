import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ChevronDown, ChevronUp, Filter } from 'lucide-react';
import type { StatsDimension } from './ShopOutputStats';

interface StatsFilterPanelProps {
      selectedDimension: StatsDimension;
}

const StatsFilterPanel: React.FC<StatsFilterPanelProps> = ({ selectedDimension }) => {
      const [isExpanded, setIsExpanded] = useState(true);

      const toggleExpanded = () => {
            setIsExpanded(!isExpanded);
      };

      return (
            <Card>
                  <div
                        className="flex items-center justify-between p-4 cursor-pointer border-b"
                        onClick={toggleExpanded}
                  >
                        <div className="flex items-center">
                              <Filter className="h-4 w-4 mr-2" />
                              <h3 className="font-medium">筛选条件</h3>
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
                              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                    {/* 店铺类别筛选器 */}
                                    {(selectedDimension === 'shop' || selectedDimension === 'courier' || selectedDimension === 'date') && (
                                          <div className="space-y-2">
                                                <label className="text-sm font-medium">店铺类别</label>
                                                <Select>
                                                      <SelectTrigger>
                                                            <SelectValue placeholder="选择店铺类别" />
                                                      </SelectTrigger>
                                                      <SelectContent>
                                                            <SelectItem value="all">全部类别</SelectItem>
                                                            <SelectItem value="1">电商平台</SelectItem>
                                                            <SelectItem value="2">实体门店</SelectItem>
                                                      </SelectContent>
                                                </Select>
                                          </div>
                                    )}

                                    {/* 店铺筛选器 */}
                                    {(selectedDimension === 'courier' || selectedDimension === 'date') && (
                                          <div className="space-y-2">
                                                <label className="text-sm font-medium">店铺</label>
                                                <Select>
                                                      <SelectTrigger>
                                                            <SelectValue placeholder="选择店铺" />
                                                      </SelectTrigger>
                                                      <SelectContent>
                                                            <SelectItem value="all">全部店铺</SelectItem>
                                                            <SelectItem value="1">东京旗舰店</SelectItem>
                                                            <SelectItem value="2">大阪分店</SelectItem>
                                                      </SelectContent>
                                                </Select>
                                          </div>
                                    )}

                                    {/* 快递类型筛选器 */}
                                    {selectedDimension === 'date' && (
                                          <div className="space-y-2">
                                                <label className="text-sm font-medium">快递类型</label>
                                                <Select>
                                                      <SelectTrigger>
                                                            <SelectValue placeholder="选择快递类型" />
                                                      </SelectTrigger>
                                                      <SelectContent>
                                                            <SelectItem value="all">全部类型</SelectItem>
                                                            <SelectItem value="1">顺丰速运</SelectItem>
                                                            <SelectItem value="2">中通快递</SelectItem>
                                                      </SelectContent>
                                                </Select>
                                          </div>
                                    )}
                              </div>

                              <div className="flex justify-end space-x-2">
                                    <Button variant="outline" size="sm">重置</Button>
                                    <Button size="sm">应用筛选</Button>
                              </div>
                        </CardContent>
                  )}
            </Card>
      );
};

export default StatsFilterPanel; 