import { ComponentFixture, TestBed } from '@angular/core/testing';

import { RTOUserCreationComponent } from './rtouser-creation.component';

describe('RTOUserCreationComponent', () => {
  let component: RTOUserCreationComponent;
  let fixture: ComponentFixture<RTOUserCreationComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RTOUserCreationComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(RTOUserCreationComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
