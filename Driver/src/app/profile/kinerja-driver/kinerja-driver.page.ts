import { Component } from '@angular/core';
import { OrderService, DriverPerformance } from '../../services/order.service';
import { NavController } from '@ionic/angular';

@Component({
  selector: 'app-kinerja-driver',
  templateUrl: './kinerja-driver.page.html',
  styleUrls: ['./kinerja-driver.page.scss'],
  standalone: false,
})
export class KinerjaDriverPage {
  performance: DriverPerformance = {
    average_rating: 0.0,
    total_reviews: 0,
    sangat_puas: 0,
    puas: 0,
    perlu_ditingkatkan: 0
  };
  isLoading = true;

  constructor(
    private orderService: OrderService,
    private navCtrl: NavController
  ) { }

  goBack() {
    this.navCtrl.navigateBack('/menu-profile');
  }

  ionViewWillEnter() {
    this.loadPerformance();
  }

  loadPerformance() {
    this.isLoading = true;
    this.orderService.getDriverPerformance().subscribe({
      next: (res) => {
        this.performance = res;
        this.isLoading = false;
      },
      error: (err) => {
        console.error('Failed to load performance data', err);
        this.isLoading = false;
      }
    });
  }
}
