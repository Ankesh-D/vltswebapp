import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SchoolMasterComponent } from './school-master.component';

describe('SchoolMasterComponent', () => {
  let component: SchoolMasterComponent;
  let fixture: ComponentFixture<SchoolMasterComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SchoolMasterComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(SchoolMasterComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
