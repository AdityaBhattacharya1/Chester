import { Position } from './Position'

export class LangError {
	posStart: Position | null
	posEnd: Position | null
	errorName: string
	details: string
	constructor(
		posStart: Position | null,
		posEnd: Position | null,
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
		result += `File ${this.posStart?.fileName}, line ${
			this.posStart && this.posStart.line + 1
		}`
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

export class ExpectedCharError extends LangError {
	constructor(posStart: Position, posEnd: Position, details: string) {
		super(posStart, posEnd, 'Expected Character', details)
	}
}

export class RunTimeError extends LangError {
	context: any
	constructor(
		posStart: Position | null,
		posEnd: Position | null,
		details: string,
		context: any
	) {
		super(posStart, posEnd, 'Runtime Error', details)
		this.context = context
	}

	asString() {
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
				`\nat ${pos && pos.fileName}, line ${(
					(pos as Position).line + 1
				).toString()}\nat ${context.displayName}` + result
			pos = context.parentEntryPosition
			context = context.parent
		}
		return `Error: Something went wrong\n${result}`
	}
}
