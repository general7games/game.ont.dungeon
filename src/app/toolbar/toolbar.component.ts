import { Component, OnInit, forwardRef, Inject, Host } from '@angular/core';
import { NGXLogger } from 'ngx-logger';
import { MatButtonToggleGroup } from '@angular/material/button-toggle';
import { AppComponent } from '../app.component';
import { Subject, Observable } from 'rxjs';

@Component({
	selector: 'app-toolbar',
	templateUrl: './toolbar.component.html',
	styleUrls: ['./toolbar.component.css']
})
export class ToolbarComponent implements OnInit {

	modeObserver = new Subject<number>()

	constructor(
		private logger: NGXLogger
	) { 
	}

	ngOnInit() {
	}

	getModeObserver(): Observable<number> {
		return this.modeObserver.asObservable()
	}

	onModeChange(value: string) {
		this.logger.info('User change mode to ' + value)
		this.modeObserver.next(parseInt(value))
	}
}
