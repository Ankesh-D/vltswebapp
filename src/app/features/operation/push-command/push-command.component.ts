import { Component, OnInit, AfterViewInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { OperationService } from '../../../core/services/operation.service';
import { DashboardService } from '../../../core/services/dashboard.service';
import { DeviceService } from '../../../core/services/device.service';
import { EncryptionService } from '../../../core/services/encryption.service';

declare var $: any;

@Component({
  selector: 'app-push-command',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './push-command.component.html',
  styleUrls: ['./push-command.component.scss']
})
export class PushCommandComponent implements OnInit, AfterViewInit {
  commandMode: string = '2'; // '2' = Single, '3' = Company, '4' = RTO
  
  // Single command fields
  tcpIpMode: string = '';
  imeiNo: string = '';
  singleCommand: string = '';
  
  // Company command fields
  selectedCompany: string = '';
  selectedImeiList: string[] = [];
  companyCommand: string = '';
  
  // RTO command fields
  selectedRTO: string = '';
  selectedRTOCompany: string = '';
  selectedRTOImeiList: string[] = [];
  rtoCommand: string = '';
  
  // Dropdowns
  companyList: any[] = [];
  rtoList: any[] = [];
  deviceList: any[] = [];
  rtoCompanyList: any[] = [];
  commandDetailsAll: any[] = [];
  commandDetailsCompany: any[] = [];
  
  loading = false;
  message = '';
  
  constructor(
    private operationService: OperationService,
    private dashboardService: DashboardService,
    private deviceService: DeviceService,
    private encryptionService: EncryptionService,
    private cdr: ChangeDetectorRef
  ) {}
  
  ngOnInit() {
    this.loadCompanyList();
    this.loadRTOList();
    this.loadCommandDetails('0', 'ALL');
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
        }
        this.cdr.detectChanges();
      },
      error: (error) => {
        console.error('Error loading company list:', error);
        this.cdr.detectChanges();
      }
    });
  }
  
  loadRTOList() {
    this.dashboardService.getRTOList('').subscribe({
      next: (response) => {
        if (response.status && response.entity) {
          this.rtoList = response.entity;
        }
        this.cdr.detectChanges();
      },
      error: (error) => {
        console.error('Error loading RTO list:', error);
        this.cdr.detectChanges();
      }
    });
  }
  
  loadCommandDetails(companyId: string, filter: string) {
    const encryptedCompanyId = this.encryptionService.encryptAccountId(companyId);
    const request = {
      param1: '', // searchText (not used currently)
      param2: 'NA',
      param3: 'NA',
      param4: encryptedCompanyId
    };
    
    this.operationService.getCommandDetails(request).subscribe({
      next: (response) => {
        if (response.status && response.entity && response.entity.listData) {
          if (filter === 'ALL') {
            this.commandDetailsAll = response.entity.listData;
          } else {
            this.commandDetailsCompany = response.entity.listData;
          }
        }
        this.cdr.detectChanges();
      },
      error: (error) => {
        console.error('Error loading command details:', error);
        this.cdr.detectChanges();
      }
    });
  }
  
  onCommandModeChange(mode: string) {
    this.commandMode = mode;
    this.cdr.detectChanges();
  }
  
  onCompanyChange() {
    if (!this.selectedCompany) {
      this.deviceList = [];
      return;
    }
    
    this.loading = true;
    const encryptedVendorId = this.encryptionService.encryptAccountId(this.selectedCompany);
    const encryptedRoleId = this.encryptionService.encryptAccountId('11');
    
    this.deviceService.getRawDataDeviceRoster(encryptedVendorId, encryptedRoleId).subscribe({
      next: (response) => {
        this.loading = false;
        if (response.status && response.entity) {
          this.deviceList = response.entity;
        }
        this.loadCommandDetails(this.selectedCompany, 'Company');
        this.cdr.detectChanges();
      },
      error: (error) => {
        this.loading = false;
        console.error('Error loading device list:', error);
        this.cdr.detectChanges();
      }
    });
  }
  
  onRTOChange() {
    if (!this.selectedRTO) {
      this.rtoCompanyList = [];
      this.deviceList = [];
      return;
    }
    
    // Load companies for selected RTO
    this.loadCompanyList();
    this.rtoCompanyList = this.companyList;
  }
  
  onRTOCompanyChange() {
    if (!this.selectedRTOCompany) {
      this.deviceList = [];
      return;
    }
    
    this.loading = true;
    const encryptedVendorId = this.encryptionService.encryptAccountId(this.selectedRTOCompany);
    const encryptedRoleId = this.encryptionService.encryptAccountId('11');
    
    this.deviceService.getRawDataDeviceRoster(encryptedVendorId, encryptedRoleId).subscribe({
      next: (response) => {
        this.loading = false;
        if (response.status && response.entity) {
          this.deviceList = response.entity;
        }
        this.loadCommandDetails(this.selectedRTOCompany, 'Company');
        this.cdr.detectChanges();
      },
      error: (error) => {
        this.loading = false;
        console.error('Error loading device list:', error);
        this.cdr.detectChanges();
      }
    });
  }
  
  encodeCommand(command: string): string {
    return command
      .replace(/#/g, '%23').replace(/!/g, '%21').replace(/\^/g, '%5E').replace(/\*/g, '%2A')
      .replace(/\+/g, '%2B').replace(/\$/g, '%24').replace(/&/g, '%26').replace(/\(/g, '%28').replace(/\)/g, '%29')
      .replace(/\//g, '%2F').replace(/</g, '%3C').replace(/>/g, '%3E').replace(/@/g, '%40').replace(/,/g, '%2C').replace(/ /g, '%20');
  }
  
  sendCommand() {
    if (this.commandMode === '2') {
      // Single command
      if (!this.tcpIpMode) {
        alert('Please select SMS / TCP IP');
        return;
      }
      if (!this.imeiNo || this.imeiNo.length !== 15) {
        alert('Enter 15 digit IMEI No.');
        return;
      }
      if (!this.singleCommand) {
        alert('Enter command');
        return;
      }
      
      this.sendSingleCommand();
    } else if (this.commandMode === '3') {
      // Company command
      if (!this.selectedCompany) {
        alert('Select Company');
        return;
      }
      if (!this.selectedImeiList || this.selectedImeiList.length === 0) {
        alert('Select IMEI No.');
        return;
      }
      if (!this.companyCommand) {
        alert('Enter command');
        return;
      }
      
      this.sendCompanyCommand();
    } else if (this.commandMode === '4') {
      // RTO command
      if (!this.selectedRTO) {
        alert('Select RTO');
        return;
      }
      if (!this.selectedRTOCompany) {
        alert('Select Company');
        return;
      }
      if (!this.selectedRTOImeiList || this.selectedRTOImeiList.length === 0) {
        alert('Select IMEI No.');
        return;
      }
      if (!this.rtoCommand) {
        alert('Enter command');
        return;
      }
      
      this.sendRTOCommand();
    }
  }
  
  sendSingleCommand() {
    this.loading = true;
    const encodedCommand = this.encodeCommand(this.singleCommand);
    
    if (this.tcpIpMode === 'TCP IP') {
      const request = {
        imeino: this.imeiNo,
        devicecommand: encodedCommand
      };
      
      this.operationService.sendCommand(request).subscribe({
        next: (response) => {
          this.loading = false;
          if (response.statuscode === 200) {
            alert(response.entity || 'Command sent successfully');
            this.message = response.entity || 'Command sent successfully';
          }
          this.cdr.detectChanges();
        },
        error: (error) => {
          this.loading = false;
          alert(error?.error?.entity || 'Error sending command');
          this.cdr.detectChanges();
        }
      });
    } else {
      // SMS mode - use health ack request
      const request = {
        param1: this.encryptionService.encryptAccountId(''),
        param2: this.imeiNo,
        param3: 'DEVICEACK'
      };
      
      this.operationService.sendHealthStatus(request).subscribe({
        next: (response) => {
          this.loading = false;
          if (response.statuscode === 200) {
            alert(response.entity || 'Command sent successfully');
            this.message = response.entity || 'Command sent successfully';
          }
          this.cdr.detectChanges();
        },
        error: (error) => {
          this.loading = false;
          alert(error?.error?.entity || 'Error sending command');
          this.cdr.detectChanges();
        }
      });
    }
  }
  
  sendCompanyCommand() {
    this.loading = true;
    const encodedCommand = this.encodeCommand(this.companyCommand);
    
    const deviceData = [];
    if (this.selectedImeiList.includes('All')) {
      for (const device of this.deviceList) {
        deviceData.push({ imeino: device.param2 });
      }
    } else {
      for (const imei of this.selectedImeiList) {
        deviceData.push({ imeino: imei });
      }
    }
    
    const request = {
      devicedata: deviceData,
      devicecommand: encodedCommand
    };
    
    this.operationService.sendMultipleCommand(request).subscribe({
      next: (response) => {
        this.loading = false;
        if (response.statuscode === 200) {
          alert(response.entity || 'Command sent successfully');
          this.message = response.entity || 'Command sent successfully';
        }
        this.cdr.detectChanges();
      },
      error: (error) => {
        this.loading = false;
        alert(error?.error?.entity || 'Error sending command');
        this.cdr.detectChanges();
      }
    });
  }
  
  sendRTOCommand() {
    this.loading = true;
    const encodedCommand = this.encodeCommand(this.rtoCommand);
    
    const deviceData = [];
    if (this.selectedRTOImeiList.includes('All')) {
      for (const device of this.deviceList) {
        deviceData.push({ imeino: device.param2 });
      }
    } else {
      for (const imei of this.selectedRTOImeiList) {
        deviceData.push({ imeino: imei });
      }
    }
    
    const request = {
      devicedata: deviceData,
      devicecommand: encodedCommand
    };
    
    this.operationService.sendMultipleCommand(request).subscribe({
      next: (response) => {
        this.loading = false;
        if (response.statuscode === 200) {
          alert(response.entity || 'Command sent successfully');
          this.message = response.entity || 'Command sent successfully';
        }
        this.cdr.detectChanges();
      },
      error: (error) => {
        this.loading = false;
        alert(error?.error?.entity || 'Error sending command');
        this.cdr.detectChanges();
      }
    });
  }
}
