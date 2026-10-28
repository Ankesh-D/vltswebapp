import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SchoolTripMasterComponent } from './school-trip-master.component';

describe('SchoolTripMasterComponent', () => {
  let component: SchoolTripMasterComponent;
  let fixture: ComponentFixture<SchoolTripMasterComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SchoolTripMasterComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(SchoolTripMasterComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
