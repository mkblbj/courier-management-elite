'use client'

import { useState, useCallback } from 'react'
import { useDropzone } from 'react-dropzone'
import { motion, AnimatePresence } from 'framer-motion'
import {
      Upload,
      X,
      File,
      Image,
      Video,
      FileText,
      CheckCircle,
      AlertCircle,
      Loader2,
      Trash2
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import { uploadApi } from '@/services/admin'
import type { UploadResult } from '@/types/admin'

interface FileUploaderProps {
      accept?: string[]
      maxSize?: number // bytes
      multiple?: boolean
      onUpload?: (files: UploadResult[]) => void
      onDelete?: (fileId: string) => void
      className?: string
      disabled?: boolean
}

interface FileWithPreview extends File {
      preview?: string
      id?: string
      uploadProgress?: number
      uploadStatus?: 'pending' | 'uploading' | 'success' | 'error'
      uploadResult?: UploadResult
      error?: string
}

const getFileIcon = (type: string) => {
      if (type.startsWith('image/')) return Image
      if (type.startsWith('video/')) return Video
      if (type.includes('text')) return FileText
      return File
}

const formatFileSize = (bytes: number) => {
      if (bytes === 0) return '0 Bytes'
      const k = 1024
      const sizes = ['Bytes', 'KB', 'MB', 'GB']
      const i = Math.floor(Math.log(bytes) / Math.log(k))
      return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

export default function FileUploader({
      accept = ['image/*', 'video/*'],
      maxSize = 10 * 1024 * 1024, // 10MB
      multiple = true,
      onUpload,
      onDelete,
      className = '',
      disabled = false,
}: FileUploaderProps) {
      const [files, setFiles] = useState<FileWithPreview[]>([])
      const [isDragActive, setIsDragActive] = useState(false)

      const onDrop = useCallback((acceptedFiles: File[], rejectedFiles: any[]) => {
            // 处理被拒绝的文件
            if (rejectedFiles.length > 0) {
                  console.warn('Rejected files:', rejectedFiles)
            }

            // 处理接受的文件
            const newFiles: FileWithPreview[] = acceptedFiles.map(file => {
                  const fileWithPreview = Object.assign(file, {
                        preview: file.type.startsWith('image/') ? URL.createObjectURL(file) : undefined,
                        id: Math.random().toString(36).substr(2, 9),
                        uploadProgress: 0,
                        uploadStatus: 'pending' as const,
                  })
                  return fileWithPreview
            })

            setFiles(prev => multiple ? [...prev, ...newFiles] : newFiles)

            // 自动开始上传
            newFiles.forEach(uploadFile)
      }, [multiple])

      const { getRootProps, getInputProps, isDragActive: dropzoneIsDragActive } = useDropzone({
            onDrop,
            accept: accept.reduce((acc, type) => ({ ...acc, [type]: [] }), {}),
            maxSize,
            multiple,
            disabled,
            onDragEnter: () => setIsDragActive(true),
            onDragLeave: () => setIsDragActive(false),
      })

      const uploadFile = async (file: FileWithPreview) => {
            try {
                  // 更新状态为上传中
                  setFiles(prev => prev.map(f =>
                        f.id === file.id
                              ? { ...f, uploadStatus: 'uploading', uploadProgress: 0 }
                              : f
                  ))

                  // 模拟上传进度
                  const progressInterval = setInterval(() => {
                        setFiles(prev => prev.map(f => {
                              if (f.id === file.id && f.uploadProgress !== undefined && f.uploadProgress < 90) {
                                    return { ...f, uploadProgress: f.uploadProgress + 10 }
                              }
                              return f
                        }))
                  }, 200)

                  // 实际上传
                  const result = await uploadApi.uploadFile(file)

                  clearInterval(progressInterval)

                  // 更新状态为成功
                  setFiles(prev => prev.map(f =>
                        f.id === file.id
                              ? {
                                    ...f,
                                    uploadStatus: 'success',
                                    uploadProgress: 100,
                                    uploadResult: result.data
                              }
                              : f
                  ))

                  // 调用回调
                  if (onUpload) {
                        onUpload([result.data])
                  }

            } catch (error) {
                  console.error('Upload failed:', error)

                  // 更新状态为失败
                  setFiles(prev => prev.map(f =>
                        f.id === file.id
                              ? {
                                    ...f,
                                    uploadStatus: 'error',
                                    error: error instanceof Error ? error.message : '上传失败'
                              }
                              : f
                  ))
            }
      }

      const removeFile = (fileId: string) => {
            const file = files.find(f => f.id === fileId)

            // 清理预览URL
            if (file?.preview) {
                  URL.revokeObjectURL(file.preview)
            }

            // 如果文件已上传成功，调用删除回调
            if (file?.uploadResult && onDelete) {
                  onDelete(file.uploadResult.id?.toString() || '')
            }

            setFiles(prev => prev.filter(f => f.id !== fileId))
      }

      const retryUpload = (fileId: string) => {
            const file = files.find(f => f.id === fileId)
            if (file) {
                  uploadFile(file)
            }
      }

      const clearAll = () => {
            files.forEach(file => {
                  if (file.preview) {
                        URL.revokeObjectURL(file.preview)
                  }
            })
            setFiles([])
      }

      return (
            <div className={`space-y-4 ${className}`}>
                  {/* 拖拽上传区域 */}
                  <Card
                        {...getRootProps()}
                        className={`
          border-2 border-dashed transition-all duration-200 cursor-pointer
          ${isDragActive || dropzoneIsDragActive
                                    ? 'border-blue-500 bg-blue-50'
                                    : 'border-gray-300 hover:border-gray-400'
                              }
          ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
        `}
                  >
                        <input {...getInputProps()} />
                        <div className="p-8 text-center">
                              <motion.div
                                    animate={{
                                          scale: isDragActive || dropzoneIsDragActive ? 1.1 : 1,
                                          rotate: isDragActive || dropzoneIsDragActive ? 5 : 0,
                                    }}
                                    transition={{ duration: 0.2 }}
                              >
                                    <Upload className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                              </motion.div>

                              <h3 className="text-lg font-medium text-gray-900 mb-2">
                                    {isDragActive || dropzoneIsDragActive ? '释放文件以上传' : '拖拽文件到此处'}
                              </h3>

                              <p className="text-sm text-gray-600 mb-4">
                                    或者 <span className="text-blue-600 font-medium">点击选择文件</span>
                              </p>

                              <div className="text-xs text-gray-500 space-y-1">
                                    <p>支持格式: {accept.join(', ')}</p>
                                    <p>最大文件大小: {formatFileSize(maxSize)}</p>
                                    {multiple && <p>支持多文件上传</p>}
                              </div>
                        </div>
                  </Card>

                  {/* 文件列表 */}
                  {files.length > 0 && (
                        <Card className="p-4">
                              <div className="flex items-center justify-between mb-4">
                                    <h4 className="font-medium text-gray-900">
                                          已选择文件 ({files.length})
                                    </h4>
                                    <Button
                                          variant="outline"
                                          size="sm"
                                          onClick={clearAll}
                                          className="text-red-600 hover:text-red-700"
                                    >
                                          <Trash2 className="h-4 w-4 mr-1" />
                                          清空
                                    </Button>
                              </div>

                              <div className="space-y-3">
                                    <AnimatePresence>
                                          {files.map((file) => {
                                                const FileIcon = getFileIcon(file.type)

                                                return (
                                                      <motion.div
                                                            key={file.id}
                                                            initial={{ opacity: 0, y: 20 }}
                                                            animate={{ opacity: 1, y: 0 }}
                                                            exit={{ opacity: 0, y: -20 }}
                                                            className="flex items-center space-x-3 p-3 border border-gray-200 rounded-lg"
                                                      >
                                                            {/* 文件预览/图标 */}
                                                            <div className="flex-shrink-0">
                                                                  {file.preview ? (
                                                                        <img
                                                                              src={file.preview}
                                                                              alt={file.name}
                                                                              className="h-12 w-12 object-cover rounded"
                                                                        />
                                                                  ) : (
                                                                        <div className="h-12 w-12 bg-gray-100 rounded flex items-center justify-center">
                                                                              <FileIcon className="h-6 w-6 text-gray-400" />
                                                                        </div>
                                                                  )}
                                                            </div>

                                                            {/* 文件信息 */}
                                                            <div className="flex-1 min-w-0">
                                                                  <p className="text-sm font-medium text-gray-900 truncate">
                                                                        {file.name}
                                                                  </p>
                                                                  <p className="text-xs text-gray-500">
                                                                        {formatFileSize(file.size)}
                                                                  </p>

                                                                  {/* 上传进度 */}
                                                                  {file.uploadStatus === 'uploading' && (
                                                                        <div className="mt-2">
                                                                              <Progress value={file.uploadProgress} className="h-1" />
                                                                              <p className="text-xs text-gray-500 mt-1">
                                                                                    上传中... {file.uploadProgress}%
                                                                              </p>
                                                                        </div>
                                                                  )}

                                                                  {/* 错误信息 */}
                                                                  {file.uploadStatus === 'error' && (
                                                                        <p className="text-xs text-red-600 mt-1">
                                                                              {file.error}
                                                                        </p>
                                                                  )}
                                                            </div>

                                                            {/* 状态和操作 */}
                                                            <div className="flex items-center space-x-2">
                                                                  {file.uploadStatus === 'pending' && (
                                                                        <Badge variant="secondary">等待上传</Badge>
                                                                  )}

                                                                  {file.uploadStatus === 'uploading' && (
                                                                        <Loader2 className="h-4 w-4 text-blue-600 animate-spin" />
                                                                  )}

                                                                  {file.uploadStatus === 'success' && (
                                                                        <CheckCircle className="h-4 w-4 text-green-600" />
                                                                  )}

                                                                  {file.uploadStatus === 'error' && (
                                                                        <div className="flex items-center space-x-1">
                                                                              <AlertCircle className="h-4 w-4 text-red-600" />
                                                                              <Button
                                                                                    variant="ghost"
                                                                                    size="sm"
                                                                                    onClick={() => retryUpload(file.id!)}
                                                                                    className="text-xs"
                                                                              >
                                                                                    重试
                                                                              </Button>
                                                                        </div>
                                                                  )}

                                                                  <Button
                                                                        variant="ghost"
                                                                        size="sm"
                                                                        onClick={() => removeFile(file.id!)}
                                                                        className="text-red-600 hover:text-red-700"
                                                                  >
                                                                        <X className="h-4 w-4" />
                                                                  </Button>
                                                            </div>
                                                      </motion.div>
                                                )
                                          })}
                                    </AnimatePresence>
                              </div>
                        </Card>
                  )}
            </div>
      )
} 