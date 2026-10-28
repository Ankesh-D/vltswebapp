import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { saveAs } from 'file-saver';
export type ToastType = 'success' | 'error' | 'info';

@Injectable({ providedIn: 'root' })
export class ToastService {
  pageName: string = '';
  private toastSubject = new BehaviorSubject<any>(null);
  toast$ = this.toastSubject.asObservable();
  public loaderFlag = false;
  
  show(message: string, type: ToastType = 'error', duration = 5000) {
    this.toastSubject.next({ message, type, duration });
  }

  clear() {
    this.toastSubject.next(null);
  }
  showLoader() {
    this.loaderFlag = true;
  }
  hideLoader() {
    this.loaderFlag = false;
  }

  openModal(id: string) {
    const modal = document.getElementById(id);
    if (modal) {
      modal.classList.add('show');
      modal.style.display = 'block';
    }
    document.body.classList.add('modal-open');

    const backdrop = document.createElement('div');
    backdrop.className = 'modal-backdrop fade show';
    document.body.appendChild(backdrop);
  }
  closeModal(id: string) {
    const modal = document.getElementById(id);
    if (modal) {
      modal.classList.remove('show');
      modal.style.display = 'none';
    }
    document.body.classList.remove('modal-open');

    const backdrop = document.querySelector('.modal-backdrop');
    if (backdrop) {
      backdrop.remove();
    }
  }
  commonFileDownload(printfilePath: string) {
      let lastindex = printfilePath.lastIndexOf("/");
      let fileName = printfilePath.substring(lastindex + 1, printfilePath.length)
      saveAs(printfilePath, fileName);
  }
  
}
