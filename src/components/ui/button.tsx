import { cva, type VariantProps } from "class-variance-authority";
import { type ButtonHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex min-h-11 items-center justify-center gap-2 rounded-lg px-5 text-sm font-bold uppercase tracking-[0.08em] transition-[color,background-color,border-color,box-shadow,transform] duration-150 disabled:pointer-events-none disabled:opacity-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary active:scale-[0.98]",
  {
    variants: {
      variant: {
        default:
          "bg-primary text-primary-fg shadow-[0_0_16px_rgb(238_184_47_/_0.28)] hover:bg-primary/90",
        pine: "bg-primary text-primary-fg shadow-[0_0_16px_rgb(238_184_47_/_0.28)] hover:bg-primary/90",
        outline:
          "border-2 border-fg bg-transparent text-fg shadow-[0_0_10px_rgb(247_242_242_/_0.22)] hover:bg-fg hover:text-bg",
        ghost: "text-fg hover:bg-fg/10",
        danger: "border-2 border-fg bg-transparent text-fg hover:bg-fg hover:text-bg",
      },
      size: {
        default: "min-h-11",
        lg: "min-h-14 px-7 text-base",
        sm: "min-h-9 px-3 text-xs",
      },
    },
    defaultVariants: { variant: "default", size: "default" },
  },
);

export function Button({
  className,
  variant,
  size,
  type = "button",
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & VariantProps<typeof buttonVariants>) {
  return (
    <button
      type={type}
      className={cn(buttonVariants({ variant, size }), className)}
      {...props}
    />
  );
}
