import { Component, OnInit, OnDestroy, ViewChild, ElementRef, AfterViewChecked } from '@angular/core';
import { NavController } from '@ionic/angular';
import { Subscription } from 'rxjs';
import { ChatService, ChatMessage } from '../../services/chat.service';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-cs-chat',
  templateUrl: './cs-chat.page.html',
  styleUrls: ['./cs-chat.page.scss'],
  standalone: false,
})
export class CsChatPage implements OnInit, OnDestroy, AfterViewChecked {
  @ViewChild('messageList') private messageList!: ElementRef;
  @ViewChild('fileInput') private fileInput!: ElementRef<HTMLInputElement>;

  messages: ChatMessage[] = [];
  newMessage: string = '';
  currentUserId: string | null = null;
  isLoading = true;

  // Image attachment state
  selectedImage: File | null = null;
  imagePreviewUrl: string | null = null;
  isSending = false;

  private msgSub: Subscription | null = null;
  private shouldScrollBottom = false;
  private pollInterval: any;

  constructor(
    private chatService: ChatService,
    private authService: AuthService,
    private navCtrl: NavController
  ) { }

  ngOnInit() {
    const user = this.authService.currentUserValue;
    this.currentUserId = user?.id ?? null;
    const token = this.authService.getToken();

    // Disconnect previous channel
    this.chatService.disconnect();
    if (this.msgSub) {
      this.msgSub.unsubscribe();
      this.msgSub = null;
    }

    if (token && this.currentUserId) {
      this.chatService.connectSupport(this.currentUserId, token);

      this.chatService.loadSupportMessages().subscribe({
        next: (res) => {
          this.chatService.setMessages(res.data);
          this.isLoading = false;
          this.shouldScrollBottom = true;
        },
        error: () => { this.isLoading = false; }
      });

      this.msgSub = this.chatService.messages$.subscribe(msgs => {
        this.messages = msgs;
        this.shouldScrollBottom = true;
      });

      // Poll messages every 3s as fallback
      this.pollInterval = setInterval(() => {
        this.chatService.loadSupportMessages().subscribe({
          next: (res) => {
            if (res.data && res.data.length !== this.messages.length) {
              this.chatService.setMessages(res.data);
            }
          }
        });
      }, 3000);
    }
  }

  ngAfterViewChecked() {
    if (this.shouldScrollBottom) {
      this.scrollToBottom();
      this.shouldScrollBottom = false;
    }
  }

  private scrollToBottom(): void {
    try {
      const el = this.messageList?.nativeElement;
      if (el) el.scrollTop = el.scrollHeight;
    } catch {}
  }

  openFilePicker() {
    this.fileInput?.nativeElement?.click();
  }

  onFileSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files[0]) {
      const file = input.files[0];
      this.selectedImage = file;
      const reader = new FileReader();
      reader.onload = (e) => {
        this.imagePreviewUrl = e.target?.result as string;
      };
      reader.readAsDataURL(file);
    }
    input.value = '';
  }

  removeImage() {
    this.selectedImage = null;
    this.imagePreviewUrl = null;
  }

  sendMessage() {
    const msg = this.newMessage.trim();
    if ((!msg && !this.selectedImage) || this.isSending) return;

    this.isSending = true;
    const imageToSend = this.selectedImage;
    this.newMessage = '';
    this.selectedImage = null;
    this.imagePreviewUrl = null;

    this.chatService.sendSupportMessage(msg, imageToSend).subscribe({
      next: (saved) => {
        this.chatService.pushMessage(saved);
        this.isSending = false;
      },
      error: () => { this.isSending = false; }
    });
  }

  goBack() {
    this.navCtrl.back();
  }

  openImage(url: string) {
    window.open(url, '_blank');
  }

  isMine(message: ChatMessage): boolean {
    return message.sender_id === this.currentUserId;
  }

  ngOnDestroy() {
    if (this.pollInterval) {
      clearInterval(this.pollInterval);
    }
    this.msgSub?.unsubscribe();
    this.chatService.disconnect();
  }

  ionViewWillEnter() {
    const tabBar = document.querySelector('ion-tab-bar');
    if (tabBar) {
      tabBar.style.display = 'none';
    }
  }

  ionViewWillLeave() {
    const tabBar = document.querySelector('ion-tab-bar');
    if (tabBar) {
      tabBar.style.display = 'flex';
    }
  }
}
