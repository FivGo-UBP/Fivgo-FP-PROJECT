import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MapVisualPage } from './map-visual.page';

describe('MapVisualPage', () => {
  let component: MapVisualPage;
  let fixture: ComponentFixture<MapVisualPage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(MapVisualPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
