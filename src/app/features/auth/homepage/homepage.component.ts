import {
  AfterViewInit,
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  OnDestroy,
  OnInit,
  ViewChild,
} from "@angular/core";
import { Router } from "@angular/router";
import { FaqComponent } from '../faq/faq.component';
import {
  AnnouncementResposne,
  ApprovedVendorRequest,
  AuthService,
} from "../../../core/services/auth.service";
import { Subscription } from "rxjs";
import * as am5 from "@amcharts/amcharts5";
import * as am5xy from "@amcharts/amcharts5/xy";

@Component({
    selector: "app-homepage",
    imports: [FaqComponent],
    templateUrl: "./homepage.component.html",
    changeDetection: ChangeDetectionStrategy.Eager,
    styleUrl: "./homepage.component.scss"
})
export class HomepageComponent implements OnInit, AfterViewInit, OnDestroy {
  @ViewChild("activityChart") activityChart?: ElementRef<HTMLDivElement>;

  leftLogo: string = "";
  dimtsLogo: string = "";
  installationPDF: string = "";
  renewalPDF: string = "";
  untagPDF: string = "";
  vendorList: any[] = [];
  announcementData: AnnouncementResposne[] = [];
  announcementInterval: any;
  announcementAPI?: Subscription;
  private chartRoot?: am5.Root;

  constructor(
    public router: Router,
    public authService: AuthService,
  ) {}
  ngOnInit(): void {
    this.leftLogo = "assets/nagaland_gov.png";
    this.dimtsLogo = "assets/login/dimtslogo.png";
    this.installationPDF =
      "assets/login/vehical_installation_and_activation.pdf";
    this.renewalPDF = "assets/login/renewalprocess1.pdf";
    this.untagPDF = "assets/login/untagworkflow.pdf";
    this.getAnnouncementDetails();
  }

  ngAfterViewInit(): void {
    const chartElement = this.activityChart?.nativeElement;
    if (!chartElement) {
      return;
    }

    const root = am5.Root.new(chartElement);
    this.chartRoot = root;
    const chart = root.container.children.push(
      am5xy.XYChart.new(root, {
        panX: false,
        panY: false,
        wheelX: "none",
        wheelY: "none",
        paddingTop: 2,
        paddingBottom: 0,
        paddingLeft: 0,
        paddingRight: 0,
      }),
    );

    const xRenderer = am5xy.AxisRendererX.new(root, { minGridDistance: 24 });
    xRenderer.grid.template.setAll({ forceHidden: true });
    xRenderer.labels.template.setAll({
      fill: am5.color(0x49627e),
      fontSize: 9,
      paddingTop: 3,
    });

    const xAxis = chart.xAxes.push(
      am5xy.CategoryAxis.new(root, {
        categoryField: "day",
        renderer: xRenderer,
      }),
    );

    const yRenderer = am5xy.AxisRendererY.new(root, {});
    yRenderer.grid.template.setAll({
      stroke: am5.color(0x7893ad),
      strokeOpacity: 0.15,
    });
    yRenderer.labels.template.setAll({ forceHidden: true });

    const yAxis = chart.yAxes.push(
      am5xy.ValueAxis.new(root, {
        min: 0,
        max: 100,
        strictMinMax: true,
        renderer: yRenderer,
      }),
    );

    const series = chart.series.push(
      am5xy.LineSeries.new(root, {
        name: "Activity",
        xAxis,
        yAxis,
        categoryXField: "day",
        valueYField: "value",
        stroke: am5.color(0xe59a19),
        fill: am5.color(0xe59a19),
        tooltip: am5.Tooltip.new(root, {
          labelText: "{categoryX}: {valueY}",
        }),
      }),
    );
    series.strokes.template.setAll({ strokeWidth: 3 });
    series.fills.template.setAll({ visible: true, fillOpacity: 0.12 });
    series.bullets.push(() =>
      am5.Bullet.new(root, {
        sprite: am5.Circle.new(root, {
          radius: 3,
          fill: am5.color(0xe59a19),
          stroke: am5.color(0xffffff),
          strokeWidth: 1.5,
        }),
      }),
    );

    const activityData = [
      { day: "Mon", value: 42 },
      { day: "Tue", value: 66 },
      { day: "Wed", value: 53 },
      { day: "Thu", value: 78 },
      { day: "Fri", value: 61 },
      { day: "Sat", value: 88 },
      { day: "Sun", value: 72 },
    ];
    xAxis.data.setAll(activityData);
    series.data.setAll(activityData);
  }
    openFaqModal() {
    this.authService.openModal('faqModal');
  }

  ngOnDestroy(): void {
    this.chartRoot?.dispose();
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
