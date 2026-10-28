import { ComponentFixture, TestBed } from '@angular/core/testing';

import { OldReportGenerationStatusComponent } from './old-report-generation-status.component';

describe('OldReportGenerationStatusComponent', () => {
  let component: OldReportGenerationStatusComponent;
  let fixture: ComponentFixture<OldReportGenerationStatusComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [OldReportGenerationStatusComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(OldReportGenerationStatusComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
