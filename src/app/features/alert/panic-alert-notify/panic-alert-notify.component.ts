import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { AlertService } from '../../../core/services/alert.service';

declare var $: any;
declare var jAlert: any;

@Component({
  selector: 'app-panic-alert-notify',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './panic-alert-notify.component.html',
  styleUrls: ['./panic-alert-notify.component.scss']
})
export class PanicAlertNotifyComponent implements OnInit {
  panicAlerts: any[] = [];
  panicCount: number = 0;
  showDetails: boolean = false;
  loading = false;

  constructor(
    private alertService: AlertService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit() {
    this.getPanicAlerts();
    // Refresh every 30 seconds
    setInterval(() => {
      this.getPanicAlerts();
    }, 30000);
  }

  getPanicAlerts() {
    this.loading = true;
    const request = {
      param1: '',
      param2: '1',
      param3: '20',
      param4: '',
      param5: ''
    };

    this.alertService.getPanicAlerts(request).subscribe({
      next: (response) => {
        this.loading = false;
        if (response.status && response.entity) {
          this.panicAlerts = response.entity.listData || [];
          this.panicCount = response.entity.param1 || 0;
        } else {
          this.panicAlerts = [];
          this.panicCount = 0;
        }
        this.cdr.detectChanges();
      },
      error: (error) => {
        this.loading = false;
        this.panicAlerts = [];
        this.panicCount = 0;
        console.error('Error fetching panic alerts:', error);
      }
    });
  }

  toggleDetails() {
    this.showDetails = !this.showDetails;
  }

  closeDetails() {
    this.showDetails = false;
  }

  viewDetails() {
    this.showDetails = true;
  }
}
