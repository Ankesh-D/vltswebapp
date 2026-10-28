import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MigrationDataComponent } from './migration-data.component';

describe('MigrationDataComponent', () => {
  let component: MigrationDataComponent;
  let fixture: ComponentFixture<MigrationDataComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MigrationDataComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(MigrationDataComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
