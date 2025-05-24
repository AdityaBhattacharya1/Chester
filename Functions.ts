import { run } from '.'
import { Context } from './Context'
import { RunTimeError } from './Errors'
import { Interpreter } from './Interpreter'
import { RunTimeResult } from './Parser'
import { SymbolTable } from './SymbolTable'
import { ListValue, NumberValue, StringValue, Value } from './Values'
const { stringify } = require('flatted')

import * as fs from 'fs'
const prompt = require('prompt-sync')()

class BaseFunction extends Value {
	name: string

	constructor(name?: string) {
		super()
		this.name = name || '<anonymous>'
	}

	generateNewContext(): Context {
		const newContext = new Context(this.name, this.context, this.posStart)
		newContext.symbolTable = new SymbolTable(newContext.parent?.symbolTable)
		return newContext
	}

	checkArgs(argNames: string[], args: Value[]) {
		const res = new RunTimeResult()

		if (args.length > argNames.length) {
			return res.failure(
				new RunTimeError(
					this.posStart,
					this.posEnd,
					`${
						args.length - argNames.length
					} too many args passed into ${this}`,
					this.context
				)
			)
		}

		if (args.length < argNames.length) {
			return res.failure(
				new RunTimeError(
					this.posStart,
					this.posEnd,
					`${
						argNames.length - args.length
					} too few args passed into ${this}`,
					this.context
				)
			)
		}

		return res.success(null)
	}

	populateArgs(argNames: string[], args: Value[], execCtx: Context): void {
		for (let i = 0; i < args.length; i++) {
			const argName = argNames[i]
			const argValue = args[i] || NumberValue.null
			if (!argValue) {
				console.log(`Error: Argument ${argName} is null or undefined`) // Debug log
			}
			argValue.setContext(execCtx)
			execCtx.symbolTable?.set(argName, argValue)
		}
	}

	checkAndPopulateArgs(
		argNames: string[],
		args: Value[],
		execCtx: Context
	): RunTimeResult {
		const res = new RunTimeResult()
		res.register(this.checkArgs(argNames, args))
		if (res.shouldReturn()) return res
		this.populateArgs(argNames, args, execCtx)
		return res.success(null)
	}
}

export class FunctionValue extends BaseFunction {
	bodyNode: any
	argNames: string[]
	shouldAutoReturn: boolean

	constructor(
		name: string,
		bodyNode: any,
		argNames: string[],
		shouldAutoReturn: boolean
	) {
		super(name)
		this.bodyNode = bodyNode
		this.argNames = argNames
		this.shouldAutoReturn = shouldAutoReturn
	}

	execute(args: Value[]): RunTimeResult {
		const res = new RunTimeResult()
		const interpreter = new Interpreter()
		const execCtx = this.generateNewContext()

		res.register(this.checkAndPopulateArgs(this.argNames, args, execCtx))
		if (res.shouldReturn()) return res

		const value = res.register(interpreter.visit(this.bodyNode, execCtx))
		if (res.shouldReturn() && res.functionReturnValue === null) return res

		const retValue =
			(this.shouldAutoReturn ? value : null) ||
			res.functionReturnValue ||
			NumberValue.null
		return res.success(retValue)
	}

	copy(): FunctionValue {
		const copy = new FunctionValue(
			this.name,
			this.bodyNode,
			this.argNames,
			this.shouldAutoReturn
		)
		copy.setContext(this.context)
		copy.setPos(this.posStart, this.posEnd)
		return copy
	}

	asString() {
		return `<function ${this.name}>`
	}
}

export class BuiltInFunction extends BaseFunction {
	static argNames: { [key: string]: string[] } = {}
	static print = new BuiltInFunction('print')
	static printReturn = new BuiltInFunction('print_ret')
	static input = new BuiltInFunction('input')
	static inputInt = new BuiltInFunction('input_int')
	static clear = new BuiltInFunction('clear')
	static isNumber = new BuiltInFunction('is_number')
	static isString = new BuiltInFunction('is_string')
	static isList = new BuiltInFunction('is_list')
	static isFunction = new BuiltInFunction('is_function')
	static append = new BuiltInFunction('append')
	static pop = new BuiltInFunction('pop')
	static concat = new BuiltInFunction('extend')
	static length = new BuiltInFunction('len')
	static run = new BuiltInFunction('run')

	constructor(name: string) {
		super(name)
	}

	public execute(args: any[]): RunTimeResult {
		const res = new RunTimeResult()
		const execCtx = this.generateNewContext()

		const methodName = `execute${this.name}`
		const method = (this as any)[methodName] || this.noVisitMethod

		res.register(
			this.checkAndPopulateArgs(
				BuiltInFunction.argNames[this.name] || [],
				args,
				execCtx
			)
		)
		if (res.shouldReturn()) return res

		const returnValue = res.register(method.call(this, execCtx, args))
		if (res.shouldReturn()) return res
		return res.success(returnValue)
	}

