import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PortEntryComponent } from './port-entry.component';

describe('PortEntryComponent', () => {
  let component: PortEntryComponent;
  let fixture: ComponentFixture<PortEntryComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PortEntryComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(PortEntryComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
