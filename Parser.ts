import {
	TT_EOF,
	TT_PLUS,
	TT_MINUS,
	TT_INT,
	TT_FLOAT,
	TT_LPAREN,
	TT_RPAREN,
	TT_MUL,
	TT_DIV,
	TT_POW,
	TT_KEYWORD,
	TT_IDENTIFIER,
	TT_EQ,
} from './Constants'
import { LangError, InvalidSyntaxError } from './Errors'
import {
	NumberNode,
	UnaryOperatorNode,
	BinaryOperatorNode,
	VarAssignNode,
	VarAccessNode,
} from './Nodes'
import { Token } from './Token'

class ResultParser {
	error: LangError | null
	node: any
	advanceCount: number
	constructor() {
		this.error = null
		this.node = null
		this.advanceCount = 0
	}

	registerAdvance() {
		this.advanceCount++
	}

	register(res: ResultParser) {
		this.advanceCount += res.advanceCount

		if (res.error) {
			this.error = res.error
		}
		return res.node
	}
	success(node: any) {
		this.node = node
		return this
	}
	failure(error: LangError) {
		if (!this.error || this.advanceCount === 0) {
			this.error = error
		}
		return this
	}
}
export class Parser {
	tokens: Token[]
	tokenIdx: number
	currentToken: Token
	constructor(tokens: Token[]) {
		this.tokens = tokens
		this.tokenIdx = -1
		this.advance()
	}
	advance() {
		this.tokenIdx += 1
		if (this.tokenIdx < this.tokens.length) {
			this.currentToken = this.tokens[this.tokenIdx]
		}
		return this.currentToken
	}
	parse() {
		const res = this.expr()
		if (!res.error && this.currentToken.type !== TT_EOF) {
			return res.failure(
				new InvalidSyntaxError(
					this.currentToken.posStart,
					this.currentToken.posEnd,
					"Expected '+', '-', '*','^' or '/'"
				)
			)
		}
		return res
	}

	atom() {
		let result = new ResultParser()
		let token = this.currentToken

		if (token.type === TT_INT || token.type === TT_FLOAT) {
			result.registerAdvance()
			this.advance()
			return result.success(new NumberNode(token))
		} else if (token.type === TT_IDENTIFIER) {
			result.registerAdvance()
			this.advance()
			return result.success(new VarAccessNode(token))
		} else if (token.type === TT_LPAREN) {
			result.registerAdvance()
			this.advance()
			let expr = result.register(this.expr())
			if (result.error) return result
			if (this.currentToken.type === TT_RPAREN) {
				result.registerAdvance()
				this.advance()
				return result.success(expr)
			}
		} else {
			return result.failure(
				new InvalidSyntaxError(
					this.currentToken.posStart,
					this.currentToken.posEnd,
					"Expected ')'"
				)
			)
		}

		return result.failure(
			new InvalidSyntaxError(
				token.posStart,
				token.posEnd,
				"Expected int, float, '+', '-' or '('"
			)
		)
	}

	power() {
		return this.binaryOperation(this.atom.bind(this), [TT_POW], this.factor)
	}

	factor() {
		const res = new ResultParser()
		const token = this.currentToken
		if (token.type === TT_PLUS || token.type === TT_MINUS) {
			res.registerAdvance()
			this.advance()
			const factor = res.register(this.factor())
			if (res.error) {
				return res
			}
			return res.success(new UnaryOperatorNode(token, factor))
		}

		// } else if (token.type === TT_INT || token.type === TT_FLOAT) {
		// 	res.registerAdvance()
		// 	this.advance()
		// 	return res.success(new NumberNode(token))
		// } else if (token.type === TT_LPAREN) {
		// 	res.registerAdvance()
		// 	this.advance()
		// 	const expr = res.register(this.expr())
		// 	if (res.error) {
		// 		return res
		// 	}
		// 	if (this.currentToken.type === TT_RPAREN) {
		// 		res.registerAdvance()
		// 		this.advance()
		// 		return res.success(expr)
		// 	} else {
		// 		return res.failure(
		// 			new InvalidSyntaxError(
		// 				this.currentToken.posStart,
		// 				this.currentToken.posEnd,
		// 				"Expected ')'"
		// 			)
		// 		)
		// 	}
		// }
		// return res.failure(
		// 	new InvalidSyntaxError(
		// 		token.posStart,
		// 		token.posEnd,
		// 		'Expected int or float'
		// 	)
		// )
		return this.power()
	}
	term() {
		return this.binaryOperation(this.factor.bind(this), [TT_MUL, TT_DIV])
	}
	expr() {
		let result = new ResultParser()
		if (this.currentToken.matches(TT_KEYWORD, 'let')) {
			result.registerAdvance()
			this.advance()

			if (this.currentToken.type !== TT_IDENTIFIER) {
				return result.failure(
					new InvalidSyntaxError(
						this.currentToken.posStart,
						this.currentToken.posEnd,
						'Expected identifier'
					)
				)
			}
			let varName = this.currentToken
			result.registerAdvance()
			this.advance()
			// @ts-ignore
			if (this.currentToken.type !== TT_EQ) {
				return result.failure(
					new InvalidSyntaxError(
						this.currentToken.posStart,
						this.currentToken.posEnd,
						"Expected '='"
					)
				)
			}
			result.registerAdvance()
			this.advance()
			let expr = result.register(this.expr())
			if (result.error) return result
			return result.success(new VarAssignNode(varName, expr))
		}

		let node = result.register(
			this.binaryOperation(this.term.bind(this), [
				TT_PLUS,
				TT_MINUS,
				TT_POW,
			])
		)

		if (result.error)
			return result.failure(
				new InvalidSyntaxError(
					this.currentToken.posStart,
					this.currentToken.posEnd,
					"Expected 'let', int, float, identifier, '+', '-' or '('"
				)
			)

		return result.success(node)
	}
	binaryOperation(
		funcOne: () => any,
		ops: string[],
		funcTwo?: () => any | null
	) {
		if (funcTwo == null) funcTwo = funcOne

		const res = new ResultParser()
		let left = res.register(funcOne())
		if (res.error) {
			return res
		}
		while (ops.includes(this.currentToken.type)) {
			const operationToken = this.currentToken
			res.registerAdvance()
			this.advance()
			let right = res.register(funcTwo())
			if (res.error) {
				return res
			}
			left = new BinaryOperatorNode(left, operationToken, right)
		}
		return res.success(left)
	}
}

export class RunTimeResult {
	value: any
	error: any

	constructor() {
		this.value = null
		this.error = null
	}

	register(result: any) {
		if (result.error) this.error = result.error
		return result.value
	}

	success(value: any) {
		this.value = value
		return this
	}

	failure(error: any) {
		this.error = error
		return this
	}
}
