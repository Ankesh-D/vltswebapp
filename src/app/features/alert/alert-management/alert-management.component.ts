import { Component, OnInit, AfterViewInit, ChangeDetectorRef, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { AlertService } from '../../../core/services/alert.service';
import { EncryptionService } from '../../../core/services/encryption.service';
import { ToastComponent } from '../../assets/inactive-assets/toast.component';
import { ToastService } from '../../../core/services/toast.service';

declare var $: any;
declare var jAlert: any;

@Component({
    selector: 'app-alert-management',
    imports: [CommonModule, FormsModule, RouterModule, ToastComponent],
    templateUrl: './alert-management.component.html',
    changeDetection: ChangeDetectionStrategy.Eager,
    styleUrls: ['./alert-management.component.scss']
})
export class AlertManagementComponent implements OnInit, AfterViewInit {
  alertTypeConfig: any[] = [];
  loading = false;
  totalCount = 0;

  sortKey: string = '';
  reverse: boolean = false;
  errorMessage: string | null = null;
  successMessage: string | null = null;

  constructor(
    private alertService: AlertService,
    private encryptionService: EncryptionService,
    private cdr: ChangeDetectorRef,
    public toastService: ToastService
  ) {
    this.toastService.pageName = 'Alert Management'; // Set page name for toast service
  }

  ngOnInit() {
    this.getAlertTypeDetails();
  }

  ngAfterViewInit() {
    // Component initialization
  }

  getAlertTypeDetails() {
    this.loading = true;
    const vendorId = this.encryptionService.encryptAccountId("11");
    const request = {
      param1: "",
      param2: "NA",
      param3: "NA",
      param4: vendorId
    };

    this.alertService.getAlertConfiguration(request).subscribe({
      next: (response) => {
        this.loading = false;
        if (response.status && response.entity && response.entity.listData) {
          this.alertTypeConfig = response.entity.listData || [];
          this.totalCount = this.alertTypeConfig.length;
        } else {
          this.alertTypeConfig = [];
          this.totalCount = 0;
        }
        this.cdr.detectChanges();
      },
      error: (error) => {
        this.loading = false;
        this.alertTypeConfig = [];
        this.totalCount = 0;
        this.errorMessage = ('Error fetching alert type details.');
        this.cdr.detectChanges();
      }
    });
  }

  sort(key: string) {
    this.sortKey = key;
    this.reverse = !this.reverse;
    this.alertTypeConfig.sort((a, b) => {
      const valA = (a as any)[key];
      const valB = (b as any)[key];
      let comparison = 0;
      if (valA > valB) {
        comparison = 1;
      } else if (valA < valB) {
        comparison = -1;
      }
      return this.reverse ? comparison * -1 : comparison;
    });
  }

  isNotificationChecked(alertId: string): boolean {
    const alert = this.alertTypeConfig.find(a => a.param1 === alertId);
    // param4 corresponds to notification in the response listData based on context
    return alert?.param4 === true || alert?.param4 === 'true';
  }

  isEmailChecked(alertId: string): boolean {
    const alert = this.alertTypeConfig.find(a => a.param1 === alertId);
    // param5 corresponds to email
    return alert?.param5 === true || alert?.param5 === 'true';
  }

  isSmsChecked(alertId: string): boolean {
    const alert = this.alertTypeConfig.find(a => a.param1 === alertId);
    // param6 corresponds to sms/mobile
    return alert?.param6 === true || alert?.param6 === 'true';
  }

  onNotificationChange(alertId: string, event: Event) {
    const checked = (event.target as HTMLInputElement).checked;
    const alert = this.alertTypeConfig.find(a => a.param1 === alertId);
    if (alert) {
      alert.param4 = checked;
    }
  }

  onEmailChange(alertId: string, event: Event) {
    const checked = (event.target as HTMLInputElement).checked;
    const alert = this.alertTypeConfig.find(a => a.param1 === alertId);
    if (alert) {
      alert.param5 = checked;
    }
  }

  onSmsChange(alertId: string, event: Event) {
    const checked = (event.target as HTMLInputElement).checked;
    const alert = this.alertTypeConfig.find(a => a.param1 === alertId);
    if (alert) {
      alert.param6 = checked;
    }
  }

  submitAlertType() {
    const alertTypeData = this.alertTypeConfig.map(alert => ({
      alertid: alert.param2,
      notification: alert.param4 === true || alert.param4 === 'true',
      email: alert.param5 === true || alert.param5 === 'true',
      mobile: alert.param6 === true || alert.param6 === 'true'
    }));

    this.loading = true;
    this.alertService.insertAlertConfiguration({ alerttypedata: alertTypeData }).subscribe({
      next: (response) => {
        this.loading = false;
        this.successMessage =(response.entity);
        if (response.statuscode === 200) {
          this.getAlertTypeDetails();
        }
      },
      error: (error) => {
        this.loading = false;
        this.errorMessage = ('Error saving alert configuration.');
      }
    });
  }
}
