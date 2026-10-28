import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { FormsModule } from '@angular/forms';

export type PageSizeOption = number | string;

@Component({
  selector: 'app-common-data-toolbar',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './common-data-toolbar.component.html',
  styleUrl: './common-data-toolbar.component.scss'
})
export class CommonDataToolbarComponent {
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
  @Input() showExcel = false;
  @Input() showPdf = false;
  @Input() showPageSize = true;
  @Input() showTotal = true;
  @Input() pageSizeLabel = 'Rows';
  @Input() totalLabel = 'Total Records';
  @Input() countSeparator = '/';

  @Output() readonly searchTextChange = new EventEmitter<string>();
  @Output() readonly search = new EventEmitter<void>();
  @Output() readonly reload = new EventEmitter<void>();
  @Output() readonly excelExport = new EventEmitter<void>();
  @Output() readonly pdfExport = new EventEmitter<void>();
  @Output() readonly pageSizeChange = new EventEmitter<PageSizeOption>();

  get selectedPageSize(): PageSizeOption {
    return this.variant === 'vehicle' && this.pageSize === this.totalRecords ? 'All' : this.pageSize;
  }

  onPageSizeChange(value: PageSizeOption): void {
    this.pageSizeChange.emit(value);
  }
}
