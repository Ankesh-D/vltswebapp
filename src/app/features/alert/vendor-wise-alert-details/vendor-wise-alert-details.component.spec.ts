import { ComponentFixture, TestBed } from '@angular/core/testing';

import { VendorWiseAlertDetailsComponent } from './vendor-wise-alert-details.component';

describe('VendorWiseAlertDetailsComponent', () => {
  let component: VendorWiseAlertDetailsComponent;
  let fixture: ComponentFixture<VendorWiseAlertDetailsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [VendorWiseAlertDetailsComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(VendorWiseAlertDetailsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
