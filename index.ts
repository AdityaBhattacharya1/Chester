import { Lexer } from './Lexer'
import { Token } from './Token'
import { Parser } from './Parser'
import { Interpreter } from './Interpreter'
import { Context } from './Context'
import { SymbolTable } from './SymbolTable'

const globalSymbolTable = new SymbolTable()
globalSymbolTable.set('null', Number(0))

export const run = (func: string, text: string) => {
	const lexer = new Lexer(func, text)
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
