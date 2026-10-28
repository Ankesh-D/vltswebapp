import { Component, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LoaderService } from '../../../core/services/loader.service';

@Component({
    selector: 'app-loader',
    imports: [CommonModule],
    template: `
    @if (loaderService.loader$ | async) {
      <div class="loader-overlay">
        <div class="spinner"></div>
        <div class="loading-text">Loading...</div>
      </div>
    }
    <!-- <div id="preloader" class="preloader" *ngIf="loaderService.loader$ | async">
    <div class="animation-preloader">
      <div class="spinner">
      </div>
      <div class="txt-loading">
        <span data-text-preloader="W" class="letters-loading">W</span>
        <span data-text-preloader="E" class="letters-loading">E</span>
        <span data-text-preloader="B" class="letters-loading">B</span>
        <span data-text-preloader="E" class="letters-loading">E</span>
        <span data-text-preloader="L" class="letters-loading">L</span>
      </div>
      <p class="text-center">Loading</p>
    </div>
    <div class="loader">
      <div class="row">
        <div class="col-3 loader-section section-left"><div class="bg"></div></div>
        <div class="col-3 loader-section section-left"><div class="bg"></div></div>
        <div class="col-3 loader-section section-right"><div class="bg"></div></div>
        <div class="col-3 loader-section section-right"><div class="bg"></div></div>
      </div>
    </div>
    </div> -->

    `,
    changeDetection: ChangeDetectionStrategy.Eager,
    styleUrls: ['./loader.component.scss']
})
export class LoaderComponent {
  constructor(public loaderService: LoaderService) {}
}