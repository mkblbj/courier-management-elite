import React, { useState, useRef, useEffect } from 'react';
import {
      Command,
      CommandEmpty,
      CommandGroup,
      CommandInput,
      CommandItem,
      CommandList
} from '@/components/ui/command';
import {
      Popover,
      PopoverContent,
      PopoverTrigger
} from '@/components/ui/popover';
import { Check, ChevronsUpDown, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

export interface MultiSelectItemProps {
      value: string;
      children: React.ReactNode;
}

export interface MultiSelectProps {
      value: string[];
      onChange: (value: string[]) => void;
      placeholder?: string;
      className?: string;
      children: React.ReactNode;
}

export const MultiSelectItem: React.FC<MultiSelectItemProps> = ({ value, children }) => {
      return <>{children}</>;
};

MultiSelectItem.displayName = "MultiSelectItem";

export const MultiSelect = React.forwardRef<HTMLButtonElement, MultiSelectProps>(
      ({ value, onChange, placeholder = '选择选项', className, children }, ref) => {
            const [open, setOpen] = useState(false);
            const containerRef = useRef<HTMLDivElement>(null);
            const [childrenOptions, setChildrenOptions] = useState<React.ReactElement<MultiSelectItemProps>[]>([]);

            // 提取和处理子元素
            useEffect(() => {
                  const options = React.Children.toArray(children)
                        .filter((child): child is React.ReactElement<MultiSelectItemProps> =>
                              React.isValidElement(child) &&
                              child.type === MultiSelectItem
                        );

                  setChildrenOptions(options as React.ReactElement<MultiSelectItemProps>[]);
            }, [children]);

            // 获取选中项的名称
            const getSelectedItemsText = () => {
                  if (!value.length) return placeholder;

                  return value.map((val) => {
                        const option = childrenOptions.find(option => option.props.value === val);
                        return option ? option.props.children : val;
                  }).join(', ');
            };

            // 移除选项
            const removeValue = (val: string, e: React.MouseEvent) => {
                  e.stopPropagation();
                  onChange(value.filter((v) => v !== val));
            };

            return (
                  <Popover open={open} onOpenChange={setOpen}>
                        <PopoverTrigger asChild>
                              <Button
                                    ref={ref}
                                    variant="outline"
                                    role="combobox"
                                    aria-expanded={open}
                                    className={cn('min-h-10 w-full justify-between', className)}
                              >
                                    <div className="flex flex-wrap gap-1 w-full">
                                          {value.length === 0 ? (
                                                <span className="text-muted-foreground">{placeholder}</span>
                                          ) : (
                                                value.map((val) => {
                                                      const option = childrenOptions.find(option => option.props.value === val);
                                                      const label = option ? option.props.children : val;

                                                      return (
                                                            <Badge key={val} variant="secondary" className="mr-1">
                                                                  {label}
                                                                  <button
                                                                        className="ml-1 ring-offset-background rounded-full outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                                                                        onMouseDown={(e) => e.preventDefault()}
                                                                        onClick={(e) => removeValue(val, e)}
                                                                  >
                                                                        <X className="h-3 w-3 text-muted-foreground hover:text-foreground" />
                                                                  </button>
                                                            </Badge>
                                                      );
                                                })
                                          )}
                                    </div>
                                    <ChevronsUpDown className="h-4 w-4 shrink-0 opacity-50" />
                              </Button>
                        </PopoverTrigger>
                        <PopoverContent className="p-0 w-full min-w-[200px]" ref={containerRef}>
                              <Command>
                                    <CommandInput placeholder="搜索选项..." />
                                    <CommandList>
                                          <CommandEmpty>无匹配选项</CommandEmpty>
                                          <CommandGroup>
                                                {childrenOptions.map((option) => {
                                                      const isSelected = value.includes(option.props.value);

                                                      return (
                                                            <CommandItem
                                                                  key={option.props.value}
                                                                  onSelect={() => {
                                                                        if (isSelected) {
                                                                              onChange(value.filter(v => v !== option.props.value));
                                                                        } else {
                                                                              onChange([...value, option.props.value]);
                                                                        }
                                                                  }}
                                                            >
                                                                  <Check
                                                                        className={cn(
                                                                              "mr-2 h-4 w-4",
                                                                              isSelected ? "opacity-100" : "opacity-0"
                                                                        )}
                                                                  />
                                                                  {option.props.children}
                                                            </CommandItem>
                                                      );
                                                })}
                                          </CommandGroup>
                                    </CommandList>
                              </Command>
                        </PopoverContent>
                  </Popover>
            );
      }
);

MultiSelect.displayName = "MultiSelect"; 