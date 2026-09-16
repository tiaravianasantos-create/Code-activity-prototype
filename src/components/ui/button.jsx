import { cva } from "class-variance-authority";
import { forwardRef } from "react";
import { cn } from "../../lib/utils";

const buttonVariants = cva("button", {
  variants: {
    variant: { default: "button--default", ghost: "button--ghost", outline: "button--outline" },
    size: { default: "button--default-size", icon: "button--icon", compact: "button--compact" },
  },
  defaultVariants: { variant: "default", size: "default" },
});

const Button = forwardRef(({ className, variant, size, type = "button", ...props }, ref) => (
  <button ref={ref} className={cn(buttonVariants({ variant, size }), className)} type={type} {...props} />
));
Button.displayName = "Button";

export { Button, buttonVariants };