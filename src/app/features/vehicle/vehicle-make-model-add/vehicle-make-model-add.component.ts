import { vehicaleInstallationRequest, Vehicle } from './../../../core/services/vehicle.service';
import { Component, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { ToastService } from '../../../core/services/toast.service';

import { VehicleService } from '../../../core/services/vehicle.service';
import { FormsModule } from '@angular/forms';
@Component({
    selector: 'app-vehicle-make-model-add',
    imports: [FormsModule],
    templateUrl: './vehicle-make-model-add.component.html',
    changeDetection: ChangeDetectionStrategy.Eager,
    styleUrl: './vehicle-make-model-add.component.scss'
})
export class VehicleMakeModelAddComponent implements OnInit {

  activeTab: 'make' | 'model' | 'class' = 'make';

setTab(tab: 'make' | 'model' | 'class') {
  this.activeTab = tab;

  if (tab === 'class') {
    this.loadClassList(); // 👈 important
  }
}

  makeList: any[] = [];
  isLoading = false;

  constructor(private Vehicle: VehicleService, private toastService: ToastService) {
    this.toastService.pageName = 'Vehicle Make & Model Management'; // Set page name for toast service
  }
// getVehicleModelList
  ngOnInit(): void {
    this.loadVehicleMakeList();
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
      },
      error: (err) => {
        console.error('Vehicle Make API Error:', err);
        this.isLoading = false;
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

  if (makeId) {
    this.loadModelList(makeId);
  } else {
    this.modelList = [];
  }
}


// ✅ LOAD MODEL LIST
loadModelList(makeId: string): void {
  this.Vehicle.getVehicleModelList(makeId).subscribe({
    next: (res: any) => {
      if (res?.status) {
        this.modelList = res.entity || [];
      } else {
        this.modelList = [];
      }
    },
    error: (err) => {
      console.error('Model API Error:', err);
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
  this.Vehicle.getVehicleClassRoster().subscribe({
    next: (res: any) => {
      if (res?.status) {
        this.classList = res.entity || [];
      }
    },
    error: (err) => {
      console.error('Class API Error:', err);
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