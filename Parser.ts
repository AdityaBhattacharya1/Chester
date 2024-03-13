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
} from './Constants'
import { LangError, InvalidSyntaxError } from './LangError'
import { Token } from './Token'

class NumberNode {
	token: Token
	constructor(token: Token) {
		this.token = token
	}
}
class BinOpNode {
	leftNode: any
	operationToken: Token
	rightNode: any
	constructor(leftNode: any, operationToken: Token, rightNode: any) {
		this.leftNode = leftNode
		this.operationToken = operationToken
		this.rightNode = rightNode
	}
}
class UnaryOpNode {
	operationToken: Token
	node: any
	constructor(operationToken: Token, node: any) {
		this.operationToken = operationToken
		this.node = node
	}
}
class ResultParser {
	error: LangError | null
	node: any
	constructor() {
		this.error = null
		this.node = null
	}
	register(res: any) {
		if (res instanceof ResultParser) {
			if (res.error) {
				this.error = res.error
			}
			return res.node
		}
		return res
	}
	success(node: any) {
		this.node = node
		return this
	}
	failure(error: LangError) {
		this.error = error
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
					"Expected '+', '-', '*' or '/'"
				)
			)
		}
		return res
	}
	factor() {
		const res = new ResultParser()
		const token = this.currentToken
		if (token.type === TT_PLUS || token.type === TT_MINUS) {
			res.register(this.advance())
			const factor = res.register(this.factor())
			if (res.error) {
				return res
			}
			return res.success(new UnaryOpNode(token, factor))
		} else if (token.type === TT_INT || token.type === TT_FLOAT) {
			res.register(this.advance())
			return res.success(new NumberNode(token))
		} else if (token.type === TT_LPAREN) {
			res.register(this.advance())
			const expr = res.register(this.expr())
			if (res.error) {
				return res
			}
			if (this.currentToken.type === TT_RPAREN) {
				res.register(this.advance())
				return res.success(expr)
			} else {
				return res.failure(
					new InvalidSyntaxError(
						this.currentToken.posStart,
						this.currentToken.posEnd,
						"Expected ')'"
					)
				)
			}
		}
		return res.failure(
			new InvalidSyntaxError(
				token.posStart,
				token.posEnd,
				'Expected int or float'
			)
		)
	}
	term() {
		return this.binaryOperation(this.factor.bind(this), [TT_MUL, TT_DIV])
	}
	expr() {
		return this.binaryOperation(this.term.bind(this), [TT_PLUS, TT_MINUS])
	}
	binaryOperation(func: () => any, ops: string[]) {
		const res = new ResultParser()
		let left = res.register(func())
		if (res.error) {
			return res
		}
		while (ops.includes(this.currentToken.type)) {
			const operationToken = this.currentToken
			res.register(this.advance())
			let right = res.register(func())
			if (res.error) {
				return res
			}
			left = new BinOpNode(left, operationToken, right)
		}
		return res.success(left)
	}
}
