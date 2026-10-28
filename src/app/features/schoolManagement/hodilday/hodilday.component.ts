import { CommonModule } from '@angular/common';
import { Component, ElementRef, HostListener, OnInit, ViewChild, ChangeDetectionStrategy } from '@angular/core';
import { FormsModule, NgForm } from '@angular/forms';
import { NgSelectModule } from '@ng-select/ng-select';
import { NgbPaginationModule } from '@ng-bootstrap/ng-bootstrap';
import dayjs from 'dayjs';

import { CommonDataToolbarComponent } from '../../../shared/components/common-data-toolbar/common-data-toolbar.component';
import { CommonTableColumn, CommonTableComponent } from '../../../shared/components/common-table/common-table.component';
import { ToastService } from '../../../core/services/toast.service';
import { HolidayCalendarService } from '../../../core/services/holiday-calendar.service';
import { HolidayValidationService } from '../../../core/services/holiday-validation.service';
import { HolidayUtilityService } from '../../../core/services/holiday-utility.service';

import {
  AcademicSession,
  CalendarDay,
  createDefaultWeekendConfig,
  createEmptyFilter,
  createEmptyHoliday,
  Holiday,
  HolidayFilter,
  HolidaySummary,
  ImportSummary,
  LookupOption,
  WeekendConfig
} from './models/holiday.model';
import {
  APPLICABLE_TO_OPTIONS,
  HOLIDAY_CATEGORY_OPTIONS,
  HOLIDAY_STATUS_OPTIONS,
  HOLIDAY_TYPE_OPTIONS,
  MONTH_NAMES,
  PAGE_SIZE_OPTIONS,
  VALIDATION_LIMITS,
  WEEKDAY_NAMES_SHORT,
  WEEKEND_DAY_OPTIONS
} from './models/holiday.constants';
import { ApplicableToType, CalendarViewType, HolidayStatus, HolidayType } from './models/holiday.enums';

@Component({
    selector: 'app-holiday-calendar-master',
    imports: [CommonModule, FormsModule, NgSelectModule, NgbPaginationModule, CommonDataToolbarComponent, CommonTableComponent],
    templateUrl: './hodilday.component.html',
    changeDetection: ChangeDetectionStrategy.Eager,
    styleUrl: './hodilday.component.scss'
})
export class HolidayCalendarMasterComponent implements OnInit {

  // ---------------------------------------------------------------------
  // Static lookups (enum-driven dropdown options) — exposed for the template
  // ---------------------------------------------------------------------
  readonly holidayTypeOptions = HOLIDAY_TYPE_OPTIONS;
  readonly holidayCategoryOptions = HOLIDAY_CATEGORY_OPTIONS;
  readonly applicableToOptions = APPLICABLE_TO_OPTIONS;
  readonly holidayStatusOptions = HOLIDAY_STATUS_OPTIONS;
  readonly weekendDayOptions = WEEKEND_DAY_OPTIONS;
  readonly pageSizeOptions = PAGE_SIZE_OPTIONS;
  readonly monthNames = MONTH_NAMES;
  readonly weekdayNames = WEEKDAY_NAMES_SHORT;
  readonly validationLimits = VALIDATION_LIMITS;
  readonly calendarViewType = CalendarViewType;
  readonly holidayStatusEnum = HolidayStatus;

  @ViewChild('holidayForm') holidayForm!: NgForm;
  @ViewChild('formCard') formCardRef!: ElementRef<HTMLElement>;
  @ViewChild('fileInput') fileInputRef!: ElementRef<HTMLInputElement>;

  // ---------------------------------------------------------------------
  // Panel / mode state — detailsToggle mirrors the pattern used by
  // school-master / school-trip-master: true = grid (Details) view,
  // false = form (Add/Edit/View) view. Only one is visible at a time.
  // ---------------------------------------------------------------------
  detailsToggle = true;
  isViewMode = false;
  isEditMode = false;
  isSingleDayHoliday = true;
  loading = false;
  saving = false;
  formSubmitted = false;

  // ---------------------------------------------------------------------
  // Working model
  // ---------------------------------------------------------------------
  holiday: Holiday = createEmptyHoliday();
  fieldErrors: { [key: string]: string } = {};
  weekendWarning = '';
  duplicateWarning = '';

