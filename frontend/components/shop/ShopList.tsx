import React, { useState, useEffect } from 'react';
import { useTranslation } from "react-i18next";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";
import { Shop } from "@/lib/types/shop";

interface ShopListProps {
  shops: Shop[];
  onToggleActive?: (id: number, active: boolean) => void;
  onEdit?: (shop: Shop) => void;
  onDelete?: (id: number) => void;
  onSort?: () => void;
  loading?: boolean;
}

export const ShopList: React.FC<ShopListProps> = ({
  shops = [],
  onToggleActive,
  onEdit,
  onDelete,
  onSort,
  loading = false,
}) => {
  const { t } = useTranslation(['common', 'shop']);
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredShops, setFilteredShops] = useState<Shop[]>(shops);

  useEffect(() => {
    setFilteredShops(
      shops.filter(shop => 
        shop.name.toLowerCase().includes(searchTerm.toLowerCase())
      )
    );
  }, [shops, searchTerm]);

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div className="relative w-64">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder={t('shop:search_shop')}
            className="pl-8"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <Button variant="outline" onClick={onSort}>
          {t('shop:sort_shops')}
        </Button>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t('shop:shop_name')}</TableHead>
              <TableHead>{t('shop:status')}</TableHead>
              <TableHead>{t('shop:sort_order')}</TableHead>
              <TableHead>{t('shop:remark')}</TableHead>
              <TableHead className="text-right">{t('common:actions')}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-10">
                  {t('common:loading')}
                </TableCell>
              </TableRow>
            ) : filteredShops.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-10">
                  {t('shop:no_shops_found')}
                </TableCell>
              </TableRow>
            ) : (
              filteredShops.map((shop) => (
                <TableRow key={shop.id}>
                  <TableCell className="font-medium">{shop.name}</TableCell>
                  <TableCell>
                    <Switch
                      checked={!!shop.is_active}
                      onCheckedChange={(checked) => onToggleActive?.(shop.id, checked)}
                    />
                  </TableCell>
                  <TableCell>{shop.sort_order}</TableCell>
                  <TableCell>{shop.remark}</TableCell>
                  <TableCell className="text-right space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onEdit?.(shop)}
                    >
                      {t('common:edit')}
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => onDelete?.(shop.id)}
                    >
                      {t('common:delete')}
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};

export default ShopList; 