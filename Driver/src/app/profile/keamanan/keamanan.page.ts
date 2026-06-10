import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { NavController } from '@ionic/angular';

@Component({
  selector: 'app-keamanan',
  templateUrl: './keamanan.page.html',
  styleUrls: ['./keamanan.page.scss'],
  standalone: false,
})
export class KeamananPage implements OnInit {
  isDropdownOpen: boolean = false;
  selectedOption: string = '';

  constructor(
    private router: Router,
    private navCtrl: NavController
  ) { }

  goBack() {
    this.navCtrl.navigateBack('/menu-profile');
  }

  ngOnInit() {
  }

  toggleDropdown() {
    this.isDropdownOpen = !this.isDropdownOpen;
  }

  navigateToForm(option: string) {
    this.selectedOption = option;
    
    // Close dropdown with a slight delay to allow selection highlight to animate/be seen
    setTimeout(() => {
      this.isDropdownOpen = false;
      this.router.navigate(['/form-pengajuan'], {
        queryParams: { type: 'update', option: option }
      });
      this.selectedOption = '';
    }, 200);
  }
}
