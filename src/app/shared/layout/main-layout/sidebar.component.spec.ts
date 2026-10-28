import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { SidebarComponent } from './sidebar.component';

describe('SidebarComponent', () => {
  let fixture: ComponentFixture<SidebarComponent>;
  let component: SidebarComponent;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SidebarComponent],
      providers: [provideRouter([])]
    }).compileComponents();

    fixture = TestBed.createComponent(SidebarComponent);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('items', [{
      id: 'operations',
      label: 'Operations',
      children: [
        { id: 'vehicles', label: 'Vehicles', route: '/vehicles' },
        {
          id: 'reports',
          label: 'Reports',
          children: [
            { id: 'daily-report', label: 'Daily report', route: '/reports/daily' }
          ]
        }
      ]
    }, {
      id: 'administration',
      label: 'Administration',
      children: [
        { id: 'users', label: 'Users', route: '/users' },
        { id: 'roles', label: 'Roles', route: '/roles' }
      ]
    }]);
    fixture.detectChanges();
  });

  it('expands navigation on keyboard focus and collapses it on Escape', () => {
    const toggle = fixture.nativeElement.querySelector('.menu-toggle') as HTMLButtonElement;
    toggle.dispatchEvent(new FocusEvent('focusin', { bubbles: true }));
    fixture.detectChanges();

    expect(toggle.getAttribute('aria-expanded')).toBe('true');
    expect(fixture.nativeElement.querySelector('.sub-menu')).not.toBeNull();

    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('.sub-menu')).toBeNull();
  });

  it('opens only the hovered menu in a flyout and immediately collapses everything on sidebar leave', () => {
    fixture.componentRef.setInput('collapsed', true);
    fixture.detectChanges();
    const aside = fixture.nativeElement.querySelector('.menu-w') as HTMLElement;
    const host = fixture.nativeElement as HTMLElement;
    const menuItems = fixture.nativeElement.querySelectorAll('.nav-item') as NodeListOf<HTMLElement>;
    menuItems[0].dispatchEvent(new PointerEvent('pointerenter', { bubbles: true, pointerType: 'mouse' }));
    fixture.detectChanges();

    expect(aside.classList).toContain('expanded');
    expect(getComputedStyle(aside).position).toBe('absolute');
    expect(getComputedStyle(host).width).toBe('56px');
    expect(fixture.nativeElement.querySelectorAll('.submenu-flyout').length).toBe(1);
    expect((fixture.nativeElement.querySelector('.submenu-heading') as HTMLElement).textContent).toContain('Operations');

    component.onViewportResize();
    fixture.detectChanges();
    const flyout = fixture.nativeElement.querySelector('.submenu-flyout') as HTMLElement;
    expect(Number.parseFloat(flyout.style.top)).toBeGreaterThanOrEqual(8);
    expect(Number.parseFloat(flyout.style.maxHeight)).toBeLessThanOrEqual(window.innerHeight - 16);

    menuItems[1].dispatchEvent(new PointerEvent('pointerenter', { bubbles: true, pointerType: 'mouse' }));
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelectorAll('.submenu-flyout').length).toBe(1);
    expect((fixture.nativeElement.querySelector('.submenu-heading') as HTMLElement).textContent).toContain('Administration');

    const nestedItem = {
      id: 'expanded-child',
      label: 'Expanded child',
      children: [{ id: 'nested-route', label: 'Nested route', route: '/nested' }]
    };
    component.toggleNested(nestedItem, new Event('click'));
    expect(component.activeNestedSubMenuItem?.id).toBe(nestedItem.id);

    aside.dispatchEvent(new PointerEvent('pointerleave', { bubbles: false, pointerType: 'mouse' }));
    fixture.detectChanges();
    expect(aside.classList).not.toContain('expanded');
    expect(fixture.nativeElement.querySelector('.submenu-flyout')).toBeNull();
    expect(component.activeSubMenu).toBeNull();
    expect(component.expandedItems.size).toBe(0);
    expect(component.desktopExpanded).toBeFalse();
  });

  it('opens submenus by click on touch input instead of pointer hover', () => {
    const aside = fixture.nativeElement.querySelector('.menu-w') as HTMLElement;
    const toggle = fixture.nativeElement.querySelector('.menu-toggle') as HTMLButtonElement;
    fixture.componentRef.setInput('mobileOpen', true);
    aside.dispatchEvent(new PointerEvent('pointerenter', { bubbles: true, pointerType: 'touch' }));
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('.sub-menu')).toBeNull();

    toggle.click();
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('.sub-menu')).not.toBeNull();
  });

  it('closes the mobile drawer from its outside-click backdrop', () => {
    const close = jasmine.createSpy('close');
    component.closeMobile.subscribe(close);
    fixture.componentRef.setInput('mobileOpen', true);
    fixture.detectChanges();

    (fixture.nativeElement.querySelector('.nav-backdrop') as HTMLButtonElement).click();
    (fixture.nativeElement.querySelector('.mobile-close') as HTMLButtonElement).click();
    expect(close).toHaveBeenCalledTimes(2);
  });

  it('keeps the rail compact by default and centers collapsed icons', () => {
    fixture.componentRef.setInput('collapsed', true);
    fixture.detectChanges();

    const sidebar = fixture.nativeElement.querySelector('.menu-w') as HTMLElement;
    const brand = fixture.nativeElement.querySelector('.sidebar-brand') as HTMLElement;
    const nav = fixture.nativeElement.querySelector('.sidebar-nav') as HTMLElement;
    const link = fixture.nativeElement.querySelector('.menu-toggle') as HTMLElement;
    expect(getComputedStyle(sidebar).width).toBe('56px');
    expect(getComputedStyle(brand).flexShrink).toBe('0');
    expect(getComputedStyle(nav).overflowY).toBe('auto');
    expect(getComputedStyle(nav).scrollbarWidth).toBe('none');
    expect(getComputedStyle(nav).minHeight).toBe('0px');
    expect(getComputedStyle(link).justifyContent).toBe('center');
    expect(getComputedStyle(link.querySelector('.nav-label') as HTMLElement).display).toBe('none');
  });

  it('opens nested submenu levels in a separately positioned flyout', () => {
    fixture.componentRef.setInput('collapsed', true);
    fixture.detectChanges();
    const item = fixture.nativeElement.querySelector('.nav-item') as HTMLElement;
    item.dispatchEvent(new PointerEvent('pointerenter', { bubbles: true, pointerType: 'mouse' }));
    fixture.detectChanges();

    const nestedToggle = fixture.nativeElement.querySelector('.nested-toggle') as HTMLButtonElement;
    nestedToggle.click();
    fixture.detectChanges();

    expect(nestedToggle.getAttribute('aria-expanded')).toBe('true');
    const rootFlyout = fixture.nativeElement.querySelector('.submenu-flyout') as HTMLElement;
    const nestedFlyout = fixture.nativeElement.querySelector('.nested-flyout') as HTMLElement;
    expect(getComputedStyle(rootFlyout).overflowY).toBe('auto');
    expect(getComputedStyle(rootFlyout).scrollbarWidth).toBe('none');
    expect(getComputedStyle(nestedFlyout).overflowY).toBe('auto');
    expect(getComputedStyle(nestedFlyout).scrollbarWidth).toBe('none');
    expect(nestedFlyout.querySelector('.sub-link')).not.toBeNull();
    component.onViewportResize();
    fixture.detectChanges();
    expect(Number.parseFloat((fixture.nativeElement.querySelector('.nested-flyout') as HTMLElement).style.maxHeight))
      .toBeLessThanOrEqual(window.innerHeight - 16);
    expect(component.nestedSubmenuLeft).toBeGreaterThanOrEqual(8);
    expect(component.nestedSubmenuLeft).toBeLessThan(window.innerWidth);
  });

  it('repositions the flyout for each hovered parent and recalculates after reopening', () => {
    fixture.componentRef.setInput('collapsed', true);
    fixture.detectChanges();

    const parents = fixture.nativeElement.querySelectorAll('.nav-item') as NodeListOf<HTMLElement>;
    spyOn(parents[0], 'getBoundingClientRect').and.returnValue(new DOMRect(0, 120, 56, 31));
    spyOn(parents[1], 'getBoundingClientRect').and.returnValue(new DOMRect(0, 320, 56, 31));

    parents[0].dispatchEvent(new PointerEvent('pointerenter', { bubbles: true, pointerType: 'mouse' }));
    fixture.detectChanges();
    component.onViewportResize();
    expect(component.submenuTop).toBe(120);

    parents[1].dispatchEvent(new PointerEvent('pointerenter', { bubbles: true, pointerType: 'mouse' }));
    fixture.detectChanges();
    component.onViewportResize();
    expect(component.activeSubMenu).toBe('administration');
    expect(component.submenuTop).toBe(320);

    component.onSidebarPointerLeave();
    expect(component.submenuTop).toBe(0);
    expect(component.submenuMaxHeight).toBe(0);

    component.onSidebarPointerEnter(new PointerEvent('pointerenter', { pointerType: 'mouse' }));
    parents[1].dispatchEvent(new PointerEvent('pointerenter', { bubbles: true, pointerType: 'mouse' }));
    fixture.detectChanges();
    component.onViewportResize();
    expect(component.submenuTop).toBe(320);
  });

  it('moves a long submenu up and constrains it to the available viewport height', () => {
    fixture.componentRef.setInput('collapsed', true);
    fixture.detectChanges();
    const anchor = fixture.nativeElement.querySelector('.nav-item') as HTMLElement;
    spyOn(anchor, 'getBoundingClientRect').and.returnValue(
      new DOMRect(0, window.innerHeight - 24, 56, 31)
    );
    anchor.dispatchEvent(new PointerEvent('pointerenter', { bubbles: true, pointerType: 'mouse' }));
    fixture.detectChanges();

    const panel = fixture.nativeElement.querySelector('.submenu-flyout') as HTMLElement;
    spyOnProperty(panel, 'scrollHeight', 'get').and.returnValue(window.innerHeight * 2);
    component.onViewportResize();
    expect(component.submenuTop).toBeLessThanOrEqual(window.innerHeight - 16);
    expect(component.submenuTop + component.submenuMaxHeight).toBeLessThanOrEqual(window.innerHeight - 8);
    fixture.detectChanges();

    const headerBottom = document.querySelector<HTMLElement>('.topbar')?.getBoundingClientRect().bottom ?? 0;
    expect(component.submenuTop).toBeGreaterThanOrEqual(headerBottom + 8);
    expect(component.submenuTop + component.submenuMaxHeight).toBeLessThanOrEqual(window.innerHeight - 8);
  });

  it('maps common application sections to distinct installed Font Awesome icons', () => {
    expect(component.iconFor('Vehicles')).toBe('fa-bus');
    expect(component.iconFor('Reports')).toBe('fa-bar-chart');
    expect(component.iconFor('Live Tracking')).toBe('fa-map-marker');
    expect(component.iconFor('Administration')).toBe('fa-wrench');
  });
});
