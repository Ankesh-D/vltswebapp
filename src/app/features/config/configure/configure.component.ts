import { Component, OnInit, AfterViewInit, ChangeDetectorRef, ChangeDetectionStrategy } from '@angular/core';

import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { ConfigService } from '../../../core/services/config.service';
import { AlertService } from '../../../core/services/alert.service';
import { DashboardService } from '../../../core/services/dashboard.service';
import { EncryptionService } from '../../../core/services/encryption.service';
import { NgSelectModule } from '@ng-select/ng-select';
import { ToastComponent } from '../../assets/inactive-assets/toast.component';
import { ToastService } from '../../../core/services/toast.service';

declare var $: any;
declare var jAlert: any;

@Component({
    selector: 'app-configure',
    imports: [FormsModule, RouterModule, NgSelectModule, ToastComponent],
    templateUrl: './configure.component.html',
    changeDetection: ChangeDetectionStrategy.Eager,
    styleUrls: ['./configure.component.scss']
})
export class ConfigureComponent implements OnInit, AfterViewInit {
  loading = false;

  searchFilter: 'Vendor' | 'RTO' | 'Customer' | '' = '';
  selectedVendor: string = '';
  selectedRTO: string = '';
  searchContact: string = '';
  selectedAlertType: string = '';
  selectedSpeed: string = '60';
  sendVia: 'SMS' | 'Email' | '' = '';
  addContact: string = '';
  addEmail: string = '';
  dayType: 'Daily' | 'Weekly' | 'Monthly' | 'Custom' | '' = '';
  selectedMonthDate: string = '';
  
  contactRows: string[] = [];
  emailRows: string[] = [];
  selectedDays: string[] = [];
  datesForMonth: number[] = [];

  vendorList: any[] = [];
  rtoList: any[] = [];
  alertTypeList: any[] = [];

  holderId: string = '';
  registeredContact: string = '';
  showRegisteredContact: boolean = false;
  errorMessage: string | null = null;
  successMessage: string | null = null;

  constructor(
    private configService: ConfigService,
    private alertService: AlertService,
    private dashboardService: DashboardService,
    private encryptionService: EncryptionService,
    private cdr: ChangeDetectorRef,
    public toastService: ToastService
  ) {
    this.toastService.pageName = 'Alert Configuration'; // Set page name for toast service
  }

  ngOnInit() {
    this.loadAlertTypes();
    this.initializeMonthDates();
  }

  ngAfterViewInit() {
    setTimeout(() => {
      if (typeof $ !== 'undefined' && $.fn.select2) {
        $('.searchable').select2();
        $('#searchfilter').on('change', (e: any) => {
          this.onSearchFilterChange();
        });
        $('#selectcomplist').on('change', (e: any) => {
          this.selectedVendor = e.target.value;
        });
        $('#selectrtolist').on('change', (e: any) => {
          this.selectedRTO = e.target.value;
        });
        $('#selectalertlist').on('change', (e: any) => {
          this.selectedAlertType = e.target.value;
          if (e.target.value === '17') {
            $('#selectspeed').show();
          } else {
            $('#selectspeed').hide();
          }
        });
        $('#speed').on('change', (e: any) => {
          this.selectedSpeed = e.target.value;
        });
        $('#sendvia').on('change', (e: any) => {
          this.onSendViaChange(e.target.value);
        });
        $('#daytype').on('change', (e: any) => {
          this.onDayTypeChange(e.target.value);
        });
        $('#monthdate').on('change', (e: any) => {
          this.selectedMonthDate = e.target.value;
          if (this.selectedMonthDate) {
            this.selectedDays = [`MONTHLY:=${this.selectedMonthDate}`];
          }
        });
      }
    }, 200);
  }

  initializeMonthDates() {
    for (let i = 1; i <= 25; i++) {
      this.datesForMonth.push(i);
    }
  }

  loadAlertTypes() {
    this.alertService.getAlertTypeDetails().subscribe({
      next: (response) => {
        if (response.status && response.entity) {
          this.alertTypeList = response.entity;
        }
      }
    });
  }

