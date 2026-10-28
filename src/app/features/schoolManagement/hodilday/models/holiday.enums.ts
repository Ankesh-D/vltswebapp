/**
 * Enumerations used across the Holiday Calendar Master module.
 * Kept string-valued so they serialize cleanly in REST payloads and are
 * human-readable in query params / logs.
 */

export enum HolidayType {
  National = 'NATIONAL',
  State = 'STATE',
  School = 'SCHOOL',
  Festival = 'FESTIVAL',
  Optional = 'OPTIONAL',
  Emergency = 'EMERGENCY'
}

export enum HolidayCategory {
  General = 'GENERAL',
  Religious = 'RELIGIOUS',
  Cultural = 'CULTURAL',
  Administrative = 'ADMINISTRATIVE',
  Sports = 'SPORTS'
}

/** "Apply To" audience — multi-selectable. */
export enum ApplicableToType {
  AllSchools = 'ALL_SCHOOLS',
  SelectedSchools = 'SELECTED_SCHOOLS',
  Classes = 'CLASSES',
  Sections = 'SECTIONS',
  Students = 'STUDENTS',
  Teachers = 'TEACHERS',
  Staff = 'STAFF'
}

export enum HolidayStatus {
  Active = 'ACTIVE',
  Inactive = 'INACTIVE'
}

export enum CalendarViewType {
  Month = 'MONTH',
  Year = 'YEAR',
  List = 'LIST',
  Agenda = 'AGENDA'
}

export enum WeekendDay {
  Sunday = 'SUNDAY',
  Saturday = 'SATURDAY',
  SecondSaturday = 'SECOND_SATURDAY',
  FourthSaturday = 'FOURTH_SATURDAY',
  Custom = 'CUSTOM'
}

export enum ImportSourceType {
  Excel = 'EXCEL',
  Csv = 'CSV'
}
