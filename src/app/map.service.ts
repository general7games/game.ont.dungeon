import { Injectable } from '@angular/core';
import { NGXLogger } from 'ngx-logger';
import { Observable } from 'rxjs';
import axios from 'axios'
import { getURL } from './utils';
import { environment } from '../environments/environment'

export interface Point {
	owner: string
	color: number
	price: number
}

export interface AllPoints {
	maxLine: number
	priceMultiplier: number
	points: Point[]
}

@Injectable({
	providedIn: 'root'
})
export class MapService {

	constructor(private logger: NGXLogger) { }

	getAllPoints(): Observable<AllPoints> {
		return new Observable<AllPoints>((observer) => {
    		axios
        		.post(getURL(environment.backend.contract.getAllPoints), {
					name: 'Game.Contract.Ont.Dungeon.online.avm',
					account: {
						address: 'AbviyFBLu2JXSTLCCXVRGzcqUDWe33B53r',
						password: '123'
					}
				})
				.then((resp) => {
					if (resp.data.error === 0) {
						this.logger.info('Got all points.')
						observer.next(resp.data.points)
					} else {
						this.logger.error('Can\'t get all points:', resp.data.error)
						observer.next(null)
					}
				})
				.catch((err) => {
					this.logger.error('getAllPoints error,', err)
					observer.next(null)
				})
		})
	}
}