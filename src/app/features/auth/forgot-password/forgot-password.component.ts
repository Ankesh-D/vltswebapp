import { Component, OnInit, ChangeDetectionStrategy } from '@angular/core';

import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService, ForgotPasswordResetReq, OTPVerificationForForgotPassword, SendOTPForForgotPassword } from '../../../core/services/auth.service';
import { LoadingComponent } from '../../../shared/components/loading/loading.component';
import { ErrorMessageComponent } from '../../../shared/components/error-message/error-message.component';
import { ToastService } from '../../../core/services/toast.service';
import { ValidationsService } from '../../../core/services/validations.service';
import { EncryptionService } from '../../../core/services/encryption.service';

// declare var this.toastService.show: any;

@Component({
    selector: 'app-forgot-password',
    imports: [FormsModule, LoadingComponent],
    templateUrl: './forgot-password.component.html',
    changeDetection: ChangeDetectionStrategy.Eager,
    styleUrls: ['./forgot-password.component.scss']
})
export class ForgotPasswordComponent implements OnInit {
  step: number = 0; // 0: username, 1: OTP request, 2: OTP verify, 3: change password
  username: string = '';
  userContact: string = '';
  userEmail: string = '';
  otpType: string = 'contact'; // 'contact' or 'email'
  contactNumber: string = '';
  emailId: string = '';
  otp: string = '';
  newPassword: string = '';
  confirmPassword: string = '';
  
  loading = false;
  errorMessage = '';
  userMessage = '';
  otpMessage = '';
  failOtpMessage = '';
  passwordMessage = '';
  confirmPasswordMessage = '';
  showOtpCounts: number = 3;
  
  passwordValid = false;
  passwordsMatch = false;
  otpTimerFlag = false
  
  constructor(
    private authService: AuthService,
    public router: Router,
    public toastService: ToastService,
    public vs:ValidationsService,
    public enc: EncryptionService
  ) {}
  
  ngOnInit() {
    // Component initialized
  }
  backToLogin() {
    this.router.navigate(['/login']);
  }
  maskUserInfo(value: string): string {
  if (!value) {
    return '';
  }

  // 📱 Mobile Number Masking
  if (/^\d{10}$/.test(value)) {
    return value.replace(/^(\d{0})\d{6}(\d{4})$/, '$1******$2');
  }

  // 📧 Email Masking
  if (value.includes('@')) {
    const [name, domain] = value.split('@');

    const maskedName =
      name.length <= 2
        ? name[0] + '*'
        : name.substring(0, 2) + '*'.repeat(name.length - 2);

    return `${maskedName}@${domain}`;
  }

  return value;
}
private intervalRef: any;
timerText: any= '02:00';
start2MinCounter() {
  let totalSeconds = 2 * 60; // 2 minutes
  this.otpTimerFlag = true;
  // clear old timer if running
  if (this.intervalRef) clearInterval(this.intervalRef);

  this.intervalRef = setInterval(() => {
    const min = Math.floor(totalSeconds / 60);
    const sec = totalSeconds % 60;

    this.timerText = `${String(min).padStart(2, '0')}:${String(sec).padStart(2, '0')}`;

    totalSeconds--;

    if (totalSeconds < 0) {
      this.otpTimerFlag = false;
      clearInterval(this.intervalRef);
      this.timerText = '00:00';
      //r finished');
    }
  }, 1000);
}
  
  submitUsername() {
  
    if (!this.username || this.username.trim() === '') {
      this.userMessage = 'Please enter Sign In Name';
      return;
    }
    
    this.loading = true;
    this.userMessage = '';
    this.errorMessage = '';
    let request=  { 
      "loginname" : this.username.trim(), 
      "ip_devicetoken" : "", 
      "browserdetails_fcmtoken": "", 
      "verifiedby" : "Mobile", 
      "mobileno" : "", 
      "registeredby" : "Web"
      }
    this.authService.forgotPasswordSubmitUsername(request).subscribe({
      next: (response) => {
        this.loading = false;
        if (response.statuscode==200) {
          const entity = response.entity;
          this.userContact = entity.param1 || entity.contact || '';
          this.userEmail = entity.param2 || entity.email || '';
          this.step = 1; // Move to OTP request step
        } else {
          this.userMessage = typeof response?.entity === 'string' ? response.entity : 'User not found';
          setTimeout(()=> {
            this.userMessage='';
          }, 10000)
        }
      },
      error: (error) => {
        this.loading = false;
        this.userMessage = error?.error?.entity || 'Error submitting username';
       
      }
    });
  }
  resendFlag: boolean= false;
  sendOTPForForgotPasswordReq: SendOTPForForgotPassword = new SendOTPForForgotPassword();
  sendOTP(resend: boolean = false) {
          // this.step = 2; // Move to OTP verification step
          
          // this.resendFlag=true;
          // this.start2MinCounter();

    if (this.otpType === 'contact' && !this.contactNumber) {
      this.otpMessage = 'Please enter registered contact number';
      return;
    }
    // if (this.otpType === 'email' && !this.emailId) {
    //   this.otpMessage = 'Please enter registered email ID';
    //   return;
    // }
    
    this.loading = true;
    this.otpMessage = '';
    this.errorMessage = '';
    
    this.sendOTPForForgotPasswordReq.otptype = '2',
    this.sendOTPForForgotPasswordReq.mobileno = this.contactNumber ? this.contactNumber : '',
    this.sendOTPForForgotPasswordReq.verifiedby = 'Mobile',
    this.sendOTPForForgotPasswordReq.loginid = '',
    this.sendOTPForForgotPasswordReq.browserdetails_fcmtoken = '',
    this.sendOTPForForgotPasswordReq.loginname = this.username ? this.username.trim() : this.username;
    this.authService.forgotPasswordSendOTP(this.sendOTPForForgotPasswordReq).subscribe({
      next: (response) => {
        this.loading = false;
        if (response.statuscode==200) {
          this.step = 2; // Move to OTP verification step
          this.resendFlag=true;
          this.start2MinCounter();
          if (resend) {
            this.toastService.show('OTP has been sent successfully');
          }
        } else {
          this.otpMessage = typeof response?.entity === 'string' ? response.entity : 'Failed to send OTP';
          if (this.showOtpCounts > 0) {
            this.showOtpCounts--;
          }
        }
      },
      error: (error) => {
        this.loading = false;
        this.otpMessage = error?.error?.entity || 'Error sending OTP';
        if (this.showOtpCounts > 0) {
          this.showOtpCounts--;
        }
      }
    });
  }
  verifyOTPReq: OTPVerificationForForgotPassword = new OTPVerificationForForgotPassword();
  verifyOTP() {
    if (!this.otp || this.otp.trim().length !== 6) {
      this.failOtpMessage = 'Please enter valid 6-digit OTP';
      return;
    }
    this.loading = true;
    this.failOtpMessage = '';
    this.errorMessage = '';
    
   
    this.verifyOTPReq.mobileno = this.contactNumber;
    this.verifyOTPReq.otpcode = this.otp.trim();
    this.verifyOTPReq.loginname = this.username.trim();
    this.verifyOTPReq.otptype = "2";
    this.authService.forgotPasswordVerifyOTP(this.verifyOTPReq).subscribe({
      next: (response) => {
        this.loading = false;
        if (response.statuscode==200) {
          this.step = 3; // Move to change password step
        } else {
          this.failOtpMessage = typeof response?.entity === 'string' ? response.entity : 'Invalid OTP';
          if (this.showOtpCounts > 0) {
            this.showOtpCounts--;
          }
        }
      },
      error: (error) => {
        this.loading = false;
        this.failOtpMessage = error?.error?.entity || 'Error verifying OTP';
        if (this.showOtpCounts > 0) {
          this.showOtpCounts--;
        }
        console.error('Error verifying OTP:', error);
      }
    });
  }
  
