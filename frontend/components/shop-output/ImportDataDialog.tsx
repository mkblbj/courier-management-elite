import { useTranslation } from "react-i18next";
import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle, Upload } from 'lucide-react';
import { importShopOutputs } from '@/lib/api/shop-output';
import { useToast } from '@/components/ui/use-toast';

interface ImportDataDialogProps {
  open: boolean;
  onClose: (refresh?: boolean) => void;
}

export function ImportDataDialog({ open, onClose }: ImportDataDialogProps) {
  const { t } = useTranslation();

  const [file, setFile] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const selectedFile = e.target.files[0];
      // 检查文件类型
      const validTypes = [
        'application/vnd.ms-excel',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'text/csv'
      ];

      if (!validTypes.includes(selectedFile.type)) {
        setError(t("请上传Excel(.xlsx, .xls)或CSV文件"));
        setFile(null);
        return;
      }

      setFile(selectedFile);
      setError(null);
    }
  };

  const handleSubmit = async () => {
    if (!file) {
      setError(t("请选择要上传的文件"));
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const result = await importShopOutputs(file);
      toast({
        title: '导入成功',
        description: `成功导入 ${result.success} 条记录，失败 ${result.failed} 条`,
      });
      onClose(true);
    } catch (error) {
      console.error('导入出力数据失败:', error);
      setError(error instanceof Error ? error.message : '导入失败，请稍后重试');
      toast({
        variant: 'destructive',
        title: '导入失败',
        description: error instanceof Error ? error.message : '请稍后重试',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    (<Dialog open={open} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{t("导入出力数据")}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="file">{t("选择Excel文件")}</Label>
            <Input
              id="file"
              type="file"
              accept=".xlsx, .xls, .csv"
              onChange={handleFileChange}
            />
            <p className="text-sm text-muted-foreground">{t("支持.xlsx、.xls或.csv格式的文件")}</p>
          </div>

          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div className="bg-muted rounded-md p-4">
            <h4 className="text-sm font-medium mb-2">{t("导入文件要求")}</h4>
            <ul className="text-sm text-muted-foreground list-disc pl-4 space-y-1">
              <li>{t("Excel文件必须包含以下列：店铺ID、日期、出力件数、平均时间、最短时间、最长时间、总时间")}</li>
              <li>{t("日期格式应为YYYY-MM-DD")}</li>
              <li>{t("时间单位为分钟")}</li>
              <li>{t("首行应为列标题")}</li>
            </ul>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onClose()} disabled={isSubmitting}>{t("取消")}</Button>
          <Button onClick={handleSubmit} disabled={isSubmitting || !file}>
            {isSubmitting ? (
              <>
                <Upload className="mr-2 h-4 w-4 animate-spin" />{t("导入中...")}</>
            ) : (
              <>
                <Upload className="mr-2 h-4 w-4" />{t("开始导入")}</>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>)
  );
} 