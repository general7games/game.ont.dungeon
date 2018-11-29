import { environment } from '../environments/environment'

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