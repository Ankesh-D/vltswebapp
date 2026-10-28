import { Component, OnInit, ChangeDetectorRef, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { RouterModule } from '@angular/router';
import { NgSelectModule } from '@ng-select/ng-select';
import { TimepickerModule } from 'ngx-bootstrap/timepicker';

import Swal from 'sweetalert2';
import { VehicleService } from '../../../core/services/vehicle.service';
import { RouteService } from '../../../core/services/route.service';
import { DashboardService } from '../../../core/services/dashboard.service';
import { Subject } from 'rxjs';
import { ToastService } from '../../../core/services/toast.service';

declare var $: any;

@Component({
    selector: 'app-route-vehicle-mapping',
    imports: [CommonModule, FormsModule, RouterModule, NgSelectModule, TimepickerModule],
    templateUrl: './route-vehicle-mapping.component.html',
    changeDetection: ChangeDetectionStrategy.Eager,
    styleUrls: ['./route-vehicle-mapping.component.scss']
})
export class RouteVehicleMappingComponent implements OnInit {
  // Dropdown lists
  rtolist: any[] = [];
  vehiclelist: any[] = [];
  routelist: any[] = [];

  // Selection models
  selectedRTOId: any = null;
  selectedVehicleId: any = null;
  selectedRouteId: any = null;
  fromTime: Date = this.createTime(0, 0);
  toTime: Date = this.createTime(23, 59);

  // Table properties
  unmapvehicleroutedata: any[] = [];
  searchText: string = '';
  currentPage: number = 1;
  pageSize: any = 20;
  totalCount: number = 0;
  pageCount: number = 0;
  pageSizeOptions: any[] = [20, 50, 100, 'All'];

  // Sorting
  sortKey: string = '';
  reverse: boolean = false;

  // Modal properties
  selectedData: any = null;
  remark: string = '';
  isIncorrect: boolean = true;
  loading: boolean = false;
  encryptUrl: string = '';
  roleId: any = sessionStorage.getItem('roleid');
  errorMessage: string | null = null;
  searchInput = new Subject<string>();

  vehicleList: any[] = [];
  fullVehicleList: any[] = [];
  visibleVehicleList: any[] = [];

  vehicleLimit = 100;   // 🔥 only 100 items render
  vehicleSearch = '';
  selectedVehicle: any = null;
  isVehicleLoaded = false;
  loadingVehicle: boolean = false;

  constructor(private http: HttpClient, private cdr: ChangeDetectorRef,
    private routeService: RouteService, private dashboardService: DashboardService,
    private vehicleService: VehicleService, private toast: ToastService) { }

  ngOnInit() {
    this.loadInitialRosters();
    this.getRouteVehicleUnmapDetails(1);
    this.searchInput.subscribe(searchText => this.onVehicleTypeaheadSearch(searchText));
  }


  loadInitialRosters() {
    this.getRouteRoster();
    this.getRtoRoster();
  }

  getRtoRoster() {
    this.dashboardService.getRTOList().subscribe(res => {
      if (res.status) this.rtolist = res.entity;
    });
  }

  getVehicleRoster() {
    this.selectedVehicleId = null;
    this.selectedVehicle = null;
    this.vehicleSearch = '';
    this.vehiclelist = [];
    this.fullVehicleList = [];
    this.visibleVehicleList = [];
    this.isVehicleLoaded = false;
    this.loadingVehicle = false;
  }

  onVehicleSearchChange() {

    if (!this.vehicleSearch) {
      // 🔥 input empty → reset everything
      this.fullVehicleList = [];
      //this.visibleVehicleList = [{param1: 'All', param2: 'All'}];
      this.selectedVehicle = null;
      this.isVehicleLoaded = false;
    }

  }

  onVehicleTypeaheadSearch(searchText: string) {
    if (!this.selectedRTOId) {
      this.visibleVehicleList = [];
      this.fullVehicleList = [];
      this.selectedVehicleId = null;
      this.loadingVehicle = false;
      return;
    }

    const lastFourDigits = (searchText || '').replace(/\D/g, '').slice(0, 4);
    this.vehicleSearch = lastFourDigits;
    this.selectedVehicle = null;

    if (!lastFourDigits) {
      this.fullVehicleList = [];
      //this.visibleVehicleList = [{param1: 'All', param2: 'All'}];
      this.isVehicleLoaded = false;
      this.loadingVehicle = false;
      return;
    }

    if (lastFourDigits.length === 4) {
      this.searchVehicle();
    }
  }

  searchVehicle() {
    if (!this.selectedRTOId) {
      this.toast.show('Please select RTO first', 'error');
      this.loadingVehicle = false;
      return;
    }

    this.loadingVehicle = true;

    const req = {
      selectvendorid: '',
      selectroleid: '',
      routeid: '',
      poiid: '',
      selectcustomerid: '',
      vehicleclassid: '',
      //  searchtype: this.deviceType === 'NEW' ? 'TCP' : 'HTTP',
      searchtype: '',
      rtoid: this.selectedRTOId || '',
      searchby: this.vehicleSearch
    };

    this.vehicleService.getVehicleListV2(req).subscribe((res: any) => {

      const data = res?.entity || [];

      // ❌ NO DATA
      if (!data || data.length === 0) {

        this.fullVehicleList = [];
        //this.visibleVehicleList = [{param1: 'All', param2: 'All'}];
        this.isVehicleLoaded = false;
        this.loadingVehicle = false;
        this.toast.show('No vehicle found', 'error');   // 🔥 DIRECT

        return;
      }

      // ✅ DATA FOUND
      this.fullVehicleList = data;
      this.visibleVehicleList = data.slice(0, this.vehicleLimit);
      this.isVehicleLoaded = true;
      this.loadingVehicle = false;

      this.toast.show('Vehicle loaded successfully', 'success'); // optional

      this.cdr.detectChanges();

    }, err => {

      this.toast.show('Something went wrong', 'error'); // 🔥 DIRECT
      this.isVehicleLoaded = false;
      this.loadingVehicle = false;

    });
  }

  getRouteRoster() {
    this.routeService.getRouteRoster()
      .subscribe(res => {
        if (res.status) this.routelist = res.entity;
      });
  }

  mapRouteToVehicle() {
    if (!this.selectedVehicleId) {
      this.errorMessage = 'Please Select Vehicle';
      return;
    }
    if (!this.selectedRouteId) {
      this.errorMessage = 'Please Select Route';
      return;
    }
    if (!this.fromTime || !this.toTime) {
      this.errorMessage = 'Please Enter Time Range';
      return;
    }

    const formattedFromTime = this.fromTime.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true });
    const formattedToTime = this.toTime.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true });

    const payload = {
      param1: this.selectedVehicleId,
      param2: this.selectedRouteId,
      param3: formattedFromTime,
      param4: formattedToTime
    };

    this.loading = true;
    this.routeService.assignRouteToVehicle(payload)
      .subscribe({
        next: (res) => {
          this.loading = false;
          this.toast.show(res.entity, 'success');
          this.getRouteVehicleUnmapDetails(1);
          this.resetForm();
        },
        error: () => { this.loading = false; this.toast.show('Mapping failed', 'error'); }
      });
  }

  getRouteVehicleUnmapDetails(pageno: number) {
    this.currentPage = pageno;
    const payload = {
      param1: this.searchText.trim(),
      param2: this.currentPage.toString(),
      param3: this.pageSize === 'All' ? 'All' : this.pageSize.toString()
    };

    this.routeService.getRouteVehicleMappingDetails(payload)
      .subscribe(res => {
        if (res.status && res.entity) {
          this.unmapvehicleroutedata = res.entity.listData || [];
          this.totalCount = res.entity.param1 || 0;
        }
        this.cdr.detectChanges();
      });
  }

  openUnmapModal(data: any) {
    this.selectedData = data;
    this.remark = '';
    this.isIncorrect = true;
    $('#unmapmodel').modal('show');
  }

  unmapRouteFromVehicle() {
    const payload = {
      param1: this.selectedData.param2, // Route ID
      param2: this.selectedData.param1, // Vehicle ID
      param4: this.remark
    };

    this.routeService.unassignRouteFromVehicle(payload)
      .subscribe(res => {
        this.toast.show(res.entity, 'success');
        $('#unmapmodel').modal('hide');
        this.getRouteVehicleUnmapDetails(1);
      });
  }

  sort(key: string) {
    if (this.sortKey === key) {
      this.reverse = !this.reverse;
    } else {
      this.sortKey = key;
      this.reverse = false;
    }

    this.unmapvehicleroutedata.sort((a, b) => {
      const valA = a[key] ?? '';
      const valB = b[key] ?? '';
      if (valA < valB) return this.reverse ? 1 : -1;
      if (valA > valB) return this.reverse ? -1 : 1;
      return 0;
    });
    this.cdr.detectChanges();
  }

  validRemark() {
    // This handles the validation state when the user types in the remark textarea
    this.isIncorrect = this.remark.trim().length < 10;
  }

  resetForm() {
    this.selectedVehicleId = null;
    this.selectedRouteId = null;
    this.fromTime = this.createTime(0, 0);
    this.toTime = this.createTime(23, 59);
  }

  private createTime(hours: number, minutes: number): Date {
    const date = new Date();
    date.setHours(hours, minutes, 0, 0);

    return date;
  }
}
