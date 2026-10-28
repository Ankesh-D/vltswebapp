import { ComponentFixture, TestBed } from '@angular/core/testing';

import { UnauthorizeStoppagesReportComponent } from './unauthorize-stoppages-report.component';

describe('UnauthorizeStoppagesReportComponent', () => {
  let component: UnauthorizeStoppagesReportComponent;
  let fixture: ComponentFixture<UnauthorizeStoppagesReportComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [UnauthorizeStoppagesReportComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(UnauthorizeStoppagesReportComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
