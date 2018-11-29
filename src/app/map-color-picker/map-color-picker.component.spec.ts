import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { MapColorPickerComponent } from './map-color-picker.component';

describe('MapColorPickerComponent', () => {
  let component: MapColorPickerComponent;
  let fixture: ComponentFixture<MapColorPickerComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ MapColorPickerComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(MapColorPickerComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
