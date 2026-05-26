import { Component, OnInit } from '@angular/core';
import { AuthService, User } from '../../services/auth.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-menu-profile',
  templateUrl: './menu-profile.page.html',
  styleUrls: ['./menu-profile.page.scss'],
  standalone: false,
})
export class MenuProfilePage implements OnInit {
  user: User | null = null;
  profileImage: string = 'https://ionicframework.com/docs/img/demos/avatar.svg';

  constructor(private authService: AuthService, private router: Router) { }

  ngOnInit() {
    this.authService.getProfile().subscribe(); // Fetch latest from server
    this.authService.currentUser.subscribe(user => {
      this.user = user;
      if (user?.photo) {
        this.profileImage = user.photo;
      }
    });
  }

  goToKinerjaDriver() {
    this.router.navigate(['/kinerja-driver']);
  }

  logout() {
    this.authService.logout().subscribe({
      next: () => this.router.navigate(['/landing-page']),
      error: () => this.router.navigate(['/landing-page'])
    });
  }
}
