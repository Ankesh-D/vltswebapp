import { ComponentFixture, TestBed } from '@angular/core/testing';

import { HolidayCalendarMasterComponent } from './hodilday.component';

describe('HolidayCalendarMasterComponent', () => {
  let component: HolidayCalendarMasterComponent;
  let fixture: ComponentFixture<HolidayCalendarMasterComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [HolidayCalendarMasterComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(HolidayCalendarMasterComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
