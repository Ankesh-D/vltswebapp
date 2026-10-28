/** Search and paging for tables whose complete displayed dataset is already loaded. */
export class LocalTableState {
  search = '';
  page = 1;
  pageSize = 20;
  readonly pageSizeOptions = [10, 20, 50, 100];

  filtered<T>(rows: T[]): T[] {
    const query = this.search.trim().toLocaleLowerCase();
    return query ? rows.filter(row => Object.values(row as object).some(value =>
      value != null && String(value).toLocaleLowerCase().includes(query))) : rows;
  }

  currentPage<T>(rows: T[]): number {
    return Math.min(Math.max(1, this.page), Math.max(1, Math.ceil(this.filtered(rows).length / this.pageSize)));
  }

  visible<T>(rows: T[]): T[] {
    const start = (this.currentPage(rows) - 1) * this.pageSize;
    return this.filtered(rows).slice(start, start + this.pageSize);
  }

  setSearch(value: string): void {
    this.search = value;
    this.page = 1;
  }

  setPageSize(value: string | number): void {
    const size = Number(value);
    if (Number.isFinite(size) && size > 0) this.pageSize = Math.max(1, Math.floor(size));
    this.page = 1;
  }

  reset(): void {
    this.search = '';
    this.page = 1;
  }
}
