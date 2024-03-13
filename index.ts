import { Lexer } from './Lexer'
import { Token } from './Token'
import { Parser } from './Parser'
import { Interpreter } from './Interpreter'
import { Context } from './Context'

export const run = (func: string, text: string) => {
	const lexer = new Lexer(func, text)
	const [tokens, error] = lexer.make_tokens()
	if (error) return [null, error]

	const parser = new Parser(tokens as Token[])
	const ast = parser.parse()
	if (ast.error) return [null, ast.error]

	const interpreter = new Interpreter()
	let context = new Context('<program>')
	let result = interpreter.visit(ast.node, context)
	return [result.value, result.error]
}
