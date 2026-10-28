import { ComponentFixture, TestBed } from '@angular/core/testing';

import { VendorwiseInstallationChecksComponent } from './vendorwise-installation-checks.component';

describe('VendorwiseInstallationChecksComponent', () => {
  let component: VendorwiseInstallationChecksComponent;
  let fixture: ComponentFixture<VendorwiseInstallationChecksComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [VendorwiseInstallationChecksComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(VendorwiseInstallationChecksComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
