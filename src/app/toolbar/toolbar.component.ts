import { Component, OnInit, forwardRef, Inject, Host } from '@angular/core';
import { NGXLogger } from 'ngx-logger';
import { MatButtonToggleGroup } from '@angular/material/button-toggle';
import { AppComponent } from '../app.component';
import { Subject, Observable, config } from 'rxjs';
import { DapiService } from '../dapi.service';
import { MatSnackBar } from '@angular/material';

@Component({
	selector: 'app-toolbar',
	templateUrl: './toolbar.component.html',
	styleUrls: ['./toolbar.component.css'],
	providers: [NGXLogger, DapiService]
})
export class ToolbarComponent implements OnInit {

	modeObserver = new Subject<number>()

	constructor(
		private app: AppComponent,
		private dapiService: DapiService,
		private logger: NGXLogger,
		private snakeBar: MatSnackBar
	) { 
	}

	ngOnInit() {
		this.app.toolbar = this
	}

	getModeObserver(): Observable<number> {
		return this.modeObserver.asObservable()
	}

	onModeChange(value: string) {
		this.logger.info('User change mode to ' + value)
		this.modeObserver.next(parseInt(value))
	}

	async onBuyClick() {
		const editedPoints = this.app.map.getEditedPoints()
		if (editedPoints.length == 0) {
			this.snakeBar.open("You haven't select points yet.", undefined, {
				duration: 3000
			})
			return
		}

		const len = editedPoints.length
		let xPoints = new Array(len)
		let yPoints = new Array(len)
		let colors = new Array(len)
		let prices = new Array(len)
		
		for (let i = 0; i < len; ++i) {
			const point = editedPoints[i]
			xPoints[i] = point.x + 1
			yPoints[i] = point.y + 1
			colors[i] = point.color
			prices[i] = point.price
		}
		const r = await this.dapiService.buyPoints(xPoints, yPoints, colors, prices)
		if (r) {
			this.snakeBar.open('Transaction is submitted, refresh webpage later to check update.', undefined, {
				duration: 5000
			})
		} else {
			this.snakeBar.open('Transactoin failed.', undefined, {
				duration: 3000
			})
		}
	}
}
