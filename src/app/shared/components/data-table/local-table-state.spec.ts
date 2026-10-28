import { LocalTableState } from './local-table-state';

describe('LocalTableState', () => {
  const rows = Array.from({ length: 45 }, (_, index) => ({ id: index + 1, name: `Vehicle ${index + 1}` }));

  it('pages without changing the source records or their identity', () => {
    const state = new LocalTableState();
    state.page = 2;
    expect(state.visible(rows).length).toBe(20);
    expect(state.visible(rows)[0]).toBe(rows[20]);
    expect(rows.length).toBe(45);
  });

  it('resets the page and searches case insensitively', () => {
    const state = new LocalTableState();
    state.page = 3;
    state.setSearch('  VEHICLE 4  ');
    expect(state.page).toBe(1);
    expect(state.filtered(rows).length).toBe(7);
    expect(state.visible(rows)[0]).toBe(rows[3]);
  });

  it('keeps edited records when moving between pages', () => {
    const editable = rows.map(row => ({ ...row, selected: false }));
    const state = new LocalTableState();
    state.visible(editable)[0].selected = true;
    state.page = 2;
    state.visible(editable);
    state.page = 1;
    expect(state.visible(editable)[0].selected).toBeTrue();
  });

  it('clamps the displayed page when refreshed data shrinks', () => {
    const state = new LocalTableState();
    state.page = 3;
    expect(state.currentPage(rows.slice(0, 5))).toBe(1);
    expect(state.visible(rows.slice(0, 5)).length).toBe(5);
    expect(state.currentPage([])).toBe(1);
    expect(state.visible([])).toEqual([]);
  });

  it('accepts select values and ignores invalid page sizes', () => {
    const state = new LocalTableState();
    state.page = 3;
    state.setPageSize('10');
    expect(state.page).toBe(1);
    expect(state.visible(rows).length).toBe(10);
    state.setPageSize(0);
    state.setPageSize('invalid');
    expect(state.pageSize).toBe(10);
  });

  it('handles missing field values and empty search results', () => {
    const state = new LocalTableState();
    state.setSearch('missing');
    expect(state.filtered([{ name: null }, { name: undefined }, { name: 'Other' }])).toEqual([]);
    state.reset();
    expect(state.visible(rows).length).toBe(20);
  });
});
