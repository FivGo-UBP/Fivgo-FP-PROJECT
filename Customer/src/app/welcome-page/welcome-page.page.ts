import { Component, OnInit, ElementRef, ViewChild } from '@angular/core';
import { Router } from '@angular/router';
import { register } from 'swiper/element/bundle';

// Register Swiper Element (Web Components)
register();

@Component({
  selector: 'app-welcome-page',
  templateUrl: './welcome-page.page.html',
  styleUrls: ['./welcome-page.page.scss'],
  standalone: false,
})
export class WelcomePagePage implements OnInit {
  @ViewChild('swiperRef', { static: false }) swiperRef?: ElementRef;

  activeIndex = 0;
  isPrivacyModalOpen = false;
  hasReadToBottom = false;
  isAgreed = false;
  private shouldNavigateToLogin = false;

  constructor(
    private router: Router
  ) { }

  ngOnInit() {
  }



  onSlideChange(event?: any) {
    const swiper = this.swiperRef?.nativeElement?.swiper;
    if (swiper) {
      this.activeIndex = swiper.activeIndex;
    }
  }

  nextSlide() {
    const swiper = this.swiperRef?.nativeElement?.swiper;
    if (swiper) {
      swiper.slideNext();
    }
  }

  skipToLanding() {
    const swiper = this.swiperRef?.nativeElement?.swiper;
    if (swiper) {
      swiper.slideTo(2); // Go to index 2 (3rd slide = Landing Page)
    }
  }

  goToSlide(index: number) {
    const swiper = this.swiperRef?.nativeElement?.swiper;
    if (swiper) {
      swiper.slideTo(index);
    }
  }

  openPrivacyModal() {
    this.isPrivacyModalOpen = true;
    this.hasReadToBottom = false;
    this.isAgreed = false;
  }

  closePrivacyModal() {
    this.isPrivacyModalOpen = false;
    // Navigate hanya setelah modal benar-benar tertutup (didDismiss)
    if (this.shouldNavigateToLogin) {
      this.shouldNavigateToLogin = false;
      this.router.navigate(['/login'], { replaceUrl: true });
    }
  }

  onPolicyScroll(event: any) {
    const element = event.target;
    // Calculate if user reached bottom
    const threshold = 15; // px tolerance
    const isAtBottom = element.scrollHeight - element.scrollTop - element.clientHeight <= threshold;
    if (isAtBottom) {
      this.hasReadToBottom = true;
    }
  }

  acceptAndProceed() {
    if (this.isAgreed && this.hasReadToBottom) {
      localStorage.setItem('welcome_seen', 'true');
      // Tandai bahwa kita perlu navigasi setelah modal tutup
      this.shouldNavigateToLogin = true;
      // Tutup modal dulu, navigasi akan terjadi di closePrivacyModal() via (didDismiss)
      this.isPrivacyModalOpen = false;
    }
  }
}
