import { ToastService } from './../../../core/services/toast.service';
import { Component, OnInit, ChangeDetectorRef, ViewChild, ChangeDetectionStrategy } from '@angular/core';

import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { FormsModule, NgForm } from '@angular/forms';
import { ModelService, Model, ModelRequest, ModelListResponse } from '../../../core/services/model.service';
import { HttpClient } from '@angular/common/http';
import { ToastComponent } from '../../assets/inactive-assets/toast.component';
import { NgSelectModule } from '@ng-select/ng-select';
import { DeviceModelDeleteReq } from '../../../core/model/request.model';
import { DatePickerService } from '../../../core/services/date-picker.service';
import moment from 'moment';
import { CommonModule } from '@angular/common';
import { CommonDataToolbarComponent } from '../../../shared/components/common-data-toolbar/common-data-toolbar.component';
import { CommonPaginationComponent } from '../../../shared/components/common-pagination/common-pagination.component';
import { CommonTableColumn, CommonTableComponent } from '../../../shared/components/common-table/common-table.component';

export type CertificateType =
  | 'TAC'
  | 'COP'
  | 'Protocol'
  | 'CERT'
  | 'BROCHURE';
declare var $: any;

@Component({
    selector: 'app-model-list',
    imports: [CommonModule, FormsModule, RouterModule, ToastComponent, NgSelectModule,
      CommonDataToolbarComponent, CommonPaginationComponent, CommonTableComponent],
    templateUrl: './model-list.component.html',
    changeDetection: ChangeDetectionStrategy.Eager,
    styleUrls: ['./model-list.component.scss']
})
export class ModelListComponent implements OnInit {
  vendorId = '';
  editForm: any = {
    modelId: '',
    modelCode: '',
    modelName: '',
    certAuthority: '',
    tacCertNo: '',
    tacCertDate: '',
    tacCertValidity: '',
    productionDate: '',
    copCertNo: '',
    copCertDate: '',
    copCertValidity: '',
    remark: ''
  };

  models: Model[] = [];
  loading = false;
  searchText = '';
  currentPage = 1;
  pageSize = 20;
  pageSizeOptions = [20];
  totalCount = 0;
  pageCount = 0;

  // Sorting
  sortKey: string = '';
  reverse: boolean = false;
  readonly tableColumns: CommonTableColumn[] = [
    { key: 'param1', label: '#', width: '3%' },
    { key: 'param15', label: 'Vendor', sortable: true, width: '9%' },
    { key: 'param3', label: 'Model Code', sortable: true, width: '8%' },
    { key: 'param4', label: 'Model Name', sortable: true, width: '11%' },
    { key: 'param9', label: 'Production Date', sortable: true, width: '8%' },
    { key: 'param7', label: 'Certified Date', sortable: true, width: '8%' },
    { key: 'param20', label: 'Approval Status', sortable: true, width: '9%' },
    { key: 'param5', label: 'Certification Authority', sortable: true, width: '13%' },
    { key: 'param18', label: 'Approved By', sortable: true, width: '9%' },
    { key: 'param8', label: 'TAC Validity / COP Validity', sortable: true, width: '11%' },
    { key: 'activity', label: 'Activity', width: '11%' }
  ];

  // Selected model for edit/delete
  selectedModel: Model =new Model();
  updateRemark = '';
  modelId = '';
  status = '';
  remarkForDelete = '';
  showEditModal = false;
  showDeleteModal = false;
  roleId: string = "";
  isExporting: boolean = false;
  copDate: string = '';
  errorMessage: string | null = null;
  successMessage: string | null = null;
  selectedCertAuthorityId: any | null = null;
  certAuthorityList: any[] = [];


  constructor(
    private modelService: ModelService,
    private route: ActivatedRoute,
    private router: Router,
    private cdr: ChangeDetectorRef,
    private http: HttpClient,
    private ToastService: ToastService,
    private datePickerService: DatePickerService
  ) {
    this.ToastService.pageName = 'Device Model Details'; // Set page name for toast service
    this.roleId = sessionStorage.getItem('roleid') || '';
  }

