export class Position {
	idx: number
	line: number
	col: number
	fileName: string
	fileTxt: string

	constructor(
		idx: number,
		line: number,
		col: number,
		fileName: string,
		fileTxt: string
	) {
		this.idx = idx
		this.line = line
		this.col = col
		this.fileName = fileName
		this.fileTxt = fileTxt
	}

	advance(currentChar: string | null = null) {
		this.idx++
		this.col++
		if (currentChar === '\n') {
			this.line++
			this.col = 0
		}
		return this
	}

	copy() {
		return new Position(
			this.idx,
			this.line,
			this.col,
			this.fileName,
			this.fileTxt
		)
	}
}