  onSearchFilterChange() {
    this.searchFilter = this.searchFilter as any;
    this.selectedVendor = '';
    this.selectedRTO = '';
    this.searchContact = '';
    this.registeredContact = '';
    this.showRegisteredContact = false;
    this.contactRows = [];
    this.emailRows = [];
    this.sendVia = '';

    if (this.searchFilter === 'Vendor') {
      this.loadVendors();
    } else if (this.searchFilter === 'RTO') {
      this.loadRTOs();
    }
    this.cdr.detectChanges();
  }

  loadVendors() {
    this.dashboardService.getVendorList().subscribe({
      next: (response) => {
        if (response.status && response.entity) {
          this.vendorList = response.entity;
        }
        this.cdr.detectChanges();
        setTimeout(() => {
          if (typeof $ !== 'undefined' && $.fn.select2) {
            $('#selectcomplist').select2();
          }
        }, 100);
      }
    });
  }

  loadRTOs() {
    this.dashboardService.getRTOList().subscribe({
      next: (response) => {
        if (response.status && response.entity) {
          this.rtoList = response.entity;
        }
        this.cdr.detectChanges();
        setTimeout(() => {
          if (typeof $ !== 'undefined' && $.fn.select2) {
            $('#selectrtolist').select2();
          }
        }, 100);
      }
    });
  }

  findRegisterContact() {
    if (this.searchContact.length < 10) {
      this.errorMessage = 'Enter 10 digit contact no.';
      return;
    }

    this.loading = true;
    this.configService.verifyContact(this.searchContact).subscribe({
      next: (response) => {
        this.loading = false;
        if (response.status && response.entity && response.entity.length > 0) {
          this.holderId = response.entity[0].param1;
          this.registeredContact = response.entity[0].param3;
          this.contactRows.push(this.registeredContact);
          this.showRegisteredContact = true;
        } else {
         this.errorMessage = ('Contact no. not registered');
          this.showRegisteredContact = false;
        }
        this.cdr.detectChanges();
      },
      error: (error) => {
        this.loading = false;
       this.errorMessage = ('Error verifying contact.');
      }
    });
  }

  onSendViaChange(value: string) {
    this.sendVia = value as any;
    if (value === 'SMS') {
      this.addEmail = '';
      this.emailRows = [];
    } else if (value === 'Email') {
      this.addContact = '';
      this.contactRows = [];
    }
    this.cdr.detectChanges();
  }

  addContactNumber() {
    if (!this.addContact || this.addContact.length < 10) {
      this.errorMessage = ('Enter 10 digit contact no.');
      return;
    }

    if (this.contactRows.includes(this.addContact)) {
      this.errorMessage = (this.addContact + ' contact no. is available in list');
      return;
    }

    this.contactRows.push(this.addContact);
    this.addContact = '';
    this.cdr.detectChanges();
  }

  removeContact(contact: string) {
    this.contactRows = this.contactRows.filter(c => c !== contact);
  }

  addEmailId() {
    const emailRegex = /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/;
    if (!this.addEmail || !emailRegex.test(this.addEmail)) {
      this.errorMessage = ('Enter valid Email Id.');
      return;
    }

    if (this.emailRows.includes(this.addEmail)) {
      this.errorMessage = (this.addEmail + ' email id is available in list');
      return;
    }

    this.emailRows.push(this.addEmail);
    this.addEmail = '';
    this.cdr.detectChanges();
  }

  removeEmail(email: string) {
    this.emailRows = this.emailRows.filter(e => e !== email);
  }

  onDayTypeChange(value: string) {
    this.dayType = value as any;
    this.selectedDays = [];
    this.selectedMonthDate = '';

    if (value === 'Daily') {
      this.selectedDays = ['DAILY'];
    } else if (value === 'Weekly') {
      const d = new Date();
      const weekday = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'];
      const currentDay = weekday[d.getDay()];
      this.selectedDays = [`WEEKLY:=${currentDay}`];
    }
    this.cdr.detectChanges();
  }