  ngOnInit() {
    // this.initializeDatePickers();
    this.loadModels();
    this.loadYears();
    this.loadMonths();
  }
  initializeDatePickers() {
    this.datePickerService.initialize({
      inputName: 'taccertdate',
      inputId: 'taccertdate',
      singleDatePicker: true,
      format: 'DD-MMM-YYYY',
      minYear: moment().subtract(5, 'years').year(),
      maxYear: moment().add(5, 'years').year(),
      endDate: moment().add(5, 'years'),
      showDropdowns: true,
      onHide: (value: string) => {
        this.editForm.tacCertDate = value;
      }
    });
    this.datePickerService.initialize({
      inputName: 'copcertdate',
      inputId: 'copcertdate',
      singleDatePicker: true,
      format: 'DD-MMM-YYYY',
      showDropdowns: true,
      minYear: moment().subtract(5, 'years').year(),
      maxYear: moment().add(5, 'years').year(),
      endDate: new Date(),
      onHide: (value: string) => {
        this.editForm.copCertDate = value;
      }
    });
    
    this.datePickerService.initialize({
      inputName: 'taccertvalidity',
      inputId: 'taccertvalidity',
      singleDatePicker: true,
      format: 'DD-MMM-YYYY',
      showDropdowns: true,
      minYear: moment().subtract(5, 'years').year(),
      maxYear: moment().add(5, 'years').year(),
      endDate: new Date(),
      onHide: (value: string) => {
        this.editForm.tacCertValidity = value;
      }
    });
    this.datePickerService.initialize({
      inputName: 'copcertvalidity',
      inputId: 'copcertvalidity',
      singleDatePicker: true,
      format: 'DD-MMM-YYYY',
      showDropdowns: true,
      minYear: moment().subtract(5, 'years').year(),
      maxYear: moment().add(5, 'years').year(),
      endDate: new Date(),
      onHide: (value: string) => {
        this.editForm.copCertValidity = value;
      }
    });


  }
  years: { value: string; label: string }[] = [];
  months: { value: string; label: string }[] = [];
  productionMonth: any = null;
  productionYear: any = null;
  loadYears() {
    const currentYear = new Date().getFullYear();
    const startYear = 2018;
    const endYear = currentYear; // Up to 5 years in the future
    this.years = [];
  
    for (let year = startYear; year <= endYear; year++) {
      const shortYear = year.toString(); 
      this.years.push({ value: shortYear, label: year.toString() });
    }
  }
  loadMonths() {
    this.months = [
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
  }

  loadCertAuthorityList() {
    this.modelService.getCertAuthorityRoster().subscribe({
      next: (response) => {
        if (response.status && response.entity) {
          this.certAuthorityList = response.entity;
        }
      },
      error: (error) => {
        this.errorMessage = error;
      }
    });
  }

  formatDate(date: Date): string {
    const day = String(date.getDate()).padStart(2, '0');
    const month = date.toLocaleString('default', { month: 'short' });
    const year = date.getFullYear();
    return `${day}-${month}-${year}`;
  }
  updatePageSizeOptions() {
    // Generate page size options based on total count
    const options = [20];
    if (this.totalCount > 50) options.push(50);
    if (this.totalCount > 100) options.push(100);
    if (this.totalCount > 200) options.push(200);
    if (this.totalCount > 500) options.push(500);
    if (this.totalCount > 1000) options.push(1000);
    if (this.totalCount > 0 && this.totalCount < 100) options.push(this.totalCount); // 'All'
    this.pageSizeOptions = options;
  }

  loadModels() {
    this.loading = true;
    this.errorMessage = '';

    const request: ModelRequest = {
      param1: this.searchText || '',
      param2: this.currentPage.toString(),
      param3: this.pageSize === this.totalCount ? 'All' : this.pageSize.toString()
    };

    this.modelService.getModelDetails(request).subscribe({
      next: (response) => {
      this.loading = false;

if (response.status && response.entity) {
  this.models = response.entity.listData || [];
  this.models = this.models.map(model => {
    // Format the dates for display
    model.param7 = model.param7 ? moment(model.param7).format('DD-MMM-YYYY') : '';
    model.param8 = model.param8 ? moment(model.param8).format('DD-MMM-YYYY') : '';
    model.param9 = model.param9 ? moment(model.param9).format('DD-MMM-YYYY') : '';
    model.param11 = model.param11 ? moment(model.param11).format('DD-MMM-YYYY') : '';
    model.param12 = model.param12 ? moment(model.param12).format('DD-MMM-YYYY') : '';
    return model;
  });
  this.totalCount = response.entity.param1 || 0;
  this.pageCount = this.models.length;

  this.updatePageSizeOptions();
  // this.pageSizeOptions = this.totalCount > 20 ? [20, 50, 100, this.totalCount] : [this.totalCount];

} else {
  // 🔥 IMPORTANT FIX
  this.models = [];          // table ko empty karo
  this.totalCount = 0;
  this.pageCount = 0;

  // Optional: error message clean rakho
 this.errorMessage =
  typeof response.entity === 'string'
    ? response.entity
    : 'No Data Found';
}

this.cdr.detectChanges();
      },
      error: (error) => {
        this.loading = false;
        this.errorMessage = error?.error?.entity || 'Error loading models';
        this.cdr.detectChanges();
      }
    });
  }

  getSearchDetails() {
    this.currentPage = 1;
    this.loadModels();
  }

  reloadData() {
    this.searchText = '';
    this.currentPage = 1;
    this.pageSize = 20;
    this.loadModels();
  }

  sort(key: string) {
    if (this.sortKey === key) {
      this.reverse = !this.reverse;
    } else {
      this.sortKey = key;
      this.reverse = false;
    }

    // Sort the models array
    this.models.sort((a, b) => {
      const aVal = (a as any)[key] || '';
      const bVal = (b as any)[key] || '';

      if (this.reverse) {
        return bVal.localeCompare(aVal);
      } else {
        return aVal.localeCompare(bVal);
      }
    });
  }

  onPageChange(page: number) {
    this.currentPage = page;
    this.loadModels();
  }

  onPageSizeChange(size: string) {
    this.pageSize = size === 'All' ? this.totalCount : parseInt(size);
    this.currentPage = 1;
    this.loadModels();
  }

  getPaginatedModels(): Model[] {
    return this.models;
  }

  getTotalPages(): number {
    return Math.ceil(this.totalCount / this.pageSize);
  }

  getPageNumbers(): number[] {
    const totalPages = this.getTotalPages();
    const pages: number[] = [];
    for (let i = 1; i <= totalPages; i++) {
      pages.push(i);
    }
    return pages;
  }

  openEditModal(model: Model) {
    this.selectedModel = model;

    this.vendorId = model.param14 || ''; // ✅ CORRECT

    this.editForm = {
      modelId: model.param2 || '',
      modelCode: model.param3 || '',
      modelName: model.param4 || '',
      certAuthority: model.param5 || '',
      productionDate: model.param9 || '',
      tacCertNo: model.param6 || '',
      tacCertDate: model.param7 ? moment(model.param7).format('DD-MMM-YYYY') : '',
      tacCertValidity: model.param8 ? moment(model.param8).format('DD-MMM-YYYY') : '',
      copCertNo: model.param10 || '',
      copCertDate: model.param11 ? moment(model.param11).format('DD-MMM-YYYY') : '',
      copCertValidity: model.param12 ? moment(model.param12).format('DD-MMM-YYYY') : '',
      remark: ''
    };
    const productionDate = this.editForm.productionDate;

this.productionMonth = productionDate
  ? moment(productionDate, 'DD-MMM-YYYY').format('MM') // June
  : null;

    // this.productionMonth = this.editForm.productionDate ? moment(this.editForm.productionDate, 'DD-MMM-YYYY').format('MMM') : null;
    this.productionYear = this.editForm.productionDate ? moment(this.editForm.productionDate, 'DD-MMM-YYYY').format('YYYY') : null;
    // console.log('Comparing month:',this.productionMonth);
    this.months.forEach(month => {
      if (month.value == this.productionMonth) {
        this.productionMonth = month;
      }
    });
    this.years.forEach(year => {
      if (year.value == this.productionYear) {
        this.productionYear = year;
      }
    });
    this.showEditModal = true;
    
    setTimeout(() => {
      this.updateDatePickers();
    }, 100);
    // setTimeout(() => {
    //   this.datePickerService.setDate('taccertdate', this.editForm.tacCertDate);
    //   this.datePickerService.setDate('copcertdate', this.editForm.copCertDate);
    //   // this.datePickerService.setDate('productiondate', model.param9);
    //   this.datePickerService.setDate('taccertvalidity', this.editForm.tacCertValidity);
    //   this.datePickerService.setDate('copcertvalidity', this.editForm.copCertValidity);
    // }, 1000);

    this.modelService.getCertAuthorityRoster().subscribe({
      next: (response) => {
        if (response.status && response.entity) {
          this.certAuthorityList = response.entity;
          const found = this.certAuthorityList.find((x: any) => x.param2 === model.param5);
          this.selectedCertAuthorityId = found ? found.param1 : null;
        }
      },
      error: (error) => this.errorMessage = error
    });
  }
  updateDatePickers() {
    this.datePickerService.initialize({
      inputName: 'taccertdate',
      inputId: 'taccertdate',
      singleDatePicker: true,
      format: 'DD-MMM-YYYY',
      minYear: moment().subtract(5, 'years').year(),
      maxYear: moment().add(5, 'years').year(),
      endDate: moment().add(5, 'years'),
      startDate: this.editForm.tacCertDate ? moment(this.editForm.tacCertDate, 'DD-MMM-YYYY').toDate() : undefined,
      showDropdowns: true,
      onHide: (value: string) => {
        this.editForm.tacCertDate = value;
      }
    });
    this.datePickerService.initialize({
      inputName: 'copcertdate',
      inputId: 'copcertdate',
      singleDatePicker: true,
      format: 'DD-MMM-YYYY',
      showDropdowns: true,
      minYear: moment().subtract(5, 'years').year(),
      maxYear: moment().add(5, 'years').year(),
      startDate: this.editForm.copCertDate ? moment(this.editForm.copCertDate, 'DD-MMM-YYYY').toDate() : undefined,
      endDate: new Date(),
      onHide: (value: string) => {
        this.editForm.copCertDate = value;
      }
    });
    
    this.datePickerService.initialize({
      inputName: 'taccertvalidity',
      inputId: 'taccertvalidity',
      singleDatePicker: true,
      format: 'DD-MMM-YYYY',
      showDropdowns: true,
      minYear: moment().subtract(5, 'years').year(),
      maxYear: moment().add(5, 'years').year(),
      startDate: this.editForm.tacCertValidity ? moment(this.editForm.tacCertValidity, 'DD-MMM-YYYY').toDate() : undefined,
      endDate: new Date(),
      onHide: (value: string) => {
        this.editForm.tacCertValidity = value;
      }
    });
    this.datePickerService.initialize({
      inputName: 'copcertvalidity',
      inputId: 'copcertvalidity',
      singleDatePicker: true,
      format: 'DD-MMM-YYYY',
      showDropdowns: true,
      minYear: moment().subtract(5, 'years').year(),
      maxYear: moment().add(5, 'years').year(),
      startDate: this.editForm.copCertValidity ? moment(this.editForm.copCertValidity, 'DD-MMM-YYYY').toDate() : undefined,
      endDate: new Date(),
      onHide: (value: string) => {
        this.editForm.copCertValidity = value;
      }
    });
  }

  closeEditModal() {
    this.showEditModal = false;
    this.selectedModel = new Model();
    this.editForm.remark = '';
  }

  formatDateToISO(dateStr: string): string {
    if (!dateStr) return '';

    // if already yyyy-MM-dd
    if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
      return dateStr;
    }

    // convert 30-Sep-2026 → 2026-09-30
    const d = new Date(dateStr);
    return d.toISOString().split('T')[0];
  }
  @ViewChild('masterForm') masterForm!: NgForm;