  // ---------------------------------------------------------------------
  // Master / lookup data
  // ---------------------------------------------------------------------
  academicSessions: AcademicSession[] = [];
  schoolList: LookupOption[] = [];

  // ---------------------------------------------------------------------
  // Grid state
  // ---------------------------------------------------------------------
  holidayList: Holiday[] = [];
  readonly tableColumns: CommonTableColumn<Holiday>[] = [
    { key: 'rowNumber', label: '#', width: '30px' },
    { key: 'holidayCode', label: 'Code', sortable: true, visible: () => this.visibleColumns['holidayCode'] },
    { key: 'holidayName', label: 'Holiday Name', sortable: true, visible: () => this.visibleColumns['holidayName'] },
    { key: 'holidayType', label: 'Type', sortable: true, visible: () => this.visibleColumns['holidayType'] },
    { key: 'holidayDate', label: 'Date', sortable: true, visible: () => this.visibleColumns['holidayDate'] },
    { key: 'applicableFrom', label: 'From', visible: () => this.visibleColumns['applicableFrom'] },
    { key: 'applicableTo', label: 'To', visible: () => this.visibleColumns['applicableTo'] },
    { key: 'academicSession', label: 'Academic Session', visible: () => this.visibleColumns['academicSession'] },
    { key: 'applicableSchools', label: 'Applicable Schools', visible: () => this.visibleColumns['applicableSchools'] },
    { key: 'status', label: 'Status', visible: () => this.visibleColumns['status'] },
    { key: 'actions', label: 'Action', width: '150px' }
  ];
  totalCount = 0;
  pageSize = 10;
  currentPage = 1;
  pageCount = 0;
  get holidayTableRows(): any[] {
    return this.loading ? Array.from({ length: 5 }) : this.holidayList.length ? this.holidayList : [null];
  }
  filter: HolidayFilter = createEmptyFilter();
  sortColumn = 'holidayDate';
  sortDirection: 'asc' | 'desc' = 'asc';
  visibleColumns: { [key: string]: boolean } = {
    holidayCode: true,
    holidayName: true,
    holidayType: true,
    holidayDate: true,
    applicableFrom: true,
    applicableTo: true,
    academicSession: true,
    applicableSchools: true,
    status: true
  };
  columnChooserOpen = false;

  // ---------------------------------------------------------------------
  // Summary card
  // ---------------------------------------------------------------------
  summary: HolidaySummary = {
    academicSession: '',
    totalHolidays: 0,
    nationalHolidays: 0,
    schoolHolidays: 0,
    optionalHolidays: 0,
    upcomingHolidays: 0,
    workingDays: 0,
    weekends: 0
  };

  // ---------------------------------------------------------------------
  // Calendar preview state
  // ---------------------------------------------------------------------
  calendarView: CalendarViewType = CalendarViewType.Month;
  calendarYear = dayjs().year();
  calendarMonth = dayjs().month(); // 0-11
  calendarDays: CalendarDay[] = [];
  jumpToDateValue = dayjs().format('YYYY-MM-DD');
  jumpToYearValue = dayjs().year();
  selectedCalendarHoliday: Holiday | null = null;

  // ---------------------------------------------------------------------
  // Weekend configuration
  // ---------------------------------------------------------------------
  weekendConfig: WeekendConfig = createDefaultWeekendConfig();

  // ---------------------------------------------------------------------
  // Delete confirmation
  // ---------------------------------------------------------------------
  holidayPendingDelete: Holiday | null = null;

  // ---------------------------------------------------------------------
  // Bulk import
  // ---------------------------------------------------------------------
  selectedImportFile: File | null = null;
  importing = false;
  importSummary: ImportSummary | null = null;

  constructor(
    public toastService: ToastService,
    private holidayService: HolidayCalendarService,
    private validationService: HolidayValidationService,
    private utilityService: HolidayUtilityService
  ) {
    this.toastService.pageName = 'Holiday Calendar Master';
  }

  ngOnInit(): void {
    this.loadAcademicSessions();
    this.loadSchoolRoster();
    this.loadWeekendConfig();
    this.reloadAll();
  }

