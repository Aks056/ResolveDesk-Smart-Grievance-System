
import * as React from "react"
import { X } from "lucide-react"
import { cn } from "@/lib/utils"

const SheetContext = React.createContext(null)

function Sheet({ open, onOpenChange, children }) {
  return (
    <SheetContext.Provider value={{ open, onOpenChange }}>
      {children}
    </SheetContext.Provider>
  )
}

function SheetTrigger({ asChild, children, onClick, ...props }) {
  const context = React.useContext(SheetContext)
  const child = React.Children.only(children)
  return React.cloneElement(child, {
    onClick: (e) => {
      onClick?.(e);
      child.props.onClick?.(e);
      context?.onOpenChange?.(true);
    },
    ...props
  })
}

function SheetPortal({ children }) {
  return <>{children}</>
}

const SheetOverlay = React.forwardRef(({ className, ...props }, ref) => {
  const context = React.useContext(SheetContext)
  if (!context?.open) return null
  return (
    <div
      ref={ref}
      className={cn(
        "fixed inset-0 z-50 bg-black/60 backdrop-blur-sm transition-opacity duration-300 ease-in-out",
        className
      )}
      onClick={() => context?.onOpenChange?.(false)}
      {...props}
    />
  )
})
SheetOverlay.displayName = "SheetOverlay"

const SheetContent = React.forwardRef(({ side = "right", className, children, ...props }, ref) => {
  const context = React.useContext(SheetContext)
  if (!context?.open) return null
  return (
    <>
      <SheetOverlay />
      <div
        ref={ref}
        role="dialog"
        aria-modal="true"
        className={cn(
          "fixed z-50 bg-card p-6 shadow-2xl border-l border-border/40 transition-transform duration-300 ease-in-out",
          side === "right" && "inset-y-0 right-0 h-full w-full sm:max-w-md translate-x-0",
          className
        )}
        {...props}
      >
        {children}
        <button
          type="button"
          onClick={() => context?.onOpenChange?.(false)}
          className="absolute right-4 top-4 rounded-xl p-1.5 opacity-70 hover:opacity-100 hover:bg-muted focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 transition-all"
        >
          <X className="h-4 w-4" />
          <span className="sr-only">Close</span>
        </button>
      </div>
    </>
  )
})
SheetContent.displayName = "SheetContent"

const SheetHeader = ({ className, ...props }) => (
  <div
    className={cn("flex flex-col space-y-2 text-left pb-4 border-b border-border/40", className)}
    {...props}
  />
)
SheetHeader.displayName = "SheetHeader"

const SheetFooter = ({ className, ...props }) => (
  <div
    className={cn("flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2 pt-4 border-t border-border/40 mt-auto", className)}
    {...props}
  />
)
SheetFooter.displayName = "SheetFooter"

const SheetTitle = React.forwardRef(({ className, ...props }, ref) => (
  <h2
    ref={ref}
    className={cn("text-lg font-black tracking-tight text-foreground", className)}
    {...props}
  />
))
SheetTitle.displayName = "SheetTitle"

const SheetDescription = React.forwardRef(({ className, ...props }, ref) => (
  <p
    ref={ref}
    className={cn("text-sm text-muted-foreground font-medium leading-relaxed", className)}
    {...props}
  />
))
SheetDescription.displayName = "SheetDescription"

export {
  Sheet,
  SheetPortal,
  SheetTrigger,
  SheetOverlay,
  SheetContent,
  SheetHeader,
  SheetFooter,
  SheetTitle,
  SheetDescription,
}
