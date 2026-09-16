import * as TabsPrimitive from "@radix-ui/react-tabs";
import { cn } from "../../lib/utils";

const Tabs = TabsPrimitive.Root;
function TabsList({ className, ...props }) { return <TabsPrimitive.List className={cn("tabs-list", className)} {...props} />; }
function TabsTrigger({ className, ...props }) { return <TabsPrimitive.Trigger className={cn("tabs-trigger", className)} {...props} />; }

export { Tabs, TabsList, TabsTrigger };