	private noVisitMethod(node: any, context: any) {
		throw new Error(`No execute${this.name} method defined`)
	}

	public copy(): BuiltInFunction {
		const copy = new BuiltInFunction(this.name)
		copy.setContext(this.context)
		copy.setPos(this.posStart, this.posEnd)
		return copy
	}

	public toString(): string {
		return `<built-in function ${this.name}>`
	}

	public executePrint(execCtx: Context): RunTimeResult {
		const value = execCtx.symbolTable?.get('value')
		console.log(value.asString())

		return new RunTimeResult().success('')
	}
	public static executePrintArgNames: string[] = ['value']

	public executePrintRet(execCtx: Context): RunTimeResult {
		return new RunTimeResult().success(
			new StringValue(String(execCtx.symbolTable?.get('value')))
		)
	}
	public static executePrintRetArgNames: string[] = ['value']

	public executeInput(execCtx: Context): RunTimeResult {
		const text = prompt('')
		return new RunTimeResult().success(new StringValue(text))
	}
	public static executeInputArgNames: string[] = []

	public executeInputInt(execCtx: Context): RunTimeResult {
		let number: number | undefined
		while (true) {
			const text = prompt('')
			try {
				number = parseInt(text)
				break
			} catch (error) {
				console.log(`'${text}' must be an integer. Try again!`)
			}
		}
		return new RunTimeResult().success(new NumberValue(number))
	}
	public static executeInputIntArgNames: string[] = []

	public executeClear(execCtx: Context): RunTimeResult {
		console.clear()
		return new RunTimeResult().success(NumberValue.null)
	}
	public static executeClearArgNames: string[] = []

	public executeIsNumber(execCtx: Context): RunTimeResult {
		const isNumber =
			execCtx.symbolTable?.get('value') instanceof NumberValue
		return new RunTimeResult().success(
			isNumber ? NumberValue.true : NumberValue.false
		)
	}
	public static executeIsNumberArgNames: string[] = ['value']

	public executeIsString(execCtx: Context): RunTimeResult {
		const isString =
			execCtx.symbolTable?.get('value') instanceof StringValue
		return new RunTimeResult().success(
			isString ? NumberValue.true : NumberValue.false
		)
	}
	public static executeIsStringArgNames: string[] = ['value']

	public executeIsList(execCtx: Context): RunTimeResult {
		const isList = execCtx.symbolTable?.get('value') instanceof ListValue
		return new RunTimeResult().success(
			isList ? NumberValue.true : NumberValue.false
		)
	}
	public static executeIsListArgNames: string[] = ['value']

	public executeIsFunction(execCtx: Context): RunTimeResult {
		const isFunction =
			execCtx.symbolTable?.get('value') instanceof BaseFunction
		return new RunTimeResult().success(
			isFunction ? NumberValue.true : NumberValue.false
		)
	}
	public static executeIsFunctionArgNames: string[] = ['value']

	public executeAppend(execCtx: Context): RunTimeResult {
		const list = execCtx.symbolTable?.get('list')
		const value = execCtx.symbolTable?.get('value')

		if (!(list instanceof ListValue)) {
			return new RunTimeResult().failure(
				new RunTimeError(
					this.posStart,
					this.posEnd,
					'First argument must be a list',
					execCtx
				)
			)
		}

		list.elements.push(value)
		return new RunTimeResult().success(NumberValue.null)
	}
	public static executeAppendArgNames: string[] = ['list', 'value']

	public executePop(execCtx: Context): RunTimeResult {
		const list = execCtx.symbolTable?.get('list')
		const index = execCtx.symbolTable?.get('index')

		if (!(list instanceof ListValue)) {
			return new RunTimeResult().failure(
				new RunTimeError(
					this.posStart,
					this.posEnd,
					'First argument must be a list',
					execCtx
				)
			)
		}

		if (!(index instanceof NumberValue)) {
			return new RunTimeResult().failure(
				new RunTimeError(
					this.posStart,
					this.posEnd,
					'Second argument must be a number',
					execCtx
				)
			)
		}

		try {
			const element = list.elements.splice(index.value)
			return new RunTimeResult().success(element)
		} catch {
			return new RunTimeResult().failure(
				new RunTimeError(
					this.posStart,
					this.posEnd,
					'Element at this index could not be removed from list because index is out of bounds',
					execCtx
				)
			)
		}
	}
	public static executePopArgNames: string[] = ['list', 'index']

