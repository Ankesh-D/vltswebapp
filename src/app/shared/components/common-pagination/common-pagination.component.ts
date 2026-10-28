import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { NgbPaginationModule } from '@ng-bootstrap/ng-bootstrap';

@Component({
  selector: 'app-common-pagination',
  standalone: true,
  imports: [CommonModule, NgbPaginationModule],
  templateUrl: './common-pagination.component.html',
  styleUrl: './common-pagination.component.scss'
})
export class CommonPaginationComponent {
  @Input() page = 1;
  @Input() pageSize = 20;
  @Input() totalRecords = 0;
  @Input() maxSize = 5;
  @Input() disabled = false;
  @Output() readonly pageChange = new EventEmitter<number>();

  get totalPages(): number {
    return this.pageSize > 0 ? Math.ceil(Math.max(0, this.totalRecords) / this.pageSize) : 0;
  }

  onPageChange(page: number): void {
    if (page >= 1 && page <= this.totalPages && page !== this.page) {
      this.pageChange.emit(page);
    }
  }
}
