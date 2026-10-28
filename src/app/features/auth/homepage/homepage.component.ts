import { Component, OnDestroy, OnInit, ChangeDetectionStrategy } from "@angular/core";
import { Router, RouterLink } from "@angular/router";
import { FaqComponent } from '../faq/faq.component';
import {
  AnnouncementResposne,
  ApprovedVendorRequest,
  AuthService,
} from "../../../core/services/auth.service";

import { FormsModule } from "@angular/forms";
import { Subscription } from "rxjs";

@Component({
    selector: "app-homepage",
    imports: [FormsModule, FaqComponent],
    templateUrl: "./homepage.component.html",
    changeDetection: ChangeDetectionStrategy.Eager,
    styleUrl: "./homepage.component.scss"
})
export class HomepageComponent implements OnInit, OnDestroy {
  leftLogo: string = "";
  webelIcon: string = "";
  installationPDF: string = "";
  renewalPDF: string = "";
  untagPDF: string = "";
  vendorList: any[] = [];
  announcementData: AnnouncementResposne[] = [];
  announcementInterval: any;
  announcementAPI?: Subscription;
  constructor(
    public router: Router,
    public authService: AuthService,
  ) {}
  ngOnInit(): void {
    this.leftLogo = "assets/login/LOGO_WB.png";
    this.webelIcon = "assets/login/Webel_logo_WBEIDC.png";
    this.installationPDF =
      "assets/login/vehical_installation_and_activation.pdf";
    this.renewalPDF = "assets/login/renewalprocess1.pdf";
    this.untagPDF = "assets/login/untagworkflow.pdf";
    this.getAnnouncementDetails();
  }
    openFaqModal() {
    this.authService.openModal('faqModal');
  }

  ngOnDestroy(): void {
    if (this.announcementAPI) {
      this.announcementAPI.unsubscribe();
    }
    if (this.announcementInterval) {
      clearTimeout(this.announcementInterval);
    }
  }
  redirectToLogin() {
    this.router.navigate(["/login"]);
  }
    redirectTofaq() {
    this.router.navigate(["/faq"]);
  }
  openVendorModal() {
    this.authService.getVendorDetails(new ApprovedVendorRequest()).subscribe({
      next: (response: any) => {
        if (response.statuscode == 200) {
          this.vendorList = response.entity?.listData || [];
          this.authService.openModal("vendorModal");
          // $("#vendorModal").modal("show");
        }
      },
      error: (error) => {
        console.log(error);
      },
    });
  }
  getAnnouncementDetails() {
    if (this.announcementAPI) {
      this.announcementAPI.unsubscribe();
    }
    this.announcementAPI = this.authService
      .getAnnouncementDetails({ param1: "" })
      .subscribe({
        next: (response: any) => {
          if (response.statuscode == 200) {
            this.announcementData = response.entity?.listData || [];
            const timmer = response.entity?.param2 || 120000; // Default to 2 minutes if not provided
            this.announcementInterval = setTimeout(() => {
              this.getAnnouncementDetails();
            }, Number(timmer)*1000);
          } else {
            this.announcementData = [];
          }
        },
        error: (error) => {
          console.log(error);
        },
      });
  }
}
