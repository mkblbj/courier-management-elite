'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Monitor, Tablet, Smartphone, X, Play, RotateCcw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import type { NotificationStyle, GradientConfig } from '@/types/admin'

interface NotificationPreviewProps {
      title: string
      content: string
      style: NotificationStyle
      mediaUrls?: string[]
      links?: Array<{ text: string; url: string }>
      className?: string
}

type DeviceType = 'desktop' | 'tablet' | 'mobile'

const deviceSizes = {
      desktop: { width: '100%', maxWidth: '400px' },
      tablet: { width: '320px', maxWidth: '320px' },
      mobile: { width: '280px', maxWidth: '280px' },
}

const deviceIcons = {
      desktop: Monitor,
      tablet: Tablet,
      mobile: Smartphone,
}

// 动画变体
const animationVariants = {
      slideInDown: {
            initial: { y: -100, opacity: 0 },
            animate: { y: 0, opacity: 1 },
            exit: { y: -100, opacity: 0 },
      },
      slideInUp: {
            initial: { y: 100, opacity: 0 },
            animate: { y: 0, opacity: 1 },
            exit: { y: 100, opacity: 0 },
      },
      slideInLeft: {
            initial: { x: -100, opacity: 0 },
            animate: { x: 0, opacity: 1 },
            exit: { x: -100, opacity: 0 },
      },
      slideInRight: {
            initial: { x: 100, opacity: 0 },
            animate: { x: 0, opacity: 1 },
            exit: { x: 100, opacity: 0 },
      },
      scaleIn: {
            initial: { scale: 0, opacity: 0 },
            animate: { scale: 1, opacity: 1 },
            exit: { scale: 0, opacity: 0 },
      },
      expandFromCenter: {
            initial: { scale: 0, opacity: 0, rotateY: 90 },
            animate: { scale: 1, opacity: 1, rotateY: 0 },
            exit: { scale: 0, opacity: 0, rotateY: 90 },
      },
      glitchIn: {
            initial: {
                  x: [0, -5, 5, -5, 5, 0],
                  opacity: 0,
                  filter: 'hue-rotate(0deg)',
            },
            animate: {
                  x: 0,
                  opacity: 1,
                  filter: 'hue-rotate(360deg)',
                  transition: {
                        x: { duration: 0.2, times: [0, 0.2, 0.4, 0.6, 0.8, 1] },
                        opacity: { duration: 0.3 },
                        filter: { duration: 0.8 },
                  }
            },
            exit: {
                  x: [0, 5, -5, 5, -5, 0],
                  opacity: 0,
                  transition: { duration: 0.3 }
            },
      },
      bounceIn: {
            initial: { scale: 0, opacity: 0 },
            animate: {
                  scale: [0, 1.2, 0.9, 1.1, 1],
                  opacity: 1,
                  transition: {
                        scale: { duration: 0.6, times: [0, 0.3, 0.5, 0.8, 1] },
                        opacity: { duration: 0.3 }
                  }
            },
            exit: { scale: 0, opacity: 0 },
      },
}

// 生成背景样式
const generateBackgroundStyle = (background: string | GradientConfig) => {
      if (typeof background === 'string') {
            return { backgroundColor: background }
      }

      const { type, direction, colors } = background
      const colorStops = colors.map(c => `${c.color} ${c.stop}%`).join(', ')

      if (type === 'linear') {
            return { background: `linear-gradient(${direction || '135deg'}, ${colorStops})` }
      } else {
            return { background: `radial-gradient(circle, ${colorStops})` }
      }
}

// 生成阴影样式
const generateShadowStyle = (shadow: any) => {
      return {
            boxShadow: `${shadow.x}px ${shadow.y}px ${shadow.blur}px ${shadow.spread}px ${shadow.color}`
      }
}

// 生成边框样式
const generateBorderStyle = (border: any) => {
      return {
            border: `${border.width}px ${border.style} ${border.color}`
      }
}

// 生成内边距样式
const generatePaddingStyle = (padding: any) => {
      return {
            padding: `${padding.top}px ${padding.right}px ${padding.bottom}px ${padding.left}px`
      }
}

// 生成文字样式
const generateTypographyStyle = (typography: any) => {
      return {
            fontFamily: typography.fontFamily,
            fontSize: `${typography.fontSize}px`,
            fontWeight: typography.fontWeight,
            lineHeight: typography.lineHeight,
            color: typography.color,
            textAlign: typography.textAlign,
      }
}

