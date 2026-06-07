import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { ToastController, NavController } from '@ionic/angular';
import { AuthService, User } from '../../services/auth.service';
import { LanguageService } from '../../services/language.service';

@Component({
  selector: 'app-edit-profile',
  templateUrl: './edit-profile.page.html',
  styleUrls: ['./edit-profile.page.scss'],
  standalone: false,
})
export class EditProfilePage implements OnInit {
  profileImage: string | ArrayBuffer | null = null;
  selectedFile: File | null = null;
  
  name: string = '';
  email: string = '';
  phone: string = '';
  selectedGender: string = 'Laki-laki';
  
  isGenderModalOpen = false;
  showSaveButton = false;
  isEmailVerified: boolean = false;

  constructor(
    private authService: AuthService,
    private toastCtrl: ToastController,
    private router: Router,
    public langService: LanguageService,
    private navCtrl: NavController
  ) { }

  ngOnInit() {
    this.authService.currentUser.subscribe(user => {
      if (user) {
        this.name = user.name || '';
        this.email = user.email || '';
        this.isEmailVerified = !!user.email_verified_at;
        this.phone = user.phone || '';
        if (user.gender) {
          this.selectedGender = user.gender;
        }
        if (user.photo) {
          this.profileImage = user.photo;
        } else {
          this.profileImage = null;
        }
      }
    });
  }

  setGenderModalOpen(isOpen: boolean) {
    this.isGenderModalOpen = isOpen;
  }

  onInteraction() {
    this.showSaveButton = true;
  }

  goToGantiNomor() {
    this.router.navigate(['/ganti-nomor']);
  }

  goBack() {
    this.navCtrl.navigateBack('/kelola-profile');
  }

  onFileSelected(event: any) {
    const file = event.target.files[0];
    if (file) {
      this.selectedFile = file;
      const reader = new FileReader();
      reader.onload = (e) => {
        if (e.target && e.target.result) {
          this.profileImage = e.target.result;
        }
      };
      reader.readAsDataURL(file);
    }
  }

  async saveChanges() {
    const formData = new FormData();
    formData.append('name', this.name);
    formData.append('email', this.email);
    formData.append('gender', this.selectedGender);
    // Nomor telepon tidak diubah di sini — gunakan halaman Ganti Nomor
    
    if (this.selectedFile) {
      formData.append('photo', this.selectedFile);
    }

    this.authService.updateProfile(formData).subscribe({
      next: async (res) => {
        const toast = await this.toastCtrl.create({
          message: this.t('editprofile.toast.success'),
          duration: 2000,
          color: 'success'
        });
        toast.present();
        this.navCtrl.navigateBack('/kelola-profile');
      },
      error: async (err) => {
        console.error(err);
        const toast = await this.toastCtrl.create({
          message: this.t('editprofile.toast.error'),
          duration: 2000,
          color: 'danger'
        });
        toast.present();
      }
    });
  }

  t(key: string): string {
    return this.langService.translate(key);
  }

  getTranslatedGender(): string {
    if (this.selectedGender === 'Perempuan') return this.t('editprofile.gender.female');
    if (this.selectedGender === 'Laki-laki') return this.t('editprofile.gender.male');
    if (this.selectedGender === 'Tidak ingin menyebutkan') return this.t('editprofile.gender.other');
    return this.selectedGender;
  }
}
