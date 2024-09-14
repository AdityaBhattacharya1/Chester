import { Context } from './Context'
import { RunTimeError } from './Errors'
import { RunTimeResult } from './Parser'
import { Position } from './Position'

export class Value {
	posStart: Position | null
	posEnd: Position | null
	context: Context | null

	constructor() {
		this.setPos()
		this.setContext()
	}

	setPos(posStart: Position | null = null, posEnd: Position | null = null) {
		this.posStart = posStart
		this.posEnd = posEnd
		return this
	}

	setContext(context: Context | null = null) {
		this.context = context
		return this
	}

	addTo(
		other: Value
	):
		| (RunTimeError | null)[]
		| (NumberValue | StringValue | ListValue | null)[] {
		return [null, this.illegalOperation(other)]
	}

	subBy(
		other: Value
	):
		| (RunTimeError | null)[]
		| (NumberValue | StringValue | ListValue | null)[] {
		return [null, this.illegalOperation(other)]
	}

	multBy(
		other: Value
	):
		| (RunTimeError | null)[]
		| (NumberValue | StringValue | ListValue | null)[] {
		return [null, this.illegalOperation(other)]
	}

	divedBy(
		other: Value
	):
		| (RunTimeError | null)[]
		| (NumberValue | StringValue | ListValue | null)[] {
		return [null, this.illegalOperation(other)]
	}

	powBy(
		other: Value
	):
		| (RunTimeError | null)[]
		| (NumberValue | StringValue | ListValue | null)[] {
		return [null, this.illegalOperation(other)]
	}

	getComparisonEq(
		other: Value
	):
		| (RunTimeError | null)[]
		| (NumberValue | StringValue | ListValue | null)[] {
		return [null, this.illegalOperation(other)]
	}

	getComparisonNe(
		other: Value
	):
		| (RunTimeError | null)[]
		| (NumberValue | StringValue | ListValue | null)[] {
		return [null, this.illegalOperation(other)]
	}

	getComparisonLt(
		other: Value
	):
		| (RunTimeError | null)[]
		| (NumberValue | StringValue | ListValue | null)[] {
		return [null, this.illegalOperation(other)]
	}

	getComparisonGt(
		other: Value
	):
		| (RunTimeError | null)[]
		| (NumberValue | StringValue | ListValue | null)[] {
		return [null, this.illegalOperation(other)]
	}

	getComparisonLte(
		other: Value
	):
		| (RunTimeError | null)[]
		| (NumberValue | StringValue | ListValue | null)[] {
		return [null, this.illegalOperation(other)]
	}

	getComparisonGte(
		other: Value
	):
		| (RunTimeError | null)[]
		| (NumberValue | StringValue | ListValue | null)[] {
		return [null, this.illegalOperation(other)]
	}

	andBy(
		other: Value
	):
		| (RunTimeError | null)[]
		| (NumberValue | StringValue | ListValue | null)[] {
		return [null, this.illegalOperation(other)]
	}

	orBy(
		other: Value
	):
		| (RunTimeError | null)[]
		| (NumberValue | StringValue | ListValue | null)[] {
		return [null, this.illegalOperation(other)]
	}

	notBy():
		| (RunTimeError | null)[]
		| (NumberValue | StringValue | ListValue | null)[] {
		return [null, this.illegalOperation()]
	}

	execute() {
		return new RunTimeResult().failure(this.illegalOperation())
	}

	copy(): Value {
		throw new Error('No copy method defined')
	}

	isTrue(): boolean {
		return false
	}

	illegalOperation(other: Value | null = null): RunTimeError {
		if (!other) {
			other = this
		}
		return new RunTimeError(
			this.posStart as Position,
			other.posEnd as Position,
			'Illegal operation',
			this.context
		)
	}
}

export class NumberValue extends Value {
	value: number

	constructor(value: number) {
		super()
		this.value = value
	}

	addTo(other: Value) {
		if (other instanceof NumberValue) {
			return [
				new NumberValue(this.value + other.value).setContext(
					this.context
				),
				null,
			]
		}
		return [null, this.illegalOperation(other)]
	}

	subBy(other: Value) {
		if (other instanceof NumberValue) {
			return [
				new NumberValue(this.value - other.value).setContext(
					this.context
				),
				null,
			]
		}
		return [null, this.illegalOperation(other)]
	}

	multBy(other: Value) {
		if (other instanceof NumberValue) {
			return [
				new NumberValue(this.value * other.value).setContext(
					this.context
				),
				null,
			]
		}
		return [null, this.illegalOperation(other)]
	}

	divedBy(other: Value) {
		if (other instanceof NumberValue) {
			if (other.value === 0) {
				return [
					null,
					new RunTimeError(
						other.posStart,
						other.posEnd,
						'Division by zero',
						this.context
					),
				]
			}
			return [
				new NumberValue(this.value / other.value).setContext(
					this.context
				),
				null,
			]
		}
		return [null, this.illegalOperation(other)]
	}

	powBy(other: Value) {
		if (other instanceof NumberValue) {
			return [
				new NumberValue(this.value ** other.value).setContext(
					this.context
				),
				null,
			]
		}
		return [null, this.illegalOperation(other)]
	}

	getComparisonEq(other: Value) {
		if (other instanceof NumberValue) {
			return [
				new NumberValue(Number(this.value === other.value)).setContext(
					this.context
				),
				null,
			]
		} else {
			return [null, new Value().illegalOperation(other)]
		}
	}

	getComparisonNe(other: Value) {
		if (other instanceof NumberValue) {
			return [
				new NumberValue(Number(this.value !== other.value)).setContext(
					this.context
				),
				null,
			]
		} else {
			return [null, new Value().illegalOperation(other)]
		}
	}

	getComparisonLt(other: Value) {
		if (other instanceof NumberValue) {
			return [
				new NumberValue(Number(this.value < other.value)).setContext(
					this.context
				),
				null,
			]
		} else {
			return [null, new Value().illegalOperation(other)]
		}
	}

	getComparisonGt(other: Value) {
		if (other instanceof NumberValue) {
			return [
				new NumberValue(Number(this.value > other.value)).setContext(
					this.context
				),
				null,
			]
		} else {
			return [null, new Value().illegalOperation(other)]
		}
	}

	getComparisonLte(other: Value) {
		if (other instanceof NumberValue) {
			return [
				new NumberValue(Number(this.value <= other.value)).setContext(
					this.context
				),
				null,
			]
		} else {
			return [null, new Value().illegalOperation(other)]
		}
	}

	getComparisonGte(other: Value) {
		if (other instanceof NumberValue) {
			return [
				new NumberValue(Number(this.value >= other.value)).setContext(
					this.context
				),
				null,
			]
		} else {
			return [null, new Value().illegalOperation(other)]
		}
	}

	andBy(other: Value) {
		if (other instanceof NumberValue) {
			return [
				new NumberValue(Number(this.value && other.value)).setContext(
					this.context
				),
				null,
			]
		} else {
			return [null, new Value().illegalOperation(other)]
		}
	}

	orBy(other: Value) {
		if (other instanceof NumberValue) {
			return [
				new NumberValue(Number(this.value || other.value)).setContext(
					this.context
				),
				null,
			]
		} else {
			return [null, new Value().illegalOperation(other)]
		}
	}

	notBy() {
		return [
			new NumberValue(this.value === 0 ? 1 : 0).setContext(this.context),
			null,
		]
	}

	copy(): NumberValue {
		const copy = new NumberValue(this.value)
		copy.setPos(this.posStart, this.posEnd)
		copy.setContext(this.context)
		return copy
	}

	isTrue(): boolean {
		return this.value !== 0
	}

	asString(): string {
		return `${this.value}`
	}
}

export class StringValue extends Value {
	value: any

	constructor(value: any) {
		super()
		this.value = value
	}

	addTo(other: Value) {
		if (other instanceof StringValue) {
			return [
				new StringValue(this.value + other.value).setContext(
					this.context
				),
				null,
			]
		} else {
			return [null, new Value().illegalOperation(other)]
		}
	}

	multBy(other: Value) {
		if (other instanceof StringValue) {
			return [
				new StringValue(this.value * other.value).setContext(
					this.context
				),
				null,
			]
		} else {
			return [null, new Value().illegalOperation(other)]
		}
	}

	isTrue(): boolean {
		return this.value.length > 0
	}

	copy() {
		const copy = new StringValue(this.value)
		copy.setPos(this.posStart, this.posEnd)
		copy.setContext(this.context)
		return copy
	}

	asString() {
		return `${this.value}`
	}
}

export class ListValue extends Value {
	elements: any[]

	constructor(elements: any) {
		super()
		this.elements = elements
	}

	addTo(other: Value) {
		const newList = this.copy()
		newList.elements.push(other)
		return [newList, null]
	}

	subBy(other: Value) {
		if (other instanceof NumberValue) {
			const newList = this.copy()
			try {
				newList.elements.push(other.value)
				return [newList, null]
			} catch (error) {
				return [
					null,
					new RunTimeError(
						other.posStart,
						other.posEnd,
						'Index out of bounds error',
						this.context
					),
				]
			}
		} else {
			return [null, new Value().illegalOperation(other)]
		}
	}

	multBy(other: Value) {
		if (other instanceof ListValue) {
			const newList = this.copy()
			newList.elements.concat(other.elements)
			return [newList, null]
		} else {
			return [null, new Value().illegalOperation(other)]
		}
	}

	divedBy(other: Value) {
		if (other instanceof NumberValue) {
			try {
				return [this.elements[other.value], null]
			} catch (error) {
				return [
					null,
					new RunTimeError(
						other.posStart,
						other.posEnd,
						'Index out of bounds error',
						this.context
					),
				]
			}
		} else {
			return [null, new Value().illegalOperation(other)]
		}
	}

	copy(): ListValue {
		const copy = new ListValue(this.elements)
		copy.setPos(this.posStart, this.posEnd)
		copy.setContext(this.context)
		return copy
	}

	asString() {
		return `[${this.elements.map((x: any) => String(x)).join(', ')}]`
	}
}
