import { Position } from './Position'

export class Token {
	type: string
	value: any | null
	posStart: Position
	posEnd: Position

	constructor(
		_type: string,
		value: any | null = null,
		posStart: Position | null = null,
		posEnd: Position | null = null
	) {
		this.type = _type
		this.value = value
		if (posStart) {
			this.posStart = posStart.copy()
			this.posEnd = posStart.copy()
			this.posEnd.advance()
		}
		if (posEnd) {
			this.posEnd = posEnd.copy()
		}
	}

	matches(_type: string, value: any | null) {
		return this.type === _type && this.value === value
	}

	asString() {
		if (this.value) {
			return `${this.type}:${this.value}`
		}
		return `${this.type}`
	}
}
