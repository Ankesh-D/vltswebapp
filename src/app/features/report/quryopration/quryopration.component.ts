import { Component, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { VehicleService } from '../../../core/services/vehicle.service';
import { ToastService } from '../../../core/services/toast.service';

@Component({
    selector: 'app-quryopration',
    imports: [
        CommonModule,
        FormsModule
    ],
    templateUrl: './quryopration.component.html',
    changeDetection: ChangeDetectionStrategy.Eager,
    styleUrl: './quryopration.component.scss'
})
export class QuryoprationComponent {

  constructor(
    private vehicleService: VehicleService,
    private toast: ToastService
  ) { 
    this.toast.pageName = 'Query Operation'; // Set page name for toast service
  }

  param1: string = 'select';

  param2: string = '';

  responseData: any = null;

  submitQuery() {

    const payload = {
      param1: this.param1,
      param2: this.param2
    };

    this.vehicleService.queryCheck(payload).subscribe({

      next: (res) => {

        this.responseData = res;

      },

      error: (err) => {

        this.responseData = err;

      }

    });

  }
copyResponse() {

  const text = JSON.stringify(this.responseData, null, 2);

  navigator.clipboard.writeText(text);

  alert('Response copied');

}
}