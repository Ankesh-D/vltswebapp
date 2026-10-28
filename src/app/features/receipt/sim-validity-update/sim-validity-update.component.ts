import { Component, OnInit, ChangeDetectionStrategy } from "@angular/core";
import { FormBuilder, FormGroup, ReactiveFormsModule } from "@angular/forms";

import { FormsModule } from "@angular/forms"; // add this
import { VahanService } from "../../../core/services/vahan.service";
import { ToastService } from "../../../core/services/toast.service";
@Component({
    selector: "app-sim-validity-update",
    imports: [ReactiveFormsModule, FormsModule], // add FormsModule
    templateUrl: "./sim-validity-update.component.html",
    changeDetection: ChangeDetectionStrategy.Eager,
    styleUrls: ["./sim-validity-update.component.scss"]
})
export class SimValidityUpdateComponent implements OnInit {
  simForm!: FormGroup;

  m2mProviderList: any[] = [];
  simList: any[] = [];

  showForm = false;

  pageSizeOptions = [10, 20, 50, 100];
  searchText = "";
  pageNo = 1;
  pageSize = 10;
  totalCount = 0;

  constructor(
    private vahanService: VahanService,
    private fb: FormBuilder,
    private toast: ToastService,
  ) {
    this.toast.pageName = 'Update SIM Validity'; // Set page name for toast service
    this.simForm = this.fb.group({
      iccid: [""],
      mobile1: [""],
      network1: [""],
      // validity1: [""],
      mobile2: [""],
      network2: [""],
      validity2: [""],
      m2m: [""],
      customerMobile: [""], // NEW FIELD
    });
  }

  ngOnInit() {
    this.loadM2MProviderList();
    this.getSimValidityDetails();
    this.loadNetworkList();
  }

  getSimValidityDetails() {
    this.vahanService
      .getSimValidityDetails(
        this.searchText,
        this.pageNo.toString(),
        this.pageSize.toString(),
      )
      .subscribe({
        next: (res: any) => {
          // //console.log("API RESPONSE:", res);

          if (res?.status && res?.entity?.listData) {
            this.simList = res.entity.listData;
            this.totalCount = Number(res.entity.param1);
          }
        },

        error: (err) => {
          console.error("API ERROR:", err);
        },
      });
  }

  searchSim() {
    this.pageNo = 1;
    this.getSimValidityDetails();
  }
  onPageSizeChange(size: any) {
    if (size === "All") {
      this.pageSize = this.totalCount;
    } else {
      this.pageSize = Number(size);
    }

    this.pageNo = 1;

    this.getSimValidityDetails();
  }
  nextPage() {
    this.pageNo++;
    this.getSimValidityDetails();
  }

  prevPage() {
    if (this.pageNo > 1) {
      this.pageNo--;
      this.getSimValidityDetails();
    }
  }

  openUpdateForm(row: any) {
    this.showForm = true;

    this.simForm.patchValue({
      iccid: row.param2,

      mobile1: row.param4,
      network1: row.param3,
      validity1: row.param7,

      mobile2: row.param6,
      network2: row.param5,
      validity2: row.param8,

      m2m: row.param12,

      customerMobile: "", // customer RMN
    });
  }
  networkList: any[] = [];
  loadNetworkList() {
    this.vahanService.getNetworkRoster().subscribe({
      next: (response) => {
        if (response?.status && response?.entity) {
          this.networkList = Array.isArray(response.entity)
            ? response.entity
            : [];
        }
      },
      error: (error) => {
        console.error("Error loading network list:", error);
      },
    });
  }
  saveData() {
    const formValue = this.simForm.value;

    const payload = {
      param1: formValue.iccid, // iccino
      param2: formValue.network1, // Primary_TSP_Name
      param3: formValue.network2, // Fallback_TSP_Name
      param4: formValue.mobile1, // Primary_TSP_MSISDN
      param5: formValue.mobile2, // Fallback_TSP_MSISDN
      param6: formValue.validity2, // primary_simvalidity
      param7: formValue.validity2, // fallback_simvalidity
      param8: formValue.customerMobile, // Customer Mobile

      param11: "", // filename
      param13: "", // token
      param12: formValue.m2m, // m2m provider id
    };

    //console.log("Update Payload:", payload);

  this.vahanService.putSimDetails(payload).subscribe({

next: (res:any)=>{

//console.log("API Response:", res);

if(res?.status){

this.toast.show(res.entity || 'SIM updated successfully','success');

this.showForm = false;

this.getSimValidityDetails();

}else{

this.toast.show(res?.entity || 'Update failed','error');

}

},

error:(err)=>{

console.error("Update Error",err);

this.toast.show('Server error while updating SIM','error');

}

});
  }

  loadM2MProviderList() {
    this.vahanService.getM2MProviderRoster().subscribe({
      next: (response: any) => {
        if (response?.status && response?.entity) {
          this.m2mProviderList = response.entity;
        }
      },
    });
  }
  getTotalPages() {
    return Math.ceil(this.totalCount / this.pageSize);
  }

  onPageChange(page: number) {
    if (page < 1) return;

    if (page > this.getTotalPages()) return;

    this.pageNo = page;

    this.getSimValidityDetails();
  }

  getPageNumbers() {
    const pages: any[] = [];

    const total = this.getTotalPages();

    const current = this.pageNo;

    for (let i = 1; i <= total; i++) {
      if (i === 1 || i === total || (i >= current - 2 && i <= current + 2)) {
        pages.push(i);
      } else if (pages[pages.length - 1] !== -1) {
        pages.push(-1);
      }
    }

    return pages;
  }
  resetForm() {
  this.simForm.reset();

  // optional: keep dropdown default values empty
  this.simForm.patchValue({
    m2m: '',
    network1: '',
    network2: ''
  });
}
}
