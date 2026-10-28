import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MenuAssignmentComponent } from './menu-assignment.component';

describe('MenuAssignmentComponent', () => {
  let component: MenuAssignmentComponent;
  let fixture: ComponentFixture<MenuAssignmentComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MenuAssignmentComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(MenuAssignmentComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
