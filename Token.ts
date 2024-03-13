import { Position } from './Position'

export class Token {
	type: string
	value: number | null
	posStart: Position
	posEnd: Position
	constructor(
		_type: string,
		value: number | null = null,
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
			this.posEnd = posEnd
		}
	}
}
