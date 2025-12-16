import * as React from "react"
import { cn } from "../../lib/utils"

interface LayoutProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode
}

const Layout = React.forwardRef<HTMLDivElement, LayoutProps>(
  ({ className, children, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          "min-h-screen bg-background font-sans antialiased",
          className
        )}
        {...props}
      >
        <main className="container mx-auto px-4 py-8">
          {children}
        </main>
      </div>
    )
  }
)
Layout.displayName = "Layout"

export { Layout }
