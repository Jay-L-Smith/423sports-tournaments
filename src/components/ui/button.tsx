import { cva, type VariantProps } from "class-variance-authority";
import { type ButtonHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex min-h-11 items-center justify-center gap-2 rounded-lg px-5 text-sm font-bold uppercase tracking-[0.08em] transition-[color,background-color,border-color,box-shadow,transform] duration-150 disabled:pointer-events-none disabled:opacity-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary active:scale-[0.98]",
  {
    variants: {
      variant: {
        default:
          "rounded-full bg-primary text-primary-fg shadow-none hover:bg-primary/90",
        pine: "rounded-full bg-primary text-primary-fg shadow-none hover:bg-primary/90",
        outline:
          "rounded-full border border-line bg-white text-fg hover:bg-fg/5",
        ghost: "text-fg hover:bg-fg/5",
        danger: "rounded-full border border-line bg-white text-fg hover:bg-warn-bg",
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
