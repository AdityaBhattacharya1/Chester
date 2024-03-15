import { Position } from './Position'

export class LangError {
	posStart: Position
	posEnd: Position
	errorName: string
	details: string
	constructor(
		posStart: Position,
		posEnd: Position,
		errorName: string,
		details: string
	) {
		this.posStart = posStart
		this.posEnd = posEnd
		this.errorName = errorName
		this.details = details
	}

	asString() {
		let result = `${this.errorName}: ${this.details}\n`
		result += `File ${this.posStart.func}, line ${this.posStart.line + 1}`
		return result
	}
}

export class IllegalCharError extends LangError {
	constructor(posStart: Position, posEnd: Position, details: string) {
		super(posStart, posEnd, 'Illegal Character', details)
	}
}
export class InvalidSyntaxError extends LangError {
	constructor(posStart: Position, posEnd: Position, details: string = '') {
		super(posStart, posEnd, 'Invalid Syntax', details)
	}
}

export class RunTimeError extends LangError {
	context: any
	constructor(
		posStart: Position,
		posEnd: Position,
		details: string,
		context: any
	) {
		super(posStart, posEnd, 'Runtime Error', details)
		this.context = context
	}

	asString(): string {
		let result = this.generateStackTrace()
		result += `${this.errorName}: ${this.details}`
		return result
	}

	generateStackTrace() {
		let result = ''
		let pos = this.posStart
		let context = this.context

		while (context) {
			result =
				`\nat ${pos.func}, line ${(pos.line + 1).toString()}\nat ${
					context.displayName
				}` + result
			pos = context.parentEntryPosition
			context = context.parent
		}
		return `Error: Something went wrong\n${result}`
	}
}
