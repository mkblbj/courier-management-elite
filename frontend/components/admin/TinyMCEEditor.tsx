'use client'

import { useRef } from 'react'
import { Editor } from '@tinymce/tinymce-react'
import { Label } from '@/components/ui/label'

interface TinyMCEEditorProps {
      value: string
      onChange: (content: string) => void
      label?: string
      placeholder?: string
      height?: number
      disabled?: boolean
      className?: string
}

export default function TinyMCEEditor({
      value,
      onChange,
      label,
      placeholder = '输入内容...',
      height = 300,
      disabled = false,
      className = '',
}: TinyMCEEditorProps) {
      const editorRef = useRef<any>(null)

      const handleEditorChange = (content: string) => {
            onChange(content)
      }

      return (
            <div className={className}>
                  {label && (
                        <Label className="block mb-2">{label}</Label>
                  )}

                  <div className="border border-gray-300 rounded-md overflow-hidden">
                        <Editor
                              apiKey={process.env.NEXT_PUBLIC_TINYMCE_API_KEY || undefined}
                              onInit={(evt, editor) => editorRef.current = editor}
                              value={value}
                              onEditorChange={handleEditorChange}
                              disabled={disabled}
                              init={{
                                    height,
                                    menubar: false,
                                    plugins: [
                                          'advlist', 'autolink', 'lists', 'link', 'image', 'charmap',
                                          'anchor', 'searchreplace', 'visualblocks', 'code', 'fullscreen',
                                          'insertdatetime', 'media', 'table', 'preview', 'help', 'wordcount',
                                          'emoticons', 'template', 'codesample'
                                    ],
                                    toolbar: 'undo redo | blocks | ' +
                                          'bold italic forecolor backcolor | alignleft aligncenter ' +
                                          'alignright alignjustify | bullist numlist outdent indent | ' +
                                          'removeformat | link image media | emoticons | code | help',
                                    content_style: `
                                          body { 
                                                font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, "Noto Sans", sans-serif; 
                                                font-size: 14px; 
                                                line-height: 1.6;
                                                color: #374151;
                                          }
                                          p { margin: 0 0 1em 0; }
                                          h1, h2, h3, h4, h5, h6 { margin: 0 0 0.5em 0; }
                                          ul, ol { margin: 0 0 1em 1.5em; }
                                          blockquote { 
                                                margin: 1em 0; 
                                                padding: 0.5em 1em; 
                                                border-left: 4px solid #e5e7eb; 
                                                background: #f9fafb; 
                                          }
                                          code { 
                                                background: #f3f4f6; 
                                                padding: 0.125em 0.25em; 
                                                border-radius: 0.25rem; 
                                                font-family: ui-monospace, SFMono-Regular, "SF Mono", Consolas, "Liberation Mono", Menlo, monospace;
                                          }
                                          pre { 
                                                background: #1f2937; 
                                                color: #f9fafb; 
                                                padding: 1em; 
                                                border-radius: 0.5rem; 
                                                overflow-x: auto;
                                          }
                                          img { max-width: 100%; height: auto; }
                                          table { border-collapse: collapse; width: 100%; }
                                          th, td { border: 1px solid #e5e7eb; padding: 0.5em; text-align: left; }
                                          th { background: #f9fafb; font-weight: 600; }
                                    `,
                                    placeholder,
                                    branding: false,
                                    resize: false,
                                    statusbar: false,
                                    elementpath: false,
                                    skin: 'oxide',
                                    content_css: 'default',
                                    directionality: 'ltr',
                                    language: 'zh_CN',
                                    // 自定义颜色选择器
                                    color_map: [
                                          '#000000', '黑色',
                                          '#434343', '深灰色',
                                          '#666666', '灰色',
                                          '#999999', '浅灰色',
                                          '#b7b7b7', '更浅灰色',
                                          '#cccccc', '浅色',
                                          '#d9d9d9', '很浅色',
                                          '#efefef', '极浅色',
                                          '#f3f3f3', '接近白色',
                                          '#ffffff', '白色',
                                          '#980000', '深红色',
                                          '#ff0000', '红色',
                                          '#ff9900', '橙色',
                                          '#ffff00', '黄色',
                                          '#00ff00', '绿色',
                                          '#00ffff', '青色',
                                          '#4a86e8', '蓝色',
                                          '#0000ff', '深蓝色',
                                          '#9900ff', '紫色',
                                          '#ff00ff', '品红色',
                                    ],
                                    // 自定义字体大小
                                    fontsize_formats: '8pt 10pt 12pt 14pt 16pt 18pt 24pt 36pt 48pt',
                                    // 自定义字体
                                    font_formats: 'Inter=Inter,sans-serif;Arial=arial,helvetica,sans-serif;Courier New=courier new,courier,monospace;Georgia=georgia,palatino,serif;Helvetica=helvetica,arial,sans-serif;Times New Roman=times new roman,times,serif;Verdana=verdana,geneva,sans-serif',
                                    // 图片上传配置
                                    images_upload_handler: (blobInfo: any, success: any, failure: any) => {
                                          // 这里可以实现图片上传逻辑
                                          // 暂时返回一个占位符
                                          const reader = new FileReader()
                                          reader.onload = () => {
                                                success(reader.result)
                                          }
                                          reader.readAsDataURL(blobInfo.blob())
                                    },
                                    // 自动保存
                                    autosave_ask_before_unload: false,
                                    autosave_interval: '30s',
                                    autosave_prefix: 'tinymce-autosave-{path}{query}-{id}-',
                                    autosave_restore_when_empty: false,
                                    autosave_retention: '2m',
                                    // 链接配置
                                    link_default_target: '_blank',
                                    link_assume_external_targets: true,
                                    // 表格配置
                                    table_default_attributes: {
                                          border: '1'
                                    },
                                    table_default_styles: {
                                          'border-collapse': 'collapse',
                                          'width': '100%'
                                    },
                                    // 代码高亮
                                    codesample_languages: [
                                          { text: 'HTML/XML', value: 'markup' },
                                          { text: 'JavaScript', value: 'javascript' },
                                          { text: 'CSS', value: 'css' },
                                          { text: 'PHP', value: 'php' },
                                          { text: 'Ruby', value: 'ruby' },
                                          { text: 'Python', value: 'python' },
                                          { text: 'Java', value: 'java' },
                                          { text: 'C', value: 'c' },
                                          { text: 'C#', value: 'csharp' },
                                          { text: 'C++', value: 'cpp' }
                                    ],
                                    // 模板配置
                                    templates: [
                                          {
                                                title: '通知模板',
                                                description: '基础通知模板',
                                                content: '<h3>通知标题</h3><p>这里是通知内容...</p><p><strong>重要提醒：</strong>请注意相关事项。</p>'
                                          },
                                          {
                                                title: '促销模板',
                                                description: '促销活动模板',
                                                content: '<h2 style="color: #ff6b35;">🎉 限时优惠</h2><p>活动时间：<strong>即日起至月底</strong></p><ul><li>全场商品8折起</li><li>满额免运费</li><li>新用户专享礼包</li></ul><p style="color: #666;">*活动详情以最终解释权为准</p>'
                                          },
                                          {
                                                title: '系统通知模板',
                                                description: '系统维护通知模板',
                                                content: '<h3>⚠️ 系统维护通知</h3><p>尊敬的用户：</p><p>为了提供更好的服务，我们将在 <strong>今晚22:00-24:00</strong> 进行系统维护。</p><p>维护期间可能影响以下功能：</p><ul><li>用户登录</li><li>数据同步</li><li>在线支付</li></ul><p>给您带来的不便，敬请谅解。</p>'
                                          }
                                    ]
                              }}
                        />
                  </div>

                  <p className="text-xs text-gray-500 mt-2">
                        支持富文本编辑，包括文字格式、链接、图片、表格等功能
                  </p>
            </div>
      )
} 