  toggleDay(day: string) {
    const index = this.selectedDays.indexOf(day);
    if (index > -1) {
      this.selectedDays.splice(index, 1);
    } else {
      this.selectedDays.push(day);
    }
  }

  isDaySelected(day: string): boolean {
    return this.selectedDays.includes(day);
  }

  configureEntry() {
    // Validation
    if (!this.searchFilter) {
      this.errorMessage = ('Please select search type');
      return;
    }
    if (this.searchFilter === 'Vendor' && !this.selectedVendor) {
      this.errorMessage = ('Please select vendor');
      return;
    }
    if (this.searchFilter === 'RTO' && !this.selectedRTO) {
      this.errorMessage = ('Please select RTO');
      return;
    }
    if (this.searchFilter === 'Customer' && !this.registeredContact) {
      this.errorMessage = ('Please find register contact no.');
      return;
    }
    if (!this.selectedAlertType) {
      this.errorMessage = ('Please select alert type');
      return;
    }
    if (this.selectedAlertType === '17' && !this.selectedSpeed) {
      this.errorMessage = ('Please select speed');
      return;
    }
    if ((this.searchFilter === 'Vendor' || this.searchFilter === 'RTO') && !this.sendVia) {
      this.errorMessage = ('Please select send via');
      return;
    }
    if (this.sendVia === 'SMS' && this.contactRows.length < 1) {
      this.errorMessage = ('Please add contact no.');
      return;
    }
    if (this.sendVia === 'Email' && this.emailRows.length < 1) {
      this.errorMessage = ('Please add email id.');
      return;
    }
    if (!this.dayType) {
      this.errorMessage = ('Please select day type');
      return;
    }
    if (this.dayType === 'Monthly' && !this.selectedMonthDate) {
      this.errorMessage = ('Please select date');
      return;
    }
    if (this.dayType === 'Custom' && this.selectedDays.length < 1) {
      this.errorMessage = ('Please select days');
      return;
    }

    // Prepare request
    let searchId = '';
    let searchFilterRoleId = '';

    if (this.searchFilter === 'Vendor') {
      searchId = this.encryptionService.encryptAccountId(this.selectedVendor);
      searchFilterRoleId = this.encryptionService.encryptAccountId('11');
    } else if (this.searchFilter === 'RTO') {
      searchId = this.encryptionService.encryptAccountId(this.selectedRTO);
      searchFilterRoleId = this.encryptionService.encryptAccountId('19');
    } else {
      searchId = this.encryptionService.encryptAccountId(this.holderId);
      searchFilterRoleId = this.encryptionService.encryptAccountId('14');
    }

    const alertTypeId = this.encryptionService.encryptAccountId(this.selectedAlertType);
    const dayList = this.selectedDays.join(',');

    const request = {
      param1: '0',
      param2: this.contactRows.join(','),
      param3: '',
      param4: this.emailRows.join(','),
      param5: '',
      param6: alertTypeId,
      param7: this.selectedSpeed || '0',
      param8: dayList,
      param9: searchId,
      param10: searchFilterRoleId
    };

    this.loading = true;
    this.configService.insertAlertConfig(request).subscribe({
      next: (response) => {
        this.loading = false;
        this.successMessage = (response.entity);
        if (response.status && response.entity === 'Successfully saved.') {
          this.resetForm();
        }
      },
      error: (error) => {
        this.loading = false;
        this.errorMessage = ('Error saving configuration.');
      }
    });
  }

  resetForm() {
    this.searchFilter = '';
    this.selectedVendor = '';
    this.selectedRTO = '';
    this.searchContact = '';
    this.selectedAlertType = '';
    this.selectedSpeed = '60';
    this.sendVia = '';
    this.addContact = '';
    this.addEmail = '';
    this.dayType = '';
    this.selectedMonthDate = '';
    this.contactRows = [];
    this.emailRows = [];
    this.selectedDays = [];
    this.registeredContact = '';
    this.showRegisteredContact = false;
    this.cdr.detectChanges();
  }
}
