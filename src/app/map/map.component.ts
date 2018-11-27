import { Component, OnInit, ViewChild, ViewContainerRef,  } from '@angular/core';
import { NGXLogger } from 'ngx-logger';
import { MapService } from '../map.service'

@Component({
	selector: 'app-map',
	templateUrl: './map.component.html',
	styleUrls: ['./map.component.css'],
	providers: [NGXLogger, MapService]
})
export class MapComponent implements OnInit {

	context: CanvasRenderingContext2D

	constructor(
		private mapService: MapService,
		private logger: NGXLogger
	) { }

	ngOnInit() {
	}

	ngAfterViewInit() {
		const mapCanvasContainer = document.getElementById('mapCanvasContainer')
		const canvas = document.createElement('canvas')
		this.context = canvas.getContext('2d')
		canvas.width = mapCanvasContainer.clientWidth
		canvas.height = mapCanvasContainer.clientHeight
		mapCanvasContainer.appendChild(canvas)

		this.fillImageData()
		canvas.addEventListener('mousemove', (ev: MouseEvent) => {
			return this.onMouseMove(ev)
		})
	}

	fillImageData() {
		this.mapService.getAllPoints().subscribe((allPoints) => {
			let art = new Array<string>(allPoints.maxLine)
			let palette = {}
			let colorToChar = {}
			let nextChar = 'A'
			for (let y = 1; y <= allPoints.maxLine; ++y) {
				let artLine = ''
				for (let x = 1; x <= allPoints.maxLine; ++x) {
					let point = allPoints.points[(y - 1) * allPoints.maxLine + x - 1]
					let ch
					if (!(point.color in colorToChar)) {
						ch = nextChar
						colorToChar[point.color] = ch
						nextChar = String.fromCharCode(ch.charCodeAt(0) + 1)
						palette[ch] = '#' + ('00000' + point.color.toString(16)).slice(-6)
					}
					artLine += colorToChar[point.color]
				}
				art[y - 1] = artLine
			}

			var pixel = require('pixel-art');
			pixel.art(art)
				.palette(palette)
				.pos({ x: 0, y: 0 })
				.scale(6)
				.draw(this.context);
			this.logger.info('Pixel art is finished.')
		})
	}

	onMouseMove(ev: MouseEvent) {
		//console.log(ev.offsetX, ev.offsetY)
	}
}
