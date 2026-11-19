
import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output, TemplateRef } from '@angular/core';

export type DataTableCellStyle = Record<string, string | number | null | undefined>;

export interface DataTableColumn<T = Record<string, unknown>> {
  header?: string;
  label?: string;
  headers?: string[];
  subLabel?: string;
  cellTemplate?: TemplateRef<{ $implicit: T }>;
  key?: string;
  sortKey?: string;
  sortable?: boolean;
  showSortIndicator?: boolean;
  width?: string;
  height?: string;
  value?: (row: T) => string | number;
  className?: string;
  cellClass?: string | ((row: T) => string);
  cellClassName?: string | ((row: T) => string);
  cellStyle?: DataTableCellStyle | ((row: T) => DataTableCellStyle);
  clickable?: (row: T) => boolean;
  actions?: DataTableAction<T>[];
  visible?: () => boolean;
}

export interface DataTableCellContext<T> {
  $implicit: T;
  column: DataTableColumn<T>;
  index: number;
}

export interface DataTableAction<T = Record<string, unknown>> {
  label: string | ((row: T) => string);
  icon?: string;
  iconOnly?: boolean;
  className?: string;
  tone?: 'primary' | 'info' | 'warning' | 'success' | 'danger' | 'neutral';
  run: (row: T) => void;
  visible?: (row: T) => boolean;
  disabled?: (row: T) => boolean;
}

@Component({
  selector: 'app-data-table',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './data-table.component.html',
  styleUrls: ['./data-table.component.scss']
})
export class DataTableComponent<T = any> {
  @Input() columns: DataTableColumn<T>[] = [];
  @Input() rows: T[] = [];
  @Input() expandedRow: T | null = null;
  @Input() rowDetailTemplate?: TemplateRef<{ $implicit: T }>;
  @Input() headerTemplate?: TemplateRef<unknown>;
  @Input() headerRowsTemplate?: TemplateRef<unknown>;
  @Input() cellTemplate?: TemplateRef<DataTableCellContext<T>>;
  /** Custom bodies preserve grouped cells, form controls and page-specific row actions. */
  @Input() bodyTemplate?: TemplateRef<{ $implicit: T[] }>;
  @Input() headerClass = '';
  @Input() bodyClass = '';
  @Input() loading = false;
  @Input() rowClass: (row: T) => string = () => ''; 
  @Input() emptyMessage = 'NO DATA FOUND';
  @Input() maxHeight = '';
  @Input() stickyHeader = false;
  @Input() tableClass = 'table table-striped mb-0';
  @Input() tableId = '';
  @Input() tableStyle = '';
  @Input() wrapperClass = '';
  @Input() sortKey = '';
  @Input() reverse = false;

  @Output() sort = new EventEmitter<string>();
  @Output() sortChange = new EventEmitter<string>();
  @Output() cellClick = new EventEmitter<{ row: T; column: DataTableColumn<T> }>();

  getValue(row: T, column: DataTableColumn<T>): string | number {
    if (column.value) {
      return column.value(row);
    }

    const value = column.key ? (row as Record<string, unknown>)[column.key] : '';
    return value === null || value === undefined || value === '' ? 'NA' : String(value);
  }

  cellValue(row: T, column: DataTableColumn<T>): string | number {
    return this.getValue(row, column);
  }

  getActionLabel(row: T, action: DataTableAction<T>): string {
    return typeof action.label === 'function' ? action.label(row) : action.label;
  }

  getVisibleColumns(): DataTableColumn<T>[] {
    return this.columns.filter(column => !column.visible || column.visible());
  }

  getCellClassName(row: T, column: DataTableColumn<T>): string {
    const resolve = (className?: string | ((row: T) => string)) =>
      typeof className === 'function' ? className(row) : className || '';
    return [resolve(column.cellClass), resolve(column.cellClassName)].filter(Boolean).join(' ');
  }

  getHeader(column: DataTableColumn<T>): string {
    return column.header ?? column.label ?? '';
  }

  sortColumn(column: DataTableColumn<T>): void {
    if (!column.sortKey && !column.sortable) return;
    const key = column.sortKey || column.key || '';
    this.sort.emit(key);
    this.sortChange.emit(key);
  }

  getCellStyle(row: T, column: DataTableColumn<T>): DataTableCellStyle | null {
    if (!column.cellStyle) return null;
    return typeof column.cellStyle === 'function' ? column.cellStyle(row) : column.cellStyle;
  }
}
