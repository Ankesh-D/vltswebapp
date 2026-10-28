import { Component, ChangeDetectionStrategy } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { ToastService } from './../../../core/services/toast.service';
import { DeviceService} from '../../../core/services/device.service';

declare var $: any;
@Component({
    selector: 'app-delete-vehicle',
    imports: [FormsModule, CommonModule],
    templateUrl: './delete-vehicle.component.html',
    changeDetection: ChangeDetectionStrategy.Eager,
    styleUrl: './delete-vehicle.component.scss'
})
export class DeleteVehicleComponent {
loading = false
  imei: string = '';
  vehicleData: any = null;

  otp: string = '';
  showOtpBox: boolean = false;

  constructor(private http: HttpClient,private toast: ToastService ,private deviceService: DeviceService) {
    this.toast.pageName = 'Delete Vehicle'; // Set page name for toast service
  }

  // 🔍 FETCH VEHICLE DETAILS
fetchDetails() {

  this.loading = true;
  // this.errorMessage = '';
  this.vehicleData = null;

  if (!this.imei || this.imei.length !== 15) {
    this.toast.show('Enter valid 15 digit IMEI', 'error');
    this.loading = false;
    return;
  }

  const request = {
    param1: this.imei,
    param2: 1,
    param3: 20,
    param4: '',
    param5: '',
    param6: '',
    param7: ''
  };

  this.deviceService.getAssetsDetails(request).subscribe({

    next: (response) => {

      this.loading = false;
      const statuscode = (response as any)?.statuscode;

      // ✅ SUCCESS CONDITION (same as loadDevices)
      if ((response?.status && statuscode === 200) || (response?.status && !statuscode)) {

        if (response?.entity && response.entity.listData?.length > 0) {

          const data = response.entity.listData[0];

          // 🔴 BLOCK IF ACTIVATED
          if (data.param25 === 'Activated') {

            this.toast.show(
              'Device is already activated and not allowed to delete',
              'error'
            );

            this.vehicleData = null;
            this.showOtpBox = false;
            return;
          }

          // ✅ SET DATA
          this.vehicleData = data;

          this.toast.show('Vehicle details fetched successfully', 'success');

        } else {
          this.vehicleData = null;
          this.toast.show('No data found', 'error');
        }

      } else {

        const errorMsg = typeof response?.entity === 'string'
          ? response.entity
          : 'Failed to fetch vehicle details';

        // this.errorMessage = errorMsg;
        this.vehicleData = null;

        this.toast.show(errorMsg, 'error');
      }

    },

    error: (error) => {

      this.loading = false;
      this.vehicleData = null;

      console.error('Error fetching vehicle:', error);

      this.toast.show(
        'Error loading vehicle details. Please try again.',
        'error'
      );
    }

  });
}

  // 📩 SEND OTP (we will update API later)
  sendOtp() {
    this.showOtpBox = true;

    // TODO: call OTP API
    console.log('Send OTP API call here');
  }


goback() {

  this.vehicleData = null;
  this.loading = false
    this.imei = '';
    // this.showDetails = false;
    // this.showActivation = false;
    // this.deviceDetails = null;
    // this.otp = '';
    // this.outputMessage = '';
  }

openOtpModal() {

  if (!this.vehicleData) {
    this.toast.show('Fetch vehicle first', 'error');
    return;
  }

  const request = {
    param1: '', // not required
    param2: this.vehicleData.param29, // 📱 customer mobile
    param3: 'vehicle',
    param4: this.vehicleData.param2, // 👉 deviceId (important)
    param5: '',
    param6: '',
    param7: ''
  };

  this.loading = true;
this.deviceService.sendDeleteOtp(request).subscribe({
  next: (res) => {
    if (res?.status) {
      this.toast.show(res.entity, 'success');
      $('#otpModal').modal('show');
    } else {
      this.toast.show(res.entity, 'error');
    }
  }
});
}

verifyOtp() {

  if (!this.otp || this.otp.length !== 6) {
    this.toast.show('Enter valid OTP', 'error');
    return;
  }

  const verifyRequest = {
    param1: this.vehicleData.param29,
    param2: this.otp,
    param3: 'vehicle',
    param4: this.vehicleData.param5,
    param5: '',
    param6: '',
    param7: '',
    param8: ''
  };

  this.loading = true;

  this.deviceService.verifyOtp(verifyRequest).subscribe({
    next: (res) => {

      if (res?.status) {

        // ✅ DEFINE deleteRequest HERE (IMPORTANT)
        const deleteRequest = {
          param1: this.vehicleData.param10, // mapping id
          param3: 'Deleted via UI'
        };

        // 🔥 CALL DELETE API
        this.deviceService.deleteVehicle(deleteRequest).subscribe({
          next: (delRes) => {

            this.loading = false;

            if (delRes?.status) {

              this.toast.show(delRes.entity, 'success');

              $('#otpModal').modal('hide');

              // reset UI
              this.vehicleData = null;
              this.imei = '';
              this.otp = '';

            } else {
              this.toast.show(delRes.entity, 'error');
            }

          },
          error: () => {
            this.loading = false;
            this.toast.show('Delete API failed', 'error');
          }
        });

      } else {
        this.loading = false;
        this.toast.show(res.entity, 'error');
      }

    },
    error: () => {
      this.loading = false;
      this.toast.show('OTP verify failed', 'error');
    }
  });
}
// http://stage.indtrack.co.in:8080/wbsdcpsvnew/psv_remove_vehicleapi
// {
//     "param1": "38", //param 10
//     "param3": "demo delete "
// }

//     {
//     "status": true,
//     "entity": "Successfully Deleted.",
//     "statuscode": 200
// }     

}