import { Component, OnInit, AfterViewInit, ChangeDetectorRef, ChangeDetectionStrategy } from '@angular/core';

import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { OperationService } from '../../../core/services/operation.service';
import { DashboardService } from '../../../core/services/dashboard.service';
import { EncryptionService } from '../../../core/services/encryption.service';

declare var $: any;

@Component({
    selector: 'app-command-entry',
    imports: [FormsModule, RouterModule],
    templateUrl: './command-entry.component.html',
    changeDetection: ChangeDetectionStrategy.Eager,
    styleUrls: ['./command-entry.component.scss']
})
export class CommandEntryComponent implements OnInit, AfterViewInit {
  selectedVendor: string = '';
  selectedModel: string = '';
  commandName: string = '';
  command: string = '';
  
  companyList: any[] = [];
  deviceModelList: any[] = [];
  
  docUrl: string = '';
  roleId: string = '';
  
  constructor(
    private operationService: OperationService,
    private dashboardService: DashboardService,
    private encryptionService: EncryptionService,
    private cdr: ChangeDetectorRef
  ) {}
  
  ngOnInit() {
    this.roleId = sessionStorage.getItem('roleId') || '';
    this.loadCompanyList();
    if (this.roleId === '11') {
      this.loadDeviceModelList('');
    }
  }
  
  ngAfterViewInit() {
    setTimeout(() => {
      if (typeof $ !== 'undefined' && $.fn.select2) {
        $('.searchable').select2();
      }
    }, 200);
  }
  
  loadCompanyList() {
    this.dashboardService.getVendorList().subscribe({
      next: (response) => {
        if (response.status && response.entity) {
          this.companyList = response.entity;
          if (this.companyList.length === 1) {
            this.selectedVendor = this.companyList[0].param1;
            this.onVendorChange();
          }
        }
      },
      error: (error) => {
        console.error('Error loading company list:', error);
      }
    });
  }
  
  onVendorChange() {
    if (this.selectedVendor) {
      const encryptedVendorId = this.encryptionService.encryptAccountId(this.selectedVendor);
      this.loadDeviceModelList(encryptedVendorId);
    } else {
      this.deviceModelList = [];
      this.selectedModel = '';
      this.docUrl = '';
    }
  }
  
  loadDeviceModelList(vendorId: string) {
    this.operationService.getDeviceModelListWithProtocol(vendorId).subscribe({
      next: (response) => {
        if (response.status && response.entity) {
          this.deviceModelList = response.entity;
          if (this.deviceModelList.length === 1) {
            this.selectedModel = this.deviceModelList[0].param1;
            this.onModelChange();
          }
        }
      },
      error: (error) => {
        console.error('Error loading device model list:', error);
      }
    });
  }
  
  onModelChange() {
    if (this.selectedModel) {
      const model = this.deviceModelList.find(m => m.param1 === this.selectedModel);
      if (model && model.param6) {
        this.docUrl = model.param6;
        this.displayPDF(this.docUrl);
      } else {
        this.docUrl = 'Protocol Document Not Available.';
      }
    }
  }
  
  displayPDF(url: string) {
    setTimeout(() => {
      const pdfViewer = document.getElementById('procertdiv') as any;
      const pdfEmbed = document.getElementById('myPdfpro') as any;
      const noPrev = document.getElementById('noprev');
      const noPrevPro = document.getElementById('noprevpro');
      
      if (pdfViewer && pdfEmbed) {
        if (url && url !== 'Protocol Document Not Available.') {
          pdfViewer.setAttribute('data', url);
          pdfEmbed.setAttribute('src', url);
          if (noPrev) noPrev.style.display = 'none';
          if (noPrevPro) noPrevPro.style.display = 'none';
          pdfViewer.style.display = 'block';
        } else {
          if (noPrev) noPrev.style.display = 'block';
          if (noPrevPro) noPrevPro.style.display = 'block';
          pdfViewer.style.display = 'none';
        }
      }
    }, 100);
  }
  
  insertDeviceCommand() {
    if (this.roleId === '17' || this.roleId === '25' || this.roleId === '10') {
      if (!this.selectedVendor) {
        alert('Select Company');
        return;
      }
    }
    
    if (!this.selectedModel) {
      alert('Select Model');
      return;
    }
    
    if (!this.commandName || this.commandName.trim() === '') {
      alert('Enter Command Name');
      return;
    }
    
    if (!this.command || this.command.trim() === '') {
      alert('Enter Command');
      return;
    }
    
    const encryptedCompanyId = this.selectedVendor ? this.encryptionService.encryptAccountId(this.selectedVendor) : '';
    const encryptedModelId = this.encryptionService.encryptAccountId(this.selectedModel);
    
    const request = {
      param1: encryptedCompanyId,
      param2: encryptedModelId,
      param3: this.commandName.trim(),
      param4: this.command.trim()
    };
    
    this.operationService.insertCommand(request).subscribe({
      next: (response) => {
        if (response.status && response.entity) {
          alert(response.entity);
          if (response.entity === 'Successfully saved.') {
            this.resetForm();
          }
        }
      },
      error: (error) => {
        console.error('Error inserting command:', error);
        alert('Error saving command');
      }
    });
  }
  
  resetForm() {
    this.commandName = '';
    this.command = '';
    this.selectedModel = '';
    this.docUrl = '';
    if (this.roleId !== '11') {
      this.selectedVendor = '';
    }
    this.loadDeviceModelList('');
  }
}
