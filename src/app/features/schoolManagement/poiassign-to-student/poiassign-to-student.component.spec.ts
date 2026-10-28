import { ComponentFixture, TestBed } from '@angular/core/testing';

import { POIAssignToStudentComponent } from './poiassign-to-student.component';

describe('POIAssignToStudentComponent', () => {
  let component: POIAssignToStudentComponent;
  let fixture: ComponentFixture<POIAssignToStudentComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [POIAssignToStudentComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(POIAssignToStudentComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
