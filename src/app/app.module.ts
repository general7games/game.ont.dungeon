import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';
import { LoggerModule, NgxLoggerLevel, NGXLogger } from 'ngx-logger'
import axios from 'axios'
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { MatToolbarModule, MatCardModule, MatButtonToggleModule, MatIconModule, MatButtonModule } from '@angular/material';

import { AppComponent } from './app.component';
import { MapComponent } from './map/map.component';
import { environment } from '../environments/environment';
import { ToolbarComponent } from './toolbar/toolbar.component';
import { MapColorPickerComponent } from './map-color-picker/map-color-picker.component';

@NgModule({
	declarations: [
		AppComponent,
		MapComponent,
		ToolbarComponent,
		MapColorPickerComponent,
	],
	imports: [
		BrowserModule,
		BrowserAnimationsModule,
		MatToolbarModule,
		MatCardModule,
		MatButtonToggleModule,
		MatIconModule,
		MatButtonModule,
		LoggerModule.forRoot({
			level: environment.logLevel.root.level,
			serverLogLevel: environment.logLevel.root.serverLogLevel
		})
	],
	providers: [NGXLogger],
	bootstrap: [AppComponent]
})
export class AppModule {

	constructor(private logger: NGXLogger) {
		axios.interceptors.request.use((request) => {
			this.logger.info(`[axios] ${request.method.toUpperCase()} ${request.url}`)
			return request
		})
		axios.interceptors.response.use((response) => {
			//this.logger.info(`[axios] response ${response.status} payload: ${JSON.stringify(response.data)}`)
			return response
		})
	}
}