  /** Warn the user before leaving the page with an unsaved (dirty) form. */
  @HostListener('window:beforeunload', ['$event'])
  unloadNotification(event: BeforeUnloadEvent): void {
    if (!this.detailsToggle && this.holidayForm?.dirty) {
      event.preventDefault();
    }
  }

  // =======================================================================
  // Data loading
  // =======================================================================

  reloadAll(): void {
    this.loadHolidayList();
    this.loadSummary();
    this.buildCalendar();
  }

  loadAcademicSessions(): void {
    this.holidayService.getAcademicSessions().subscribe({
      next: (response) => {
        this.academicSessions = response?.entity ?? [];
      },
      error: () => {
        this.academicSessions = [];
      }
    });
  }

  loadSchoolRoster(): void {
    this.holidayService.getSchoolRoster().subscribe({
      next: (response) => {
        this.schoolList = response?.entity ?? [];
      },
      error: () => {
        this.schoolList = [];
      }
    });
  }

  loadWeekendConfig(): void {
    this.holidayService.getWeekendConfig(this.filter.academicSessionId).subscribe({
      next: (response) => {
        if (response?.entity) {
          this.weekendConfig = response.entity;
          this.buildCalendar();
        }
      },
      error: () => {
        // keep client-side defaults when the backend has no saved config yet
      }
    });
  }

  loadHolidayList(type: 'search' | 'pageSize' | 'reload' | 'pageChange' = 'reload'): void {
    if (type === 'search' || type === 'reload') {
      this.currentPage = 1;
    }
    this.loading = true;
    this.holidayService.getHolidayList(this.filter, this.currentPage, this.pageSize).subscribe({
      next: (response: any) => {
        this.loading = false;
        if (response?.statuscode === 200 || response?.status) {
          this.holidayList = response.entity?.listData ?? [];
          this.totalCount = response.entity?.param1 ?? this.holidayList.length;
          this.pageCount = Math.ceil(this.totalCount / this.pageSize);
        } else {
          this.holidayList = [];
          this.totalCount = 0;
          this.pageCount = 0;
        }
      },
      error: () => {
        this.loading = false;
        this.holidayList = [];
        this.toastService.show('Unable to fetch holiday list. Please try again.', 'error');
      }
    });
  }

  loadSummary(): void {
    this.holidayService.getHolidaySummary(this.filter.academicSessionId).subscribe({
      next: (response) => {
        if (response?.entity) {
          this.summary = response.entity;
        }
      },
      error: () => {
        // summary card degrades gracefully to zeros
      }
    });
  }

  onPageChange(page: number): void {
    this.currentPage = page;
    this.loadHolidayList('pageChange');
  }

  onPageSizeChange(): void {
    this.currentPage = 1;
    this.loadHolidayList('pageSize');
  }

  onSearch(): void {
    this.loadHolidayList('search');
  }

  resetFilters(): void {
    this.filter = createEmptyFilter();
    this.loadHolidayList('reload');
  }

  sortBy(column: string): void {
    this.sortDirection = this.sortColumn === column && this.sortDirection === 'asc' ? 'desc' : 'asc';
    this.sortColumn = column;
    const direction = this.sortDirection === 'asc' ? 1 : -1;
    this.holidayList = [...this.holidayList].sort((a: any, b: any) => {
      const valA = (a[column] ?? '').toString().toLowerCase();
      const valB = (b[column] ?? '').toString().toLowerCase();
      return valA > valB ? direction : valA < valB ? -direction : 0;
    });
  }

  toggleColumnChooser(): void {
    this.columnChooserOpen = !this.columnChooserOpen;
  }

  toggleColumnVisibility(column: string): void {
    this.visibleColumns[column] = !this.visibleColumns[column];
  }

  // =======================================================================
  // Panel toggling / CRUD entry points
  // =======================================================================

  openCreatePanel(): void {
    this.holiday = createEmptyHoliday();
    this.isEditMode = false;
    this.isViewMode = false;
    this.isSingleDayHoliday = true;
    this.formSubmitted = false;
    this.fieldErrors = {};
    this.weekendWarning = '';
    this.duplicateWarning = '';
    this.detailsToggle = false;
  }

  viewHoliday(row: Holiday): void {
    this.loadHolidayIntoForm(row, true);
  }

