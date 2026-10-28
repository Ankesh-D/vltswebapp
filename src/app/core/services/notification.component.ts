import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Subscription } from 'rxjs';
import { Notification, NotificationService } from '../../core/services/notification.service';

@Component({
  selector: 'app-notification',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './notification.component.html',
  styleUrls: ['./notification.component.scss']
})
export class NotificationComponent implements OnInit, OnDestroy {
  notification: Notification | null = null;
  private subscription!: Subscription;
  private timer: any;

  constructor(private notificationService: NotificationService) {}

  ngOnInit() {
    this.subscription = this.notificationService.notification$.subscribe(notification => {
      this.notification = notification;
      if (this.timer) clearTimeout(this.timer);
      if (notification) {
        this.timer = setTimeout(() => this.close(), 5000); // Auto-close after 5 seconds
      }
    });
  }

  ngOnDestroy() {
    this.subscription.unsubscribe();
    if (this.timer) clearTimeout(this.timer);
  }

  close() {
    this.notification = null;
    if (this.timer) clearTimeout(this.timer);
  }
}