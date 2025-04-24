import { cn } from "@/lib/utils"

interface LoadingSpinnerProps {
  size?: "sm" | "md" | "lg"
  className?: string
  text?: string
}

export function LoadingSpinner({ size = "md", className, text }: LoadingSpinnerProps) {
  const sizeClasses = {
    sm: "h-4 w-4",
    md: "h-8 w-8",
    lg: "h-12 w-12",
  }

  return (
    <div className={cn("flex flex-col items-center justify-center", className)}>
      <div className="relative">
        <div className={cn("rounded-full border-2 border-blue-100", sizeClasses[size])}></div>
        <div
          className={cn(
            "absolute top-0 left-0 rounded-full border-2 border-transparent border-t-blue-600 animate-spin",
            sizeClasses[size],
          )}
        ></div>
      </div>
      {text && <div className="mt-2 text-sm text-blue-600 font-medium">{text}</div>}
    </div>
  )
}
