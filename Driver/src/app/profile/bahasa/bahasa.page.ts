import { Component, OnInit } from '@angular/core';
import { NavController } from '@ionic/angular';
import { LanguageService } from '../../services/language.service';

@Component({
  selector: 'app-bahasa',
  templateUrl: './bahasa.page.html',
  styleUrls: ['./bahasa.page.scss'],
  standalone: false,
})
export class BahasaPage implements OnInit {
  selectedLanguage: string = 'id';

  constructor(
    private langService: LanguageService,
    private navCtrl: NavController
  ) { }

  ngOnInit() {
    this.selectedLanguage = this.langService.getLanguage();
  }

  selectLanguage(lang: string) {
    this.selectedLanguage = lang;
  }

  saveChanges() {
    this.langService.setLanguage(this.selectedLanguage as any);
    this.navCtrl.navigateBack('/menu-profile');
  }

  goBack() {
    this.navCtrl.navigateBack('/menu-profile');
  }

  t(key: string): string {
    return this.langService.translate(key);
  }
}
