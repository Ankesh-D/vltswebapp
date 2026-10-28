import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output, TemplateRef } from '@angular/core';

export interface CommonTableAction<T = Record<string, unknown>> {
  label: string | ((row: T) => string);
  icon?: string;
  iconOnly?: boolean;
  className?: string;
  tone?: 'primary' | 'info' | 'warning' | 'success' | 'danger' | 'neutral';
  run: (row: T) => void;
  visible?: (row: T) => boolean;
  disabled?: (row: T) => boolean;
}

export type CommonTableCellStyle = Record<string, string | number | null | undefined>;

export interface CommonTableColumn<T = Record<string, unknown>> {
  key: string;
  label?: string;
  header?: string;
  headers?: string[];
  subLabel?: string;
  sortable?: boolean;
  sortKey?: string;
  showSortIndicator?: boolean;
  width?: string;
  height?: string;
  cellClass?: string | ((row: T) => string);
  className?: string;
  cellClassName?: string | ((row: T) => string);
  cellStyle?: CommonTableCellStyle | ((row: T) => CommonTableCellStyle);
  value?: (row: T) => string | number;
  cellTemplate?: TemplateRef<{ $implicit: T }>;
  clickable?: (row: T) => boolean;
  actions?: CommonTableAction<T>[];
  visible?: () => boolean;
}

export interface CommonTableHeaderContext<T> {
  $implicit: CommonTableColumn<T>;
}

export interface CommonTableCellContext<T> {
  $implicit: T;
  column: CommonTableColumn<T>;
  index: number;
}

@Component({
  selector: 'app-common-table',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './common-table.component.html',
  styleUrl: './common-table.component.scss'
})
export class CommonTableComponent<T> {
  @Input() columns: CommonTableColumn<T>[] = [];
  @Input() rows: T[] = [];
  @Input() expandedRow: T | null = null;
  @Input() rowDetailTemplate?: TemplateRef<{ $implicit: T }>;
  @Input() bodyTemplate?: TemplateRef<{ $implicit: T[] }>;
  @Input() loading = false;
  @Input() emptyMessage = 'NO DATA FOUND';
  @Input() tableClass = 'table';
  @Input() wrapperClass = '';
  @Input() tableId = '';
  @Input() tableStyle = '';
  @Input() headerClass = '';
  @Input() bodyClass = '';
  @Input() rowClass: (row: T) => string = () => '';
  @Input() maxHeight = '';
  @Input() stickyHeader = false;
  @Input() sortKey = '';
  @Input() reverse = false;
  @Input() headerRowsTemplate?: TemplateRef<unknown>;
  @Input() footerTemplate?: TemplateRef<unknown>;
  @Input() headerTemplate?: TemplateRef<CommonTableHeaderContext<T>>;
  @Input() cellTemplate?: TemplateRef<CommonTableCellContext<T>>;
  @Output() readonly sortChange = new EventEmitter<string>();
  @Output() readonly cellClick = new EventEmitter<{ row: T; column: CommonTableColumn<T> }>();

  requestSort(column: CommonTableColumn<T>): void {
    if (column.sortable) this.sortChange.emit(column.sortKey ?? column.key ?? '');
  }

  getVisibleColumns(): CommonTableColumn<T>[] {
    return this.columns.filter(column => !column.visible || column.visible());
  }

  getCellClassNames(row: T, column: CommonTableColumn<T>): string[] {
    return [
      this.resolveCellClass(row, column.cellClass),
      this.resolveCellClass(row, column.cellClassName),
      column.clickable?.(row) ? 'clickable' : ''
    ];
  }

  getCellStyle(row: T, column: CommonTableColumn<T>): CommonTableCellStyle | null {
    if (!column.cellStyle) return null;
    return typeof column.cellStyle === 'function' ? column.cellStyle(row) : column.cellStyle;
  }

  private resolveCellClass(row: T, className?: string | ((row: T) => string)): string {
    return typeof className === 'function' ? className(row) : className || '';
  }

  cellValue(row: T, column: CommonTableColumn<T>): string | number {
    if (column.value) return column.value(row);

    const key = column.key;
    const value = row && typeof row === 'object' && key && key in row
      ? Reflect.get(row, key)
      : '';
    return value === null || value === undefined || value === '' ? 'NA' : String(value);
  }

  getActionLabel(row: T, action: CommonTableAction<T>): string {
    return typeof action.label === 'function' ? action.label(row) : action.label;
  }

  getColumnKey(column: CommonTableColumn<T>): string {
    return column.sortKey ?? column.key ?? '';
  }

  onCellClick(row: T, column: CommonTableColumn<T>): void {
    if (column.clickable?.(row)) this.cellClick.emit({ row, column });
  }

  onHeaderKeydown(event: KeyboardEvent, column: CommonTableColumn<T>): void {
    if (column.sortable && (event.key === 'Enter' || event.key === ' ')) {
      event.preventDefault();
      this.requestSort(column);
    }
  }
}
