import { Lexer } from './Lexer'
import { Token } from './Token'
import { Parser } from './Parser'
import { Interpreter } from './Interpreter'
import { Context } from './Context'
import { SymbolTable } from './SymbolTable'
import { BuiltInFunction } from './Functions'
import { NumberValue } from './Values'

export const run = (fileName: string, text: string) => {
	// NumberValue.null = new NumberValue(0)
	// NumberValue.false = new NumberValue(1)
	// NumberValue.true = new NumberValue(1)
	// NumberValue.MATH_PI = new NumberValue(Math.PI)

	BuiltInFunction.print = new BuiltInFunction('Print')
	BuiltInFunction.printReturn = new BuiltInFunction('PrintReturn')
	BuiltInFunction.input = new BuiltInFunction('Input')
	BuiltInFunction.inputInt = new BuiltInFunction('InputInt')
	BuiltInFunction.clear = new BuiltInFunction('Clear')
	BuiltInFunction.isNumber = new BuiltInFunction('NumberCheck')
	BuiltInFunction.isString = new BuiltInFunction('StringCheck')
	BuiltInFunction.isList = new BuiltInFunction('ListCheck')
	BuiltInFunction.isFunction = new BuiltInFunction('FunctionCheck')
	BuiltInFunction.append = new BuiltInFunction('Append')
	BuiltInFunction.pop = new BuiltInFunction('Pop')
	BuiltInFunction.concat = new BuiltInFunction('Concat')
	BuiltInFunction.length = new BuiltInFunction('Length')
	BuiltInFunction.run = new BuiltInFunction('Run')

	const globalSymbolTable = new SymbolTable()
	globalSymbolTable.set('null', new NumberValue(0))
	globalSymbolTable.set('false', NumberValue.false)
	globalSymbolTable.set('true', NumberValue.true)
	globalSymbolTable.set('MATH_PI', NumberValue.MATH_PI)
	globalSymbolTable.set('print', BuiltInFunction.print)
	globalSymbolTable.set('printReturn', BuiltInFunction.printReturn)
	globalSymbolTable.set('input', BuiltInFunction.input)
	globalSymbolTable.set('inputInt', BuiltInFunction.inputInt)
	globalSymbolTable.set('clear', BuiltInFunction.clear)
	globalSymbolTable.set('cls', BuiltInFunction.clear)
	globalSymbolTable.set('isNum', BuiltInFunction.isNumber)
	globalSymbolTable.set('isStr', BuiltInFunction.isString)
	globalSymbolTable.set('isList', BuiltInFunction.isList)
	globalSymbolTable.set('isFunc', BuiltInFunction.isFunction)
	globalSymbolTable.set('append', BuiltInFunction.append)
	globalSymbolTable.set('pop', BuiltInFunction.pop)
	globalSymbolTable.set('concat', BuiltInFunction.concat)
	globalSymbolTable.set('length', BuiltInFunction.length)
	globalSymbolTable.set('run', BuiltInFunction.run)

	const lexer = new Lexer(fileName, text)
	const [tokens, error] = lexer.makeTokens()
	if (error) return [null, error]

	const parser = new Parser(tokens as Token[])
	const ast = parser.parse()
	if (ast.error) return [null, ast.error]

	const interpreter = new Interpreter()
	let context = new Context('<program>')
	context.symbolTable = globalSymbolTable
	let result = interpreter.visit(ast.node, context)
	return [result.value, result.error]
}
