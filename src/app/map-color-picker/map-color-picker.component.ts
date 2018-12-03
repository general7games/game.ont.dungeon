import { Component, OnInit } from '@angular/core';
import { NGXLogger } from 'ngx-logger';
import { Observable, Subject } from 'rxjs';

@Component({
	selector: 'app-map-color-picker',
	templateUrl: './map-color-picker.component.html',
	styleUrls: ['./map-color-picker.component.css'],
	providers: [NGXLogger]
})
export class MapColorPickerComponent implements OnInit {

	colors: string[] = [
		'#222222',
		'#888888',
		'#E4E4E4',
		'#FFFFFF',
		'#E50000',
		'#E59500',
		'#E5D900',
		'#99db46',
		'#02BE01',
		'#00d9e2',
		'#0089bf',
		'#0000ed',
		'#87007c',
		'#ce6fe4',
		'#ffa3d1'
	];

	colorObserver = new Subject<string>()
	
	constructor(
		private logger: NGXLogger
	) { }

	ngOnInit() {
	}

	getColorObserver(): Observable<string> {
		return this.colorObserver.asObservable()
	}

	onColorChange(value: string) {
		let color = this.colors[parseInt(value)]
		this.logger.info('User change color to ' + color)
		this.colorObserver.next(color)
	}
}
