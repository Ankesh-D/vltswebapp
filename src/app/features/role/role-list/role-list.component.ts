import { Component, OnInit, ChangeDetectorRef, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { RoleService, Role, RoleRequest, RoleUpdateRequest, RoleDeleteRequest } from '../../../core/services/role.service';
import { CommonTableColumn, CommonTableComponent } from '../../../shared/components/common-table/common-table.component';

@Component({
    selector: 'app-role-list',
    imports: [CommonModule, FormsModule, RouterModule, CommonTableComponent],
    templateUrl: './role-list.component.html',
    changeDetection: ChangeDetectionStrategy.Eager,
    styleUrls: ['./role-list.component.scss']
})
export class RoleListComponent implements OnInit {
  roles: Role[] = [];
  loading = false;
  errorMessage = '';
  searchText = '';
  currentPage = 1;
  pageSize = 20;
  pageSizeOptions = [20];
  totalCount = 0;
  pageCount = 0;
  
  // Sorting
  sortKey: string = '';
  reverse: boolean = false;
  readonly tableColumns: CommonTableColumn<Role>[] = [
    { key: 'param1', label: '#', width: '25px', value: role => role.param1 || 'NA' },
    { key: 'param3', label: 'Role Name', sortable: true, value: role => role.param3 || 'NA' },
    { key: 'param4', label: 'Role Description', sortable: true, value: role => role.param4 || 'NA' },
    { key: 'param5', label: 'Created Date', sortable: true, value: role => role.param5 || 'NA' },
    { key: 'actions', label: 'Action' }
  ];
  
  // Modal data
  selectedRole: Role | null = null;
  editRoleName: string = '';
  editRoleDescription: string = '';
  editRemark: string = '';
  deleteRemark: string = '';
  
  // Modal visibility
  showEditModal = false;
  showDeleteModal = false;
  isIncorrect = false;
  
  constructor(
    private roleService: RoleService,
    private route: ActivatedRoute,
    private router: Router,
    private cdr: ChangeDetectorRef
  ) {}
  
  ngOnInit() {
    this.loadRoles();
  }
  
  loadRoles() {
    this.loading = true;
    this.errorMessage = '';
    
    const request: RoleRequest = {
      param1: this.searchText || '',
      param2: this.currentPage.toString(),
      param3: this.pageSize === this.totalCount ? 'All' : this.pageSize.toString()
    };
    
    this.roleService.getRoleDetails(request).subscribe({
      next: (response) => {
        this.loading = false;
        if (response.status && response.entity) {
          this.roles = response.entity.listData || [];
          this.totalCount = response.entity.param1 || 0;
          this.pageCount = this.roles.length;
        } else {
          this.errorMessage = typeof response.entity === 'string' ? response.entity : 'Failed to load roles';
        }
        this.cdr.detectChanges();
      },
      error: (error) => {
        this.loading = false;
        this.errorMessage = error?.error?.entity || 'Error loading roles';
        console.error('Error loading roles:', error);
        this.cdr.detectChanges();
      }
    });
  }
  
  getSearchDetails() {
    this.currentPage = 1;
    this.loadRoles();
  }
  
  reloadData() {
    this.searchText = '';
    this.currentPage = 1;
    this.loadRoles();
  }
  
  sort(key: string) {
    if (this.sortKey === key) {
      this.reverse = !this.reverse;
    } else {
      this.sortKey = key;
      this.reverse = false;
    }
    
    // Sort the roles array
    this.roles.sort((a, b) => {
      const aVal = (a as any)[key] || '';
      const bVal = (b as any)[key] || '';
      return this.reverse 
        ? String(bVal).localeCompare(String(aVal))
        : String(aVal).localeCompare(String(bVal));
    });
  }
  
  onPageSizeChange(size: any) {
    if (size === 'All') {
      this.pageSize = this.totalCount;
    } else {
      this.pageSize = parseInt(size, 10);
    }
    this.currentPage = 1;
    this.loadRoles();
  }
  
  getPaginatedRoles(): Role[] {
    if (this.pageSize === this.totalCount || this.pageSize >= this.roles.length) {
      return this.roles;
    }
    const start = (this.currentPage - 1) * this.pageSize;
    const end = start + this.pageSize;
    return this.roles.slice(start, end);
  }
  
  onPageChange(page: number) {
    this.currentPage = page;
    this.loadRoles();
  }
  
  openEditModal(role: Role) {
    this.selectedRole = role;
    this.editRoleName = role.param3 || '';
    this.editRoleDescription = role.param4 || '';
    this.editRemark = '';
    this.isIncorrect = false;
    this.showEditModal = true;
  }
  
  closeEditModal() {
    this.showEditModal = false;
    this.selectedRole = null;
    this.editRoleName = '';
    this.editRoleDescription = '';
    this.editRemark = '';
    this.isIncorrect = false;
  }
  
  validateEditRemark() {
    if (this.editRemark.length < 10) {
      this.isIncorrect = true;
    } else {
      this.isIncorrect = false;
    }
  }
  
  updateRole() {
    if (!this.editRoleName || this.editRoleName.trim() === '') {
      alert('Please Enter Role Name');
      return;
    }
    
    if (!this.editRoleDescription || this.editRoleDescription.trim() === '') {
      alert('Please Enter Role Description');
      return;
    }
    
    if (this.editRemark.length < 10) {
      alert('Remark should be 10 characters');
      return;
    }
    
    if (confirm('Are you sure to update Role details?')) {
      this.loading = true;
      
      const updateData: RoleUpdateRequest = {
        param1: this.selectedRole!.param2 || '',
        param2: this.editRoleName.trim(),
        param3: this.editRoleDescription.trim(),
        param4: this.editRemark.trim()
      };
      
      this.roleService.editRole(updateData).subscribe({
        next: (response) => {
          this.loading = false;
          if (response.status) {
            const message = typeof response.entity === 'string' ? response.entity : 'Role updated successfully';
            alert(message);
            if (message === 'Successfully updated.' || message.includes('Successfully')) {
              this.closeEditModal();
              this.loadRoles();
            }
          } else {
            alert(typeof response.entity === 'string' ? response.entity : 'Failed to update role');
          }
        },
        error: (error) => {
          this.loading = false;
          alert('Error updating role: ' + (error?.error?.entity || 'Unknown error'));
          console.error('Error updating role:', error);
        }
      });
    }
  }
  
  openDeleteModal(role: Role) {
    this.selectedRole = role;
    this.deleteRemark = '';
    this.isIncorrect = false;
    this.showDeleteModal = true;
  }
  
  closeDeleteModal() {
    this.showDeleteModal = false;
    this.selectedRole = null;
    this.deleteRemark = '';
    this.isIncorrect = false;
  }
  
  validateDeleteRemark() {
    if (this.deleteRemark.length < 10) {
      this.isIncorrect = true;
    } else {
      this.isIncorrect = false;
    }
  }
  
  deleteRole() {
    if (!this.deleteRemark || this.deleteRemark.trim() === '') {
      alert('Remark should be of minimum 10 characters');
      this.isIncorrect = true;
      return;
    }
    
    if (confirm('Are you sure to Delete this record permanently?')) {
      this.loading = true;
      
      const deleteData: RoleDeleteRequest = {
        param1: this.selectedRole!.param2 || '',
        param3: this.deleteRemark.trim()
      };
      
      this.roleService.removeRole(deleteData).subscribe({
        next: (response) => {
          this.loading = false;
          if (response.status) {
            const message = typeof response.entity === 'string' ? response.entity : 'Role deleted successfully';
            alert(message);
            if (message === 'Successfully deleted.' || message.includes('Successfully')) {
              this.closeDeleteModal();
              this.loadRoles();
            }
          } else {
            alert(typeof response.entity === 'string' ? response.entity : 'Failed to delete role');
          }
        },
        error: (error) => {
          this.loading = false;
          alert('Error deleting role: ' + (error?.error?.entity || 'Unknown error'));
          console.error('Error deleting role:', error);
        }
      });
    }
  }
  
  getTotalPages(): number {
    if (this.pageSize === 0 || this.totalCount === 0) return 0;
    return Math.ceil(this.totalCount / this.pageSize);
  }
  
  getPageNumbers(): number[] {
    const totalPages = this.getTotalPages();
    return Array.from({ length: totalPages }, (_, i) => i + 1);
  }
}
