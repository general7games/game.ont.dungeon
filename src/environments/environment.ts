import { NgxLoggerLevel } from 'ngx-logger'

export const environment = {
  production: false,
  logLevel: {
		root: {
			level: NgxLoggerLevel.DEBUG,
			serverLogLevel: NgxLoggerLevel.INFO
		}
	},
  backend: {
    root: 'http://127.0.0.1:3000',
    contract: {
      getAllPoints: '/contract/getAllPoints'
    }
  }
};
