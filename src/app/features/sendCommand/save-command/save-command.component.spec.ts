import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SaveCommandComponent } from './save-command.component';

describe('SaveCommandComponent', () => {
  let component: SaveCommandComponent;
  let fixture: ComponentFixture<SaveCommandComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SaveCommandComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(SaveCommandComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
