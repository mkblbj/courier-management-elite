import type React from "react"

/**
 * 高亮文本中匹配的部分
 * @param text 原始文本
 * @param query 搜索查询
 * @param className 高亮部分的CSS类名
 * @returns 包含高亮部分的React元素
 */
export function highlightText(
  text: string,
  query: string,
  className = "bg-yellow-200 dark:bg-yellow-800 rounded px-0.5",
): React.ReactNode {
  if (!query || !text) return text

  try {
    // 转义正则表达式特殊字符
    const escapedQuery = query.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
    const regex = new RegExp(`(${escapedQuery})`, "gi")
    const parts = text.split(regex)

    if (parts.length <= 1) return text

    return (
      <>
        {parts.map((part, i) => {
          // 检查当前部分是否匹配查询（不区分大小写）
          const isMatch = part.toLowerCase() === query.toLowerCase()
          return isMatch ? (
            <span key={i} className={className}>
              {part}
            </span>
          ) : (
            part
          )
        })}
      </>
    )
  } catch (error) {
    // 如果正则���达式出错，返回原始文本
    console.error("Highlight text error:", error)
    return text
  }
}
