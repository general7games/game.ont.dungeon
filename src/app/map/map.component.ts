import { Component, OnInit, ViewChild, ViewContainerRef,  } from '@angular/core';
import { NGXLogger } from 'ngx-logger';
import { MapService, Point } from '../map.service'
import { Observable } from 'rxjs';
import * as utils from '../utils'

@Component({
	selector: 'app-map',
	templateUrl: './map.component.html',
	styleUrls: ['./map.component.css'],
	providers: [NGXLogger, MapService]
})
export class MapComponent implements OnInit {

	context: CanvasRenderingContext2D
	bubble: CanvasRenderingContext2D
	scale: number = 6
	maxLine: number
	points: Array<Point>

	constructor(
		private mapService: MapService,
		private logger: NGXLogger
	) { }

	ngOnInit() {
	}

	ngAfterViewInit() {
		const mapCanvasContainer = document.getElementById('mapCanvasContainer')
		const canvas = document.getElementById('points') as HTMLCanvasElement
		this.context = canvas.getContext('2d')
		canvas.width = mapCanvasContainer.clientWidth
		canvas.height = mapCanvasContainer.clientHeight

		const bubbleCanvas = document.getElementById('bubble') as HTMLCanvasElement
		this.bubble = bubbleCanvas.getContext('2d')
		bubbleCanvas.width = mapCanvasContainer.clientWidth
		bubbleCanvas.height = mapCanvasContainer.clientHeight

		this.fillImageData().subscribe((filled) => {
			if (filled) {
				bubbleCanvas.addEventListener('mousemove', (ev: MouseEvent) => {
					this.onMouseMove(ev)
				})
				bubbleCanvas.addEventListener('mouseup', (ev: MouseEvent) => {
					this.onMouseUp(ev)
				})
			}
		})
	}

	fillImageData(): Observable<boolean> {
		return new Observable<boolean>((observer) => {
			this.mapService.getAllPoints().subscribe((allPoints) => {
				if (allPoints != null) {
					let art = new Array<string>(allPoints.maxLine)
					let palette = {}
					let colorToChar = {}
					let nextChar = 'A'
					for (let y = 1; y <= allPoints.maxLine; ++y) {
						let artLine = ''
						for (let x = 1; x <= allPoints.maxLine; ++x) {
							let point = allPoints.points[(y - 1) * allPoints.maxLine + x - 1]
							if (!(point.color in colorToChar)) {
								let ch = nextChar
								if (ch == 'z') {
									throw new Error('Too many different colors.')
								}
								colorToChar[point.color] = ch
								nextChar = String.fromCharCode(ch.charCodeAt(0) + 1)
								palette[ch] = utils.colorIntToHex(point.color)
							}
							artLine += colorToChar[point.color]
						}
						art[y - 1] = artLine
					}

					var pixel = require('pixel-art');
					pixel.art(art)
						.palette(palette)
						.pos({ x: 0, y: 0 })
						.scale(this.scale)
						.draw(this.context);
					this.logger.info('Pixel art is finished.')

					this.maxLine = allPoints.maxLine
					this.points = allPoints.points
					observer.next(true)
				} else {
					observer.next(false)
				}
			})
		})
	}

	onMouseMove(ev: MouseEvent) {
		this.bubble.clearRect(0, 0, this.bubble.canvas.width, this.bubble.canvas.height)
		let offsetX = ev.offsetX + 10
		let offsetY = ev.offsetY + 10
		let x = Math.floor(ev.offsetX / this.scale)
		let y = Math.floor(ev.offsetY / this.scale)

		let i = y * this.maxLine + x
		if (i >= 0 && i < this.points.length) {
			let point = this.points[i]
			this.bubble.fillStyle = utils.colorIntToHex(point.color)
			this.bubble.fillRect(offsetX, offsetY, 320, 70)
			this.bubble.fillStyle = 'lightgray'
			this.bubble.lineWidth = 1
			this.bubble.strokeRect(offsetX, offsetY, 320, 70)
			this.bubble.fillStyle = 'black'
			this.bubble.font = '15px Arial'
			this.bubble.fillText(point.owner == '' ? 'No owner' : point.owner, offsetX + 5, offsetY + 20)
			this.bubble.fillText(x + ', ' + y, offsetX + 5, offsetY + 40)
			this.bubble.fillText(point.price + ' ONT to buy', offsetX + 5, offsetY + 60)
		}
	}

	onMouseUp(ev: MouseEvent) {

	}
}
