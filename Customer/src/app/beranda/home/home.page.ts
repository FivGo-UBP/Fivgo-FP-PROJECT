import { Component, OnInit } from '@angular/core';
import { AuthService, User } from '../../services/auth.service';
import { LanguageService } from '../../services/language.service';

@Component({
  selector: 'app-home',
  templateUrl: 'home.page.html',
  styleUrls: ['home.page.scss'],
  standalone: false,
})
export class HomePage implements OnInit {
  user: User | null = null;

  constructor(
    private authService: AuthService,
    public langService: LanguageService
  ) {}

  ngOnInit() {
    this.authService.currentUser.subscribe(user => {
      this.user = user;
    });
  }

  t(key: string): string {
    return this.langService.translate(key);
  }
}
