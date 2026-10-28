import { Injectable } from '@angular/core';
import dayjs from 'dayjs';
import { WeekendDay } from '../../features/schoolManagement/hodilday/models/holiday.enums';
import { Holiday, ValidationResult, WeekendConfig } from '../../features/schoolManagement/hodilday/models/holiday.model';
import { VALIDATION_LIMITS, VALIDATION_MESSAGES } from '../../features/schoolManagement/hodilday/models/holiday.constants';

/**
 * Pure, stateless business-rule validation for the Holiday Calendar Master module.
 * No HTTP/UI concerns here — only rule evaluation, so it can be unit tested in isolation.
 */
@Injectable({
  providedIn: 'root'
})
export class HolidayValidationService {

  /**
   * Runs every business rule against the candidate holiday and returns a map of
   * control-name -> error message (empty map == valid).
   */
  validateHoliday(candidate: Holiday, existingHolidays: Holiday[], weekendConfig: WeekendConfig): ValidationResult {
    const errors: { [key: string]: string } = {};

    if (!candidate.holidayName?.trim()) {
      errors['holidayName'] = VALIDATION_MESSAGES.required('Holiday Name');
    } else if (candidate.holidayName.length > VALIDATION_LIMITS.holidayNameMax) {
      errors['holidayName'] = VALIDATION_MESSAGES.maxLength('Holiday Name', VALIDATION_LIMITS.holidayNameMax);
    }

    if (!candidate.holidayType) {
      errors['holidayType'] = VALIDATION_MESSAGES.required('Holiday Type');
    }

    if (!candidate.academicSessionId) {
      errors['academicSessionId'] = VALIDATION_MESSAGES.required('Academic Session');
    }

    if (!candidate.holidayDate || !dayjs(candidate.holidayDate).isValid()) {
      errors['holidayDate'] = VALIDATION_MESSAGES.invalidDate;
    }

    if (candidate.holidayCode && candidate.holidayCode.length > VALIDATION_LIMITS.holidayCodeMax) {
      errors['holidayCode'] = VALIDATION_MESSAGES.maxLength('Holiday Code', VALIDATION_LIMITS.holidayCodeMax);
    }

    if (candidate.description && candidate.description.length > VALIDATION_LIMITS.descriptionMax) {
      errors['description'] = VALIDATION_MESSAGES.maxLength('Description', VALIDATION_LIMITS.descriptionMax);
    }

    if (!candidate.applicabilityTypes || candidate.applicabilityTypes.length === 0) {
      errors['applicabilityTypes'] = VALIDATION_MESSAGES.applicableToRequired;
    }

    if (candidate.applicableFrom && candidate.applicableTo) {
      if (!this.isDateRangeValid(candidate.applicableFrom, candidate.applicableTo)) {
        errors['applicableTo'] = VALIDATION_MESSAGES.dateRange;
      }
    }

    // Only evaluate cross-record rules once the base fields are valid.
    if (!errors['holidayDate'] && !errors['holidayType']) {
      if (this.isDuplicateDate(candidate, existingHolidays)) {
        errors['holidayDate'] = VALIDATION_MESSAGES.duplicateDate;
      }
    }

    if (!errors['holidayName'] && !errors['academicSessionId']) {
      if (this.isDuplicateName(candidate, existingHolidays)) {
        errors['holidayName'] = VALIDATION_MESSAGES.duplicateName;
      }
    }

    if (!errors['applicableFrom'] && !errors['applicableTo'] && candidate.applicableFrom && candidate.applicableTo) {
      if (this.isOverlapping(candidate, existingHolidays)) {
        errors['applicableFrom'] = VALIDATION_MESSAGES.overlap;
      }
    }

    return { isValid: Object.keys(errors).length === 0, errors };
  }

  isDateRangeValid(applicableFrom: string, applicableTo: string): boolean {
    if (!applicableFrom || !applicableTo) {
      return true;
    }
    return !dayjs(applicableFrom).isAfter(dayjs(applicableTo));
  }

  /** Same Holiday Type cannot repeat on the same date (excluding the record being edited). */
  isDuplicateDate(candidate: Holiday, existingHolidays: Holiday[]): boolean {
    return existingHolidays.some(h =>
      h.holidayId !== candidate.holidayId &&
      h.holidayType === candidate.holidayType &&
      h.holidayDate === candidate.holidayDate
    );
  }

  /** Holiday Name must be unique within the same Academic Session. */
  isDuplicateName(candidate: Holiday, existingHolidays: Holiday[]): boolean {
    const name = candidate.holidayName?.trim().toLowerCase();
    return existingHolidays.some(h =>
      h.holidayId !== candidate.holidayId &&
      h.academicSessionId === candidate.academicSessionId &&
      h.holidayName?.trim().toLowerCase() === name
    );
  }

  /** Two holidays of the same category cannot have overlapping date ranges. */
  isOverlapping(candidate: Holiday, existingHolidays: Holiday[]): boolean {
    const from = dayjs(candidate.applicableFrom);
    const to = dayjs(candidate.applicableTo);
    return existingHolidays.some(h => {
      if (h.holidayId === candidate.holidayId || h.holidayCategory !== candidate.holidayCategory) {
        return false;
      }
      const existingFrom = dayjs(h.applicableFrom);
      const existingTo = dayjs(h.applicableTo);
      return from.isBefore(existingTo.add(1, 'day')) && existingFrom.isBefore(to.add(1, 'day'));
    });
  }

  /** Non-blocking warning check — a chosen date sits on a configured weekend. */
  fallsOnWeekend(date: string, weekendConfig: WeekendConfig): boolean {
    if (!date || !weekendConfig) {
      return false;
    }
    const d = dayjs(date);
    const dow = d.day(); // 0 = Sunday ... 6 = Saturday

    if (weekendConfig.sunday && dow === 0) {
      return true;
    }
    if (weekendConfig.saturday && dow === 6) {
      return true;
    }
    if (dow === 6 && (weekendConfig.secondSaturday || weekendConfig.fourthSaturday)) {
      const nth = Math.ceil(d.date() / 7);
      if (weekendConfig.secondSaturday && nth === 2) {
        return true;
      }
      if (weekendConfig.fourthSaturday && nth === 4) {
        return true;
      }
    }
    if (weekendConfig.customDates?.includes(d.format('YYYY-MM-DD'))) {
      return true;
    }
    return false;
  }

  /** Warn (non-blocking) if an identical active holiday already exists. */
  alreadyExists(candidate: Holiday, existingHolidays: Holiday[]): boolean {
    return this.isDuplicateDate(candidate, existingHolidays) || this.isDuplicateName(candidate, existingHolidays);
  }

  /** Inclusive day-count between Applicable From/To — auto-populated on the form. */
  calculateNumberOfDays(applicableFrom: string, applicableTo: string): number {
    if (!applicableFrom || !applicableTo) {
      return 1;
    }
    const diff = dayjs(applicableTo).diff(dayjs(applicableFrom), 'day');
    return diff >= 0 ? diff + 1 : 1;
  }
}
