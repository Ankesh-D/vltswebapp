import { Injectable } from '@angular/core';
import dayjs from 'dayjs';
import { HolidayValidationService } from './holiday-validation.service';
import { CalendarDay, Holiday, WeekendConfig } from '../../features/schoolManagement/hodilday/models/holiday.model';
import { HOLIDAY_TYPE_COLOR_MAP, WEEKEND_COLOR } from '../../features/schoolManagement/hodilday/models/holiday.constants';
import { HolidayType } from '../../features/schoolManagement/hodilday/models/holiday.enums';

/**
 * Presentation-agnostic helper functions shared by the Holiday Calendar Master
 * component: calendar grid construction, color resolution and holiday-code
 * generation. Keeping these here avoids duplicating logic across views
 * (Month / Year / List / Agenda).
 */
@Injectable({
  providedIn: 'root'
})
export class HolidayUtilityService {

  constructor(private validationService: HolidayValidationService) {}

  /**
   * Builds a 6x7 month grid (including leading/trailing days from adjacent months)
   * with holidays and weekend flags attached to each day.
   */
  buildMonthCalendar(year: number, month: number, holidays: Holiday[], weekendConfig: WeekendConfig): CalendarDay[] {
    const firstOfMonth = dayjs(new Date(year, month, 1));
    const startOffset = firstOfMonth.day(); // 0 (Sun) - 6 (Sat)
    const gridStart = firstOfMonth.subtract(startOffset, 'day');
    const today = dayjs().format('YYYY-MM-DD');

    const holidaysByDate = new Map<string, Holiday[]>();
    for (const h of holidays) {
      if (!h.holidayDate) {
        continue;
      }
      const key = dayjs(h.holidayDate).format('YYYY-MM-DD');
      const list = holidaysByDate.get(key) ?? [];
      list.push(h);
      holidaysByDate.set(key, list);
    }

    const days: CalendarDay[] = [];
    for (let i = 0; i < 42; i++) {
      const current = gridStart.add(i, 'day');
      const iso = current.format('YYYY-MM-DD');
      days.push({
        date: iso,
        dayOfMonth: current.date(),
        isCurrentMonth: current.month() === month,
        isToday: iso === today,
        isWeekend: this.validationService.fallsOnWeekend(iso, weekendConfig),
        holidays: holidaysByDate.get(iso) ?? []
      });
    }
    return days;
  }

  /** Resolves the highlight color for a calendar day (weekend takes lowest priority). */
  getDayColor(day: CalendarDay): string | null {
    if (day.holidays.length > 0) {
      return this.getColorForType(day.holidays[0].holidayType as HolidayType);
    }
    if (day.isWeekend) {
      return WEEKEND_COLOR;
    }
    return null;
  }

  getColorForType(type: HolidayType | ''): string {
    if (!type) {
      return '#6c757d';
    }
    return HOLIDAY_TYPE_COLOR_MAP[type] ?? '#6c757d';
  }

  /** Generates a readable holiday code, e.g. NAT-2026-0007. */
  generateHolidayCode(type: HolidayType | '', sequence: number, year: number = dayjs().year()): string {
    const prefixMap: Record<string, string> = {
      [HolidayType.National]: 'NAT',
      [HolidayType.State]: 'STA',
      [HolidayType.School]: 'SCH',
      [HolidayType.Festival]: 'FES',
      [HolidayType.Optional]: 'OPT',
      [HolidayType.Emergency]: 'EMR'
    };
    const prefix = type ? (prefixMap[type] ?? 'HOL') : 'HOL';
    return `${prefix}-${year}-${String(sequence).padStart(4, '0')}`;
  }

  /** Finds the first invalid control in a form and scrolls/focuses it for a11y + UX. */
  scrollToFirstInvalidControl(formElement: HTMLElement): void {
    const invalidControl = formElement.querySelector<HTMLElement>('.is-invalid, .ng-invalid');
    if (invalidControl) {
      invalidControl.scrollIntoView({ behavior: 'smooth', block: 'center' });
      invalidControl.focus({ preventScroll: true });
    }
  }

  /** Builds CSV content (opens cleanly in Excel) for a quick client-side export fallback. */
  buildCsv(rows: Record<string, string | number>[]): string {
    if (!rows.length) {
      return '';
    }
    const headers = Object.keys(rows[0]);
    const escape = (value: string | number) => `"${String(value ?? '').replace(/"/g, '""')}"`;
    const lines = [headers.join(',')];
    for (const row of rows) {
      lines.push(headers.map(h => escape(row[h])).join(','));
    }
    return lines.join('\n');
  }
}
