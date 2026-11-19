import { vehicaleInstallationRequest, Vehicle } from './../../../core/services/vehicle.service';
import { Component, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { ToastService } from '../../../core/services/toast.service';

import { VehicleService } from '../../../core/services/vehicle.service';
import { FormsModule } from '@angular/forms';
import { CommonDataToolbarComponent } from '../../../shared/components/common-data-toolbar/common-data-toolbar.component';
import { DataTableColumn, DataTableComponent } from '../../../shared/components/data-table/data-table.component';
import { PaginationComponent } from '../../../shared/components/pagination/pagination.component';
@Component({
    selector: 'app-vehicle-make-model-add',
    imports: [FormsModule, CommonDataToolbarComponent, DataTableComponent, PaginationComponent],
    templateUrl: './vehicle-make-model-add.component.html',
    changeDetection: ChangeDetectionStrategy.Eager,
    styleUrl: './vehicle-make-model-add.component.scss'
})
export class VehicleMakeModelAddComponent implements OnInit {

  activeTab: 'make' | 'model' | 'class' = 'make';
  searchText = '';
  currentPage = 1;
  pageSize = 20;
  pageSizeOptions = [10, 20, 50, 100];
  totalCount = 0;
  pageCount = 0;
  tableRows: any[] = [];

  readonly makeTableColumns: DataTableColumn<any>[] = [
    { key: 'serialNo', header: 'Sr.No' },
    { key: 'param2', header: 'Make Name' },
    {
      header: 'Action',
      actions: [
        { label: 'Edit', className: 'btn btn-sm btn-outline-primary me-2', run: item => this.editMake(item) },
        { label: 'Delete', className: 'btn btn-sm btn-outline-danger', tone: 'danger', run: item => this.openDeleteModal('make', item) }
      ]
    }
  ];
  readonly modelTableColumns: DataTableColumn<any>[] = [
    { key: 'serialNo', header: 'ID' },
    { key: 'param2', header: 'Model Name' },
    {
      header: 'Action',
      actions: [
        { label: 'Edit', className: 'btn btn-sm btn-outline-primary me-2', run: item => this.editModel(item) },
        { label: 'Delete', className: 'btn btn-sm btn-outline-danger', tone: 'danger', run: item => this.openDeleteModal('model', item) }
      ]
    }
  ];
  readonly classTableColumns: DataTableColumn<any>[] = [
    { key: 'serialNo', header: 'Sr.No' },
    { key: 'param2', header: 'Class Name' },
    {
      header: 'Action',
      actions: [
        { label: 'Edit', className: 'btn btn-sm btn-outline-primary me-2', run: item => this.editClass(item) },
        { label: 'Delete', className: 'btn btn-sm btn-outline-danger', tone: 'danger', run: item => this.openDeleteModal('class', item) }
      ]
    }
  ];

  get tableColumns(): DataTableColumn<any>[] {
    if (this.activeTab === 'model') return this.modelTableColumns;
    if (this.activeTab === 'class') return this.classTableColumns;
    return this.makeTableColumns;
  }

  get tableLoading(): boolean {
    if (this.activeTab === 'model') return this.isModelLoading;
    if (this.activeTab === 'class') return this.isClassLoading;
    return this.isLoading;
  }

setTab(tab: 'make' | 'model' | 'class') {
  this.activeTab = tab;
  this.searchText = '';
  this.currentPage = 1;
  this.updateTableView();

  if (tab === 'class') {
    this.loadClassList(); // 👈 important
  }
}

  makeList: any[] = [];
  isLoading = false;
  isModelLoading = false;
  isClassLoading = false;

  constructor(private Vehicle: VehicleService, private toastService: ToastService) {
    this.toastService.pageName = 'Vehicle Make & Model Management'; // Set page name for toast service
  }
// getVehicleModelList
  ngOnInit(): void {
    this.loadVehicleMakeList();
  }

  private updateTableView(): void {
    const records = this.activeTab === 'make'
      ? this.makeList
      : this.activeTab === 'model'
        ? this.modelList
        : this.classList;
    const query = this.searchText.trim().toLowerCase();
    const filteredRecords = query
      ? records.filter(record => Object.values(record).some(value =>
          String(value ?? '').toLowerCase().includes(query)))
      : records;
    this.totalCount = filteredRecords.length;

    const totalPages = Math.ceil(this.totalCount / this.pageSize);
    if (totalPages > 0 && this.currentPage > totalPages) {
      this.currentPage = totalPages;
    }

    const start = (this.currentPage - 1) * this.pageSize;
    this.tableRows = filteredRecords
      .slice(start, start + this.pageSize)
      .map((record, index) => ({ ...record, serialNo: start + index + 1 }));
    this.pageCount = this.tableRows.length;
  }

  onSearchTextChange(searchText: string): void {
    this.searchText = searchText;
    this.currentPage = 1;
    this.updateTableView();
  }

  onSearch(): void {
    this.currentPage = 1;
    this.updateTableView();
  }

  onPageChange(page: number): void {
    const totalPages = Math.ceil(this.totalCount / this.pageSize);
    if (page < 1 || page > totalPages) return;
    this.currentPage = page;
    this.updateTableView();
  }

  onPageSizeChange(size: number | string): void {
    this.pageSize = size === 'All' ? this.totalCount : Number(size);
    this.currentPage = 1;
    this.updateTableView();
  }

  reloadList(): void {
    this.searchText = '';
    this.currentPage = 1;
    this.pageSize = 20;

    if (this.activeTab === 'make') {
      this.loadVehicleMakeList();
    } else if (this.activeTab === 'model' && this.selectedMakeId) {
      this.loadModelList(this.selectedMakeId);
    } else if (this.activeTab === 'class') {
      this.loadClassList();
    } else {
      this.modelList = [];
      this.updateTableView();
    }
  }

  // ✅ MAIN FUNCTION (Proper)
  loadVehicleMakeList(): void {
    this.isLoading = true;

    this.Vehicle.getVehicleMakeList().subscribe({
      next: (res: any) => {
        if (res?.status) {
          this.makeList = res.entity || [];
        } else {
          this.makeList = [];
        }
        this.isLoading = false;
        this.updateTableView();
      },
      error: (err) => {
        console.error('Vehicle Make API Error:', err);
        this.isLoading = false;
        this.updateTableView();
      }
    });
  }

 


 

  showEditModal = false;
selectedMake: any = {};
remark: string = '';


// ✅ OPEN MODAL


// ✅ UPDATE API CALL
updateMake(): void {

  const payload = {
    param1: this.selectedMake.param1, // makeId
    param2: this.selectedMake.param2, // makeName
    param4: this.remark              // remark
  };

  this.Vehicle.updateVehicleMake(payload).subscribe({
    next: (res: any) => {
      console.log('Updated Successfully', res);

      this.showEditModal = false;

      // 🔁 reload list
      this.loadVehicleMakeList();
    },
    error: (err) => {
      console.error('Update Error', err);
    }
  });
}






// ✅ ADD CLICK
addMake(): void {
  this.isEditMode = false;

  this.selectedMake = {
    param1: '',   // 👈 IMPORTANT (blank for add)
    param2: ''
  };

  this.remark = '';
  this.showEditModal = true;
}

isEditMode = false
// ✅ EDIT CLICK
editMake(item: any): void {
  this.isEditMode = true;

  this.selectedMake = { ...item }; // clone
  this.remark = '';

  this.showEditModal = true;
}


// ✅ CLOSE
closeModal(): void {
  this.showEditModal = false;
}


// ✅ SAVE (ADD + EDIT SAME FUNCTION)
saveMake(): void {

  const payload = {
    param1: this.selectedMake.param1 || '', // 👈 blank = add
    param2: this.selectedMake.param2,
    param4: this.remark
  };

  this.Vehicle  .updateVehicleMake(payload).subscribe({
    next: (res: any) => {
      console.log('Saved Successfully', res);

      this.showEditModal = false;

      // 🔁 REFRESH LIST AFTER ADD / EDIT
      this.loadVehicleMakeList();
    },
    error: (err) => {
      console.error('Save Error', err);
    }
  });
}
modelList: any[] = [];
selectedMakeId: string = '';


// ✅ ON MAKE CHANGE
onMakeChange(event: any): void {
  const makeId = event.target.value;

  this.selectedMakeId = makeId;
  this.currentPage = 1;

  if (makeId) {
    this.loadModelList(makeId);
  } else {
    this.modelList = [];
    this.updateTableView();
  }
}


// ✅ LOAD MODEL LIST
loadModelList(makeId: string): void {
  this.isModelLoading = true;
  this.Vehicle.getVehicleModelList(makeId).subscribe({
    next: (res: any) => {
      if (res?.status) {
        this.modelList = res.entity || [];
      } else {
        this.modelList = [];
      }
      this.isModelLoading = false;
      this.updateTableView();
    },
    error: (err) => {
      console.error('Model API Error:', err);
      this.isModelLoading = false;
      this.updateTableView();
    }
  });
}


// ✅ ADD MODEL
// addMake(): void {
//   console.log('Add Model for MakeId:', this.selectedMakeId);
// }


// ✅ EDIT MODEL
editmake(item: any): void {
  console.log('Edit Model:', item);
}


// 🔹 MODEL STATE
showModelModal = false;
isModelEdit = false;

selectedModel: any = {
  param1: '', // modelId
  param2: '', // year
  param3: '', // makeId
  param4: '', // modelName
  param5: ''  // classId
};

classList: any[] = [];


// ✅ LOAD CLASS LIST
loadClassList(): void {
  this.isClassLoading = true;
  this.Vehicle.getVehicleClassRoster().subscribe({
    next: (res: any) => {
      if (res?.status) {
        this.classList = res.entity || [];
      } else {
        this.classList = [];
      }
      this.isClassLoading = false;
      this.updateTableView();
    },
    error: (err) => {
      console.error('Class API Error:', err);
      this.isClassLoading = false;
      this.updateTableView();
    }
  });
}


// ✅ ADD MODEL
addModel(): void {
  this.isModelEdit = false;

  this.selectedModel = {
    param1: '',                        // 👈 blank for add
    param2: '',
    param3: this.selectedMakeId,      // 👈 IMPORTANT
    param4: '',
    param5: ''
  };

  this.showModelModal = true;
  this.loadClassList(); // load dropdown
}


// ✅ EDIT MODEL
editModel(item: any): void {
  this.isModelEdit = true;

  this.selectedModel = {
    param1: item.param1,
    param2: item.param3,  // year
    param3: item.param4,  // makeId
    param4: item.param2,  // modelName
    param5: ''            // (if API later gives classId map here)
  };

  this.showModelModal = true;
  this.loadClassList();
}


// ✅ CLOSE
closeModelModal(): void {
  this.showModelModal = false;
}


// ✅ SAVE (ADD + EDIT)
saveModel(): void {

  // ✅ VALIDATION
  if (!this.selectedModel.param3) {
    alert('Please select Make');
    return;
  }

  if (!this.selectedModel.param4) {
    alert('Please enter Model Name');
    return;
  }

  if (!this.selectedModel.param2) {
    alert('Please enter Year');
    return;
  }

  // 🔁 EDIT MODE
  if (this.isModelEdit) {

    const payload = {
      param1: this.selectedModel.param1,  // modelId
      param2: this.selectedModel.param2,  // year
      param4: this.selectedModel.param3,  // makeId
      param5: this.selectedModel.param4,  // modelName
      param6: this.selectedModel.param5   // classId
    };

    this.Vehicle.editVehicleModel(payload).subscribe({
      next: () => {
        this.afterSave();
      },
      error: (err) => console.error(err)
    });

  } 
  // ➕ ADD MODE
  else {

    const payload = {
      param1: '',                         // blank
      param2: this.selectedModel.param2,  // year
      param3: this.selectedModel.param3,  // makeId
      param4: this.selectedModel.param4,  // modelName
      param5: this.selectedModel.param5   // classId
    };

    this.Vehicle.saveVehicleModel(payload).subscribe({
      next: () => {
        this.afterSave();
      },
      error: (err) => console.error(err)
    });

  }
}


// ✅ COMMON AFTER SAVE
afterSave(): void {
  this.showModelModal = false;

  // 🔁 REFRESH LIST
  this.loadModelList(this.selectedModel.param3);
}
deleteModel(item: any): void {

  const confirmDelete = confirm('Are you sure you want to delete this model?');

  if (!confirmDelete) return;

  const payload = {
    param1: item.param1,  // modelId
    param2: 'deleted'     // remark
  };

  this.Vehicle.deleteVehicleModel(payload).subscribe({
    next: () => {
      console.log('Deleted');

      // 🔁 refresh
      this.loadModelList(this.selectedMakeId);
    },
    error: (err) => console.error(err)
  });
}

deleteMake(item: any): void {

  const confirmDelete = confirm('Are you sure you want to delete this make?');

  if (!confirmDelete) return;

  const payload = {
    param1: item.param1,  // 👈 makeId
    param2: 'deleted'     // 👈 remark
  };

  this.Vehicle.deleteVehicleMake(payload).subscribe({
    next: () => {
      console.log('Make Deleted');

      // 🔁 REFRESH LIST
      this.loadVehicleMakeList();
    },
    error: (err) => {
      console.error('Delete Error', err);
    }
  });
}




// 🔹 CLASS STATE
showClassModal = false;
isClassEdit = false;

selectedClass: any = {
  param1: '', // classId
  param2: '', // className
  param4: '', // description
  param5: ''  // remark
};


// ✅ ADD CLASS
addClass(): void {
  this.isClassEdit = false;

  this.selectedClass = {
    param1: '',
    param2: '',
    param4: '',
    param5: ''
  };

  this.showClassModal = true;
}


// ✅ EDIT CLASS
editClass(item: any): void {
  this.isClassEdit = true;

  this.selectedClass = {
    param1: item.param1,
    param2: item.param2,
    param4: '',
    param5: ''
  };

  this.showClassModal = true;
}


// ✅ CLOSE
closeClassModal(): void {
  this.showClassModal = false;
}


// ✅ SAVE CLASS (ADD + EDIT)
saveClass(): void {

  if (!this.selectedClass.param2) {
    alert('Please enter class name');
    return;
  }

  // 🔁 EDIT
  if (this.isClassEdit) {

    const payload = {
      param1: this.selectedClass.param1,
      param2: this.selectedClass.param2,
      param4: this.selectedClass.param4,
      param5: this.selectedClass.param5
    };

    this.Vehicle.editVehicleClass(payload).subscribe({
      next: () => this.afterClassSave(),
      error: (err) => console.error(err)
    });

  } 
  // ➕ ADD
  else {

    const payload = {
      param1: '',
      param2: this.selectedClass.param2,
      param4: this.selectedClass.param4,
      param5: this.selectedClass.param5
    };

    this.Vehicle.saveVehicleClass(payload).subscribe({
      next: () => this.afterClassSave(),
      error: (err) => console.error(err)
    });

  }
}


// ✅ AFTER SAVE
afterClassSave(): void {
  this.showClassModal = false;
  this.loadClassList(); // 🔁 refresh
}


// ✅ DELETE CLASS
deleteClass(item: any): void {

  const confirmDelete = confirm('Are you sure to delete this class?');
  if (!confirmDelete) return;

  const payload = {
    param1: item.param1,
    param3: 'deleted'
  };

  this.Vehicle.deleteVehicleClass(payload).subscribe({
    next: () => this.loadClassList(),
    error: (err) => console.error(err)
  });
}
showDeleteModal = false;
deleteRemark: string = '';
deleteType: 'make' | 'model' | 'class' = 'make';
deleteItem: any = null;
deleteItemName: string = '';

openDeleteModal(type: 'make' | 'model' | 'class', item: any) {
  this.deleteType = type;
  this.deleteItem = item;
  this.deleteRemark = '';

  // name show
  this.deleteItemName = item.param2;

  this.showDeleteModal = true;
}
submitDelete(): void {

  if (!this.deleteRemark) {
    alert('Please enter remark');
    return;
  }

  // 🔴 MAKE DELETE
  if (this.deleteType === 'make') {
    const payload = {
      param1: this.deleteItem.param1,
      param2: this.deleteRemark
    };

    this.Vehicle.deleteVehicleMake(payload).subscribe(() => {
      this.loadVehicleMakeList();
      this.closeDeleteModal();
    });
  }

  // 🔴 MODEL DELETE
  if (this.deleteType === 'model') {
    const payload = {
      param1: this.deleteItem.param1,
      param2: this.deleteRemark
    };

    this.Vehicle.deleteVehicleModel(payload).subscribe(() => {
      this.loadModelList(this.selectedMakeId);
      this.closeDeleteModal();
    });
  }

  // 🔴 CLASS DELETE
  if (this.deleteType === 'class') {
    const payload = {
      param1: this.deleteItem.param1,
      param3: this.deleteRemark
    };

    this.Vehicle.deleteVehicleClass(payload).subscribe(() => {
      this.loadClassList();
      this.closeDeleteModal();
    });
  }
}
closeDeleteModal(): void {
  this.showDeleteModal = false;
}
}