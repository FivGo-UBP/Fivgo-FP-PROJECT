import { Component, OnInit } from '@angular/core';
import { NavController } from '@ionic/angular';
import { LanguageService } from '../../services/language.service';

@Component({
  selector: 'app-laporan-masalah',
  templateUrl: './laporan-masalah.page.html',
  styleUrls: ['./laporan-masalah.page.scss'],
  standalone: false,
})
export class LaporanMasalahPage implements OnInit {
  isLoading: boolean = false;

  constructor(
    private navCtrl: NavController,
    public langService: LanguageService
  ) { }

  ngOnInit() {
  }

  goBack() {
    this.navCtrl.back();
  }

  reloadData() {
    this.isLoading = true;
    setTimeout(() => {
      this.isLoading = false;
    }, 1500); // 1.5s loading simulation
  }

  t(key: string): string {
    return this.langService.translate(key);
  }
}
