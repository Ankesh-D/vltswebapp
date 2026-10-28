import { DashboardService } from './../../../core/services/dashboard.service';
import { Component, OnInit, ViewChild, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { ModelService, ModelEntryRequest } from '../../../core/services/model.service';
import { ToastComponent } from '../../assets/inactive-assets/toast.component';
import { NgSelectModule } from '@ng-select/ng-select';
import { ToastService } from '../../../core/services/toast.service';
import moment from 'moment';
import { single } from 'rxjs';
import { DatePickerService } from '../../../core/services/date-picker.service';

declare var $: any;

@Component({
    selector: 'app-model-entry',
    imports: [CommonModule, FormsModule, RouterModule, ToastComponent, NgSelectModule],
    templateUrl: './model-entry.component.html',
    changeDetection: ChangeDetectionStrategy.Eager,
    styleUrls: ['./model-entry.component.scss']
})
export class ModelEntryComponent implements OnInit {
  @ViewChild('modelEntryForm') modelEntryForm!: any;
  // Form fields
  selectedVendorId: string = '';
  modelName: any = ''; // Changed to any to allow null value
  modelCode: string = '';
  productionMonth: any = null; // Changed to any to allow null value
  productionYear: any = null;  // Changed to any to allow null value
  selectedCertAuthorityId: any = null;
  irnss: string = 'yes'; // yes = IRNSS, no = Non-IRNSS
  copUpload: string = 'Yes'; // Yes/No for COP upload
  
  // TAC Certificate
  tacFile: File | null = null;
  tacCertNo: string = '';
  tacCertDate: string = '';
  tacCertValidity: string = '';
  
  // COP Certificate
  copFile: File | null = null;
  copCertNo: string = '';
  copCertDate: string = '';
  copCertValidity: string = '';
  
  // Other files
  protocolFile: File | null = null;
  brochureFile: File | null = null;
  certificateFile: File | null = null;
  
  remark: string = '';
  
  // Dropdowns
  vendorList: any[] = [];
  certAuthorityList: any[] = [];
  
  // Months and Years
  months: { value: string; label: string }[] = [
    { value: '01', label: 'JAN' },
    { value: '02', label: 'FEB' },
    { value: '03', label: 'MAR' },
    { value: '04', label: 'APR' },
    { value: '05', label: 'MAY' },
    { value: '06', label: 'JUN' },
    { value: '07', label: 'JUL' },
    { value: '08', label: 'AUG' },
    { value: '09', label: 'SEP' },
    { value: '10', label: 'OCT' },
    { value: '11', label: 'NOV' },
    { value: '12', label: 'DEC' }
  ];
  years: { value: string; label: string }[] = [];
  // years = [
  //   { value: '18', label: '2018' },
  //   { value: '19', label: '2019' },
  //   { value: '20', label: '2020' },
  //   { value: '21', label: '2021' },
  //   { value: '22', label: '2022' },
  //   { value: '23', label: '2023' },
  //   { value: '24', label: '2024' },
  //   { value: '25', label: '2025' }
  // ];
  
  // Validation
  loading = false;
  formErrors: { [key: string]: string } = {};
  showCopSection = true;
  errorMessage: string | null = null;
  successMessage: string | null = null;
  roleId: any = sessionStorage.getItem('roleid');
  userid: any = sessionStorage.getItem('userid');
  constructor(
    private DashboardService:DashboardService,
    private modelService: ModelService,
    private router: Router,
    private toastService: ToastService,
    private datePickerService: DatePickerService
  ) {
    this.toastService.pageName = 'Device Model Entry'; // Set page name for toast service
  }
  
  ngOnInit() {
    this.loadInitialData();
    this.initializeDatePickers();
    
    this.loadYears();
  }
  initializeDatePickers() {
    this.datePickerService.initialize({
      inputName: 'taccertdate',
      inputId: 'tacdatecertpicker',
      singleDatePicker: true,
      format: 'DD-MMM-YYYY',
      maxDate: moment(),
      endDate: moment(),
      minYear: moment().subtract(5, 'years').year(),
      showDropdowns: true,
      drops: 'up',
      onHide: (value: string) => {
        this.tacCertDate = value;
      }
    });
    
    this.datePickerService.initialize({
      inputName: 'taccertvalidity',
      inputId: 'taccertvalidity',
      singleDatePicker: true,
      format: 'DD-MMM-YYYY',
      showDropdowns: true,
      // minDate: moment(),
      minYear: moment().subtract(5, 'years').year(),
      maxYear: moment().add(1, 'years').year(),
      endDate: moment().add(5, 'years'),
      drops: 'up',
      onHide: (value: string) => {
        this.tacCertValidity = value;
      }
    });
    
    this.datePickerService.initialize({
      inputName: 'copdatecert',
      inputId: 'copdatecertpicker',
      singleDatePicker: true,
      format: 'DD-MMM-YYYY',
      maxDate: moment(),
      endDate: moment(),
      minYear: moment().subtract(1, 'years').year(),
      showDropdowns: true,
      drops: 'up',
      onHide: (value: string) => {
        this.copCertDate = value;
      }
    });
    this.datePickerService.initialize({
      inputName: 'copcertvalidity',
      inputId: 'copcertvalidity',
      singleDatePicker: true,
      format: 'DD-MMM-YYYY',
      showDropdowns: true,
      minDate: moment(),
      maxYear: moment().add(1, 'years').year(),
      endDate: moment().add(2, 'years'),
      drops: 'up',
      onHide: (value: string) => {
        this.copCertValidity = value;
      }
    });

  }

  loadYears() {
    const currentYear = new Date().getFullYear();
    const startYear = 2018;
    const endYear = currentYear; // Up to 5 years in the future
    this.years = [];
  
    for (let year = startYear; year <= endYear; year++) {
      const shortYear = year.toString(); // Get last two digits
      this.years.push({ value: shortYear, label: year.toString() });
    }
  }

  loadInitialData() {
    if(this.roleId!='11'){
    this.loadVendorList();
    }
    this.loadCertAuthorityList();
  }
  
  loadVendorList() {
    this.DashboardService.getVendorList().subscribe({
      next: (response) => {
        if (response.status && response.entity) {
          this.vendorList = response.entity;
        }
      },
      error: (error) => {
        console.error('Error loading vendor list:', error);
      }
    });
  }
  
  loadCertAuthorityList() {
    this.modelService.getCertAuthorityRoster().subscribe({
      next: (response) => {
        if (response.status && response.entity) {
          this.certAuthorityList = response.entity;
        }
      },
      error: (error) => {
        this.errorMessage =  error;
      }
    });
  }
  
  // initializeDatePickers() {
  //   setTimeout(() => {
  //     if (typeof $ !== 'undefined' && $.fn.datepicker) {
  //       const today = new Date();
  //       const formattedToday = this.formatDateForDisplay(today);

  //       // TAC Certificate Date
  //       $('#appcertdate').datepicker({
  //         format: 'dd-M-yyyy',
  //         endDate: '+0d',
  //         autoclose: true
  //       }).on('changeDate', (e: any) => {
  //         if (e.format) {
  //           this.tacCertDate = e.format(0, 'dd-M-yyyy');
  //         }
  //       });

  //       // TAC Certificate Validity
  //       $('#appcertvalidity').datepicker({
  //         format: 'dd-M-yyyy',
  //         startDate: '+0d',
  //         autoclose: true
  //       }).on('changeDate', (e: any) => {
  //         if (e.format) {
  //           this.tacCertValidity = e.format(0, 'dd-M-yyyy');
  //         }
  //       });

  //       // COP Certificate Date
  //       $('#concertdate').datepicker({
  //         format: 'dd-M-yyyy',
  //         endDate: '+0d',
  //         autoclose: true
  //       }).on('changeDate', (e: any) => {
  //         if (e.format) {
  //           this.copCertDate = e.format(0, 'dd-M-yyyy');
  //         }
  //       });

  //       // COP Certificate Validity
  //       $('#concertvalidity').datepicker({
  //         format: 'dd-M-yyyy',
  //         startDate: '+0d',
  //         autoclose: true
  //       }).on('changeDate', (e: any) => {
  //         if (e.format) {
  //           this.copCertValidity = e.format(0, 'dd-M-yyyy');
  //         }
  //       });

  //       // Set initial dates and update models
  //       this.tacCertDate = formattedToday;
  //       this.tacCertValidity = formattedToday;
  //       this.copCertDate = formattedToday;
  //       this.copCertValidity = formattedToday;
  //     }
  //   }, 100);
  // }
  

  
  onCopUploadChange() {
    this.showCopSection = this.copUpload === 'Yes';
    if (this.copUpload === 'No') {
      this.copFile = null;
      this.copCertNo = '';
      this.copCertDate = '';
      this.copCertValidity = '';
    }
  }
  
  onTacFileChange(event: Event): void {
  const input = event.target as HTMLInputElement;

  if (input.files && input.files.length > 0) {
    const file = input.files[0];
    const maxSize = 5 * 1024 * 1024; // 5 MB

    // Check PDF
    if (file.type !== 'application/pdf') {
      this.toastService.show('Please select a PDF file only.','error');
      input.value = ''; // Clear selected file
      this.tacFile = null;
      return;
    } else 
      if (file.size > maxSize) {
        this.toastService.show('File size should not exceed 5 MB.','error');
        input.value = '';
        this.tacFile = null;
        return;
      } else {
        this.tacFile = file;
        this.validateForm();
      }


    // Check file size (5 MB)


    // Valid file
  }
}
  
  onCopFileChange(event: Event) {
    const input = event.target as HTMLInputElement;

  if (input.files && input.files.length > 0) {
    const file = input.files[0];
    // Check file size (5 MB)
    const maxSize = 5 * 1024 * 1024; // 5 MB

    // Check PDF
    if (file.type !== 'application/pdf') {
      this.toastService.show('Please select a PDF file only.','error');
      input.value = ''; // Clear selected file
      this.copFile = null;
      return;
    }else 
      if (file.size > maxSize) {
      this.toastService.show('File size should not exceed 5 MB.','error');
      input.value = '';
      this.copFile = null;
      return;
    } else {
      this.copFile = file;
      this.validateForm();
    }

    // Valid file
  }
    // const input = event.target as HTMLInputElement;
    // if (input.files && input.files.length > 0) {
    //   this.copFile = input.files[0];
    // }
  }
  
  onProtocolFileChange(event: Event) {
    const input = event.target as HTMLInputElement;
    // Check file size (5 MB)
    const maxSize = 5 * 1024 * 1024; // 5 MB

  if (input.files && input.files.length > 0) {
    const file = input.files[0];

    // Check PDF
    if (file.type !== 'application/pdf') {
      this.toastService.show('Please select a PDF file only.','error');
      input.value = ''; // Clear selected file
      this.protocolFile = null;
      return;
    }else    
      if (file.size > maxSize) {
      this.toastService.show('File size should not exceed 5 MB.','error');
      input.value = '';
      this.protocolFile = null;
      return;
    } else {
      this.protocolFile = file;
      this.validateForm();
    }

    // Valid file
  }
    // const input = event.target as HTMLInputElement;
    // if (input.files && input.files.length > 0) {
    //   this.protocolFile = input.files[0];
    // }
  }
  
  onBrochureFileChange(event: Event) {
    const input = event.target as HTMLInputElement;

  if (input.files && input.files.length > 0) {
    const file = input.files[0];
    // Check file size (5 MB)
    const maxSize = 5 * 1024 * 1024; // 5 MB

    // Check PDF
    if (file.type !== 'application/pdf') {
      this.toastService.show('Please select a PDF file only.','error');
      input.value = ''; // Clear selected file
      this.brochureFile = null;
      return;
    } else
      if (file.size > maxSize) {
      this.toastService.show('File size should not exceed 5 MB.','error');
      input.value = '';
      this.brochureFile = null;
      return;
    } else {
      // Valid file
      this.brochureFile = file;
      this.validateForm();
    }
  }
    // const input = event.target as HTMLInputElement;
    // if (input.files && input.files.length > 0) {
    //   this.brochureFile = input.files[0];
    // }
  }
  
  onCertificateFileChange(event: Event) {
    // const input = event.target as HTMLInputElement;
    // if (input.files && input.files.length > 0) {
    //   this.certificateFile = input.files[0];
    // }
    const input = event.target as HTMLInputElement;

    if (input.files && input.files.length > 0) {
        const file = input.files[0];
        // Check file size (5 MB)
        const maxSize = 5 * 1024 * 1024; // 5 MB

        // Check PDF
        if (file.type !== 'application/pdf') {
          this.toastService.show('Please select a PDF file only.','error');
          input.value = ''; // Clear selected file
          this.certificateFile = null;
          return;
        } else
          if (file.size > maxSize) {
          this.toastService.show('File size should not exceed 5 MB.','error');
          input.value = '';
          this.certificateFile = null;
          return;
        } else {
          // Valid file
          this.certificateFile = file;
          this.validateForm();
        }
      }
  }
  
  validateModelCode() {
    if (this.modelCode && this.modelCode.length < 2) {
      this.formErrors['modelCode'] = 'Model Code must be 2 characters.';
    } else {
      delete this.formErrors['modelCode'];
    }
  }
  
  validateModelName() {
    if (this.modelName && this.modelName.length < 8) {
      this.formErrors['modelName'] = 'Model Name must be at least 8 characters.';
    } else {
      delete this.formErrors['modelName'];
    }
  }
  
  validateRemark() {
    if (this.remark && this.remark.length < 10) {
      this.formErrors['remark'] = 'Remark must be at least 10 characters.';
    } else {
      delete this.formErrors['remark'];
    }
  }
  
  validateForm(): boolean {
    this.formErrors = {};
    let isValid = true;
    
    // // if (!this.modelName || this.modelName.trim() === '') {
    // //   this.formErrors['modelName'] = 'Model Name is required.';
    // //   isValid = false;
    // // } else if (this.modelName.trim().length < 8) {
    // //   this.formErrors['modelName'] = 'Model Name must be at least 8 characters.';
    // //   isValid = false;
    // // }
    
    // // if (!this.modelCode || this.modelCode.trim() === '' || this.modelCode.length !== 2) {
    // //   this.formErrors['modelCode'] = 'Model Code must be exactly 2 characters.';
    // //   isValid = false;
    // // }
    
    // // if (!this.productionMonth || this.productionMonth === 'MM') {
    // //   this.formErrors['productionMonth'] = 'Please select production month.';
    // //   isValid = false;
    // // }
    
    // // if (!this.productionYear || this.productionYear === 'YY') {
    // //   this.formErrors['productionYear'] = 'Please select production year.';
    // //   isValid = false;
    // // }
    
    // // // Check if production year is not in future
    // // const currentYear = new Date().getFullYear();
    // // const selectedYear = parseInt('20' + this.productionYear);
    // // if (selectedYear > currentYear) {
    // //   this.formErrors['productionYear'] = 'Production year cannot be in the future.';
    // //   isValid = false;
    // // }
    
    // if (!this.selectedCertAuthorityId || this.selectedCertAuthorityId === 'Select') {
    //   this.formErrors['certAuthority'] = 'Please select certified authority.';
    //   isValid = false;
    // }
    
    
    
    // if (!this.tacCertNo || this.tacCertNo.trim() === '') {
    //   this.formErrors['tacCertNo'] = 'TAC certificate number is required.';
    //   isValid = false;
    // }
    
    // if (!this.tacCertDate || this.tacCertDate.trim() === '') {
    //   this.formErrors['tacCertDate'] = 'TAC certificate date is required.';
    //   isValid = false;
    // }
    
    // if (!this.tacCertValidity || this.tacCertValidity.trim() === '') {
    //   this.formErrors['tacCertValidity'] = 'TAC certificate validity is required.';
    //   isValid = false;
    // }
    
    if (this.copUpload === 'Yes') {
      
      
      // if (!this.copCertNo || this.copCertNo.trim() === '') {
      //   this.formErrors['copCertNo'] = 'COP certificate number is required.';
      //   isValid = false;
      // }
      
      // if (!this.copCertDate || this.copCertDate.trim() === '') {
      //   this.formErrors['copCertDate'] = 'COP certificate date is required.';
      //   isValid = false;
      // }
      
      // if (!this.copCertValidity || this.copCertValidity.trim() === '') {
      //   this.formErrors['copCertValidity'] = 'COP certificate validity is required.';
      //   isValid = false;
      // }
    }

    if (!this.tacFile) {
      this.formErrors['tacFile'] = 'Please upload the TAC certificate file.';
      isValid = false;
    }

    if (!this.copFile) {
        this.formErrors['copFile'] = 'Please upload the COP certificate file.';
        isValid = false;
    }
    
    if (!this.protocolFile) {
      this.formErrors['protocolFile'] = 'Please upload the protocol file.';
      isValid = false;
    }
    
    
    return isValid;
  }
  
  formatDate(dateStr: string): string {
    // Convert from dd-M-yyyy to yyyy-MM-dd format for API
    if (!dateStr) return '';
    try {
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) {
        return ''; // Invalid date
      }
      return d.toISOString().split('T')[0];
    } catch (e) {
      return '';
    }
  }
  
  clearFormErrors() {
    this.formErrors = {};
    this.errorMessage = '';
  }
  
  insertModelData() {
    this.clearFormErrors();
    if (!this.validateForm()) {
      return;
    }
    
    // if (confirm('Are you sure you want to submit this model entry?')) {
      this.loading = true;
      this.errorMessage = '';
      
      const productionDate = `${this.productionYear}-${this.productionMonth}-01`; // Assuming day is always 01 for production date
      const certDate = this.tacCertDate;
      const certValDate = this.tacCertValidity;
      const copCertDate = this.copCertDate;//this.copUpload === 'Yes' ? this.formatDate(this.copCertDate) : '';
      const copCertValidity = this.copCertValidity;//this.copUpload === 'Yes' ? this.formatDate(this.copCertValidity) : '';
      
      const modelData: ModelEntryRequest = {
        param1: '0', // 0 for new entry
        param2: this.modelCode.trim() || '',
        param3: this.modelName.trim() || '',
        param4: this.selectedCertAuthorityId || '',
        param5: this.tacCertNo.trim() || '',
        param6: certDate,
        param7: certValDate,
        param8: productionDate,
        param9: this.copCertNo,//this.copUpload === 'Yes' ? (this.copCertNo.trim() || '') : '',
        param10: copCertDate,
        param11: copCertValidity,
        param12: this.certificateFile ? 'uploaded' : '',
        param13: this.roleId=='11' ? this.userid : this.selectedVendorId || '',
        param14: '', // creator loginid
        param15: this.tacFile ? this.tacFile.name : '',
        param16: this.copFile ? this.copFile.name : '',//this.copUpload === 'Yes' && this.copFile ? this.copFile.name : '',
        param17: this.certificateFile ? this.certificateFile.name : '',
        param18: this.brochureFile ? this.brochureFile.name : '',
        param19: this.protocolFile ? this.protocolFile.name : '',
        param20: 'true', //this.irnss === 'yes' ? 'true' : 'false',
        param21: this.remark.trim() || ''
      };
      

this.modelService.putDeviceModel(modelData).subscribe({
        next: (response) => {
          this.loading = false;
          if (response.statuscode == 200) {
            // Response may contain # separated values
            const message = typeof response.entity == 'string' ? response.entity : 'Model created successfully';
            const parts = message.split('#');
            const displayMessage = parts.length > 1 ? parts[1] : parts[0];
            this.successMessage = (displayMessage);
            
            if (displayMessage.includes('Successfully') && parts.length > 2) {
              const modelId = parts[2];
              // Upload files if model was created successfully
              this.uploadFiles(modelId);
              this.resetForm();
              this.toastService.show(displayMessage,'success');
              setTimeout(() => {
                this.router.navigate(['/model']);
              }, 2000); // Navigate after 2 seconds
            } else {
              this.toastService.show(displayMessage,'error');
            }
          } else {
            this.errorMessage = typeof response.entity === 'string' ? response.entity : 'Failed to create model';
            this.toastService.show(this.errorMessage,'error');
          }
        },
        error: (error) => {
          this.loading = false;
          this.errorMessage = error?.error?.entity || 'Error creating model';
          // this.toastService.show(this.errorMessage,'error');
        }
      });
    // }
  }
  
 uploadFiles(modelId: string) {
  const vendorId = this.roleId=='11' ? this.userid : this.selectedVendorId || '';

  // TAC
  if (this.tacFile) {
   this.modelService.uploadCertificate(
  this.tacFile!,
  'TAC',
  modelId,
  vendorId,
  this.modelName,
  this.modelCode,
  this.tacCertNo,
  this.tacCertDate,
  this.tacCertValidity

).subscribe();

  }

  // COP
  if (this.copUpload === 'Yes' && this.copFile) {
   this.modelService.uploadCertificate(
  this.copFile!,
  'COP',
  modelId,
  vendorId,
  this.modelName,
  this.modelCode,
  this.copCertNo,
  this.copCertDate,
  this.copCertValidity
).subscribe();

  }

  // Protocol
  if (this.protocolFile) {
  this.modelService.uploadCertificate(
  this.protocolFile!,
  'Protocol',
  modelId,
  vendorId,
  this.modelName,
  this.modelCode,
  '',
  '',
  ''
).subscribe();
  }
}

  
  resetForm() {
    this.selectedVendorId = '';
    this.modelName = '';
    this.modelCode = '';
    this.productionMonth = 'MM';
    this.productionYear = 'YY';
    this.selectedCertAuthorityId = 'Select';
    this.irnss = 'yes';
    this.copUpload = 'Yes';
    this.tacFile = null;
    this.tacCertNo = '';
    this.tacCertDate = '';
    this.tacCertValidity = '';
    this.copFile = null;
    this.copCertNo = '';
    this.copCertDate = '';
    this.copCertValidity = '';
    this.protocolFile = null;
    this.brochureFile = null;
    this.certificateFile = null;
    this.remark = '';
    this.showCopSection = true;
    this.clearFormErrors();
    
    const form = document.getElementById('modelentrydata') as HTMLFormElement;
    if (form) {
      form.reset();
    }
    
    // Reset file input labels
    const tacLabel = document.querySelector('label[for="taccertificate"]');
    if (tacLabel) {
      tacLabel.textContent = 'Upload File';
    }
    const copLabel = document.querySelector('label[for="copcertificate"]');
    if (copLabel) {
      copLabel.textContent = 'Upload File';
    }
  }
  
  formatDateForDisplay(date: Date): string {
    const day = String(date.getDate()).padStart(2, '0');
    const month = date.toLocaleString('default', { month: 'short' });
    const year = date.getFullYear();
    return `${day}-${month}-${year}`;
  }

  getFieldError(fieldName: string): boolean {
    return !!this.formErrors[fieldName] ;
  }

  getErrorMessage(fieldName: string): string {
    return this.formErrors[fieldName] || '';
  }
  
  goBack() {
    this.router.navigate(['/model']);
  }

  allowAlphaNumericSpace(event: any) {
  const initialValue = event.target.value;

  // allow only alphabets, numbers and space
  event.target.value = initialValue.replace(/[^a-zA-Z0-9 ]/g, '');

  // update ngModel value
  this.modelName = event.target.value;
}
 
   onMfgCodeInput(event: any) {
    const input = event.target as HTMLInputElement;
    input.value = input.value.toUpperCase().replace(/[^A-Z0-9]/g, '');
    this.modelCode = input.value;
    // this.tacCertNo = input.value;
    // this.copCertNo = input.value;
  }
  
  
}
