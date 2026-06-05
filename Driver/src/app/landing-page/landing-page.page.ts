import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

@Component({
  selector: 'app-landing-page',
  templateUrl: './landing-page.page.html',
  styleUrls: ['./landing-page.page.scss'],
  standalone: false,
})
export class LandingPagePage implements OnInit {

  constructor(
    private authService: AuthService,
    private router: Router
  ) { }

  ngOnInit() {
  }

  ionViewWillEnter() {
    if (this.authService.getToken()) {
      this.router.navigate(['/tabs/beranda'], { replaceUrl: true });
    }
  }

}
