import { Component, OnInit } from '@angular/core';
import { AuthService, User } from '../../services/auth.service';
import { Router } from '@angular/router';
import { AlertController } from '@ionic/angular';

@Component({
  selector: 'app-menu-profile',
  templateUrl: './menu-profile.page.html',
  styleUrls: ['./menu-profile.page.scss'],
  standalone: false,
})
export class MenuProfilePage implements OnInit {
  user: User | null = null;
  profileImage: string = 'assets/Profile-Default.jpeg';
  showLogoutConfirm: boolean = false;

  constructor(
    private authService: AuthService,
    private router: Router,
    private alertCtrl: AlertController
  ) { }

  ngOnInit() {
    this.authService.getProfile().subscribe(); // Fetch latest from server
    this.authService.currentUser.subscribe(user => {
      this.user = user;
      this.profileImage = user?.photo || 'assets/Profile-Default.jpeg';
    });
  }

  goToKinerjaDriver() {
    this.router.navigate(['/kinerja-driver']);
  }

  goToKeamanan() {
    this.router.navigate(['/keamanan']);
  }

  goToBahasa() {
    this.router.navigate(['/bahasa']);
  }

  goToBantuan() {
    this.router.navigate(['/bantuan']);
  }

  confirmLogout() {
    this.showLogoutConfirm = true;
  }

  logout() {
    this.authService.isSessionInitialized = false;
    this.authService.logout().subscribe({
      next: () => this.router.navigate(['/welcome-page']),
      error: () => this.router.navigate(['/welcome-page'])
    });
  }
}
