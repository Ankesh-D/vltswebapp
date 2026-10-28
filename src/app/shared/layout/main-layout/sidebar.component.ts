import { CommonModule } from '@angular/common';
import { Component, ElementRef, EventEmitter, HostListener, Input, OnChanges, OnDestroy, Output, SimpleChanges, ViewChild } from '@angular/core';
import { Router, RouterModule } from '@angular/router';

export interface SidebarMenuItem {
  id: string;
  label: string;
  route?: string;
  children?: SidebarMenuItem[];
}

@Component({
  selector: 'app-sidebar',
  imports: [CommonModule, RouterModule],
  templateUrl: './sidebar.component.html',
  styleUrl: './sidebar.component.scss'
})
export class SidebarComponent implements OnChanges, OnDestroy {
  @Input() items: SidebarMenuItem[] = [];
  @Input() collapsed = true;
  @Input() mobileOpen = false;
  @Input() logoSrc = '';
  @Output() readonly closeMobile = new EventEmitter<void>();
  private submenuPanel?: HTMLElement;
  private nestedPanel?: HTMLElement;
  private panelResizeObserver?: ResizeObserver;

  desktopExpanded = false;
  activeSubMenu: string | null = null;
  activeSubMenuItem: SidebarMenuItem | null = null;
  activeNestedSubMenuItem: SidebarMenuItem | null = null;
  private submenuAnchor?: HTMLElement;
  private nestedSubmenuAnchor?: HTMLElement;
  expandedItems = new Set<string>();
  private pointerWithin = false;
  private focusWithin = false;
  submenuTop = 64;
  submenuMaxHeight = 0;
  nestedSubmenuTop = 64;
  nestedSubmenuLeft = 0;
  nestedSubmenuMaxHeight = 0;

  constructor(
    private readonly host: ElementRef<HTMLElement>,
    private readonly router: Router
  ) {}

  @ViewChild('submenuPanel')
  set submenuPanelRef(element: ElementRef<HTMLElement> | undefined) {
    this.observePanel(element?.nativeElement, 'submenu');
  }

  @ViewChild('nestedPanel')
  set nestedPanelRef(element: ElementRef<HTMLElement> | undefined) {
    this.observePanel(element?.nativeElement, 'nested');
  }

