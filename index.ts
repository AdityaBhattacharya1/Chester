import { Lexer } from './Lexer'
import { Token } from './Token'
import { Parser } from './Parser'

export const run = (func: string, text: string) => {
	const lexer = new Lexer(func, text)
	const [tokens, error] = lexer.make_tokens()
	if (error) {
		return [null, error]
	}
	const parser = new Parser(tokens as Token[])
	const ast = parser.parse()
	return [ast.node, ast.error]
}
