import { Injectable, OnDestroy } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../environments/environment';
import Echo from 'laravel-echo';
import Pusher from 'pusher-js';
import { BehaviorSubject } from 'rxjs';

export interface ChatMessage {
  id: string;
  order_id: string;
  sender_id: string;
  receiver_id: string;
  message: string;
  image_url?: string | null;
  created_at: string;
  is_read?: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class ChatService implements OnDestroy {
  private echo: Echo<any> | null = null;
  private messagesSubject = new BehaviorSubject<ChatMessage[]>([]);
  public messages$ = this.messagesSubject.asObservable();
  private currentOrderId: string | null = null;

  constructor(private http: HttpClient) {}

  connect(orderId: string, token: string) {
    if (this.echo && this.currentOrderId === orderId) return;

    this.disconnect();
    this.currentOrderId = orderId;

    (window as any).Pusher = Pusher;

    this.echo = new Echo({
      broadcaster: 'reverb',
      key: environment.reverb.key,
      wsHost: environment.reverb.host,
      wsPort: environment.reverb.port,
      wssPort: environment.reverb.port,
      forceTLS: environment.reverb.scheme === 'https',
      enabledTransports: ['ws', 'wss'],
      authEndpoint: `${environment.apiUrl}/broadcasting/auth`,
      auth: {
        headers: {
          Authorization: `Bearer ${token}`
        }
      }
    });

    this.echo.private(`chat.${orderId}`)
      .listen('.MessageSent', (data: ChatMessage) => {
        const current = this.messagesSubject.getValue();
        this.messagesSubject.next([...current, data]);
      });
  }

  loadMessages(orderId: string) {
    return this.http.get<{ data: ChatMessage[] }>(`${environment.apiUrl}/chats/${orderId}`);
  }

  sendMessage(orderId: string, message: string, imageFile?: File | null) {
    const formData = new FormData();
    formData.append('order_id', orderId);
    if (message.trim()) formData.append('message', message);
    if (imageFile) formData.append('image', imageFile, imageFile.name);

    return this.http.post<ChatMessage>(`${environment.apiUrl}/chats`, formData);
  }

  pushMessage(msg: ChatMessage) {
    const current = this.messagesSubject.getValue();
    this.messagesSubject.next([...current, msg]);
  }

  setMessages(msgs: ChatMessage[]) {
    this.messagesSubject.next(msgs);
  }

  disconnect() {
    if (this.echo && this.currentOrderId) {
      this.echo.leave(`chat.${this.currentOrderId}`);
      this.echo.disconnect();
    }
    this.echo = null;
    this.currentOrderId = null;
    this.messagesSubject.next([]);
  }

  ngOnDestroy() {
    this.disconnect();
  }
}
