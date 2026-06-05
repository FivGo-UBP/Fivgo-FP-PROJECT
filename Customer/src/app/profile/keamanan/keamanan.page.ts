import { Component, OnInit, OnDestroy } from '@angular/core';
import { NavController, ToastController } from '@ionic/angular';
import { Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { AuthService, User } from '../../services/auth.service';
import { LanguageService } from '../../services/language.service';

@Component({
  selector: 'app-keamanan',
  templateUrl: './keamanan.page.html',
  styleUrls: ['./keamanan.page.scss'],
  standalone: false,
})
export class KeamananPage implements OnInit, OnDestroy {
  user: User | null = null;
  phone: string = '';
  showDeleteConfirm: boolean = false;
  private userSub!: Subscription;

  constructor(
    private authService: AuthService,
    private navCtrl: NavController,
    private router: Router,
    private toastCtrl: ToastController,
    public langService: LanguageService
  ) { }

  ngOnInit() {
    this.userSub = this.authService.currentUser.subscribe(user => {
      this.user = user;
      this.phone = user?.phone || '';
    });
  }

  ngOnDestroy() {
    if (this.userSub) {
      this.userSub.unsubscribe();
    }
  }

  t(key: string): string {
    return this.langService.translate(key);
  }

  goBack() {
    this.navCtrl.navigateBack('/kelola-profile');
  }

  goToGantiNomor() {
    this.router.navigate(['/ganti-nomor']);
  }

  confirmDelete() {
    this.showDeleteConfirm = true;
  }

  cancelDelete() {
    this.showDeleteConfirm = false;
  }

  async deleteAccount() {
    this.showDeleteConfirm = false;
    this.authService.deleteAccount().subscribe({
      next: async () => {
        const toast = await this.toastCtrl.create({
          message: this.t('security.delete.toast.success'),
          duration: 2500,
          color: 'success',
          position: 'top'
        });
        await toast.present();
        this.router.navigate(['/landing-page']);
      },
      error: async (err) => {
        console.error('Delete account failed', err);
        const toast = await this.toastCtrl.create({
          message: this.t('security.delete.toast.error'),
          duration: 2500,
          color: 'danger',
          position: 'top'
        });
        await toast.present();
      }
    });
  }
}
