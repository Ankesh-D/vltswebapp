import { ComponentFixture, TestBed } from '@angular/core/testing';

import { OutOfOfficeHrsReportComponent } from './out-of-office-hrs-report.component';

describe('OutOfOfficeHrsReportComponent', () => {
  let component: OutOfOfficeHrsReportComponent;
  let fixture: ComponentFixture<OutOfOfficeHrsReportComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [OutOfOfficeHrsReportComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(OutOfOfficeHrsReportComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