  verifyPassword() {
    const password = this.newPassword;
    // Password must be at least 8 characters, 1 uppercase, 1 special character, 1 number
    const hasMinLength = password.length >= 8;
    const hasUpperCase = /[A-Z]/.test(password);
    const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);
    const hasNumber = /[0-9]/.test(password);
    
    this.passwordValid = hasMinLength && hasUpperCase && hasSpecialChar && hasNumber;
    
    if (!this.passwordValid) {
      this.passwordMessage = 'Password must have at least 8 characters, 1 uppercase, 1 special character & 1 number';
    } else {
      this.passwordMessage = '';
      this.checkPasswordsMatch();
    }
  }
  
  checkPasswordsMatch() {
    if (this.confirmPassword) {
      this.passwordsMatch = this.newPassword === this.confirmPassword;
      this.confirmPasswordMessage = this.passwordsMatch ? '' : 'Passwords do not match';
    }
  }
  resetPasswordReq: ForgotPasswordResetReq = new ForgotPasswordResetReq();
  submitNewPassword() {
    if (!this.passwordValid) {
      this.toastService.show('Please enter a valid password');
      return;
    }
    if (!this.passwordsMatch) {
      this.toastService.show('Passwords do not match');
      return;
    }
    
    this.loading = true;
    this.errorMessage = '';
    
    // const request = {
    //   param1: this.username.trim(),
    //   param2: this.newPassword,
    //   param3: this.otp.trim()
    // };
    this.resetPasswordReq.loginname = this.username.trim();
    this.resetPasswordReq.mobileno = this.contactNumber;
    this.resetPasswordReq.newpassoword = this.enc.encryptPassword(this.newPassword);
    this.resetPasswordReq.confirmpassword = this.enc.encryptPassword(this.newPassword);

    this.authService.forgotPasswordReset(this.resetPasswordReq).subscribe({
      next: (response) => {
        this.loading = false;
        if (response.statuscode==200) {
          this.toastService.show('Password reset successfully. Please login with your new password.', 'success');
          this.router.navigate(['/login']);
        } else {
          this.errorMessage = typeof response?.entity === 'string' ? response.entity : 'Failed to reset password';
          this.toastService.show(this.errorMessage);
        }
      },
      error: (error) => {
        this.loading = false;
        this.errorMessage = error?.error?.entity || 'Error resetting password';
        this.toastService.show(this.errorMessage);
        console.error('Error resetting password:', error);
      }
    });
  }
  
  backToUser() {
    this.step = 0;
    this.otpType = 'contact';
    this.contactNumber = '';
    this.emailId = '';
    this.otpMessage = '';
  }
  
  back() {
    this.step = 1;
    this.otp = '';
    this.failOtpMessage = '';
  }
  
  goToLogin() {
    this.reset();
    this.router.navigate(['/login']);
  }
  
  reset() {
    this.step = 0;
    this.username = '';
    this.userContact = '';
    this.userEmail = '';
    this.otpType = 'contact';
    this.contactNumber = '';
    this.emailId = '';
    this.otp = '';
    this.newPassword = '';
    this.confirmPassword = '';
    this.userMessage = '';
    this.otpMessage = '';
    this.failOtpMessage = '';
    this.passwordMessage = '';
    this.confirmPasswordMessage = '';
    this.showOtpCounts = 3;
    this.passwordValid = false;
    this.passwordsMatch = false;
  }
  hidePassword: boolean = false;
  hideCPassword: boolean= false;
  
}