  editHoliday(row: Holiday): void {
    this.loadHolidayIntoForm(row, false);
  }

  copyHoliday(row: Holiday): void {
    this.loadHolidayIntoForm(row, false);
    this.holiday.holidayId = null;
    this.holiday.holidayCode = '';
    this.holiday.holidayName = `${row.holidayName} (Copy)`;
    this.isEditMode = false;
  }

  private loadHolidayIntoForm(row: Holiday, viewOnly: boolean): void {
    this.holiday = { ...createEmptyHoliday(), ...row };
    this.isEditMode = !viewOnly;
    this.isViewMode = viewOnly;
    this.isSingleDayHoliday = row.applicableFrom === row.applicableTo;
    this.formSubmitted = false;
    this.fieldErrors = {};
    this.weekendWarning = '';
    this.duplicateWarning = '';
    this.detailsToggle = false;
  }

  closeFormPanel(): void {
    if (this.holidayForm?.dirty && !confirm('You have unsaved changes. Are you sure you want to discard them?')) {
      return;
    }
    this.detailsToggle = true;
    this.resetForm();
  }

  resetForm(): void {
    this.holiday = createEmptyHoliday();
    this.isEditMode = false;
    this.isViewMode = false;
    this.formSubmitted = false;
    this.fieldErrors = {};
    this.weekendWarning = '';
    this.duplicateWarning = '';
    this.holidayForm?.resetForm();
  }

  // =======================================================================
  // Form business logic
  // =======================================================================

  onSingleDayToggle(): void {
    if (this.isSingleDayHoliday) {
      this.holiday.applicableTo = this.holiday.applicableFrom;
    }
    this.recomputeDerivedFields();
  }

  onHolidayDateChange(): void {
    if (!this.holiday.applicableFrom) {
      this.holiday.applicableFrom = this.holiday.holidayDate;
    }
    if (this.isSingleDayHoliday) {
      this.holiday.applicableFrom = this.holiday.holidayDate;
      this.holiday.applicableTo = this.holiday.holidayDate;
    }
    this.recomputeDerivedFields();
  }

  onApplicableDateChange(): void {
    if (this.isSingleDayHoliday) {
      this.holiday.applicableTo = this.holiday.applicableFrom;
    }
    this.recomputeDerivedFields();
  }

  private recomputeDerivedFields(): void {
    this.holiday.numberOfDays = this.validationService.calculateNumberOfDays(
      this.holiday.applicableFrom, this.holiday.applicableTo
    );
    this.weekendWarning = this.validationService.fallsOnWeekend(this.holiday.holidayDate, this.weekendConfig)
      ? 'Note: The selected date falls on a configured weekend.'
      : '';
    this.duplicateWarning = this.validationService.alreadyExists(this.holiday, this.activeHolidaysExcludingSelf())
      ? 'Warning: A similar holiday already exists.'
      : '';
  }

  private activeHolidaysExcludingSelf(): Holiday[] {
    return this.holidayList.filter(h => h.holidayId !== this.holiday.holidayId);
  }

  isApplicabilitySelected(type: ApplicableToType): boolean {
    return this.holiday.applicabilityTypes?.includes(type);
  }

  toggleApplicability(type: ApplicableToType, checked: boolean): void {
    const set = new Set(this.holiday.applicabilityTypes ?? []);
    if (checked) {
      set.add(type);
    } else {
      set.delete(type);
    }
    this.holiday.applicabilityTypes = Array.from(set);
  }

  isControlInvalid(name: string): boolean {
    return this.formSubmitted && !!this.fieldErrors[name];
  }

  // =======================================================================
  // Save / Submit
  // =======================================================================

