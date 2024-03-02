const TT_INT = 'TT_INT'
const TT_FLOAT = 'FLOAT'
const TT_PLUS = 'PLUS'
const TT_MINUS = 'MINUS'
const TT_MUL = 'MUL'
const TT_DIV = 'DIV'
const TT_LPAREN = 'LPAREN'
const TT_RPAREN = 'RPAREN'

const DIGITS = '0123456789.'

class LangError {
	pos_start: Position
	pos_end: Position
	error_name: string
	details: string

	constructor(
		pos_start: Position,
		pos_end: Position,
		error_name: string,
		details: string
	) {
		this.pos_start = pos_start
		this.pos_end = pos_end
		this.error_name = error_name
		this.details = details
	}

	asString() {
		return `${this.error_name}: ${this.details}\nFile ${
			this.pos_start.filename
		}, line ${this.pos_start.line + 1}`
	}
}

export class IllegalCharError extends LangError {
	constructor(pos_start: Position, pos_end: Position, details: string) {
		super(pos_start, pos_end, 'Illegal Character', details)
	}
}

class Position {
	idx: number
	line: number
	col: number
	filename: string
	filetxt: string

	constructor(
		idx: number,
		line: number,
		col: number,
		filename: string,
		filetxt: string
	) {
		this.idx = idx
		this.line = line
		this.col = col
		this.filename = filename
		this.filetxt = filetxt
	}

	advance(current_char: string | null) {
		this.idx++
		this.col++

		if (current_char === '\n') {
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
			this.filename,
			this.filetxt
		)
	}
}

class Token {
	type: string
	value: any | null

	constructor(_type: string, value: any | null = null) {
		this.type = _type
		this.value = value
	}

	print() {
		return this.value ? `${this.type}:${this.value}` : `${this.type}`
	}
}

class Lexer {
	filename: string
	text: string
	pos: Position
	current_char: null | string

	constructor(text: string, filename: string) {
		this.text = text
		this.filename = filename
		this.pos = new Position(-1, 0, -1, filename, text)
		this.current_char = null
		this.advance()
	}

	advance() {
		this.pos.advance(this.current_char)
		this.current_char =
			this.pos.idx < this.text.length ? this.text[this.pos.idx] : null
	}

	makeTokens(): [Token[], IllegalCharError | null] {
		const tokens = []
		while (this.current_char != null) {
			if (this.current_char == ' ' || this.current_char == '\t') {
				this.advance()
			} else if (DIGITS.indexOf(this.current_char) !== -1) {
				console.log('here')
				tokens.push(this.makeNum())
			} else if (this.current_char === '+') {
				tokens.push(new Token(TT_PLUS))
				this.advance()
			} else if (this.current_char === '-') {
				tokens.push(new Token(TT_MINUS))
				this.advance()
			} else if (this.current_char === '*') {
				tokens.push(new Token(TT_MUL))
				this.advance()
			} else if (this.current_char === '/') {
				tokens.push(new Token(TT_DIV))
				this.advance()
			} else if (this.current_char === '(') {
				tokens.push(new Token(TT_LPAREN))
				this.advance()
			} else if (this.current_char === ')') {
				tokens.push(new Token(TT_RPAREN))
				this.advance()
			} else {
				let pos_start = this.pos.copy()
				let char = this.current_char
				this.advance()
				return [
					[],
					new IllegalCharError(pos_start, this.pos, `"${char}"`),
				]
			}
		}

		return [tokens, null]
	}

	makeNum() {
		let numStr = ''
		let dotCount = 0

		while (
			this.current_char != null &&
			DIGITS.indexOf(this.current_char) !== -1
		) {
			if (this.current_char === '.') {
				if (dotCount == 1) {
					break
				}
				dotCount += 1
				numStr += '.'
			} else {
				numStr += this.current_char
			}
			this.advance()
		}

		return dotCount == 0
			? new Token(TT_INT, parseInt(numStr))
			: new Token(TT_FLOAT, parseFloat(numStr))
	}
}

export const run = (
	filename: string,
	text: string
): [Token[], IllegalCharError | null] => {
	const lexer = new Lexer(text, filename)
	let [result, error] = lexer.makeTokens()
	return [result, error]
}
