import { Component, OnInit, ChangeDetectionStrategy } from '@angular/core';

import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { RtoService, RTOEntryRequest } from '../../../core/services/rto.service';
import { ToastService } from '../../../core/services/toast.service';

@Component({
    selector: 'app-rto-entry',
    imports: [FormsModule, RouterModule],
    templateUrl: './rto-entry.component.html',
    changeDetection: ChangeDetectionStrategy.Eager,
    styleUrls: ['./rto-entry.component.scss']
})
export class RtoEntryComponent implements OnInit {
  rtoCode: string = '';
  rtoAddress: string = '';
  pinCode: string = '';
  
  // Default state (DL - Delhi, stateId: 7)
  stateId: string = '34';
  stateCode: string = 'wb';
  placeholder: string = 'Wb01';
  
  loading = false;
  errorMessage = '';
  
  constructor(
    private rtoService: RtoService,
    private router: Router,
    public toastService: ToastService
  ) {
    this.toastService.pageName = 'RTO Master Entry'; // Set page name for toast service
  }

  ngOnInit() {
    // RTO code should be uppercase
    this.placeholder = this.stateCode + '30';
  }

  onRTOCodeKeyUp() {
    this.rtoCode = this.rtoCode.toUpperCase();
  }

  validateRTOCode(): boolean {
    const regExp = /^([A-Za-z]{2}[0-9]{2})$/;
    const regExp1 = /^([A-Za-z]{2}[0-9]{2}[A-Za-z]{1})$/;
    const code = this.rtoCode.substring(0, 2);
    return !!(this.rtoCode.match(regExp) || this.rtoCode.match(regExp1)) && 
           this.stateCode === code && 
           this.rtoCode.length >= 4;
  }

  rtoEntry() {
    if (!this.rtoCode) {
      alert('Please Enter RTO code');
      return;
    }
    
    const code = this.rtoCode.substring(0, 2);
    // if (this.stateCode !== code || this.rtoCode.length < 4) {
    //   alert('Invalid RTO code. RTO code must start with state code (DL) and be at least 4 characters.');
    //   return;
    // }
    
    if (!this.rtoAddress) {
      alert('Please Enter RTO Address');
      return;
    }
    
    if (!this.pinCode || this.pinCode.length !== 6 || !/^\d{6}$/.test(this.pinCode)) {
      alert('Please Enter Valid PIN Code (6 digits)');
      return;
    }

    if (confirm('Are you sure you want to add this RTO?')) {
      this.loading = true;
      const rtoData: RTOEntryRequest = {
        param1: '',
        param2: this.rtoCode,
        param3: this.rtoAddress,
        param4: this.pinCode,
        param5: this.stateId
      };

      this.rtoService.putRTO(rtoData).subscribe({
        next: (response) => {
          this.loading = false;
          if (response.status) {
            alert(response.entity || 'RTO added successfully');
            if (response.entity?.includes('Successfully')) {
              this.rtoCode = '';
              this.rtoAddress = '';
              this.pinCode = '';
              this.router.navigate(['/rto']);
            }
          } else {
            this.errorMessage = response.entity || 'Failed to add RTO';
            alert(this.errorMessage);
          }
        },
        error: (error) => {
          this.loading = false;
          this.errorMessage = 'Error adding RTO. Please try again.';
          alert(this.errorMessage);
          console.error('Error adding RTO:', error);
        }
      });
    }
  }
}
