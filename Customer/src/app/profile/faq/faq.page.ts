import { Component, OnInit } from '@angular/core';
import { NavController } from '@ionic/angular';
import { LanguageService } from '../../services/language.service';

interface FaqItem {
  question: string;
  answer: string;
  isOpen: boolean;
}

@Component({
  selector: 'app-faq',
  templateUrl: './faq.page.html',
  styleUrls: ['./faq.page.scss'],
  standalone: false,
})
export class FAQPage implements OnInit {
  faqItems: FaqItem[] = [
    {
      question: 'Saya lupa / kurang membayar ke Mitra Pengemudi',
      answer: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Ut elit tellus, luctus nec ullamcorper mattis, pulvinar dapibus leo. Lorem ipsum dolor sit amet, consectetur adipiscing elit.',
      isOpen: false
    },
    {
      question: 'Cara melaporkan Mitra Pengemudi',
      answer: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Ut elit tellus, luctus nec ullamcorper mattis, pulvinar dapibus leo. Lorem ipsum dolor sit amet, consectetur adipiscing elit.',
      isOpen: false
    },
    {
      question: 'Mitra Pengemudi tidak mengantarkan sampai ke tujuan',
      answer: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Ut elit tellus, luctus nec ullamcorper mattis, pulvinar dapibus leo. Lorem ipsum dolor sit amet, consectetur adipiscing elit.',
      isOpen: false
    },
    {
      question: 'Saya tidak bisa menggunakan pembayaran non-tunai',
      answer: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Ut elit tellus, luctus nec ullamcorper mattis, pulvinar dapibus leo. Lorem ipsum dolor sit amet, consectetur adipiscing elit.',
      isOpen: false
    }
  ];

  constructor(
    private navCtrl: NavController,
    public langService: LanguageService
  ) { }

  ngOnInit() {
  }

  toggleFaq(index: number) {
    this.faqItems[index].isOpen = !this.faqItems[index].isOpen;
  }

  goBack() {
    this.navCtrl.back();
  }

  t(key: string): string {
    return this.langService.translate(key);
  }
}
