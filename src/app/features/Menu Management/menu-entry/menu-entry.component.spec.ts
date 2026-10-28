import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { RouterTestingModule } from '@angular/router/testing';

import { MenuEntryComponent } from './menu-entry.component';

describe('MenuEntryComponent', () => {
  let component: MenuEntryComponent;
  let fixture: ComponentFixture<MenuEntryComponent>;
  
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MenuEntryComponent, HttpClientTestingModule, RouterTestingModule]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(MenuEntryComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