  updateModel() {
   
   if(!this.masterForm.valid) {
      this.errorMessage = 'Please fill all required fields correctly.';
      return;
    } else {
      const productionDate = `01-${this.productionMonth.value}-${this.productionYear}`; // Assuming day is always 01
      const payload = {
        param1: this.editForm.modelId,
        param2: this.editForm.modelCode,
        param3: this.editForm.modelName,
        param4: this.selectedCertAuthorityId,
        param5: this.editForm.tacCertNo,
        param6: this.editForm.tacCertDate,
        param7: this.editForm.tacCertValidity,
        param8: `${moment(productionDate, 'DD-MM-YYYY').format('YYYY-MM-DD')}`, // Convert to YYYY-MM-DD
        param9: this.editForm.copCertNo,
        param10: this.editForm.copCertDate,
        param11: this.editForm.copCertValidity,
        param12: '',
        param13: this.vendorId,
        param14: 'UPDATE',
        param15: "",//tac_cert_path
        param16: "",//cop_cert_path
        param17: "",//model_cert_path
        param18: "",//Brochure_path
        param19: "",//Protocol_path
        param20: "",//isirnss
        param21: this.editForm.remark.trim(),
      };
  
     
  
  
      console.log(payload);
      // this.modelService.editDeviceModel(payload).subscribe({
      //   next: (res) => {
      //     if (res.statuscode === 200) {
      //       this.successMessage = 'Model updated successfully';
      //       this.ToastService.show('Model updated successfully','success');
      //       this.closeEditModal();
      //       this.loadModels();
      //     } else {
      //       this.errorMessage = res.entity || 'Update failed';
      //       this.ToastService.show(res.entity || 'Update failed','error');
      //     }
      //   },
      //   error: () => this.errorMessage = 'Server error'
      // });

    }


  }

