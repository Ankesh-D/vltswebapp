import { ApplicableToType, HolidayCategory, HolidayStatus, HolidayType, WeekendDay } from './holiday.enums';

/** Default color swatch per Holiday Type — drives calendar highlighting & badges. */
export const HOLIDAY_TYPE_COLOR_MAP: Record<HolidayType, string> = {
  [HolidayType.National]: '#e63946',
  [HolidayType.State]: '#8e44ad',
  [HolidayType.School]: '#1d75d0',
  [HolidayType.Festival]: '#f77f00',
  [HolidayType.Optional]: '#2a9d63',
  [HolidayType.Emergency]: '#6c1d1d'
};

export const WEEKEND_COLOR = '#9aa1a9';

export const HOLIDAY_TYPE_OPTIONS: { value: HolidayType; label: string }[] = [
  { value: HolidayType.National, label: 'National Holiday' },
  { value: HolidayType.State, label: 'State Holiday' },
  { value: HolidayType.School, label: 'School Holiday' },
  { value: HolidayType.Festival, label: 'Festival Holiday' },
  { value: HolidayType.Optional, label: 'Optional Holiday' },
  { value: HolidayType.Emergency, label: 'Emergency Holiday' }
];

export const HOLIDAY_CATEGORY_OPTIONS: { value: HolidayCategory; label: string }[] = [
  { value: HolidayCategory.General, label: 'General' },
  { value: HolidayCategory.Religious, label: 'Religious' },
  { value: HolidayCategory.Cultural, label: 'Cultural' },
  { value: HolidayCategory.Administrative, label: 'Administrative' },
  { value: HolidayCategory.Sports, label: 'Sports' }
];

export const APPLICABLE_TO_OPTIONS: { value: ApplicableToType; label: string }[] = [
  { value: ApplicableToType.AllSchools, label: 'All Schools' },
  { value: ApplicableToType.SelectedSchools, label: 'Selected Schools' },
  { value: ApplicableToType.Classes, label: 'Classes' },
  { value: ApplicableToType.Sections, label: 'Sections' },
  { value: ApplicableToType.Students, label: 'Students' },
  { value: ApplicableToType.Teachers, label: 'Teachers' },
  { value: ApplicableToType.Staff, label: 'Staff' }
];

export const HOLIDAY_STATUS_OPTIONS: { value: HolidayStatus; label: string }[] = [
  { value: HolidayStatus.Active, label: 'Active' },
  { value: HolidayStatus.Inactive, label: 'Inactive' }
];

export const WEEKEND_DAY_OPTIONS: { value: WeekendDay; label: string }[] = [
  { value: WeekendDay.Sunday, label: 'Sunday' },
  { value: WeekendDay.Saturday, label: 'Every Saturday' },
  { value: WeekendDay.SecondSaturday, label: '2nd Saturday' },
  { value: WeekendDay.FourthSaturday, label: '4th Saturday' },
  { value: WeekendDay.Custom, label: 'Custom Weekend' }
];

export const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

export const WEEKDAY_NAMES_SHORT = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export const PAGE_SIZE_OPTIONS = [10, 25, 50, 100];

export const VALIDATION_LIMITS = {
  holidayNameMax: 100,
  holidayCodeMax: 20,
  descriptionMax: 500,
  remarksMax: 500
};

export const VALIDATION_MESSAGES = {
  required: (field: string) => `${field} is required.`,
  maxLength: (field: string, max: number) => `${field} cannot exceed ${max} characters.`,
  invalidDate: 'Please enter a valid date.',
  dateRange: 'Applicable From date must be on or before Applicable To date.',
  duplicateDate: 'Another holiday of the same type already exists on this date.',
  duplicateName: 'Holiday name must be unique within the selected Academic Session.',
  overlap: 'This holiday overlaps with another holiday of the same category.',
  weekendConflict: 'This date falls on a configured weekend.',
  applicableToRequired: 'Please select at least one "Apply To" audience.'
};
