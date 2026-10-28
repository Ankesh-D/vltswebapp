import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DistributorMasterComponent } from './distributor-master.component';

describe('DistributorMasterComponent', () => {
  let component: DistributorMasterComponent;
  let fixture: ComponentFixture<DistributorMasterComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DistributorMasterComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(DistributorMasterComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