  openDeleteModal(model: Model) {
    this.selectedModel = model;
    this.remarkForDelete = '';
    this.showDeleteModal = true;
  }



  closeDeleteModal() {
    this.showDeleteModal = false;
    this.selectedModel = new Model();
    this.remarkForDelete = '';
  }

  deleteModel() {
    //console.log('DELETE PAYLOAD', payload);
    const deleteRequest:DeviceModelDeleteReq =  new DeviceModelDeleteReq();
    deleteRequest.param1 = this.selectedModel.param2; // modelId
    deleteRequest.param3 = this.remarkForDelete.trim(); // remark
    deleteRequest.param4 = this.selectedModel.param14; // vendorId
    this.modelService.deleteDeviceModel(deleteRequest).subscribe({
      next: (res) => {
        if (res.statuscode === 200) {
          this.ToastService.show('Model deleted successfully','success');
          this.closeDeleteModal();
          this.loadModels();
        } else {
          this.ToastService.show(res.entity || 'Delete failed','error');
          this.selectedModel = new Model();
          // alert(res.entity || 'Delete failed');
        }
      },
      error: () => this.ToastService.show('Server error while deleting model','error')
    });
  }







  goHome() {
    this.router.navigate(['/dashboard']);
  }

  pdfUrl: string | null = null;
  showNoPreview = false;

