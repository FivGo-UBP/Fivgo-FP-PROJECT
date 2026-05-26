import { Component, OnInit } from '@angular/core';
import { LanguageService } from '../../services/language.service';

@Component({
  selector: 'app-chat',
  templateUrl: './chat.page.html',
  styleUrls: ['./chat.page.scss'],
  standalone: false,
})
export class ChatPage implements OnInit {
  segmentValue: string = 'chat';

  constructor(public langService: LanguageService) { }

  ngOnInit() {
  }

  t(key: string): string {
    return this.langService.translate(key);
  }
}
