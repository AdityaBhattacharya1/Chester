import { Token } from './Token'
import { Position } from './Position'
import { IllegalCharError } from './LangError'
import {
	DIGITS,
	TT_PLUS,
	TT_MINUS,
	TT_MUL,
	TT_DIV,
	TT_LPAREN,
	TT_RPAREN,
	TT_EOF,
	TT_INT,
	TT_FLOAT,
	TT_POW,
} from './Constants'

export class Lexer {
	func: string
	text: string
	pos: Position
	currentChar: string | null
	constructor(func: string, text: string) {
		this.func = func
		this.text = text
		this.pos = new Position(-1, 0, -1, func, text)
		this.currentChar = null
		this.advance()
	}
	advance() {
		this.pos.advance(this.currentChar)
		this.currentChar = this.text[this.pos.idx] ?? null
	}
	make_tokens() {
		const tokens: Token[] = []
		while (this.currentChar !== null) {
			if (this.currentChar === ' ' || this.currentChar === '\t') {
				this.advance()
			} else if (DIGITS.includes(this.currentChar)) {
				tokens.push(this.make_number())
			} else if (this.currentChar === '+') {
				tokens.push(new Token(TT_PLUS, null, this.pos))
				this.advance()
			} else if (this.currentChar === '-') {
				tokens.push(new Token(TT_MINUS, null, this.pos))
				this.advance()
			} else if (this.currentChar === '*') {
				tokens.push(new Token(TT_MUL, null, this.pos))
				this.advance()
			} else if (this.currentChar === '/') {
				tokens.push(new Token(TT_DIV, null, this.pos))
				this.advance()
			} else if (this.currentChar === '^') {
				tokens.push(new Token(TT_POW, null, this.pos))
				this.advance()
			} else if (this.currentChar === '(') {
				tokens.push(new Token(TT_LPAREN, null, this.pos))
				this.advance()
			} else if (this.currentChar === ')') {
				tokens.push(new Token(TT_RPAREN, null, this.pos))
				this.advance()
			} else {
				const posStart = this.pos.copy()
				const char = this.currentChar
				this.advance()
				return [
					[],
					new IllegalCharError(posStart, this.pos, "'" + char + "'"),
				]
			}
		}
		tokens.push(new Token(TT_EOF, null, this.pos))
		return [tokens, null]
	}
	make_number() {
		let numStrRes = ''
		let dotCount = 0
		const posStart = this.pos.copy()
		while (this.currentChar !== null && DIGITS.includes(this.currentChar)) {
			if (this.currentChar === '.') {
				if (dotCount === 1) {
					break
				}
				dotCount += 1
				numStrRes += '.'
			} else {
				numStrRes += this.currentChar
			}
			this.advance()
		}
		if (dotCount === 0) {
			return new Token(TT_INT, parseInt(numStrRes), posStart, this.pos)
		} else {
			return new Token(
				TT_FLOAT,
				parseFloat(numStrRes),
				posStart,
				this.pos
			)
		}
	}
}
