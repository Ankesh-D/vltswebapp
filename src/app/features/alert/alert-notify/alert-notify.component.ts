import { Component, OnInit, ChangeDetectorRef, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { AlertService } from '../../../core/services/alert.service';

declare var $: any;
declare var jAlert: any;

@Component({
    selector: 'app-alert-notify',
    imports: [CommonModule, FormsModule, RouterModule],
    templateUrl: './alert-notify.component.html',
    changeDetection: ChangeDetectionStrategy.Eager,
    styleUrls: ['./alert-notify.component.scss']
})
export class AlertNotifyComponent implements OnInit {
  alertCounts: any[] = [];
  selectedAlertType: string = '';
  alertDetails: any[] = [];
  showDetails: boolean = false;
  loading = false;

  constructor(
    private alertService: AlertService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit() {
    this.getAlertSummaryCount();
    // Refresh every 30 seconds
    setInterval(() => {
      this.getAlertSummaryCount();
    }, 30000);
  }

    getAlertSummaryCount() {
    this.loading = true;
    const today = new Date();
    const request = {
      param1: 'Today',
      param2: this.formatDate(today),
      param3: this.formatDate(today)
    };

    this.alertService.getAlertSummaryCount(request).subscribe({
      next: (response) => {
        this.loading = false;
        if (response.status && response.entity) {
          this.alertCounts = response.entity.listData || [];
        } else {
          this.alertCounts = [];
        }
        this.cdr.detectChanges();
      },
      error: (error) => {
        this.loading = false;
        this.alertCounts = [];
        console.error('Error fetching alert summary:', error);
      }
    });
  }

  formatDate(date: Date): string {
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return `${day}-${month}-${year}`;
  }

  toggleDetails() {
    this.showDetails = !this.showDetails;
  }

  closeDetails() {
    this.showDetails = false;
    this.selectedAlertType = '';
    this.alertDetails = [];
  }

  getAlertDetails(alertType: string) {
    if (!alertType) return;
    
    this.selectedAlertType = alertType;
    this.showDetails = true;
    this.loading = true;

    const today = new Date();
    const request = {
      param1: '',
      param2: '1',
      param3: '20',
      param4: alertType,
      param5: this.formatDate(today),
      param6: this.formatDate(today)
    };

    this.alertService.getAlertDetailsByType(request).subscribe({
      next: (response) => {
        this.loading = false;
        if (response.status && response.entity) {
          this.alertDetails = response.entity.listData || [];
        } else {
          this.alertDetails = [];
        }
        this.cdr.detectChanges();
      },
      error: (error) => {
        this.loading = false;
        this.alertDetails = [];
        console.error('Error fetching alert details:', error);
      }
    });
  }
}
