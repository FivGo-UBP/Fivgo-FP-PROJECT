import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';

@Component({
  selector: 'app-prioritas-kendaraan',
  templateUrl: './prioritas-kendaraan.page.html',
  styleUrls: ['./prioritas-kendaraan.page.scss'],
  standalone: false,
})
export class PrioritasKendaraanPage implements OnInit {
  vehicle: string = '';

  constructor(private route: ActivatedRoute, private router: Router) { }

  ngOnInit() {
    this.route.queryParams.subscribe(params => {
      if (params && params['vehicle']) {
        this.vehicle = params['vehicle'];
      }
    });
  }

  goToOrder() {
    this.router.navigate(['/order'], { queryParams: { vehicle: this.vehicle } });
  }
}
