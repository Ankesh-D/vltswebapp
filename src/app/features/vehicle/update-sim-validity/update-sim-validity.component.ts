import { Component, OnInit, AfterViewInit, ChangeDetectorRef, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { SimValidityService } from '../../../core/services/sim-validity.service';
import { ToastComponent } from '../../assets/inactive-assets/toast.component';
import { NgbPaginationModule } from '@ng-bootstrap/ng-bootstrap';
import { ToastService } from '../../../core/services/toast.service';

declare var $: any;
declare var jAlert: any;

@Component({
    selector: 'app-update-sim-validity',
    imports: [CommonModule, FormsModule, RouterModule, NgbPaginationModule],
    templateUrl: './update-sim-validity.component.html',
    changeDetection: ChangeDetectionStrategy.Eager,
    styleUrls: ['./update-sim-validity.component.scss']
})
export class UpdateSimValidityComponent implements OnInit, AfterViewInit {
  simValidityData: any[] = [];
  loading = false;

  searchText: string = '';
  currentPage = 1;
  pageSize = 20;
  pageSizeOptions = [20, 50, 100, 200, 500];
  totalCount = 0;
  pageCount = 0;

  // Slider properties for animated tabs
  sliderPosition: string = '0px';
  sliderWidth: string = '0px';

  sortKey: string = '';
  reverse: boolean = false;

  // Update status tracking
  updatingDevices: Set<string> = new Set();

  constructor(
    private simValidityService: SimValidityService,
    private cdr: ChangeDetectorRef,
    private toast: ToastService
  ) {
    this.toast.pageName = 'Update Sim Validity'; // Set page name for toast service
  }

  ngOnInit() {
    this.getSimValidityDetails(1);
  }

  ngAfterViewInit() {
    setTimeout(() => {
      if (typeof $ !== 'undefined' && $.fn.select2) {
        $('.searchable').select2();
      }

      // Initialize slider position for animated tabs
      const tabsContainer = document.querySelector('.modern-tabs-track');
      if (tabsContainer) {
        const activeTab = tabsContainer.querySelector('.modern-tab-item.active') || tabsContainer.querySelector('.modern-tab-item');
        if (activeTab) {
          const tabEl = activeTab as HTMLElement;
          this.sliderWidth = tabEl.clientWidth + 'px';
          this.sliderPosition = tabEl.offsetLeft + 'px';
          this.cdr.detectChanges();
        }
      }
    }, 200);
  }

  updateSlider(event: Event) {
    const target = event.currentTarget as HTMLElement;
    if (target) {
      // Use direct element properties for performance
      this.sliderWidth = target.clientWidth + 'px';
      this.sliderPosition = target.offsetLeft + 'px';
      
      // Run change detection to ensure the style updates immediately
      this.cdr.detectChanges();
    }
  }
  updatePageSizeOptions() {
    // Generate page size options based on total count
    const options = [20];
    if (this.totalCount > 50) options.push(50);
    if (this.totalCount > 100) options.push(100);
    if (this.totalCount > 200) options.push(200);
    if (this.totalCount > 500) options.push(500);
    if (this.totalCount > 0 && this.totalCount < 100) options.push(this.totalCount); // 'All'
    this.pageSizeOptions = options;
  }

  getSimValidityDetails(pageNumber: number) {
    this.loading = true;
    this.currentPage = pageNumber;

    const request = {
      param1: this.searchText,
      param2: String(this.currentPage),
      param3: String(this.pageSize),
      pdfexcel:""
    };

    this.simValidityService.getSimValidityDetails(request).subscribe({
      next: (response) => {
        this.loading = false;
        if (response.status && response.entity) {
          this.simValidityData = response.entity.listData || [];
          this.totalCount = response.entity.param1 || 0;
          this.pageCount = this.simValidityData.length;
          this.updatePageSizeOptions();
        } else {
          this.simValidityData = [];
          this.totalCount = 0;
          this.pageCount = 0;
          //this.toastService.show(response.entity, 'error');
          jAlert('No Data Found: ' + response.entity);
        }
        this.cdr.detectChanges();
      },
      error: (error) => {
        this.loading = false;
        this.simValidityData = [];
        this.totalCount = 0;
        this.pageCount = 0;
        console.error('Error fetching SIM validity details:', error);
        jAlert('Error fetching SIM validity details.');
        this.cdr.detectChanges();
      }
    });
  }

  getSearchDetails() {
    this.getSimValidityDetails(1);
  }

  reloadData() {
    this.searchText = '';
    this.currentPage = 1;
    this.pageSize = 20;
    this.getSimValidityDetails(1);
  }

  sort(key: string) {
    this.sortKey = key;
    this.reverse = !this.reverse;
    this.simValidityData.sort((a, b) => {
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

  onPageChange(page: number) {
    this.currentPage = page;
    this.getSimValidityDetails(this.currentPage);
  }

  onPageSizeChange(event: Event) {
    const newSize = (event.target as HTMLSelectElement).value;
    this.pageSize = newSize === 'All' ? this.totalCount : Number(newSize);
    this.currentPage = 1;
    this.getSimValidityDetails(this.currentPage);
  }

  getTotalPages(): number {
    return Math.ceil(this.totalCount / this.pageSize);
  }

  getPageNumbers(): number[] {
    const total = this.getTotalPages();
    const pages: number[] = [];
    const maxPages = 8;

    if (total <= maxPages) {
      for (let i = 1; i <= total; i++) {
        pages.push(i);
      }
    } else {
      if (this.currentPage <= 4) {
        for (let i = 1; i <= 5; i++) {
          pages.push(i);
        }
        pages.push(-1);
        pages.push(total);
      } else if (this.currentPage >= total - 3) {
        pages.push(1);
        pages.push(-1);
        for (let i = total - 4; i <= total; i++) {
          pages.push(i);
        }
      } else {
        pages.push(1);
        pages.push(-1);
        for (let i = this.currentPage - 1; i <= this.currentPage + 1; i++) {
          pages.push(i);
        }
        pages.push(-1);
        pages.push(total);
      }
    }
    return pages;
  }

  getPaginatedData(): any[] {
    return this.simValidityData;
  }

  isUpdating(deviceId: string): boolean {
    return this.updatingDevices.has(deviceId);
  }

  updateSimValidity(device: any) {
    const deviceId = device.param1 || '';
    if (this.updatingDevices.has(deviceId)) {
      return; // Already updating
    }

    this.updatingDevices.add(deviceId);
    this.cdr.detectChanges();

    const request = {
      param1: device.param7 || '', // ICCID No
      param2: device.param15 || '', // Vendor Name
      param3: device.param45 || '', // Manufacturer Code
      param4: device.param14 || ''  // M2M Code
    };

    this.simValidityService.updateSimValidity(request).subscribe({
      next: (response) => {
        this.updatingDevices.delete(deviceId);
        if (response.status && (response.entity === 'Successfully saved' || response.entity === 'Successfully updated')) {
          jAlert('Sim Validity Updated', 'Information');
          this.getSimValidityDetails(this.currentPage);
        } else {
          jAlert(response.entity, 'Information');
        }
        this.cdr.detectChanges();
      },
      error: (error) => {
        this.updatingDevices.delete(deviceId);
        console.error('Error updating SIM validity:', error);
        jAlert('Error updating SIM validity.');
        this.cdr.detectChanges();
      }
    });
  }
}
