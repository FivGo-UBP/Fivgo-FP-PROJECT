import { Component, OnInit } from '@angular/core';
import { AlertController, NavController } from '@ionic/angular';
import { Router } from '@angular/router';
import { AuthService, User } from '../../services/auth.service';
import { LanguageService, LanguageType } from '../../services/language.service';

@Component({
  selector: 'app-kelola-profile',
  templateUrl: './kelola-profile.page.html',
  styleUrls: ['./kelola-profile.page.scss'],
  standalone: false,
})
export class KelolaProfilePage implements OnInit {
  user: User | null = null;
  showLogoutConfirm: boolean = false;

  constructor(
    private authService: AuthService,
    private alertController: AlertController,
    private navCtrl: NavController,
    private router: Router,
    public langService: LanguageService
  ) { }

  ngOnInit() {
    this.authService.currentUser.subscribe(user => {
      this.user = user;
    });
    
    // Fetch fresh profile data when page loads
    this.authService.getProfile().subscribe({
      error: (err) => console.error('Failed to fetch profile', err)
    });
  }

  confirmLogout() {
    this.showLogoutConfirm = true;
  }

  logout() {
    this.authService.logout().subscribe({
      next: () => {
        this.router.navigate(['/landing-page']);
      },
      error: (err) => {
        console.error('Logout failed', err);
        this.router.navigate(['/landing-page']);
      }
    });
  }


  t(key: string): string {
    return this.langService.translate(key);
  }

  get currentLanguageLabel(): string {
    return this.langService.getLanguage() === 'id' ? 'Bahasa Indonesia' : 'English';
  }

  goBack() {
    this.navCtrl.navigateBack('/tabs/beranda');
  }

}