  ngOnDestroy(): void {
    this.panelResizeObserver?.disconnect();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['items'] && this.activeSubMenu) {
      this.activeSubMenuItem = this.findMenuItem(this.items, this.activeSubMenu) ?? null;
      if (!this.activeSubMenuItem) {
        this.closeSubMenu();
        return;
      }
      this.scheduleSubmenuPosition();
      if (this.activeNestedSubMenuItem) {
        this.activeNestedSubMenuItem =
          this.findMenuItem(this.items, this.activeNestedSubMenuItem.id) ?? null;
        if (this.activeNestedSubMenuItem) this.scheduleNestedSubmenuPosition();
        else {
          this.nestedSubmenuAnchor = undefined;
          this.nestedSubmenuTop = 0;
          this.nestedSubmenuLeft = 0;
          this.nestedSubmenuMaxHeight = 0;
        }
      }
    }
  }

  toggleSubMenu(item: SidebarMenuItem, event: Event): void {
    if (this.desktopExpanded && !this.mobileOpen) return;
    if (this.activeSubMenu === item.id) {
      this.closeSubMenu();
      return;
    }
    this.openSubMenu(item, event);
  }

  onSidebarPointerEnter(event: PointerEvent): void {
    if (!this.mobileOpen && event.pointerType !== 'touch') {
      this.pointerWithin = true;
      this.desktopExpanded = true;
    }
  }

  onSidebarPointerLeave(): void {
    if (this.mobileOpen) return;
    this.pointerWithin = false;
    this.collapseNavigation();
  }

  onSidebarFocusIn(): void {
    this.focusWithin = true;
    this.desktopExpanded = true;
  }

  onSidebarFocusOut(event: FocusEvent): void {
    const aside = event.currentTarget;
    if (!(event.relatedTarget instanceof Node) ||
        !(aside instanceof HTMLElement) ||
        !aside.contains(event.relatedTarget)) {
      this.focusWithin = false;
      this.desktopExpanded = this.pointerWithin;
      if (!this.desktopExpanded) this.closeSubMenu();
    }
  }

  openSubMenu(item: SidebarMenuItem, event: Event): void {
    if (!item.children?.length) return;
    if (this.activeSubMenu !== item.id) {
      this.activeNestedSubMenuItem = null;
      this.nestedSubmenuAnchor = undefined;
      this.expandedItems.clear();
      this.submenuTop = 0;
      this.submenuMaxHeight = 0;
      this.nestedSubmenuTop = 0;
      this.nestedSubmenuLeft = 0;
      this.nestedSubmenuMaxHeight = 0;
    }
    if (!this.mobileOpen) {
      this.pointerWithin = true;
      this.desktopExpanded = true;
    }
    this.activeSubMenu = item.id;
    this.activeSubMenuItem = item;
    this.submenuAnchor = event.currentTarget instanceof HTMLElement ? event.currentTarget : undefined;
    if (!this.mobileOpen) {
      const { top, bottom } = this.visibleBounds();
      this.submenuMaxHeight = Math.max(0, bottom - top);
      this.submenuTop = this.clamp(this.submenuAnchor?.getBoundingClientRect().top ?? top, top, bottom);
      this.scheduleSubmenuPosition();
    }
  }

  onRootItemPointerEnter(item: SidebarMenuItem, event: PointerEvent): void {
    if (this.mobileOpen || event.pointerType === 'touch') return;
    if (item.children?.length) this.openSubMenu(item, event);
    else this.closeSubMenu();
  }

  onRootItemFocus(item: SidebarMenuItem, event: FocusEvent): void {
    if (this.mobileOpen) return;
    if (item.children?.length) this.openSubMenu(item, event);
    else this.closeSubMenu();
  }

  closeSubMenu(): void {
    this.activeSubMenu = null;
    this.activeSubMenuItem = null;
    this.activeNestedSubMenuItem = null;
    this.submenuAnchor = undefined;
    this.nestedSubmenuAnchor = undefined;
    this.expandedItems.clear();
    this.submenuTop = 0;
    this.submenuMaxHeight = 0;
    this.nestedSubmenuTop = 0;
    this.nestedSubmenuLeft = 0;
    this.nestedSubmenuMaxHeight = 0;
  }

  isMenuExpanded(item: SidebarMenuItem): boolean {
    return this.activeSubMenu === item.id || this.expandedItems.has(item.id);
  }

  routeActive(route: string): boolean {
    const normalize = (value: string) => {
      const path = (value || '').replace(/^#!?\/?/, '/').split(/[?#]/, 1)[0].replace(/\/+/g, '/').replace(/\/$/, '');
      return path.startsWith('/') ? path : `/${path}`;
    };
    const target = normalize(route);
    const current = normalize(this.router.url);
    return target !== '/' && (current === target || current.startsWith(`${target}/`));
  }

  menuActive(item: SidebarMenuItem): boolean {
    return Boolean((item.route && this.routeActive(item.route)) ||
      item.children?.some(child => this.menuActive(child)));
  }

  directRoute(item: SidebarMenuItem): string | undefined {
    if (item.route && !item.children?.length) return item.route;
    if (item.children?.length === 1) {
      const [child] = item.children;
      if (child.route && !child.children?.length) return child.route;
    }
    return undefined;
  }

  toggleNested(item: SidebarMenuItem, event: Event): void {
    if (!this.mobileOpen) {
      if (this.activeNestedSubMenuItem?.id === item.id) {
        this.activeNestedSubMenuItem = null;
        this.nestedSubmenuAnchor = undefined;
        this.nestedSubmenuTop = 0;
        this.nestedSubmenuLeft = 0;
        this.nestedSubmenuMaxHeight = 0;
      } else {
        this.openNestedSubmenu(item, event);
      }
      return;
    }
    const expanded = new Set(this.expandedItems);
    if (expanded.has(item.id)) expanded.delete(item.id);
    else expanded.add(item.id);
    this.expandedItems = expanded;
  }

  onNestedPointerEnter(item: SidebarMenuItem, event: PointerEvent): void {
    if (!this.mobileOpen && event.pointerType !== 'touch' && item.children?.length) this.openNestedSubmenu(item, event);
  }

  onNestedFocus(item: SidebarMenuItem, event: FocusEvent): void {
    if (!this.mobileOpen && item.children?.length) this.openNestedSubmenu(item, event);
  }

  isNestedExpanded(item: SidebarMenuItem): boolean {
    return this.mobileOpen
      ? this.expandedItems.has(item.id)
      : this.activeNestedSubMenuItem?.id === item.id;
  }

  onNavigation(): void {
    this.closeSubMenu();
    this.desktopExpanded = false;
    this.pointerWithin = false;
    if (this.mobileOpen) this.closeMobile.emit();
  }

  iconFor(label: string): string {
    const name = label.toLowerCase();
    if (/dashboard|home|control center/.test(name)) return 'fa-tachometer';
    if (/vehicle|fleet/.test(name)) return 'fa-bus';
    if (/device|sim|firmware/.test(name)) return 'fa-microchip';
    if (/vendor|dealer/.test(name)) return 'fa-truck';
    if (/user|role|permission/.test(name)) return 'fa-users';
    if (/alert|panic|sos/.test(name)) return 'fa-bell';
    if (/report|analytics/.test(name)) return 'fa-bar-chart';
    if (/track|map|location/.test(name)) return 'fa-map-marker';
    if (/route|trip/.test(name)) return 'fa-road';
    if (/operation|command/.test(name)) return 'fa-cogs';
    if (/menu|navigation/.test(name)) return 'fa-list';
    if (/setting|config|admin/.test(name)) return 'fa-wrench';
    return 'fa-th-large';
  }

  @HostListener('document:keydown.escape')
  onEscape(): void {
    this.closeSubMenu();
    this.desktopExpanded = this.pointerWithin || this.focusWithin;
  }

  @HostListener('window:resize')
  onViewportResize(): void {
    this.positionSubmenu();
    this.positionNestedSubmenu();
  }

  onMenuScroll(): void {
    this.scheduleSubmenuPosition();
    this.scheduleNestedSubmenuPosition();
  }

  private positionSubmenu(): void {
    const panel = this.submenuPanel ?? this.host.nativeElement.querySelector<HTMLElement>('.submenu-flyout');
    if (this.mobileOpen) return;
    const { top: topBoundary, bottom: bottomBoundary } = this.visibleBounds();
    const availableHeight = Math.max(0, bottomBoundary - topBoundary);
    this.submenuMaxHeight = availableHeight;
    const anchorElement =
      this.findAnchor('[data-menu-id]', 'data-menu-id', this.activeSubMenu) ??
      (this.submenuAnchor?.isConnected ? this.submenuAnchor : undefined);
    const anchor = anchorElement?.getBoundingClientRect();
    const desiredTop = anchor?.top ?? topBoundary;
    const contentHeight = panel?.scrollHeight ?? 0;
    const panelHeight = Math.min(contentHeight || availableHeight, availableHeight);
    this.submenuTop = this.clamp(desiredTop, topBoundary, bottomBoundary - panelHeight);
    this.positionNestedSubmenu();
  }

  private positionNestedSubmenu(): void {
    const panel = this.nestedPanel ?? this.host.nativeElement.querySelector<HTMLElement>('.nested-flyout');
    if (this.mobileOpen) return;
    const { top: topBoundary, bottom: bottomBoundary } = this.visibleBounds();
    const availableHeight = Math.max(0, bottomBoundary - topBoundary);
    const anchorElement = this.findAnchor(
      '[data-submenu-id]',
      'data-submenu-id',
      this.activeNestedSubMenuItem?.id
    ) ?? (this.nestedSubmenuAnchor?.isConnected ? this.nestedSubmenuAnchor : undefined);
    const anchor = anchorElement?.getBoundingClientRect();
    const panelWidth = panel?.offsetWidth ?? 220;
    const rightSpace = window.innerWidth - (anchor?.right ?? 0) - 8;
    const leftSpace = (anchor?.left ?? panelWidth + 8) - 8;
    const openRight = rightSpace >= panelWidth || rightSpace >= leftSpace;
    const desiredLeft = openRight
      ? (anchor?.right ?? 0)
      : (anchor?.left ?? panelWidth + 8) - panelWidth;
    const viewportWidth = window.visualViewport?.width ?? window.innerWidth;
    const left = this.clamp(desiredLeft, 8, viewportWidth - panelWidth - 8);

    this.nestedSubmenuMaxHeight = availableHeight;
    const contentHeight = panel?.scrollHeight ?? 0;
    const panelHeight = Math.min(contentHeight || availableHeight, availableHeight);
    this.nestedSubmenuLeft = left;
    this.nestedSubmenuTop = this.clamp(anchor?.top ?? topBoundary, topBoundary, bottomBoundary - panelHeight);
  }

  private openNestedSubmenu(item: SidebarMenuItem, event: Event): void {
    if (!item.children?.length) return;
    this.activeNestedSubMenuItem = item;
    this.nestedSubmenuAnchor = event.currentTarget instanceof HTMLElement ? event.currentTarget : undefined;
    const { top, bottom } = this.visibleBounds();
    this.nestedSubmenuMaxHeight = Math.max(0, bottom - top);
    this.nestedSubmenuTop = this.clamp(this.nestedSubmenuAnchor?.getBoundingClientRect().top ?? top, top, bottom);
    this.nestedSubmenuLeft = 0;
    this.scheduleNestedSubmenuPosition();
  }

  private findAnchor(selector: string, attribute: string, id: string | null | undefined): HTMLElement | undefined {
    if (!id) return undefined;
    return Array.from(this.host.nativeElement.querySelectorAll<HTMLElement>(selector))
      .find(element => element.getAttribute(attribute) === id);
  }

  private scheduleSubmenuPosition(): void {
    requestAnimationFrame(() => this.positionSubmenu());
  }

  private scheduleNestedSubmenuPosition(): void {
    requestAnimationFrame(() => this.positionNestedSubmenu());
  }

  private observePanel(panel: HTMLElement | undefined, kind: 'submenu' | 'nested'): void {
    const previousPanel = kind === 'submenu' ? this.submenuPanel : this.nestedPanel;
    if (previousPanel && previousPanel !== panel) this.panelResizeObserver?.unobserve(previousPanel);
    if (kind === 'submenu') this.submenuPanel = panel;
    else this.nestedPanel = panel;
    if (!panel || typeof ResizeObserver === 'undefined') {
      if (panel) {
        this.scheduleSubmenuPosition();
        this.scheduleNestedSubmenuPosition();
      }
      return;
    }

    this.panelResizeObserver ??= new ResizeObserver(() => {
      this.scheduleSubmenuPosition();
      this.scheduleNestedSubmenuPosition();
    });
    this.panelResizeObserver.observe(panel);
    this.scheduleSubmenuPosition();
  }

  private visibleBounds(): { top: number; bottom: number } {
    const viewportTop = Math.min(window.visualViewport?.offsetTop ?? 0, window.innerHeight);
    const viewportBottom = Math.min(
      window.innerHeight,
      viewportTop + (window.visualViewport?.height ?? window.innerHeight)
    );
    const bottom = Math.max(8, viewportBottom - 8);
    const headerBottom = document.querySelector<HTMLElement>('.topbar')?.getBoundingClientRect().bottom ?? viewportTop;
    const top = Math.min(Math.max(viewportTop + 8, headerBottom + 8), bottom);
    return { top, bottom };
  }

  private clamp(value: number, minimum: number, maximum: number): number {
    return Math.max(minimum, Math.min(value, Math.max(minimum, maximum)));
  }

  private findMenuItem(items: SidebarMenuItem[], id: string): SidebarMenuItem | undefined {
    for (const item of items) {
      if (item.id === id) return item;
      const found = item.children && this.findMenuItem(item.children, id);
      if (found) return found;
    }
    return undefined;
  }

  private collapseNavigation(): void {
    this.desktopExpanded = false;
    this.pointerWithin = false;
    this.closeSubMenu();
  }
}
