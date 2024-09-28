import { Token } from './Token'
import { Position } from './Position'
import { ExpectedCharError, IllegalCharError } from './Errors'
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
	TT_EQ,
	LETTERS,
	ALPHANUM,
	KEYWORDS,
	TT_KEYWORD,
	TT_IDENTIFIER,
	TT_STRING,
	TT_ARROW,
	TT_NE,
	TT_EE,
	TT_GT,
	TT_GTE,
	TT_NEWLINE,
	TT_LSQUARE,
	TT_RSQUARE,
	TT_LT,
	TT_LTE,
	TT_COMMA,
} from './Constants'

export class Lexer {
	fileName: string
	text: string
	pos: Position
	currentChar: string | null
	constructor(fileName: string, text: string) {
		this.fileName = fileName
		this.text = text
		this.pos = new Position(-1, 0, -1, fileName, text)
		this.currentChar = null
		this.advance()
	}
	advance() {
		this.pos.advance(this.currentChar)
		this.currentChar =
			this.pos.idx < this.text.length ? this.text[this.pos.idx] : null
	}
	makeTokens() {
		const tokens: Token[] = []

		while (this.currentChar !== null) {
			if (this.currentChar === ' ' || this.currentChar === '\t') {
				this.advance()
			} else if (this.currentChar === '#') {
				this.makeComment()
			} else if (this.currentChar === ';' || this.currentChar === '\n') {
				tokens.push(new Token(TT_NEWLINE, null, this.pos))
				this.advance()
			} else if (DIGITS.includes(this.currentChar)) {
				tokens.push(this.makeNumber())
			} else if (LETTERS.includes(this.currentChar)) {
				tokens.push(this.makeIdentifier())
			} else if (this.currentChar === '"') {
				tokens.push(this.makeString())
			} else if (this.currentChar === '+') {
				tokens.push(new Token(TT_PLUS, null, this.pos))
				this.advance()
			} else if (this.currentChar === '-') {
				tokens.push(this.makeMinusOrArrow())
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
			} else if (this.currentChar === '[') {
				tokens.push(new Token(TT_LSQUARE, null, this.pos))
				this.advance()
			} else if (this.currentChar === ']') {
				tokens.push(new Token(TT_RSQUARE, null, this.pos))
				this.advance()
			} else if (this.currentChar === '!') {
				const [token, error] = this.makeNotEqual()
				if (error) return [[], error]
				tokens.push(token as Token)
			} else if (this.currentChar === '=') {
				tokens.push(this.makeEquals())
			} else if (this.currentChar === '<') {
				tokens.push(this.makeLesserThan())
			} else if (this.currentChar === '>') {
				tokens.push(this.makeGreaterThan())
			} else if (this.currentChar === ',') {
				tokens.push(new Token(TT_COMMA, null, this.pos))
				this.advance()
			} else {
				const posStart = this.pos.copy()
				const char = this.currentChar
				this.advance()
				return [
					[],
					new IllegalCharError(posStart, this.pos, `'${char}'`),
				]
			}
		}
		tokens.push(new Token(TT_EOF, null, this.pos))
		return [tokens, null]
	}
	makeNumber() {
		let numStrRes = ''
		let dotCount = 0
		const posStart = this.pos.copy()
		while (
			this.currentChar !== null &&
			(DIGITS + '.').includes(this.currentChar)
		) {
			if (this.currentChar === '.') {
				if (dotCount === 1) {
					break
				}
				dotCount++
				// numStrRes += '.'
			}
			numStrRes += this.currentChar

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

	makeString() {
		let string = ''
		let posStart = this.pos.copy()
		let escChar = false
		this.advance()

		let escChars = {
			n: '\n',
			t: '\t',
		}

		while (
			this.currentChar !== null &&
			(this.currentChar !== `"` || escChar)
		) {
			if (escChar) {
				string += escChars.hasOwnProperty(this.currentChar)
					? escChars[this.currentChar as 'n' | 't']
					: this.currentChar
			} else {
				if (this.currentChar === '\\') {
					escChar = true
				} else {
					string += this.currentChar
				}
			}
			this.advance()
			escChar = false
		}
		this.advance()
		return new Token(TT_STRING, string, posStart, this.pos)
	}

	makeIdentifier() {
		let idStr = ''
		let posStart = this.pos.copy()

		while (
			this.currentChar !== null &&
			`${ALPHANUM}_`.includes(this.currentChar)
		) {
			idStr += this.currentChar
			this.advance()
		}

		let tokenType = KEYWORDS.includes(idStr) ? TT_KEYWORD : TT_IDENTIFIER
		return new Token(tokenType, idStr, posStart, this.pos)
	}

	makeMinusOrArrow() {
		let tokenType = TT_MINUS
		let posStart = this.pos.copy()
		this.advance()

		if (this.currentChar === '>') {
			this.advance()
			tokenType = TT_ARROW
		}
		return new Token(tokenType, null, posStart, this.pos)
	}

	makeEquals() {
		let tokenType = TT_EQ
		let posStart = this.pos.copy()
		this.advance()

		if (this.currentChar === '=') {
			this.advance()
			tokenType = TT_EE
		}
		return new Token(tokenType, null, posStart, this.pos)
	}

	makeNotEqual() {
		let posStart = this.pos.copy()
		this.advance()

		if (this.currentChar === '=') {
			this.advance()
			return [new Token(TT_NE, null, posStart, this.pos), null]
		}

		this.advance()
		return [
			null,
			new ExpectedCharError(posStart, this.pos, "'=' (after '!')"),
		]
	}

	makeLesserThan() {
		let tokenType = TT_LT
		let posStart = this.pos.copy()
		this.advance()

		if (this.currentChar === '=') {
			this.advance()
			tokenType = TT_LTE
		}
		return new Token(tokenType, null, posStart, this.pos)
	}

	makeGreaterThan() {
		let tokenType = TT_GT
		let posStart = this.pos.copy()
		this.advance()

		if (this.currentChar === '=') {
			this.advance()
			tokenType = TT_GTE
		}
		return new Token(tokenType, null, posStart, this.pos)
	}

	makeComment() {
		this.advance()

		while (this.currentChar !== '\n') {
			this.advance()
		}

		this.advance()
	}
}
