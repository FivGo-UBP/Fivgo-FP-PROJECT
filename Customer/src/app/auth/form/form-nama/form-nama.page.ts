import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../../services/auth.service';
import { AlertController, LoadingController } from '@ionic/angular';

@Component({
  selector: 'app-form-nama',
  templateUrl: './form-nama.page.html',
  styleUrls: ['./form-nama.page.scss'],
  standalone: false,
})
export class FormNamaPage implements OnInit {
  name: string = '';

  constructor(
    private authService: AuthService,
    private router: Router,
    private loadingCtrl: LoadingController,
    private alertCtrl: AlertController
  ) {}

  ngOnInit() {}

  async onSubmit() {
    const trimmedName = this.name.trim();

    if (!trimmedName) {
      await this.showAlert('Peringatan', 'Silakan masukkan nama Anda.');
      return;
    }

    const loading = await this.loadingCtrl.create({ message: 'Menyimpan nama...' });
    await loading.present();

    this.authService.updateName(trimmedName).subscribe({
      next: async (res: any) => {
        await loading.dismiss();
        // Update cached user name
        const userStr = localStorage.getItem('user');
        if (userStr) {
          const user = JSON.parse(userStr);
          user.name = trimmedName;
          localStorage.setItem('user', JSON.stringify(user));
        }
        await this.router.navigate(['/home']);
      },
      error: async (err: any) => {
        await loading.dismiss();
        const message = err.error?.message || 'Gagal menyimpan nama. Silakan coba lagi.';
        await this.showAlert('Gagal', message);
      }
    });
  }

  async showAlert(header: string, message: string) {
    const alert = await this.alertCtrl.create({
      header,
      message,
      buttons: ['OK']
    });
    await alert.present();
  }
}
