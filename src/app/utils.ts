import * as base58 from 'bs58';
import * as cryptoJS from 'crypto-js';
import { environment } from '../environments/environment'
const Buffer = require('safe-buffer').Buffer

export function getURL(path: string): string {
	return environment.backend.root + path
}

export function colorIntToHex(color: number): string {
	return '#' + ('00000' + color.toString(16)).slice(-6)
}

export function colorHexToInt(color: string): number {
	return parseInt(color.slice(1), 16)
}

export function replaceAt(str, index, replacement) {
    return str.substr(0, index) + replacement+ str.substr(index + replacement.length);
}

export function base58ToHex(base58Encoded: string) {
	const decoded = base58.decode(base58Encoded);
	const hexEncoded = ab2hexstring(decoded).substr(2, 40);
  
	if (base58Encoded !== hexToBase58(hexEncoded)) {
		throw new Error('[addressToU160] decode encoded verify failed');
	}
	return hexEncoded;
}

function ab2hexstring(arr: any): string {
	let result: string = '';
	const uint8Arr: Uint8Array = new Uint8Array(arr);
	for (let i = 0; i < uint8Arr.byteLength; i++) {
		let str = uint8Arr[i].toString(16);
		str = str.length === 0 ? '00' : str.length === 1 ? '0' + str : str;
		result += str;
	}
	return result;
}

function hexToBase58(hexEncoded: string): string {
	const data = 17 + hexEncoded;

	const hash = sha256(data);
	const hash2 = sha256(hash);
	const checksum = hash2.slice(0, 8);

	const datas = data + checksum;

	return base58.encode(new Buffer(datas, 'hex'))
}

function sha256(data: string) {
	const hex = cryptoJS.enc.Hex.parse(data);
	const sha = cryptoJS.SHA256(hex).toString();
	return sha;
}