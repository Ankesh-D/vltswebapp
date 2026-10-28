import { Component, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { POIService, POIEntryRequest } from '../../../core/services/poi.service';
import { ToastComponent } from '../../assets/inactive-assets/toast.component';
import { ToastService } from '../../../core/services/toast.service';

@Component({
    selector: 'app-poi-entry',
    imports: [CommonModule, FormsModule, RouterModule, ToastComponent],
    templateUrl: './poi-entry.component.html',
    changeDetection: ChangeDetectionStrategy.Eager,
    styleUrls: ['./poi-entry.component.scss']
})
export class POIEntryComponent implements OnInit {
  // Form fields
  poiName: string = '';
  poiIcon: string = '';
  latitude: string = '';
  longitude: string = '';
  range: string = '';
  
  // POI Icon options
  poiIcons = [
    { value: '', label: 'Select Icon' },
    { value: 'railway', label: 'Railway' },
    { value: 'airport', label: 'AirPort' },
    { value: 'bar', label: 'Bar' },
    { value: 'building', label: 'Building' },
    { value: 'coffeehouse', label: 'Coffee House' },
    { value: 'education', label: 'Education' },
    { value: 'flag', label: 'Flag' },
    { value: 'garden', label: 'Garden' },
    { value: 'hospital', label: 'Hospital' },
    { value: 'industry', label: 'Industry' },
    { value: 'mapicon', label: 'Map Icon' },
    { value: 'market', label: 'Market' },
    { value: 'office', label: 'Office' },
    { value: 'postoffice', label: 'Post Office' },
    { value: 'restaurant', label: 'Restaurant' },
    { value: 'stopmarker', label: 'Stop Marker' },
    { value: 'temple', label: 'Temple' },
    { value: 'water', label: 'Water' }
  ];
  
  // Image URL for selected icon
  imageUrl: string = '';
  
  // Validation
  loading = false;
  formErrors: { [key: string]: boolean } = {};
  errorMessage: string | null = null;
  successMessage: string | null = null;
  
  constructor(
    private poiService: POIService,
    private router: Router,
    private toastService: ToastService
  ) {
    this.toastService.pageName = 'POI Entry'; // Set page name for toast service
  }
  
  ngOnInit() {
    // Initialize form
  }
  
  onPoiNameInput(event: any) {
    const input = event.target as HTMLInputElement;
    // Allowed: a-z, A-Z, 0-9, Space, -, ., (, ), /
    const sanitizedValue = input.value.replace(/[^a-zA-Z0-9 \-\.\(\)\/]/g, '');
    this.poiName = sanitizedValue;
  }

  onLatitudeInput(event: any) {
    const input = event.target as HTMLInputElement;
    let value = input.value.replace(/[^0-9.-]/g, '');

    if (value.includes('-', 1)) value = value.charAt(0) + value.slice(1).replace(/-/g, '');

    const parts = value.split('.');
    if (parts.length > 2) value = parts[0] + '.' + parts.slice(1).join('');

    // Auto-insert decimal point after 2 digits if missing (e.g., 453456 -> 45.3456)
    if (!value.includes('.') && value.replace('-', '').length > 2) {
      const dotIndex = value.startsWith('-') ? 3 : 2;
      value = value.slice(0, dotIndex) + '.' + value.slice(dotIndex);
    }

    this.latitude = value;
    input.value = value;
    this.checkLatitude();
  }

  onLongitudeInput(event: any) {
    const input = event.target as HTMLInputElement;
    let value = input.value.replace(/[^0-9.-]/g, '');

    if (value.includes('-', 1)) value = value.charAt(0) + value.slice(1).replace(/-/g, '');

    const parts = value.split('.');
    if (parts.length > 2) value = parts[0] + '.' + parts.slice(1).join('');

    // Auto-insert decimal point after 2 digits if missing
    if (!value.includes('.') && value.replace('-', '').length > 2) {
      const dotIndex = value.startsWith('-') ? 3 : 2;
      value = value.slice(0, dotIndex) + '.' + value.slice(dotIndex);
    }

    this.longitude = value;
    input.value = value;
    this.checkLongitude();
  }

  onRangeInput(event: any) {
    const input = event.target as HTMLInputElement;
    let value = input.value.replace(/[^0-9.]/g, ''); // Allow only numbers and one dot

    // Ensure only one decimal point
    const parts = value.split('.');
    if (parts.length > 2) {
      value = parts[0] + '.' + parts.slice(1).join('');
    }

    this.range = value;
    input.value = value; // Update input value to reflect sanitization
    this.checkRange(); // Trigger validation on input
  }



  onPoiIconChange() {
    this.updateImageUrl();
  }
  
  updateImageUrl() {
    const iconPathMap: { [key: string]: string } = {
      'railway': 'assets/poiicons/railway.png',
      'airport': 'assets/poiicons/airport.png',
      'bar': 'assets/poiicons/bar.png',
      'building': 'assets/poiicons/building.png',
      'coffeehouse': 'assets/poiicons/coffeehouse.png',
      'education': 'assets/poiicons/education.png',
      'flag': 'assets/poiicons/flag.png',
      'garden': 'assets/poiicons/garden.png',
      'hospital': 'assets/poiicons/hospital.png',
      'industry': 'assets/poiicons/industry.png',
      'mapicon': 'assets/poiicons/map_icon.png',
      'market': 'assets/poiicons/market.png',
      'office': 'assets/poiicons/office.png',
      'postoffice': 'assets/poiicons/postoffice.png',
      'restaurant': 'assets/poiicons/restaurant.png',
      'stopmarker': 'assets/poiicons/stopmark.png',
      'temple': 'assets/poiicons/temple.png',
      'water': 'assets/poiicons/water.png'
    };
    
    if (this.poiIcon && iconPathMap[this.poiIcon]) {
      this.imageUrl = iconPathMap[this.poiIcon];
    } else {
      this.imageUrl = '';
    }
  }
  
  checkLatitude() {
    const lat = this.latitude;
    if (!lat) {
      this.formErrors['latitude'] = false;
      return;
    }
    
    if (lat[2] === '.') {
      if (lat.length < 6 || lat.length > 9) {
        this.formErrors['latitude'] = true;
      } else {
        this.formErrors['latitude'] = false;
      }
    } else if (lat[3] === '.') {
      if (lat.length < 7 || lat.length > 10) {
        this.formErrors['latitude'] = true;
      } else {
        this.formErrors['latitude'] = false;
      }
    } else {
      this.formErrors['latitude'] = true;
    }
  }
  
  checkLongitude() {
    const lon = this.longitude;
    if (!lon) {
      this.formErrors['longitude'] = false;
      return;
    }
    
    if (lon[2] === '.') {
      if (lon.length < 6 || lon.length > 9) {
        this.formErrors['longitude'] = true;
      } else {
        this.formErrors['longitude'] = false;
      }
    } else if (lon[3] === '.') {
      if (lon.length < 7 || lon.length > 10) {
        this.formErrors['longitude'] = true;
      } else {
        this.formErrors['longitude'] = false;
      }
    } else {
      this.formErrors['longitude'] = true;
    }
  }
  
  checkRange() {
    const rangeVal = parseFloat(this.range);
    // Assuming a reasonable range for POI is between 0.1 and 500 km
    if (isNaN(rangeVal) || rangeVal <= 0 || rangeVal > 500) {
      this.formErrors['range'] = true;
    } else {
      this.formErrors['range'] = false;
    }
  }

  validateForm(): boolean {
    this.formErrors = {};
    let isValid = true;
    
    if (!this.poiName || this.poiName.trim() === '') {
      this.formErrors['poiName'] = true;
      isValid = false;
    }
    
    if (!this.poiIcon || this.poiIcon === '') {
      this.formErrors['poiIcon'] = true;
      isValid = false;
    }
    
    if (!this.latitude || this.latitude.trim() === '') {
      this.formErrors['latitude'] = true;
      isValid = false;
    } else {
      this.checkLatitude();
      if (this.formErrors['latitude']) {
        isValid = false;
      }
    }
    
    if (!this.longitude || this.longitude.trim() === '') {
      this.formErrors['longitude'] = true;
      isValid = false;
    } else {
      this.checkLongitude();
      if (this.formErrors['longitude']) {
        isValid = false;
      }
    }
    
    if (this.latitude === this.longitude) {
      this.formErrors['latitude'] = true;
      this.formErrors['longitude'] = true;
      isValid = false;
    }
    
    if (!this.range || this.range.trim() === '') {
      this.formErrors['range'] = true;
      isValid = false;
    } else {
      this.checkRange();
      if (this.formErrors['range']) {
        isValid = false;
      }
    }
    
    // Additional latitude/longitude validation
    const lat = this.latitude;
    if (lat) {
      if (lat[2] === '.') {
        if (lat.length < 6 || lat.length > 9) {
          this.formErrors['latitude'] = true;
          isValid = false;
        }
      } else if (lat[3] === '.') {
        if (lat.length < 7 || lat.length > 10) {
          this.formErrors['latitude'] = true;
          isValid = false;
        }
      } else {
        this.formErrors['latitude'] = true;
        isValid = false;
      }
    }
    
    const lon = this.longitude;
    if (lon) {
      if (lon[2] === '.') {
        if (lon.length < 6 || lon.length > 9) {
          this.formErrors['longitude'] = true;
          isValid = false;
        }
      } else if (lon[3] === '.') {
        if (lon.length < 7 || lon.length > 10) {
          this.formErrors['longitude'] = true;
          isValid = false;
        }
      } else {
        this.formErrors['longitude'] = true;
        isValid = false;
      }
    }
    
    return isValid;
  }
  
  clearFormErrors() {
    this.formErrors = {};
    this.errorMessage = '';
  }
  
  poiInsert() {   
    
    if (!this.validateForm()) {
      this.errorMessage = 'Please fill all required fields correctly.';
      return;
    }
    
    this.loading = true;
    this.errorMessage = '';
    
    // Get full icon path
    const iconPathMap: { [key: string]: string } = {
      'railway': 'assets/poiicons/railway.png',
      'airport': 'assets/poiicons/airport.png',
      'bar': 'assets/poiicons/bar.png',
      'building': 'assets/poiicons/building.png',
      'coffeehouse': 'assets/poiicons/coffeehouse.png',
      'education': 'assets/poiicons/education.png',
      'flag': 'assets/poiicons/flag.png',
      'garden': 'assets/poiicons/garden.png',
      'hospital': 'assets/poiicons/hospital.png',
      'industry': 'assets/poiicons/industry.png',
      'mapicon': 'assets/poiicons/map_icon.png',
      'market': 'assets/poiicons/market.png',
      'office': 'assets/poiicons/office.png',
      'postoffice': 'assets/poiicons/postoffice.png',
      'restaurant': 'assets/poiicons/restaurant.png',
      'stopmarker': 'assets/poiicons/stopmark.png',
      'temple': 'assets/poiicons/temple.png',
      'water': 'assets/poiicons/water.png'
    };
    
    const iconPath = iconPathMap[this.poiIcon] || '';
    
    const poiData: POIEntryRequest = {
      param1: '', // Empty for new entry
      param2: this.poiName.trim() || '',
      param3: '',
      param4: iconPath,
      param5: this.poiName.trim() || '',
      param6: this.range.trim() || '',
      param7: this.latitude.trim() || '',
      param8: this.longitude.trim() || ''
    };
    
    this.poiService.putNewPOI(poiData).subscribe({
      next: (response) => {
        this.loading = false;
        if (response.status) {
          this.successMessage = typeof response.entity === 'string' ? response.entity : 'POI created successfully';

          if (this.successMessage.includes('Successfully')) {
            this.resetForm();
            this.router.navigate(['/poi']);
          }
        } else {
          this.errorMessage = typeof response.entity === 'string' ? response.entity : 'Failed to create POI';
          
        }
      },
      error: (error) => {
        this.loading = false;
        this.errorMessage = error?.error?.entity || 'Error creating POI';
      }
    });
  }
  
  resetForm() {
    this.poiName = '';
    this.poiIcon = '';
    this.latitude = '';
    this.longitude = '';
    this.range = '';
    this.imageUrl = '';
    this.clearFormErrors();
    
    // Reset border styles
    const latElement = document.getElementById('lat');
    const longElement = document.getElementById('long');
    if (latElement) {
      latElement.style.border = '2px solid #dde2ec';
    }
    if (longElement) {
      longElement.style.border = '2px solid #dde2ec';
    }
  }
  
  getFieldError(fieldName: string): boolean {
    return this.formErrors[fieldName] || false;
  }
  
  goBack() {
    this.router.navigate(['/poi']);
  }
}