  onSubmit(form: NgForm): void {
    this.formSubmitted = true;
    this.recomputeDerivedFields();

    const validation = this.validationService.validateHoliday(
      this.holiday, this.activeHolidaysExcludingSelf(), this.weekendConfig
    );
    this.fieldErrors = validation.errors;

    if (!form.valid || !validation.isValid) {
      setTimeout(() => {
        if (this.formCardRef?.nativeElement) {
          this.utilityService.scrollToFirstInvalidControl(this.formCardRef.nativeElement);
        }
      });
      return;
    }

    this.saving = true;
    const request$ = this.isEditMode
      ? this.holidayService.updateHoliday(this.holiday)
      : this.holidayService.createHoliday(this.holiday);

    request$.subscribe({
      next: (response: any) => {
        this.saving = false;
        if (response?.statuscode === 200 || response?.status) {
          this.toastService.show(`Holiday ${this.isEditMode ? 'updated' : 'created'} successfully.`, 'success');
          this.detailsToggle = true;
          this.resetForm();
          this.reloadAll();
        } else {
          this.toastService.show(response?.message || 'Unable to save the holiday.', 'error');
        }
      },
      error: () => {
        this.saving = false;
        this.toastService.show('An error occurred while saving the holiday.', 'error');
      }
    });
  }

  // =======================================================================
  // Delete / Activate / Deactivate
  // =======================================================================

  openDeleteModal(row: Holiday): void {
    this.holidayPendingDelete = row;
    this.toastService.openModal('deleteHolidayModal');
  }

  closeDeleteModal(): void {
    this.holidayPendingDelete = null;
    this.toastService.closeModal('deleteHolidayModal');
  }

  confirmDelete(): void {
    if (!this.holidayPendingDelete?.holidayId) {
      return;
    }
    this.holidayService.deleteHoliday(this.holidayPendingDelete.holidayId).subscribe({
      next: (response: any) => {
        if (response?.statuscode === 200 || response?.status) {
          this.toastService.show('Holiday deleted successfully.', 'success');
          this.closeDeleteModal();
          this.reloadAll();
        } else {
          this.toastService.show(response?.message || 'Unable to delete the holiday.', 'error');
        }
      },
      error: () => {
        this.toastService.show('An error occurred while deleting the holiday.', 'error');
      }
    });
  }

  toggleStatus(row: Holiday): void {
    const nextStatus = row.status === HolidayStatus.Active ? HolidayStatus.Inactive : HolidayStatus.Active;
    this.holidayService.updateHolidayStatus(row.holidayId as string, nextStatus).subscribe({
      next: (response: any) => {
        if (response?.statuscode === 200 || response?.status) {
          this.toastService.show(`Holiday ${nextStatus === HolidayStatus.Active ? 'activated' : 'deactivated'} successfully.`, 'success');
          this.reloadAll();
        } else {
          this.toastService.show(response?.message || 'Unable to update status.', 'error');
        }
      },
      error: () => {
        this.toastService.show('An error occurred while updating the status.', 'error');
      }
    });
  }

  // =======================================================================
  // Calendar preview
  // =======================================================================

  buildCalendar(): void {
    this.calendarDays = this.utilityService.buildMonthCalendar(
      this.calendarYear, this.calendarMonth, this.holidayList, this.weekendConfig
    );
  }

  getDayColor(day: CalendarDay): string | null {
    return this.utilityService.getDayColor(day);
  }

  colorForType(type: HolidayType | ''): string {
    return this.utilityService.getColorForType(type);
  }

  prevMonth(): void {
    const d = dayjs(new Date(this.calendarYear, this.calendarMonth, 1)).subtract(1, 'month');
    this.calendarYear = d.year();
    this.calendarMonth = d.month();
    this.buildCalendar();
  }

  nextMonth(): void {
    const d = dayjs(new Date(this.calendarYear, this.calendarMonth, 1)).add(1, 'month');
    this.calendarYear = d.year();
    this.calendarMonth = d.month();
    this.buildCalendar();
  }

  jumpToDate(): void {
    if (!this.jumpToDateValue) {
      return;
    }
    const d = dayjs(this.jumpToDateValue);
    this.calendarYear = d.year();
    this.calendarMonth = d.month();
    this.buildCalendar();
  }

  jumpToYear(): void {
    this.calendarYear = Number(this.jumpToYearValue) || dayjs().year();
    this.buildCalendar();
  }

  changeCalendarView(view: CalendarViewType): void {
    this.calendarView = view;
  }

  onCalendarDayClick(day: CalendarDay): void {
    this.selectedCalendarHoliday = day.holidays.length > 0 ? day.holidays[0] : null;
    if (this.selectedCalendarHoliday) {
      this.toastService.openModal('holidayDetailModal');
    }
  }

