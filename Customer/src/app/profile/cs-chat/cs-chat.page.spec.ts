import { ComponentFixture, TestBed } from '@angular/core/testing';
import { CsChatPage } from './cs-chat.page';

describe('CsChatPage', () => {
  let component: CsChatPage;
  let fixture: ComponentFixture<CsChatPage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(CsChatPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
