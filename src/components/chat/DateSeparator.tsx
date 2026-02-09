import { format, isToday, isYesterday } from "date-fns";
import { ru } from "date-fns/locale";

interface DateSeparatorProps {
  date: string;
}

export function formatDateSeparator(dateStr: string): string {
  try {
    const date = new Date(dateStr);
    if (isToday(date)) return "Сегодня";
    if (isYesterday(date)) return "Вчера";
    return format(date, "d MMMM yyyy", { locale: ru });
  } catch {
    return "";
  }
}

/** Returns true if a date separator should be shown before this message */
export function shouldShowDateSeparator(
  currentDate: string,
  previousDate: string | undefined
): boolean {
  if (!previousDate) return true;
  try {
    const current = new Date(currentDate).toDateString();
    const previous = new Date(previousDate).toDateString();
    return current !== previous;
  } catch {
    return false;
  }
}

export function DateSeparator({ date }: DateSeparatorProps) {
  const label = formatDateSeparator(date);
  if (!label) return null;

  return (
    <div className="flex items-center justify-center py-2">
      <span className="px-3 py-1 rounded-full bg-white/10 backdrop-blur-xl text-[11px] font-medium text-white/60">
        {label}
      </span>
    </div>
  );
}
