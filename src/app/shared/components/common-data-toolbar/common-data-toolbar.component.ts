import { CommonModule } from '@angular/common';
import { AfterViewInit, Component, ElementRef, EventEmitter, Input, OnDestroy, Output, ViewChild } from '@angular/core';
import { FormsModule } from '@angular/forms';
import moment from 'moment';

declare var $: any;

export type PageSizeOption = number | string;
export type OldNewOption = 'old' | 'new';

@Component({
  selector: 'app-common-data-toolbar',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './common-data-toolbar.component.html',
  styleUrl: './common-data-toolbar.component.scss'
})
export class CommonDataToolbarComponent implements AfterViewInit, OnDestroy {
  @ViewChild('dateRangeInput') private dateRangeInput?: ElementRef<HTMLInputElement>;
  @Input() variant: 'vehicle' | 'device' = 'device';
  @Input() searchText = '';
  @Input() searchLabel = 'Search';
  @Input() searchPlaceholder = 'Search...';
  @Input() pageSize = 20;
  @Input() pageSizeOptions: PageSizeOption[] = [];
  @Input() displayedCount = 0;
  @Input() totalRecords = 0;
  @Input() loading = false;
  @Input() exportLoading = false;
  @Input() showSearch = true;
  @Input() showReload = true;
  @Input() showFilters = false;
  @Input() showDateRange = false;
  @Input() dateRangeStart = '';
  @Input() dateRangeEnd = '';
  @Input() showExcel = true;
  @Input() showPdf = false;
  @Input() showPageSize = true;
  @Input() showOldNew = false;
  @Input() oldNewValue: OldNewOption = 'new';
  @Input() showTotal = true;
  @Input() pageSizeLabel = 'Rows';
  @Input() totalLabel = 'Total Records';
  @Input() countSeparator = '/';

  @Output() readonly searchTextChange = new EventEmitter<string>();
  @Output() readonly search = new EventEmitter<void>();
  @Output() readonly reload = new EventEmitter<void>();
  @Output() readonly dateRangeChange = new EventEmitter<{ startDate: string; endDate: string }>();
  @Output() readonly excelExport = new EventEmitter<void>();
  @Output() readonly pdfExport = new EventEmitter<void>();
  @Output() readonly pageSizeChange = new EventEmitter<PageSizeOption>();
  @Output() readonly oldNewChange = new EventEmitter<OldNewOption>();
  OldNewOptions: { value: OldNewOption; label: string }[] = [
    { value: 'old', label: 'Old' },
    { value: 'new', label: 'New' }
  ];

  get selectedPageSize(): PageSizeOption {
    return this.variant === 'vehicle' && this.pageSize === this.totalRecords ? 'All' : this.pageSize;
  }


  onPageSizeChange(value: PageSizeOption): void {
    this.pageSizeChange.emit(value);
  }

  ngAfterViewInit(): void {
    if (!this.showDateRange || !this.dateRangeInput) return;

    const $dateInput = $(this.dateRangeInput.nativeElement);
    const startDate = this.dateRangeStart
      ? moment(this.dateRangeStart, 'DD-MMM-YYYY', true)
      : moment();
    const endDate = this.dateRangeEnd
      ? moment(this.dateRangeEnd, 'DD-MMM-YYYY', true)
      : moment();

    $dateInput.daterangepicker({
      singleDatePicker: false,
      showDropdowns: true,
      autoApply: false,
      timePicker: false,
      startDate: startDate.isValid() ? startDate : moment(),
      endDate: endDate.isValid() ? endDate : moment(),
      maxDate: moment(),
      minYear: moment().subtract(2, 'year').year(),
      maxYear: moment().year(),
      opens: 'center',
      drops: 'down',
      locale: { format: 'DD-MMM-YYYY' }
    });

    $dateInput.on('apply.daterangepicker.commonDataToolbar', (_event: unknown, picker: any) => {
      this.onDateRangeChange(
        picker.startDate.format('DD-MMM-YYYY'),
        picker.endDate.format('DD-MMM-YYYY')
      );
    });
  }

  ngOnDestroy(): void {
    const $dateInput = this.dateRangeInput ? $(this.dateRangeInput.nativeElement) : null;
    if (!$dateInput) return;

    $dateInput.off('.commonDataToolbar');
    $dateInput.data('daterangepicker')?.remove();
  }

  onDateRangeChange(startDate: string, endDate: string): void {
    this.dateRangeChange.emit({
      startDate,
      endDate
    });
  }

  onOldNewChange(value: OldNewOption): void {
    this.oldNewValue = value;
    this.oldNewChange.emit(value);
  }
}
