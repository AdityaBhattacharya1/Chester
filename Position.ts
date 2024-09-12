export class Position {
	idx: number
	line: number
	col: number
	func: string
	filetxt: string

	constructor(
		idx: number,
		line: number,
		col: number,
		func: string,
		filetxt: string
	) {
		this.idx = idx
		this.line = line
		this.col = col
		this.func = func
		this.filetxt = filetxt
	}

	advance(currentChar: string | null = null) {
		this.idx += 1
		this.col += 1
		if (currentChar === '\n') {
			this.line += 1
			this.col = 0
		}
		return this
	}

	copy() {
		return new Position(
			this.idx,
			this.line,
			this.col,
			this.func,
			this.filetxt
		)
	}
}
