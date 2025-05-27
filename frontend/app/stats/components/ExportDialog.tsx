import React, { useState } from 'react';
import {
      Dialog,
      DialogContent,
      DialogDescription,
      DialogFooter,
      DialogHeader,
      DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Checkbox } from '@/components/ui/checkbox';
import { Progress } from '@/components/ui/progress';
import { AlertCircle, Download, FileSpreadsheet, FileText, FileImage } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useTranslation } from 'react-i18next';
import type { ExportFormat, ExportOptions } from '@/lib/services/export';

interface ExportDialogProps {
      open: boolean;
      onOpenChange: (open: boolean) => void;
      onExport: (options: ExportOptions) => Promise<void>;
      dateRange?: {
            from: string;
            to: string;
      };
      isExporting?: boolean;
      exportProgress?: number;
      exportError?: string;
}

const ExportDialog: React.FC<ExportDialogProps> = ({
      open,
      onOpenChange,
      onExport,
      dateRange,
      isExporting = false,
      exportProgress = 0,
      exportError,
}) => {
      const { t } = useTranslation('stats');

      const [format, setFormat] = useState<ExportFormat>('excel');
      const [filename, setFilename] = useState('');
      const [includeCharts, setIncludeCharts] = useState(false);

      // 生成默认文件名
      const generateDefaultFilename = (selectedFormat: ExportFormat): string => {
            const now = new Date();
            const timestamp = now.toISOString().slice(0, 10).replace(/-/g, '');

            let name = `订单统计数据_${timestamp}`;

            if (dateRange) {
                  const fromDate = dateRange.from.replace(/-/g, '');
                  const toDate = dateRange.to.replace(/-/g, '');
                  name = `订单统计数据_${fromDate}_${toDate}`;
            }

            const extensions = {
                  excel: '.xlsx',
                  csv: '.csv',
                  pdf: '.pdf'
            };

            return `${name}${extensions[selectedFormat]}`;
      };

      // 当格式改变时更新默认文件名
      React.useEffect(() => {
            if (!filename || filename === generateDefaultFilename(format)) {
                  setFilename(generateDefaultFilename(format));
            }
      }, [format, dateRange]);

      // 重置对话框状态
      React.useEffect(() => {
            if (open) {
                  setFormat('excel');
                  setIncludeCharts(false);
                  setFilename(generateDefaultFilename('excel'));
            }
      }, [open]);

      const handleExport = async () => {
            try {
                  const options: ExportOptions = {
                        format,
                        filename: filename || generateDefaultFilename(format),
                        includeCharts: format === 'pdf' ? includeCharts : false,
                        dateRange,
                  };

                  await onExport(options);
            } catch (error) {
                  console.error('导出失败:', error);
            }
      };

      const getFormatIcon = (formatType: ExportFormat) => {
            switch (formatType) {
                  case 'excel':
                        return <FileSpreadsheet className="h-4 w-4" />;
                  case 'csv':
                        return <FileText className="h-4 w-4" />;
                  case 'pdf':
                        return <FileImage className="h-4 w-4" />;
                  default:
                        return <FileText className="h-4 w-4" />;
            }
      };

      const getFormatDescription = (formatType: ExportFormat) => {
            switch (formatType) {
                  case 'excel':
                        return '适合数据分析和进一步处理';
                  case 'csv':
                        return '通用格式，兼容性好';
                  case 'pdf':
                        return '适合打印和分享报告';
                  default:
                        return '';
            }
      };

      return (
            <Dialog open={open} onOpenChange={onOpenChange}>
                  <DialogContent className="sm:max-w-[500px]">
                        <DialogHeader>
                              <DialogTitle className="flex items-center gap-2">
                                    <Download className="h-5 w-5" />
                                    {t('导出数据')}
                              </DialogTitle>
                              <DialogDescription>
                                    选择导出格式和选项，将当前统计数据导出为文件。
                              </DialogDescription>
                        </DialogHeader>

                        <div className="space-y-6">
                              {/* 导出格式选择 */}
                              <div className="space-y-3">
                                    <Label className="text-sm font-medium">{t('导出格式')}</Label>
                                    <RadioGroup value={format} onValueChange={(value) => setFormat(value as ExportFormat)}>
                                          <div className="space-y-2">
                                                <div className="flex items-center space-x-3 p-3 border rounded-lg hover:bg-gray-50">
                                                      <RadioGroupItem value="excel" id="excel" />
                                                      <div className="flex items-center gap-2 flex-1">
                                                            {getFormatIcon('excel')}
                                                            <div>
                                                                  <Label htmlFor="excel" className="font-medium">Excel (.xlsx)</Label>
                                                                  <p className="text-sm text-gray-500">{getFormatDescription('excel')}</p>
                                                            </div>
                                                      </div>
                                                </div>

                                                <div className="flex items-center space-x-3 p-3 border rounded-lg hover:bg-gray-50">
                                                      <RadioGroupItem value="csv" id="csv" />
                                                      <div className="flex items-center gap-2 flex-1">
                                                            {getFormatIcon('csv')}
                                                            <div>
                                                                  <Label htmlFor="csv" className="font-medium">CSV (.csv)</Label>
                                                                  <p className="text-sm text-gray-500">{getFormatDescription('csv')}</p>
                                                            </div>
                                                      </div>
                                                </div>

                                                <div className="flex items-center space-x-3 p-3 border rounded-lg hover:bg-gray-50">
                                                      <RadioGroupItem value="pdf" id="pdf" />
                                                      <div className="flex items-center gap-2 flex-1">
                                                            {getFormatIcon('pdf')}
                                                            <div>
                                                                  <Label htmlFor="pdf" className="font-medium">PDF (.pdf)</Label>
                                                                  <p className="text-sm text-gray-500">{getFormatDescription('pdf')}</p>
                                                            </div>
                                                      </div>
                                                </div>
                                          </div>
                                    </RadioGroup>
                              </div>

                              {/* PDF特有选项 */}
                              {format === 'pdf' && (
                                    <div className="space-y-3">
                                          <Label className="text-sm font-medium">PDF选项</Label>
                                          <div className="flex items-center space-x-2">
                                                <Checkbox
                                                      id="includeCharts"
                                                      checked={includeCharts}
                                                      onCheckedChange={(checked) => setIncludeCharts(checked as boolean)}
                                                />
                                                <Label htmlFor="includeCharts" className="text-sm">
                                                      包含图表（如果有）
                                                </Label>
                                          </div>
                                    </div>
                              )}

                              {/* 文件名输入 */}
                              <div className="space-y-2">
                                    <Label htmlFor="filename" className="text-sm font-medium">
                                          {t('文件名')}
                                    </Label>
                                    <Input
                                          id="filename"
                                          value={filename}
                                          onChange={(e) => setFilename(e.target.value)}
                                          placeholder={generateDefaultFilename(format)}
                                    />
                              </div>

                              {/* 数据范围信息 */}
                              {dateRange && (
                                    <div className="p-3 bg-blue-50 rounded-lg">
                                          <div className="text-sm">
                                                <span className="font-medium">数据范围：</span>
                                                <span className="text-blue-700">
                                                      {dateRange.from} 至 {dateRange.to}
                                                </span>
                                          </div>
                                    </div>
                              )}

                              {/* 导出进度 */}
                              {isExporting && (
                                    <div className="space-y-2">
                                          <div className="flex items-center justify-between text-sm">
                                                <span>导出进度</span>
                                                <span>{exportProgress}%</span>
                                          </div>
                                          <Progress value={exportProgress} className="w-full" />
                                    </div>
                              )}

                              {/* 错误信息 */}
                              {exportError && (
                                    <Alert variant="destructive">
                                          <AlertCircle className="h-4 w-4" />
                                          <AlertDescription>{exportError}</AlertDescription>
                                    </Alert>
                              )}
                        </div>

                        <DialogFooter>
                              <Button
                                    variant="outline"
                                    onClick={() => onOpenChange(false)}
                                    disabled={isExporting}
                              >
                                    {t('取消')}
                              </Button>
                              <Button
                                    onClick={handleExport}
                                    disabled={isExporting || !filename.trim()}
                              >
                                    {isExporting ? (
                                          <>
                                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                                                导出中...
                                          </>
                                    ) : (
                                          <>
                                                <Download className="h-4 w-4 mr-2" />
                                                {t('导出')}
                                          </>
                                    )}
                              </Button>
                        </DialogFooter>
                  </DialogContent>
            </Dialog>
      );
};

export default ExportDialog; 