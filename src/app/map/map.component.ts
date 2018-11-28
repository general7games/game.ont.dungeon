import { Component, OnInit, ViewChild, ViewContainerRef,  } from '@angular/core';
import { NGXLogger } from 'ngx-logger';
import { MapService, Point } from '../map.service'
import { Observable } from 'rxjs';
import * as utils from '../utils'

enum Mode {
	View = 0,
	Draw,
	Erase
}

interface XY {
	x: number
	y: number
}

const FLAG_MOUSE_MOVE  = 0x01
const FLAG_MOUSE_WHEEL = 0x02
const FLAG_MOUSE_DOWN  = 0x04
const FLAG_MOUSE_UP    = 0x08
const FLAG_MOUSE_DRAG  = 0x10

const FLAGS_MODE = {
	0/* Mode.View */: FLAG_MOUSE_MOVE | FLAG_MOUSE_WHEEL | FLAG_MOUSE_DRAG | FLAG_MOUSE_DOWN | FLAG_MOUSE_UP,
	1/* Mode.Draw */: FLAG_MOUSE_MOVE | FLAG_MOUSE_WHEEL | FLAG_MOUSE_UP
}

@Component({
	selector: 'app-map',
	templateUrl: './map.component.html',
	styleUrls: ['./map.component.css'],
	providers: [NGXLogger, MapService]
})
export class MapComponent implements OnInit {

	context: CanvasRenderingContext2D
	bubble: CanvasRenderingContext2D
	
	art: Array<string>
	palette
	scale = 6
	lastScaleTime = 0

	maxLine: number
	points: Array<Point>

	mode: Mode = Mode.View
	lastDragXY: XY
	totalOffset: XY = {
		x: 0, y: 0
	}

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
				let isMouseDown = false
				bubbleCanvas.addEventListener('mousemove', (ev: MouseEvent) => {
					if ((FLAGS_MODE[this.mode] & FLAG_MOUSE_DRAG) && isMouseDown) {
						this.onMouseDrag(ev)
					} else if ((FLAGS_MODE[this.mode] & FLAG_MOUSE_MOVE) > 0) {
						this.onMouseMove(ev)
					}
				})
				bubbleCanvas.addEventListener('wheel', (ev: MouseEvent) => {
					if ((FLAGS_MODE[this.mode] & FLAG_MOUSE_WHEEL) > 0) {
						this.onMouseWheel(ev)
					}
				})
				bubbleCanvas.addEventListener('mousedown', (ev: MouseEvent) => {
					isMouseDown = true
					if ((FLAGS_MODE[this.mode] & FLAG_MOUSE_DOWN) > 0) {
						this.onMouseDown(ev)
					}
				})
				bubbleCanvas.addEventListener('mouseup', (ev: MouseEvent) => {
					isMouseDown = false
					if ((FLAGS_MODE[this.mode] & FLAG_MOUSE_UP) > 0) {
						this.onMouseUp(ev)
					}
				})
			} else {
				alert('Error to fill data.')
			}
		})
	}

	switchMode(mode: Mode) {
		this.mode = mode
	}

	fillImageData(): Observable<boolean> {
		return new Observable<boolean>((observer) => {
			this.mapService.getAllPoints().subscribe((allPoints) => {
				if (allPoints != null) {
					this.art = new Array<string>(allPoints.maxLine)
					this.palette = {}
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
								this.palette[ch] = utils.colorIntToHex(point.color)
							}
							artLine += colorToChar[point.color]
						}
						this.art[y - 1] = artLine
					}

					this.maxLine = allPoints.maxLine
					this.points = allPoints.points
					this.drawAllPoints()
					observer.next(true)
				} else {
					observer.next(false)
				}
			})
		})
	}

	drawAllPoints() {
		this.context.clearRect(0, 0, this.context.canvas.width, this.context.canvas.height)
		var pixel = require('pixel-art');
		pixel.art(this.art)
			.palette(this.palette)
			.pos({ x: this.totalOffset.x / this.scale, y: this.totalOffset.y / this.scale })
			.scale(this.scale)
			.draw(this.context);
		this.logger.info('Pixel art is drawn with scale ' + this.scale)
	}

	onMouseMove(ev: MouseEvent) {
		this.bubble.clearRect(0, 0, this.bubble.canvas.width, this.bubble.canvas.height)
		let offsetX = ev.offsetX + 10
		let offsetY = ev.offsetY + 10
		let x = Math.floor((ev.offsetX - this.totalOffset.x) / this.scale)
		let y = Math.floor((ev.offsetY - this.totalOffset.y) / this.scale)

		let i = y * this.maxLine + x
		if (x >= 0 && x < this.maxLine && y >=0 && y < this.maxLine && i < this.points.length) {
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

	onMouseWheel(ev: MouseEvent) {
		const time = Date.now()
		if (time - this.lastScaleTime < 200) {
			return
		}
		this.lastScaleTime = time

		this.scale *= ev.wheelDelta > 0 ? 2 : 0.5
		this.drawAllPoints()
	}

	onMouseDown(ev: MouseEvent) {
		this.lastDragXY = {
			x: ev.offsetX,
			y: ev.offsetY
		}
		this.bubble.clearRect(0, 0, this.bubble.canvas.width, this.bubble.canvas.height)
	}

	onMouseUp(ev: MouseEvent) {
		this.bubble.canvas.style.left = this.context.canvas.style.left
		this.bubble.canvas.style.top = this.context.canvas.style.top
	}

	onMouseDrag(ev: MouseEvent) {
		let offsetX = ev.offsetX - this.lastDragXY.x
		let offsetY = ev.offsetY - this.lastDragXY.y
		this.lastDragXY = {
			x: ev.offsetX,
			y: ev.offsetY
		}
		this.totalOffset.x += offsetX
		this.totalOffset.y += offsetY
		this.redraw()
	}

	redraw() {
		this.drawAllPoints()
	}
}
