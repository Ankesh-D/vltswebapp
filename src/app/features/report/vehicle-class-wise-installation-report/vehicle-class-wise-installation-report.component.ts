import { Component, OnInit, ChangeDetectionStrategy } from '@angular/core';

import { FormsModule } from '@angular/forms';
import { VahanService } from '../../../core/services/vahan.service';
import { ReportService } from './../../../core/services/report.service';
import { ToastService } from '../../../core/services/toast.service';
import { CommonDataToolbarComponent } from '../../../shared/components/common-data-toolbar/common-data-toolbar.component';
import { CommonTableColumn, CommonTableComponent } from '../../../shared/components/common-table/common-table.component';

@Component({
    selector: 'app-vehicle-class-wise-installation-report',
    imports: [
    FormsModule,
    CommonDataToolbarComponent, CommonTableComponent],
    templateUrl: './vehicle-class-wise-installation-report.component.html',
    changeDetection: ChangeDetectionStrategy.Eager,
    styleUrls: ['./vehicle-class-wise-installation-report.component.scss']
})

export class VehicleClassWiseInstallationReportComponent implements OnInit {
  readonly tableColumns: CommonTableColumn[] = [
    { key: 'column1', label: 'Sr No', width: '35px' },
    { key: 'column2', label: 'Vehicle Class Name' },
    { key: 'column3', label: 'Installed' },
    { key: 'column4', label: 'Activated' },
    { key: 'column5', label: 'Approved (Mvi Verified)' },
    { key: 'column6', label: 'Vahan Uploaded (sucessfully )' },
    { key: 'column7', label: 'Others (pending )' }
  ];


  reportList: any[] = [];
downloadType: string = '';
  searchBy: string = '';
  fromDate: string = '';
  toDate: string = '';

  pageNo: number = 1;
  itemPerPage: number = 20;

  totalRecords: number = 0;
  totalPages: number = 0;

  pages: number[] = [];

  loading: boolean = false;
vehicleClassList: any[] = [];

selectedVehicleClass: string = '';
  constructor(
    private reportService: ReportService, private vahanService: VahanService,
    private toastService: ToastService
  ) {
    this.toastService.pageName = 'Vehicle Class Wise Installation Report'; // Set page name for toast service
  }

  ngOnInit(): void {

  this.getVehicleClassRoster();
    this.getReport();
  }
// =============================
// VEHICLE CLASS DROPDOWN API
// =============================

getVehicleClassRoster(): void {

  this.vahanService
    .getVehicleClassRoster()
    .subscribe({

      next: (res: any) => {

        // console.log(
        //   'Vehicle Class =>',
        //   res
        // );

        if (res?.status) {

          this.vehicleClassList =
            res?.entity || [];

        }

      },

      error: (err: any) => {

        // console.log(err);

      }

    });

}
  getReport(): void {

    this.loading = true;

    const payload = {
      param1: this.searchBy || '',
      param2: this.pageNo,
      param3: this.itemPerPage,
      param4: this.fromDate || '',
      param5: this.toDate || '',
 pdfexcel: '',
  param6: this.selectedVehicleClass || ''
    };

    // console.log('Payload => ', payload);

    this.reportService
      .getVehicleClassWiseInstallationReport(payload)
      .subscribe({

        next: (res: any) => {

          // console.log('API Response => ', res);

          if (res?.status) {

            this.reportList =
              res?.entity?.listData || [];

            this.totalRecords =
              this.reportList.length || 0;

            this.totalPages = Math.ceil(
              this.totalRecords / this.itemPerPage
            );

            this.generatePages();

          } else {

            this.reportList = [];
            this.totalRecords = 0;
            this.totalPages = 0;

          }

          this.loading = false;

        },

        error: (err: any) => {

          // console.log('API Error => ', err);

          this.loading = false;

          this.reportList = [];
          this.totalRecords = 0;
          this.totalPages = 0;

        }

      });

  }

  searchReport(): void {

    this.pageNo = 1;

    this.getReport();

  }

  resetFilters(): void {

    this.searchBy = '';
    this.fromDate = '';
    this.toDate = '';

    this.pageNo = 1;

    this.getReport();

  }

  changePage(page: number): void {

    if (page < 1 || page > this.totalPages) {
      return;
    }

    this.pageNo = page;

    this.getReport();

  }

  generatePages(): void {

    this.pages = [];

    let start = Math.max(this.pageNo - 2, 1);

    let end = Math.min(
      start + 4,
      this.totalPages
    );

    for (let i = start; i <= end; i++) {
      this.pages.push(i);
    }

  }
// ==========================
// DOWNLOAD REPORT
// ==========================

downloadReport(): void {

  if (!this.downloadType) {
    this.downloadType = 'excel';
  }

  if (this.downloadType !== 'excel') {
    return;
  }

  const payload = {

    param1: this.searchBy || '',

    param2: this.pageNo,

    param3: this.itemPerPage,

    param4: this.fromDate || '',

    param5: this.toDate || '',

    param6: this.selectedVehicleClass || '',

    // DOWNLOAD TYPE
    pdfexcel: 'excel'

  };

  // console.log(
  //   'Download Payload => ',
  //   payload
  // );

  this.reportService
    .getVehicleClassWiseInstallationReport(payload)
    .subscribe({

      next: (res: any) => {

        // console.log(
        //   'Download Response => ',
        //   res
        // );

        if (
          res?.status &&
          res?.entity
        ) {

          window.open(
            res.entity,
            '_blank'
          );

        }

        this.downloadType = '';

      },

      error: (err: any) => {

        // console.log(err);

        this.downloadType = '';

      }

    });

}
}