  closeHolidayDetailModal(): void {
    this.selectedCalendarHoliday = null;
    this.toastService.closeModal('holidayDetailModal');
  }

  getApplicableSchoolNames(holiday: Holiday | null): string {
    if (!holiday?.schoolIds?.length) {
      return 'All Schools';
    }
    return this.schoolList
      .filter(s => holiday.schoolIds.includes(s.id))
      .map(s => s.name)
      .join(', ');
  }

  getAcademicSessionName(academicSessionId: string): string {
    return this.academicSessions.find(s => s.id === academicSessionId)?.name ?? '-';
  }

  // =======================================================================
  // Weekend configuration
  // =======================================================================

  openWeekendConfigModal(): void {
    this.toastService.openModal('weekendConfigModal');
  }

  closeWeekendConfigModal(): void {
    this.toastService.closeModal('weekendConfigModal');
  }

  saveWeekendConfig(): void {
    this.holidayService.saveWeekendConfig(this.filter.academicSessionId, this.weekendConfig).subscribe({
      next: (response: any) => {
        if (response?.statuscode === 200 || response?.status) {
          this.toastService.show('Weekend configuration saved successfully.', 'success');
          this.closeWeekendConfigModal();
          this.buildCalendar();
        } else {
          this.toastService.show(response?.message || 'Unable to save weekend configuration.', 'error');
        }
      },
      error: () => {
        this.toastService.show('An error occurred while saving weekend configuration.', 'error');
      }
    });
  }

  // =======================================================================
  // Export / Print
  // =======================================================================

  exportExcel(): void {
    this.holidayService.exportHolidays(this.filter, 'excel').subscribe({
      next: (response: any) => {
        if (response?.entity) {
          this.toastService.commonFileDownload(response.entity);
        } else {
          this.toastService.show('Nothing to export.', 'info');
        }
      },
      error: () => this.toastService.show('Unable to export to Excel right now.', 'error')
    });
  }

  exportPdf(): void {
    this.holidayService.exportHolidays(this.filter, 'pdf').subscribe({
      next: (response: any) => {
        if (response?.entity) {
          this.toastService.commonFileDownload(response.entity);
        } else {
          this.toastService.show('Nothing to export.', 'info');
        }
      },
      error: () => this.toastService.show('Unable to export to PDF right now.', 'error')
    });
  }

  printGrid(): void {
    window.print();
  }

  // =======================================================================
  // Bulk Import
  // =======================================================================

  openBulkImportModal(): void {
    this.selectedImportFile = null;
    this.importSummary = null;
    this.toastService.openModal('bulkImportModal');
  }

  closeBulkImportModal(): void {
    this.toastService.closeModal('bulkImportModal');
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) {
      return;
    }
    const extension = file.name.split('.').pop()?.toLowerCase();
    if (extension !== 'xlsx' && extension !== 'xls' && extension !== 'csv') {
      this.toastService.show('Only .xlsx, .xls or .csv files are allowed.', 'error');
      input.value = '';
      this.selectedImportFile = null;
      return;
    }
    this.selectedImportFile = file;
  }

  submitBulkImport(): void {
    if (!this.selectedImportFile) {
      this.toastService.show('Please select a file to import.', 'error');
      return;
    }
    this.importing = true;
    const formData = new FormData();
    formData.append('file', this.selectedImportFile);
    formData.append('academicSessionId', this.filter.academicSessionId);

    this.holidayService.bulkImportHolidays(formData).subscribe({
      next: (response: any) => {
        this.importing = false;
        if (response?.statuscode === 200 || response?.status) {
          this.importSummary = response.entity ?? null;
          this.toastService.show('Bulk import completed.', 'success');
          this.reloadAll();
        } else {
          this.toastService.show(response?.message || 'Bulk import failed.', 'error');
        }
      },
      error: () => {
        this.importing = false;
        this.toastService.show('An error occurred during bulk import.', 'error');
      }
    });
  }

  trackByHolidayId(_index: number, item: Holiday): string {
    return item.holidayId ?? `${item.holidayName}-${item.holidayDate}`;
  }

  trackByDate(_index: number, item: CalendarDay): string {
    return item.date;
  }
}