	public executeConcat(execCtx: Context): RunTimeResult {
		const listA = execCtx.symbolTable?.get('listA')
		const listB = execCtx.symbolTable?.get('listB')

		if (!(listA instanceof ListValue)) {
			return new RunTimeResult().failure(
				new RunTimeError(
					this.posStart,
					this.posEnd,
					'First argument must be a list',
					execCtx
				)
			)
		}

		if (!(listB instanceof ListValue)) {
			return new RunTimeResult().failure(
				new RunTimeError(
					this.posStart,
					this.posEnd,
					'Second argument must be a list',
					execCtx
				)
			)
		}

		listA.elements.push(...listB.elements)
		return new RunTimeResult().success(NumberValue.null)
	}
	public static executeConcatArgNames: string[] = ['listA', 'listB']

	public executeLength(execCtx: Context): RunTimeResult {
		const list = execCtx.symbolTable?.get('list')
		console.log(`Length function called with: ${list}`) // Debug log

		if (!(list instanceof ListValue)) {
			return new RunTimeResult().failure(
				new RunTimeError(
					this.posStart,
					this.posEnd,
					'Argument must be a list',
					execCtx
				)
			)
		}
		console.log(`Length of list: ${list.elements.length}`) // Debug log

		return new RunTimeResult().success(
			new NumberValue(list.elements.length)
		)
	}
	public static executeLenArgNames: string[] = ['list']

	executeRun(execCtx: Context): RunTimeResult {
		const fn = execCtx.symbolTable?.get('fn')

		if (!(fn instanceof StringValue)) {
			return new RunTimeResult().failure(
				new RunTimeError(
					this.posStart,
					this.posEnd,
					'Argument must be string',
					execCtx
				)
			)
		}

		const fileName = fn.value
		// check if file extension is .ct
		if (!fileName.endsWith('.ct')) {
			return new RunTimeResult().failure(
				new RunTimeError(
					this.posStart,
					this.posEnd,
					'File name must end with .ct',
					execCtx
				)
			)
		}
		let script: string

		try {
			script = fs.readFileSync(fileName, 'utf-8')
		} catch (e) {
			return new RunTimeResult().failure(
				new RunTimeError(
					this.posStart,
					this.posEnd,
					`Failed to load script "${fileName}"\n${e}`,
					execCtx
				)
			)
		}

		const [, error] = run(fileName, script)
		if (error) {
			return new RunTimeResult().failure(
				new RunTimeError(
					this.posStart,
					this.posEnd,
					`Failed to finish executing script "${fileName}"\n${error.asString()}`,
					execCtx
				)
			)
		}

		return new RunTimeResult().success(NumberValue.null)
	}
	public static executeRunArgNames: string[] = ['fn']
}

BuiltInFunction.print = new BuiltInFunction('print')
BuiltInFunction.printReturn = new BuiltInFunction('print_ret')
BuiltInFunction.input = new BuiltInFunction('input')
BuiltInFunction.inputInt = new BuiltInFunction('input_int')
BuiltInFunction.clear = new BuiltInFunction('clear')
BuiltInFunction.isNumber = new BuiltInFunction('is_number')
BuiltInFunction.isString = new BuiltInFunction('is_string')
BuiltInFunction.isList = new BuiltInFunction('is_list')
BuiltInFunction.isFunction = new BuiltInFunction('is_function')
BuiltInFunction.append = new BuiltInFunction('append')
BuiltInFunction.pop = new BuiltInFunction('pop')
BuiltInFunction.concat = new BuiltInFunction('extend')
BuiltInFunction.length = new BuiltInFunction('length')
BuiltInFunction.run = new BuiltInFunction('run')

BuiltInFunction.argNames['Print'] = BuiltInFunction.executePrintArgNames
BuiltInFunction.argNames['PrintReturn'] =
	BuiltInFunction.executePrintRetArgNames
BuiltInFunction.argNames['Input'] = BuiltInFunction.executeInputArgNames
BuiltInFunction.argNames['InputInt'] = BuiltInFunction.executeInputIntArgNames
BuiltInFunction.argNames['Clear'] = BuiltInFunction.executeClearArgNames
BuiltInFunction.argNames['NumberCheck'] =
	BuiltInFunction.executeIsNumberArgNames
BuiltInFunction.argNames['StringCheck'] =
	BuiltInFunction.executeIsStringArgNames
BuiltInFunction.argNames['ListCheck'] = BuiltInFunction.executeIsListArgNames
BuiltInFunction.argNames['FunctionCheck'] =
	BuiltInFunction.executeIsFunctionArgNames
BuiltInFunction.argNames['Append'] = BuiltInFunction.executeAppendArgNames
BuiltInFunction.argNames['Pop'] = BuiltInFunction.executePopArgNames
BuiltInFunction.argNames['Concat'] = BuiltInFunction.executeConcatArgNames
BuiltInFunction.argNames['Length'] = BuiltInFunction.executeLenArgNames
BuiltInFunction.argNames['Run'] = BuiltInFunction.executeRunArgNames