export default function NotificationPreview({
      title,
      content,
      style,
      mediaUrls = [],
      links = [],
      className = '',
}: NotificationPreviewProps) {
      const [deviceType, setDeviceType] = useState<DeviceType>('desktop')
      const [isVisible, setIsVisible] = useState(false)
      const [animationKey, setAnimationKey] = useState(0)

      const playAnimation = () => {
            setIsVisible(false)
            setTimeout(() => {
                  setAnimationKey(prev => prev + 1)
                  setIsVisible(true)
            }, 100)
      }

      useEffect(() => {
            setIsVisible(true)
      }, [])

      const notificationStyle = {
            ...generateBackgroundStyle(style.config.background),
            ...generateShadowStyle(style.config.shadow),
            ...generateBorderStyle(style.config.border),
            ...generatePaddingStyle(style.config.padding),
            borderRadius: `${style.config.borderRadius}px`,
            ...generateTypographyStyle(style.config.typography),
            ...(style.config.effects.backdrop && {
                  backdropFilter: style.config.effects.backdrop,
            }),
            ...(style.config.effects.glow && style.config.effects.neon && {
                  filter: `drop-shadow(0 0 10px ${style.config.effects.neon})`,
            }),
            position: 'relative' as const,
            overflow: 'hidden' as const,
      }

      const animationType = style.config.animation.type
      const animationDuration = style.config.animation.duration

      return (
            <div className={`space-y-4 ${className}`}>
                  {/* 设备切换和控制按钮 */}
                  <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                              {Object.entries(deviceIcons).map(([device, Icon]) => (
                                    <Button
                                          key={device}
                                          variant={deviceType === device ? 'default' : 'outline'}
                                          size="sm"
                                          onClick={() => setDeviceType(device as DeviceType)}
                                          className="flex items-center space-x-1"
                                    >
                                          <Icon className="h-4 w-4" />
                                          <span className="capitalize">{device}</span>
                                    </Button>
                              ))}
                        </div>

                        <div className="flex items-center space-x-2">
                              <Badge variant="secondary" className="text-xs">
                                    {style.name}
                              </Badge>
                              <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={playAnimation}
                                    className="flex items-center space-x-1"
                              >
                                    <Play className="h-3 w-3" />
                                    <span>重播</span>
                              </Button>
                        </div>
                  </div>

                  {/* 预览容器 */}
                  <Card className="p-6 bg-gradient-to-br from-gray-50 to-gray-100 min-h-[400px] flex items-center justify-center">
                        <div
                              className="relative flex items-center justify-center"
                              style={deviceSizes[deviceType]}
                        >
                              <AnimatePresence mode="wait">
                                    {isVisible && (
                                          <motion.div
                                                key={animationKey}
                                                className="w-full"
                                                variants={animationVariants[animationType]}
                                                initial="initial"
                                                animate="animate"
                                                exit="exit"
                                                transition={{
                                                      duration: animationDuration,
                                                      ease: style.config.animation.easing || 'easeOut'
                                                }}
                                          >
                                                <div style={notificationStyle} className="relative">
                                                      {/* 科技风格的霓虹效果 */}
                                                      {style.config.effects.glow && style.config.effects.neon && (
                                                            <div
                                                                  className="absolute inset-0 rounded-inherit opacity-20"
                                                                  style={{
                                                                        background: style.config.effects.neon,
                                                                        filter: 'blur(8px)',
                                                                        borderRadius: `${style.config.borderRadius}px`,
                                                                  }}
                                                            />
                                                      )}

                                                      {/* 通知内容 */}
                                                      <div className="relative z-10">
                                                            {/* 标题 */}
                                                            <h3
                                                                  className="font-semibold mb-2"
                                                                  style={{
                                                                        fontSize: `${style.config.typography.fontSize + 2}px`,
                                                                        fontWeight: style.config.typography.fontWeight + 100,
                                                                  }}
                                                            >
                                                                  {title}
                                                            </h3>

                                                            {/* 内容 */}
                                                            <div
                                                                  className="prose prose-sm max-w-none"
                                                                  dangerouslySetInnerHTML={{ __html: content }}
                                                            />

                                                            {/* 媒体文件 */}
                                                            {mediaUrls.length > 0 && (
                                                                  <div className="mt-3 space-y-2">
                                                                        {mediaUrls.map((url, index) => (
                                                                              <img
                                                                                    key={index}
                                                                                    src={url}
                                                                                    alt={`Media ${index + 1}`}
                                                                                    className="max-w-full h-auto rounded"
                                                                                    style={{ maxHeight: '120px' }}
                                                                              />
                                                                        ))}
                                                                  </div>
                                                            )}

                                                            {/* 链接按钮 */}
                                                            {links.length > 0 && (
                                                                  <div className="mt-4 flex flex-wrap gap-2">
                                                                        {links.map((link, index) => (
                                                                              <button
                                                                                    key={index}
                                                                                    className="px-3 py-1 text-xs rounded transition-colors"
                                                                                    style={{
                                                                                          backgroundColor: style.config.effects.neon || '#3b82f6',
                                                                                          color: '#ffffff',
                                                                                    }}
                                                                              >
                                                                                    {link.text}
                                                                              </button>
                                                                        ))}
                                                                  </div>
                                                            )}
                                                      </div>

                                                      {/* 关闭按钮 */}
                                                      <button
                                                            className="absolute top-2 right-2 p-1 rounded-full hover:bg-black hover:bg-opacity-10 transition-colors"
                                                            style={{ color: style.config.typography.color }}
                                                      >
                                                            <X className="h-4 w-4" />
                                                      </button>
                                                </div>
                                          </motion.div>
                                    )}
                              </AnimatePresence>
                        </div>
                  </Card>

                  {/* 动画信息 */}
                  <div className="text-xs text-gray-500 text-center">
                        动画类型: {animationType} | 持续时间: {animationDuration}s | 设备: {deviceType}
                  </div>
            </div>
      )
} 