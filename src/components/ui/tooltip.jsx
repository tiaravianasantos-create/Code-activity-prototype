import * as TooltipPrimitive from "@radix-ui/react-tooltip";

const TooltipProvider = TooltipPrimitive.Provider;
const Tooltip = TooltipPrimitive.Root;
const TooltipTrigger = TooltipPrimitive.Trigger;
function TooltipContent({ className = "", sideOffset = 6, ...props }) {
  return <TooltipPrimitive.Content className={`tooltip-content ${className}`} sideOffset={sideOffset} {...props} />;
}

export { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger };