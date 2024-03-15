import { Context } from './Context'
import { RunTimeError } from './Errors'
import { Position } from './Position'

export class Number {
	value: any
	posStart: Position | null
	posEnd: Position | null
	context: Context | null

	constructor(value: any) {
		this.value = value
		this.setPosition()
		this.setContext()
	}

	public setPosition(
		posStart: Position | null = null,
		posEnd: Position | null = null
	) {
		this.posStart = posStart
		this.posEnd = posEnd
		return this
	}
	public setContext(context: Context | null = null) {
		this.context = context
		return this
	}

	addition(otherNum: any) {
		if (otherNum instanceof Number)
			return [
				new Number(this.value + otherNum.value).setContext(
					this.context
				),
				null,
			]
	}

	subtraction(otherNum: any) {
		if (otherNum instanceof Number)
			return [
				new Number(this.value - otherNum.value).setContext(
					this.context
				),
				null,
			]
	}
	multiplication(otherNum: any) {
		if (otherNum instanceof Number)
			return [
				new Number(this.value * otherNum.value).setContext(
					this.context
				),
				null,
			]
	}
	division(otherNum: any) {
		if (otherNum instanceof Number) {
			if (otherNum.value === 0)
				return [
					null,
					new RunTimeError(
						otherNum.posStart as Position,
						otherNum.posEnd as Position,
						'Division by zero',
						this.context
					),
				]
			return [
				new Number(this.value / otherNum.value).setContext(
					this.context
				),
				null,
			]
		}
	}
	exponent(otherNum: any) {
		if (otherNum instanceof Number)
			return [
				new Number(this.value ** otherNum.value).setContext(
					this.context
				),
				null,
			]
	}

	copy() {
		const copy = new Number(this.value)
		copy.setPosition(this.posStart, this.posEnd)
		copy.setContext(this.context)
		return copy
	}
}
