import { FontAwesomeIconComponent } from '../font-awesome-icon/font-awesome-icon.component';
import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-table-controls',
  standalone: true,
  imports: [FontAwesomeIconComponent, CommonModule, FormsModule],
  templateUrl: './table-controls.component.html',
  styleUrls: ['./table-controls.component.scss']
})
export class TableControlsComponent {
  @Input() searchValue = '';
  @Input() searchPlaceholder = 'Type here...';
  @Input() loading = false;
  @Input() showSearch = true;
  @Input() showReload = true;
  @Input() showDownload = false;
  @Input() showPageSize = true;
  @Input() showTotalRecords = true;
  @Input() pageSize: string | number = 20;
  @Input() pageSizeOptions: Array<string | number> = [];
  @Input() totalCount = 0;
  @Input() pageCount = 0;
  @Input() selectedDownloadType = '';
  @Input() downloadOptions: string[] = ['Select', 'Excel'];
  @Input() isExporting = false;
  @Input() searchLabel = 'Search :';
  @Input() downloadLabel = 'Download :';
  @Input() pageSizeLabel = 'Show Rows :';
  @Input() totalRecordsLabel = 'Total Records :';
  @Input() searchName = 'searchTextBox';

  @Output() searchValueChange = new EventEmitter<string>();
  @Output() search = new EventEmitter<void>();
  @Output() reload = new EventEmitter<void>();
  @Output() pageSizeChange = new EventEmitter<string | number>();
  @Output() downloadTypeChange = new EventEmitter<string>();

  onSearchValueChange(value: string): void {
    this.searchValueChange.emit(value);
  }

  onSearch(): void {
    this.search.emit();
  }

  onReload(): void {
    this.reload.emit();
  }

  onPageSizeChanged(value: string | number): void {
    this.pageSizeChange.emit(value);
  }

  onDownloadTypeChanged(value: string): void {
    this.downloadTypeChange.emit(value);
  }
}
