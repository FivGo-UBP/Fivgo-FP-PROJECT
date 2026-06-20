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
      broadcaster: (environment.reverb as any).broadcaster || 'reverb',
      key: environment.reverb.key,
      cluster: (environment.reverb as any).cluster || undefined,
      wsHost: (environment.reverb as any).broadcaster === 'pusher' ? undefined : environment.reverb.host,
      wsPort: (environment.reverb as any).broadcaster === 'pusher' ? undefined : environment.reverb.port,
      wssPort: (environment.reverb as any).broadcaster === 'pusher' ? undefined : environment.reverb.port,
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
        if (current.some(m => m.id === data.id)) return;
        this.messagesSubject.next([...current, data]);
      });
  }

  connectSupport(userId: string, token: string) {
    if (this.echo && this.currentOrderId === 'support_' + userId) return;

    this.disconnect();
    this.currentOrderId = 'support_' + userId;

    (window as any).Pusher = Pusher;

    this.echo = new Echo({
      broadcaster: (environment.reverb as any).broadcaster || 'reverb',
      key: environment.reverb.key,
      cluster: (environment.reverb as any).cluster || undefined,
      wsHost: (environment.reverb as any).broadcaster === 'pusher' ? undefined : environment.reverb.host,
      wsPort: (environment.reverb as any).broadcaster === 'pusher' ? undefined : environment.reverb.port,
      wssPort: (environment.reverb as any).broadcaster === 'pusher' ? undefined : environment.reverb.port,
      forceTLS: environment.reverb.scheme === 'https',
      enabledTransports: ['ws', 'wss'],
      authEndpoint: `${environment.apiUrl}/broadcasting/auth`,
      auth: {
        headers: {
          Authorization: `Bearer ${token}`
        }
      }
    });

    this.echo.private(`chat.support.${userId}`)
      .listen('.MessageSent', (data: ChatMessage) => {
        const current = this.messagesSubject.getValue();
        if (current.some(m => m.id === data.id)) return;
        this.messagesSubject.next([...current, data]);
      });
  }

  loadConversations() {
    return this.http.get<{ data: any[] }>(`${environment.apiUrl}/chats`);
  }

  loadMessages(orderId: string) {
    return this.http.get<{ data: ChatMessage[] }>(`${environment.apiUrl}/chats/${orderId}`);
  }

  loadSupportMessages() {
    return this.http.get<{ data: ChatMessage[] }>(`${environment.apiUrl}/chats/support/messages`);
  }

  /**
   * Send a message (text + optional image) via FormData
   */
  sendMessage(orderId: string, message: string, imageFile?: File | null) {
    const formData = new FormData();
    formData.append('order_id', orderId);
    if (message.trim()) formData.append('message', message);
    if (imageFile) formData.append('image', imageFile, imageFile.name);

    return this.http.post<ChatMessage>(`${environment.apiUrl}/chats`, formData);
  }

  sendSupportMessage(message: string, imageFile?: File | null) {
    const formData = new FormData();
    if (message.trim()) formData.append('message', message);
    if (imageFile) formData.append('image', imageFile, imageFile.name);

    return this.http.post<ChatMessage>(`${environment.apiUrl}/chats/support/messages`, formData);
  }

  pushMessage(msg: ChatMessage) {
    const current = this.messagesSubject.getValue();
    if (current.some(m => m.id === msg.id)) return;
    this.messagesSubject.next([...current, msg]);
  }

  setMessages(msgs: ChatMessage[]) {
    this.messagesSubject.next(msgs);
  }

  disconnect() {
    if (this.echo && this.currentOrderId) {
      if (this.currentOrderId.startsWith('support_')) {
        const userId = this.currentOrderId.split('_')[1];
        this.echo.leave(`chat.support.${userId}`);
      } else {
        this.echo.leave(`chat.${this.currentOrderId}`);
      }
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
