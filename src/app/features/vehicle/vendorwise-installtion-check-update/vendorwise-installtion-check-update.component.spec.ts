import { ComponentFixture, TestBed } from '@angular/core/testing';

import { VendorwiseInstalltionCheckUpdateComponent } from './vendorwise-installtion-check-update.component';

describe('VendorwiseInstalltionCheckUpdateComponent', () => {
  let component: VendorwiseInstalltionCheckUpdateComponent;
  let fixture: ComponentFixture<VendorwiseInstalltionCheckUpdateComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [VendorwiseInstalltionCheckUpdateComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(VendorwiseInstalltionCheckUpdateComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
