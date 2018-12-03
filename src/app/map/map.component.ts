import { Component, OnInit, ViewChild, ViewContainerRef, Host,  } from '@angular/core';
import { NGXLogger } from 'ngx-logger';
import { MapService, Point } from '../map.service'
import { Observable } from 'rxjs';
import * as utils from '../utils'
import { MapColorPickerComponent } from '../map-color-picker/map-color-picker.component';
import { AppComponent } from '../app.component';
import { MatSnackBar } from '@angular/material';

enum Mode {
	View = 0,
	Edit,
	Erase
}

interface XY {
	x: number
	y: number
}

export interface EditedPoint {
	x: number
	y: number
	color: number
	price: number
}

const FLAG_MOUSE_MOVE  = 0x01
const FLAG_MOUSE_WHEEL = 0x02
const FLAG_MOUSE_DOWN  = 0x04
const FLAG_MOUSE_UP    = 0x08
const FLAG_MOUSE_DRAG  = 0x10

const FLAGS_MODE = {
	0/* Mode.View  */: FLAG_MOUSE_MOVE | FLAG_MOUSE_WHEEL | FLAG_MOUSE_DRAG | FLAG_MOUSE_DOWN,
	1/* Mode.Edit  */: FLAG_MOUSE_MOVE | FLAG_MOUSE_WHEEL | FLAG_MOUSE_UP,
	2/* Mode.Erase */: FLAG_MOUSE_MOVE | FLAG_MOUSE_WHEEL | FLAG_MOUSE_UP
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
	artUnedited: Array<string>
	palette = {} // eg. 'A' -> '#FFFFFF'
	colorToChar = {} // key value reversed from palette, eg. '#FFFFFF' -> 'A'
	scale = 6
	lastScaleTime = 0

	maxLine: number
	priceMultiplier: number
	points: Array<Point>
	editedPoints = {} // XY -> Point

	mode: Mode = Mode.View
	lastDragXY: XY
	totalOffset: XY = {
		x: 0, y: 0
	}

	@ViewChild(MapColorPickerComponent)
	colorPicker: MapColorPickerComponent
	color: string

	constructor(
		private app: AppComponent,
		private mapService: MapService,
		private snakeBar: MatSnackBar,
		private logger: NGXLogger
	) { }

	ngOnInit() {
		this.app.map = this
	}

	ngAfterViewInit() {
		this.snakeBar.open('Loading, please wait...')

		const mapCanvasContainer = document.getElementById('mapCanvasContainer')
		const canvas = document.getElementById('points') as HTMLCanvasElement
		this.context = canvas.getContext('2d')
		canvas.width = mapCanvasContainer.clientWidth
		canvas.height = mapCanvasContainer.clientHeight

		const bubbleCanvas = document.getElementById('bubble') as HTMLCanvasElement
		this.bubble = bubbleCanvas.getContext('2d')
		bubbleCanvas.width = mapCanvasContainer.clientWidth
		bubbleCanvas.height = mapCanvasContainer.clientHeight

		for (let i = 0; i < this.colorPicker.colors.length; ++i) {
			let j = i + 21; // Palette use character after space.
			let c = String.fromCharCode(j)
			let color = this.colorPicker.colors[i].toUpperCase()
			this.palette[c] = color
			this.colorToChar[color] = c
		}

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
						this.onMouseWheel(ev as MouseWheelEvent)
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
				this.snakeBar.dismiss()
			} else {
				alert('Error to fill data.')
			}
		})

		this.app.toolbar.getModeObserver().subscribe((mode) => {
			this.mode = mode
		})
		this.color = this.colorPicker.colors[0]
		this.colorPicker.getColorObserver().subscribe((color) => {
			this.color = color.toUpperCase()
		})
	}

	fillImageData(): Observable<boolean> {
		return new Observable<boolean>((observer) => {
			this.mapService.getAllPoints().subscribe((allPoints) => {
				if (allPoints != null) {
					this.art = new Array<string>(allPoints.maxLine)
					let nextChar = String.fromCharCode(this.colorPicker.colors.length + 21)
					for (let y = 1; y <= allPoints.maxLine; ++y) {
						let artLine = ''
						for (let x = 1; x <= allPoints.maxLine; ++x) {
							let point = allPoints.points[(y - 1) * allPoints.maxLine + x - 1]
							let color = utils.colorIntToHex(point.color).toUpperCase()
							if (!(color in this.colorToChar)) {
								let ch = nextChar
								if (ch == 'z') {
									throw 'Too many different colors.'
								}
								this.colorToChar[color] = ch
								this.palette[ch] = color
								nextChar = String.fromCharCode(ch.charCodeAt(0) + 1)
							}
							artLine += this.colorToChar[color]
						}
						this.art[y - 1] = artLine
					}
					this.artUnedited = Object.assign([], this.art)

					this.maxLine = allPoints.maxLine
					this.priceMultiplier = allPoints.priceMultiplier
					this.points = allPoints.points
					this.drawAllPoints()
					observer.next(true)
				} else {
					observer.next(false)
				}
			})
		})
	}

	redraw() {
		this.drawAllPoints()
	}

	drawAllPoints() {
		this.drawArtOnCanvas(this.art, this.context)
		//this.logger.info('Pixel art is drawn with scale ' + this.scale)
	}

	drawArtOnCanvas(art, context) {
		context.clearRect(0, 0, context.canvas.width, context.canvas.height)
		var pixel = require('pixel-art');
		pixel.art(art)
			.palette(this.palette)
			.pos({ x: this.totalOffset.x / this.scale, y: this.totalOffset.y / this.scale })
			.scale(this.scale)
			.draw(context);
	}

	onMouseMove(ev: MouseEvent) {
		this.bubble.clearRect(0, 0, this.bubble.canvas.width, this.bubble.canvas.height)
		let offsetX = ev.offsetX + 10
		let offsetY = ev.offsetY + 10
		
		let xy = this.getXYFromMouse(ev)
		let i = xy.y * this.maxLine + xy.x
		if (xy.x >= 0 && xy.x < this.maxLine && xy.y >=0 && xy.y < this.maxLine && i < this.points.length) {
			let point = this.points[i]
			this.bubble.fillStyle = utils.colorIntToHex(point.color)
			this.bubble.fillRect(offsetX, offsetY, 320, 70)
			this.bubble.fillStyle = 'lightgray'
			this.bubble.lineWidth = 1
			this.bubble.strokeRect(offsetX, offsetY, 320, 70)
			this.bubble.fillStyle = 'black'
			this.bubble.font = '15px Arial'
			this.bubble.fillText(point.owner == '' ? 'No owner' : point.owner, offsetX + 5, offsetY + 20)
			this.bubble.fillText(xy.x + ', ' + xy.y, offsetX + 5, offsetY + 40)
			this.bubble.fillText(this.calcBuyPrice(point.price) + ' ONT to buy', offsetX + 5, offsetY + 60)
		}
	}

	getXYFromMouse(ev: MouseEvent): XY {
		let x = Math.floor((ev.offsetX - this.totalOffset.x) / this.scale)
		let y = Math.floor((ev.offsetY - this.totalOffset.y) / this.scale)
		return {
			x: x,
			y: y
		}
	}

	onMouseWheel(ev: MouseWheelEvent) {
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
		switch (this.mode) {
			case Mode.Edit: {
				let xy = this.getXYFromMouse(ev)
				if (xy.x >= 0 && xy.x < this.maxLine && xy.y >=0 && xy.y < this.maxLine) {
					this.art[xy.y] = utils.replaceAt(this.art[xy.y], xy.x, this.colorToChar[this.color])
					let i = this.xyToIndex(xy)
					this.editedPoints[i] = {
						x: xy.x,
						y: xy.y,
						color: utils.colorHexToInt(this.color),
						price: this.calcBuyPrice(this.points[i].price)
					}
					this.redraw()
				}
				break
			}
			case Mode.Erase: {
				let xy = this.getXYFromMouse(ev)
				if (xy.x >= 0 && xy.x < this.maxLine && xy.y >=0 && xy.y < this.maxLine) {
					let c = this.artUnedited[xy.y][xy.x]
					this.art[xy.y] = utils.replaceAt(this.art[xy.y], xy.x, c)
					delete this.editedPoints[this.xyToIndex(xy)]
					this.redraw()
				}
				break
			}
		}
		//this.logger.info('Edited points ' + Object.keys(this.editedPoints).length)
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

	getEditedPoints(): Array<EditedPoint> {
		return Object.values(this.editedPoints)
	}

	calcBuyPrice(price) {
		return Math.floor(price * this.priceMultiplier)
	}

	xyToIndex(xy) {
		return xy.y * this.maxLine + xy.x
	}
}
