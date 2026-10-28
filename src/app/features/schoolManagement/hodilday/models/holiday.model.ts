import { ApplicableToType, CalendarViewType, HolidayCategory, HolidayStatus, HolidayType, WeekendDay } from './holiday.enums';

/**
 * Core Holiday domain model — mirrors the REST API payload contract.
 * `null`/`''` defaults keep the model directly bindable to a Template Driven Form.
 */
export interface Holiday {
  holidayId: string | null;
  holidayCode: string;
  holidayName: string;
  holidayType: HolidayType | '';
  holidayCategory: HolidayCategory | '';
  holidayDate: string;          // ISO yyyy-MM-dd
  applicableFrom: string;       // ISO yyyy-MM-dd
  applicableTo: string;         // ISO yyyy-MM-dd
  academicSessionId: string;
  schoolId: string;
  stateId: string;
  districtId: string;
  applicabilityTypes: ApplicableToType[]; // "Apply To" selection(s)
  schoolIds: string[];
  classIds: string[];
  sectionIds: string[];
  studentIds: string[];
  teacherIds: string[];
  staffIds: string[];
  description: string;
  colorCode: string;
  status: HolidayStatus;
  remarks: string;
  isRecurringYearly: boolean;
  isHalfDay: boolean;
  createdBy: string;
  createdDate: string;
  lastModified: string;
  /** Derived client-side, inclusive day count between applicableFrom/applicableTo. */
  numberOfDays: number;
}

export function createEmptyHoliday(): Holiday {
  return {
    holidayId: null,
    holidayCode: '',
    holidayName: '',
    holidayType: '',
    holidayCategory: '',
    holidayDate: '',
    applicableFrom: '',
    applicableTo: '',
    academicSessionId: '',
    schoolId: '',
    stateId: '',
    districtId: '',
    applicabilityTypes: [],
    schoolIds: [],
    classIds: [],
    sectionIds: [],
    studentIds: [],
    teacherIds: [],
    staffIds: [],
    description: '',
    colorCode: '',
    status: HolidayStatus.Active,
    remarks: '',
    isRecurringYearly: false,
    isHalfDay: false,
    createdBy: '',
    createdDate: '',
    lastModified: '',
    numberOfDays: 1
  };
}

export interface AcademicSession {
  id: string;
  name: string;
  startDate: string;
  endDate: string;
}

export interface LookupOption {
  id: string;
  name: string;
}

export interface WeekendConfig {
  sunday: boolean;
  saturday: boolean;
  secondSaturday: boolean;
  fourthSaturday: boolean;
  customDays: WeekendDay[];
  customDates: string[]; // ad-hoc custom weekend dates (ISO)
}

export function createDefaultWeekendConfig(): WeekendConfig {
  return {
    sunday: true,
    saturday: false,
    secondSaturday: true,
    fourthSaturday: true,
    customDays: [],
    customDates: []
  };
}

export interface HolidaySummary {
  academicSession: string;
  totalHolidays: number;
  nationalHolidays: number;
  schoolHolidays: number;
  optionalHolidays: number;
  upcomingHolidays: number;
  workingDays: number;
  weekends: number;
}

export interface CalendarDay {
  date: string;        // ISO yyyy-MM-dd
  dayOfMonth: number;
  isCurrentMonth: boolean;
  isToday: boolean;
  isWeekend: boolean;
  holidays: Holiday[];
}

export interface HolidayFilter {
  searchText: string;
  holidayType: HolidayType | '';
  schoolId: string;
  academicSessionId: string;
  status: HolidayStatus | '';
  fromDate: string;
  toDate: string;
}

export function createEmptyFilter(): HolidayFilter {
  return {
    searchText: '',
    holidayType: '',
    schoolId: '',
    academicSessionId: '',
    status: '',
    fromDate: '',
    toDate: ''
  };
}

export interface ImportSummary {
  totalRecords: number;
  successCount: number;
  failedCount: number;
  duplicateHolidays: number;
  invalidDates: number;
  duplicateNames: number;
  errors: string[];
}

export interface ValidationResult {
  isValid: boolean;
  /** control-name -> error message, used to highlight invalid controls & show inline errors. */
  errors: { [controlName: string]: string };
}

export interface CalendarState {
  viewType: CalendarViewType;
  year: number;
  month: number; // 0-11
}
