import { environment } from '../environments/environment'

export function getURL(path: string): string {
	return environment.backend.root + path
}

export function colorIntToHex(color: number): string {
	return '#' + ('00000' + color.toString(16)).slice(-6)
}