  data: any = {};
  selectedType!: CertificateType;

  displayModelviewDetail(data: any, selectedType: CertificateType) {
    this.data = data;
    this.selectedType = selectedType;
    this.showNoPreview = false;

    switch (selectedType) {
      case 'TAC':
        this.loadPdf(data.param21);
        break;

      case 'COP':
        this.loadPdf(data.param22);
        break;

      case 'Protocol':
        this.loadPdf(data.param25);
        break;
    }
  }

  private loadPdf(url: string) {
    if (!url) {
      this.showNoPreview = true;
      this.pdfUrl = null;
      return;
    }

    this.http.get(url, { responseType: 'blob' }).subscribe({
      next: () => {
        this.pdfUrl = url;
        this.showNoPreview = false;
      },
      error: () => {
        this.showNoPreview = true;
        this.pdfUrl = null;
      }
    });
  }
  exportToExcel() {

    this.isExporting = true;

    const request = {
      param1: this.searchText || '',
      param2: '',   // pagination ignore for full export
      param3: '',
      pdfexcel: 'excel'
    };

    this.modelService.getModelDetailsForExport(request)
      .subscribe({
        next: (response: any) => {

          this.isExporting = false;

          if (response?.status && typeof response.entity === 'string') {

            const link = document.createElement('a');
            link.href = response.entity;
            link.download = '';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);

          } else {
            alert('Failed to generate Excel');
          }
        },
        error: (err) => {
          this.isExporting = false;
          alert('Error exporting Excel');
          console.error(err);
        }
      });
  }

  getFieldError(field: string): boolean {
    // Basic implementation to prevent template errors.
    // You can add logic here if you want to highlight invalid fields in red.
    return false;
  }

}
