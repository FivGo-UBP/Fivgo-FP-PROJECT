import { ComponentFixture, TestBed } from '@angular/core/testing';
import { RatingDriverPage } from './rating-driver.page';

describe('RatingDriverPage', () => {
  let component: RatingDriverPage;
  let fixture: ComponentFixture<RatingDriverPage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(RatingDriverPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
