import { Component, OnInit, ChangeDetectionStrategy } from '@angular/core';

import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { RoleService, RoleEntryRequest } from '../../../core/services/role.service';

@Component({
    selector: 'app-role-entry',
    imports: [FormsModule, RouterModule],
    templateUrl: './role-entry.component.html',
    changeDetection: ChangeDetectionStrategy.Eager,
    styleUrls: ['./role-entry.component.scss']
})
export class RoleEntryComponent implements OnInit {
  // Form fields
  roleName: string = '';
  roleDescription: string = '';
  
  // Validation
  loading = false;
  errorMessage = '';
  
  // Form validation flags
  formErrors: { [key: string]: boolean } = {};
  
  constructor(
    private roleService: RoleService,
    private router: Router
  ) {}
  
  ngOnInit() {
    // Component initialization
  }
  
  validateForm(): boolean {
    this.formErrors = {};
    let isValid = true;
    
    if (!this.roleName || this.roleName.trim() === '') {
      this.formErrors['roleName'] = true;
      isValid = false;
    }
    
    if (!this.roleDescription || this.roleDescription.trim() === '') {
      this.formErrors['roleDescription'] = true;
      isValid = false;
    }
    
    return isValid;
  }
  
  clearFormErrors() {
    this.formErrors = {};
    this.errorMessage = '';
  }
  
  roleEntry() {
    this.clearFormErrors();
    
    if (!this.validateForm()) {
      alert('Please fill all required fields correctly.');
      return;
    }
    
    if (confirm('Are you sure you want to submit this role entry?')) {
      this.loading = true;
      this.errorMessage = '';
      
      const roleData: RoleEntryRequest = {
        param1: this.roleName.trim() || '',
        param2: this.roleDescription.trim() || ''
      };
      
      this.roleService.putRole(roleData).subscribe({
        next: (response) => {
          this.loading = false;
          if (response.status) {
            const message = typeof response.entity === 'string' ? response.entity : 'Role created successfully';
            alert(message);
            if (message === 'Successfully saved.' || message.includes('Successfully')) {
              this.resetForm();
              this.router.navigate(['/role']);
            }
          } else {
            this.errorMessage = typeof response.entity === 'string' ? response.entity : 'Failed to create role';
            alert(this.errorMessage);
          }
        },
        error: (error) => {
          this.loading = false;
          this.errorMessage = error?.error?.entity || 'Error creating role';
          alert('Error creating role: ' + this.errorMessage);
          console.error('Error creating role:', error);
        }
      });
    }
  }
  
  resetForm() {
    this.roleName = '';
    this.roleDescription = '';
    this.clearFormErrors();
    const form = document.getElementById('roleentryform') as HTMLFormElement;
    if (form) {
      form.reset();
    }
  }
  
  getFieldError(fieldName: string): boolean {
    return this.formErrors[fieldName] || false;
  }
  
  goBack() {
    this.router.navigate(['/role']);
  }
}
