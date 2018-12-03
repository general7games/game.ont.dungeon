import { Component, ViewChild } from '@angular/core';
import { MapComponent } from './map/map.component';
import { ToolbarComponent } from './toolbar/toolbar.component';

@Component({
	selector: 'app-root',
	templateUrl: './app.component.html',
	styleUrls: ['./app.component.css']
})
export class AppComponent {
	title = 'Game';

	toolbar: ToolbarComponent
	map: MapComponent
}
