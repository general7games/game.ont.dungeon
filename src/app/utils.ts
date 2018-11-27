import { environment } from '../environments/environment'

export function getURL(path: string): string {
	return environment.backend.root + path
}