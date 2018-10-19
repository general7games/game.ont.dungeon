import { Component, OnInit, ViewChild, ViewContainerRef,  } from '@angular/core';

@Component({
	selector: 'app-map',
	templateUrl: './map.component.html',
	styleUrls: ['./map.component.css']
})
export class MapComponent implements OnInit {

	context: CanvasRenderingContext2D

	constructor() { }

	ngOnInit() {
	}

	ngAfterViewInit() {
		const mapCanvasContainer = document.getElementById('mapCanvasContainer')
		const canvas = document.createElement('canvas')
		this.context = canvas.getContext('2d')
		canvas.width = mapCanvasContainer.clientWidth
		canvas.height = mapCanvasContainer.clientHeight
		mapCanvasContainer.appendChild(canvas)
	}
}
