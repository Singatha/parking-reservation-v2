import * as DropdownMenuPrimitive from "@radix-ui/react-dropdown-menu";
import { Check, ChevronRight } from "lucide-react";
import { cn } from "../../lib/utils.js";

export const DropdownMenu = DropdownMenuPrimitive.Root;
export const DropdownMenuTrigger = DropdownMenuPrimitive.Trigger;
export const DropdownMenuPortal = DropdownMenuPrimitive.Portal;
export const DropdownMenuSub = DropdownMenuPrimitive.Sub;

export function DropdownMenuContent({ className, sideOffset = 8, ...props }) {
  return (
    <DropdownMenuPrimitive.Portal>
      <DropdownMenuPrimitive.Content
        sideOffset={sideOffset}
        className={cn("z-50 min-w-56 overflow-hidden rounded-lg border border-neutral-200 bg-white p-1.5 text-neutral-950 shadow-xl dark:border-neutral-800 dark:bg-neutral-950 dark:text-white", className)}
        {...props}
      />
    </DropdownMenuPrimitive.Portal>
  );
}

export function DropdownMenuItem({ className, inset, ...props }) {
  return (
    <DropdownMenuPrimitive.Item
      className={cn("flex cursor-default select-none items-center gap-2 rounded-md px-2.5 py-2 text-sm outline-none transition focus:bg-neutral-100 data-[disabled]:pointer-events-none data-[disabled]:opacity-50 dark:focus:bg-neutral-900", inset && "pl-8", className)}
      {...props}
    />
  );
}

export function DropdownMenuLabel({ className, ...props }) {
  return <DropdownMenuPrimitive.Label className={cn("px-2.5 py-2 text-xs font-medium text-neutral-500", className)} {...props} />;
}

export function DropdownMenuSeparator({ className, ...props }) {
  return <DropdownMenuPrimitive.Separator className={cn("-mx-1 my-1 h-px bg-neutral-200 dark:bg-neutral-800", className)} {...props} />;
}

export function DropdownMenuSubTrigger({ children, className, ...props }) {
  return (
    <DropdownMenuPrimitive.SubTrigger className={cn("flex cursor-default items-center gap-2 rounded-md px-2.5 py-2 text-sm outline-none focus:bg-neutral-100 data-[state=open]:bg-neutral-100 dark:focus:bg-neutral-900 dark:data-[state=open]:bg-neutral-900", className)} {...props}>
      {children}<ChevronRight className="ml-auto size-4" />
    </DropdownMenuPrimitive.SubTrigger>
  );
}

export function DropdownMenuSubContent({ className, ...props }) {
  return (
    <DropdownMenuPrimitive.Portal>
      <DropdownMenuPrimitive.SubContent className={cn("z-50 min-w-40 rounded-lg border border-neutral-200 bg-white p-1.5 shadow-xl dark:border-neutral-800 dark:bg-neutral-950", className)} {...props} />
    </DropdownMenuPrimitive.Portal>
  );
}

export function DropdownMenuRadioGroup(props) {
  return <DropdownMenuPrimitive.RadioGroup {...props} />;
}

export function DropdownMenuRadioItem({ children, className, ...props }) {
  return (
    <DropdownMenuPrimitive.RadioItem className={cn("relative flex cursor-default items-center rounded-md py-2 pl-8 pr-2.5 text-sm outline-none focus:bg-neutral-100 dark:focus:bg-neutral-900", className)} {...props}>
      <span className="absolute left-2.5"><DropdownMenuPrimitive.ItemIndicator><Check className="size-4" /></DropdownMenuPrimitive.ItemIndicator></span>
      {children}
    </DropdownMenuPrimitive.RadioItem>
  );
}
