import { Component, OnInit, OnDestroy, ViewChild, ElementRef, AfterViewChecked } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Location } from '@angular/common';
import { Subscription } from 'rxjs';
import { ChatService, ChatMessage } from '../../services/chat.service';
import { AuthService } from '../../services/auth.service';
import { OrderService, ActiveOrder } from '../../services/order.service';

@Component({
  selector: 'app-chat',
  templateUrl: './chat.page.html',
  styleUrls: ['./chat.page.scss'],
  standalone: false,
})
export class ChatPage implements OnInit, OnDestroy, AfterViewChecked {
  @ViewChild('messageList') private messageList!: ElementRef;
  @ViewChild('fileInput') private fileInput!: ElementRef<HTMLInputElement>;

  segmentValue: string = 'chat';
  orderId: string | null = null;
  messages: ChatMessage[] = [];
  newMessage: string = '';
  currentUserId: string | null = null;
  isLoading = true;
  activeOrder: ActiveOrder | null = null;
  conversations: any[] = [];

  // Image attachment state
  selectedImage: File | null = null;
  imagePreviewUrl: string | null = null;
  isSending = false;

  private msgSub: Subscription | null = null;
  private queryParamsSub: Subscription | null = null;
  private shouldScrollBottom = false;

  constructor(
    private chatService: ChatService,
    private authService: AuthService,
    private route: ActivatedRoute,
    private router: Router,
    private orderService: OrderService,
    private location: Location
  ) {}

  ngOnInit() {
    const user = this.authService.currentUserValue;
    this.currentUserId = user?.id ?? null;
    const token = this.authService.getToken();

    this.queryParamsSub = this.route.queryParams.subscribe(params => {
      this.orderId = params['order_id'] ?? null;
      this.isLoading = true;

      // Disconnect previous Echo channel
      this.chatService.disconnect();
      if (this.msgSub) {
        this.msgSub.unsubscribe();
        this.msgSub = null;
      }

      if (this.orderId && token) {
        this.orderService.getActiveOrder().subscribe({
          next: (order) => {
            this.activeOrder = order;
          }
        });

        this.chatService.connect(this.orderId, token);

        this.chatService.loadMessages(this.orderId).subscribe({
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
      } else {
        this.loadConversationsList();
      }
    });
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
    if ((!msg && !this.selectedImage) || !this.orderId || this.isSending) return;

    this.isSending = true;
    const imageToSend = this.selectedImage;
    this.newMessage = '';
    this.selectedImage = null;
    this.imagePreviewUrl = null;

    this.chatService.sendMessage(this.orderId, msg, imageToSend).subscribe({
      next: (saved) => {
        this.chatService.pushMessage(saved);
        this.isSending = false;
      },
      error: () => { this.isSending = false; }
    });
  }

  goBack() {
    this.location.back();
  }

  openImage(url: string) {
    window.open(url, '_blank');
  }

  isMine(message: ChatMessage): boolean {
    return message.sender_id === this.currentUserId;
  }

  loadConversationsList() {
    this.isLoading = true;
    this.chatService.loadConversations().subscribe({
      next: (res) => {
        this.conversations = res.data;
        this.isLoading = false;
      },
      error: () => {
        this.isLoading = false;
      }
    });
  }

  openChatRoom(orderId: string) {
    this.router.navigate(['/tabs/pesan'], { queryParams: { order_id: orderId } });
  }

  ngOnDestroy() {
    this.msgSub?.unsubscribe();
    this.queryParamsSub?.unsubscribe();
    this.chatService.disconnect();
  }

  ionViewWillEnter() {
    if (this.orderId) {
      const tabBar = document.querySelector('ion-tab-bar');
      if (tabBar) {
        tabBar.style.display = 'none';
      }
    }
  }

  ionViewWillLeave() {
    if (this.orderId) {
      const tabBar = document.querySelector('ion-tab-bar');
      if (tabBar) {
        tabBar.style.display = 'flex';
      }
    }
  }
}
