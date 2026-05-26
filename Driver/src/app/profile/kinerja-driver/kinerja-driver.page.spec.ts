import { ComponentFixture, TestBed } from '@angular/core/testing';
import { KinerjaDriverPage } from './kinerja-driver.page';

describe('KinerjaDriverPage', () => {
  let component: KinerjaDriverPage;
  let fixture: ComponentFixture<KinerjaDriverPage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(KinerjaDriverPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
