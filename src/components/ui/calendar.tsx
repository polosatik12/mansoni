import * as React from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { DayPicker } from "react-day-picker";

import { cn } from "@/lib/utils";
import { buttonVariants } from "@/components/ui/button";

export type CalendarProps = React.ComponentProps<typeof DayPicker>;

function Calendar({ className, classNames, showOutsideDays = true, ...props }: CalendarProps) {
  return (
    <DayPicker
      showOutsideDays={showOutsideDays}
      className={cn(
        "p-3 pointer-events-auto",
        "bg-black/30 backdrop-blur-xl",
        "border border-white/20",
        "rounded-2xl",
        "shadow-lg shadow-black/20",
        "text-white",
        className
      )}
      classNames={{
        months: "flex flex-col sm:flex-row space-y-4 sm:space-x-4 sm:space-y-0",
        month: "space-y-4",
        caption: "flex justify-center pt-1 relative items-center",
        caption_label: "text-sm font-medium text-white",
        nav: "space-x-1 flex items-center",
        nav_button: cn(
          "h-7 w-7 p-0 inline-flex items-center justify-center rounded-md",
          "bg-white/10 border border-white/15 text-white/70",
          "hover:bg-white/20 hover:text-white transition-colors",
        ),
        nav_button_previous: "absolute left-1",
        nav_button_next: "absolute right-1",
        table: "w-full border-collapse space-y-1",
        head_row: "flex",
        head_cell: "text-white/50 rounded-md w-9 font-normal text-[0.8rem]",
        row: "flex w-full mt-2",
        cell: cn(
          "h-9 w-9 text-center text-sm p-0 relative",
          "[&:has([aria-selected].day-range-end)]:rounded-r-md",
          "[&:has([aria-selected])]:bg-white/10",
          "first:[&:has([aria-selected])]:rounded-l-md last:[&:has([aria-selected])]:rounded-r-md",
          "focus-within:relative focus-within:z-20",
        ),
        day: cn(
          "h-9 w-9 p-0 font-normal inline-flex items-center justify-center rounded-md",
          "text-white/80 hover:bg-white/15 hover:text-white transition-colors",
          "aria-selected:opacity-100",
        ),
        day_range_end: "day-range-end",
        day_selected:
          "bg-white/25 text-white border border-white/30 hover:bg-white/30 hover:text-white focus:bg-white/25 focus:text-white",
        day_today: "bg-white/10 text-white font-semibold border border-white/20",
        day_outside:
          "day-outside text-white/25 aria-selected:bg-white/5 aria-selected:text-white/30",
        day_disabled: "text-white/20",
        day_range_middle: "aria-selected:bg-white/10 aria-selected:text-white/80",
        day_hidden: "invisible",
        ...classNames,
      }}
      components={{
        IconLeft: ({ ..._props }) => <ChevronLeft className="h-4 w-4" />,
        IconRight: ({ ..._props }) => <ChevronRight className="h-4 w-4" />,
      }}
      {...props}
    />
  );
}
Calendar.displayName = "Calendar";

export { Calendar };
