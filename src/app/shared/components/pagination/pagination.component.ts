import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { NgbPaginationModule } from '@ng-bootstrap/ng-bootstrap';

@Component({
  selector: 'app-pagination',
  standalone: true,
  imports: [CommonModule, NgbPaginationModule],
  templateUrl: './pagination.component.html',
  styleUrls: ['./pagination.component.scss']
})
export class PaginationComponent {
  @Input() totalCount = 0;
  @Input() page = 1;
  @Input() pageSize = 10;
  @Input() maxSize = 5;
  @Input() boundaryLinks = true;
  @Input() rotate = true;
  @Input() ellipses = false;
  @Input() size: 'sm' | 'lg' = 'sm';
  @Input() align: 'start' | 'center' | 'end' = 'end';
  @Input() forceDisplay = false;
  @Input() disabled = false;

  @Output() pageChange = new EventEmitter<number>();

  onPageChange(page: number): void {
    if (!this.disabled) this.pageChange.emit(page);
  }
}
