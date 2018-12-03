import { Injectable } from '@angular/core';
import { NGXLogger } from 'ngx-logger';
import { client } from 'ontology-dapi';
import * as utils from './utils'

@Injectable({
  	providedIn: 'root'
})
export class DapiService {

	isReady = false

  	constructor(
		private logger: NGXLogger
	) { 
		this.init()
	}

	async init() {
		this.logger.info('Initializing dapi service.')
		client.registerClient({});
		const network = await client.api.network.getNetwork();
		this.logger.debug('ONT network ' + network.type + ' - ' + network.address)
		this.isReady = true
	}

	async buyPoints(xPoints: Array<number>, yPoints: Array<number>, colors: Array<number>, prices: Array<number>) {
		try {
			const account = await client.api.asset.getAccount()
			const accountHex = utils.base58ToHex(account)
			this.logger.info('Account ' + account + '(' + accountHex + ') capture ' + xPoints.length + ' points.')

			const r = await client.api.smartContract.invoke({
				scriptHash: 'a6e480ec31348c1bd2adc27b4d0d4e9001815213', 
				operation: 'Capture',
				args: [{
					type: 'ByteArray',
					value: accountHex
				}, {
					type: 'Array',
					value: this.intArrayToContractArray(xPoints)
				}, {
					type: 'Array',
					value: this.intArrayToContractArray(yPoints)
				}, {
					type: 'Array',
					value: this.intArrayToContractArray(colors)
				}, {
					type: 'Array',
					value: this.intArrayToContractArray(prices)
				}],
				gasPrice: 0, 
				gasLimit: 20000000
			})
			this.logger.info('buyPoints invoke result ' + JSON.stringify(r))
			if (r.result[0].length == 2 && parseInt(r.result[0][0]) == 0 && r.result[0][1] == '4f4b' /* OK */) {
				return true
			} else {
				return false
			}
		} catch (e) {
			this.logger.error('buyPoints error, ' + e)
			this.logger.error(e)
			return false
		}
	}

	intArrayToContractArray(array) {
		let newArray = new Array(array.length)
		for (let i = 0; i < array.length; ++i) {
			newArray[i] = {
				type: 'Integer',
				value: array[i]
			}
		}
		return newArray
	}
}
