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
	TT_NEWLINE,
	TT_EE,
	TT_NE,
	TT_LT,
	TT_GT,
	TT_LTE,
	TT_GTE,
	TT_STRING,
	TT_LSQUARE,
	TT_RSQUARE,
	TT_COMMA,
	TT_ARROW,
} from './Constants'
import { LangError, InvalidSyntaxError } from './Errors'
import {
	NumberNode,
	UnaryOperatorNode,
	BinaryOperatorNode,
	VarAssignNode,
	VarAccessNode,
	ListNode,
	BreakNode,
	ReturnNode,
	ContinueNode,
	StringNode,
	IfNode,
	ForNode,
	WhileNode,
	FunctionDefinitionNode,
	CallNode,
} from './Nodes'
import { Token } from './Token'

class ResultParser {
	error: LangError | null
	node: any
	lastRegisteredAdvanceCount: number
	advanceCount: number
	toReverseCount: number
	constructor() {
		this.error = null
		this.node = null
		this.lastRegisteredAdvanceCount = 0
		this.advanceCount = 0
		this.toReverseCount = 0
	}

	registerAdvance() {
		this.advanceCount++
		this.lastRegisteredAdvanceCount = 1
	}

	register(res: ResultParser) {
		this.lastRegisteredAdvanceCount = res.advanceCount
		this.advanceCount += res.advanceCount

		if (res.error) {
			this.error = res.error
		}
		return res.node
	}

	tryRegister(res: ResultParser) {
		if (res.error) {
			this.toReverseCount = res.advanceCount
			return
		}
		return this.register(res)
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

	updateCurrToken() {
		if (this.tokenIdx >= 0 && this.tokenIdx < this.tokens.length) {
			this.currentToken = this.tokens[this.tokenIdx]
		}
	}

	advance() {
		this.tokenIdx += 1
		this.updateCurrToken()
		return this.currentToken
	}

	reverse(amount: number = 1) {
		this.tokenIdx -= amount
		this.updateCurrToken()
		return this.currentToken
	}

	statement() {
		const res = new ResultParser()
		const posStart = this.currentToken.posStart.copy()

		if (this.currentToken.matches(TT_KEYWORD, 'return')) {
			res.registerAdvance()
			this.advance()

			const expr = res.tryRegister(this.expression())
			if (!expr) {
				this.reverse(res.toReverseCount)
			}
			return res.success(
				new ReturnNode(
					expr,
					posStart,
					this.currentToken.posStart.copy()
				)
			)
		}

		if (this.currentToken.matches(TT_KEYWORD, 'continue')) {
			res.registerAdvance()
			this.advance()
			return res.success(
				new ContinueNode(posStart, this.currentToken.posStart.copy())
			)
		}

		if (this.currentToken.matches(TT_KEYWORD, 'break')) {
			res.registerAdvance()
			this.advance()
			return res.success(
				new BreakNode(posStart, this.currentToken.posStart.copy())
			)
		}

		const expr = res.register(this.expression())
		if (res.error) {
			return res.failure(
				new InvalidSyntaxError(
					this.currentToken.posStart,
					this.currentToken.posEnd,
					"Expected 'return', 'continue', 'break', 'let', 'if', 'for', 'while', 'func', int, float, identifier, '+', '-', '(', '[' or 'not'"
				)
			)
		}

		return res.success(expr)
	}

	statements() {
		const res = new ResultParser()
		const statements = []
		let posStart = this.currentToken.posStart.copy()

		while (this.currentToken.type === TT_NEWLINE) {
			res.registerAdvance()
			this.advance()
		}

		let statement = res.register(this.statement())
		if (res.error) return res
		statements.push(statement)

		let moreStatements = true
		while (true) {
			let newlineCount = 0
			while (this.currentToken.type == TT_NEWLINE) {
				res.registerAdvance()
				this.advance()
				newlineCount++
			}

			if (newlineCount === 0) moreStatements = false

			if (!moreStatements) break

			statement = res.tryRegister(this.statement())
			if (!statement) {
				this.reverse(res.toReverseCount)
				moreStatements = false
				continue
			}
			statements.push(statement)
		}
		return res.success(
			new ListNode(statements, posStart, this.currentToken.posEnd.copy())
		)
	}

	parse() {
		const res = this.statements()
		if (!res.error && this.currentToken.type !== TT_EOF) {
			return res.failure(
				new InvalidSyntaxError(
					this.currentToken.posStart,
					this.currentToken.posEnd,
					'Token cannot appear after previous tokens'
				)
			)
		}
		return res
	}

	listExpression() {
		const res = new ResultParser()
		const element_nodes: any[] = []
		const posStart = this.currentToken.posStart.copy()

		if (this.currentToken.type !== TT_LSQUARE) {
			return res.failure(
				new InvalidSyntaxError(
					this.currentToken.posStart,
					this.currentToken.posEnd,
					"Expected '['"
				)
			)
		}

		res.registerAdvance()
		this.advance()
		// @ts-ignore
		if (this.currentToken.type === TT_RSQUARE) {
			res.registerAdvance()
			this.advance()
		} else {
			element_nodes.push(res.register(this.expression()))
			if (res.error) {
				return res.failure(
					new InvalidSyntaxError(
						this.currentToken.posStart,
						this.currentToken.posEnd,
						"Expected ']', 'let', 'if', 'for', 'while', 'func', int, float, identifier, '+', '-', '(', '[' or 'not'"
					)
				)
			}
			// @ts-ignore
			while (this.currentToken.type === TT_COMMA) {
				res.registerAdvance()
				this.advance()
				element_nodes.push(res.register(this.expression()))
				if (res.error) {
					return res
				}
			}
			// @ts-ignore
			if (this.currentToken.type !== TT_RSQUARE) {
				return res.failure(
					new InvalidSyntaxError(
						this.currentToken.posStart,
						this.currentToken.posEnd,
						"Expected ',' or ']'"
					)
				)
			}

			res.registerAdvance()
			this.advance()
		}

		return res.success(
			new ListNode(
				element_nodes,
				posStart,
				this.currentToken.posEnd.copy()
			)
		)
	}

	ifExpressionB() {
		return this.ifExpressionCases('elif')
	}

	ifExpressionBorC() {
		const res = new ResultParser()
		let cases: any[] = []
		let else_case: any = null

		if (this.currentToken.matches(TT_KEYWORD, 'elif')) {
			const all_cases = res.register(this.ifExpressionB())
			if (res.error) return res
			;[cases, else_case] = all_cases
		} else {
			else_case = res.register(this.ifExpressionC())
			if (res.error) return res
		}

		return res.success([cases, else_case])
	}

	ifExpressionC() {
		const res = new ResultParser()
		let else_case: any = null

		if (this.currentToken.matches(TT_KEYWORD, 'else')) {
			res.registerAdvance()
			this.advance()

			if (this.currentToken.type === TT_NEWLINE) {
				res.registerAdvance()
				this.advance()

				const statements = res.register(this.statements())
				if (res.error) return res
				else_case = [statements, true]

				if (this.currentToken.matches(TT_KEYWORD, 'end')) {
					res.registerAdvance()
					this.advance()
				} else {
					return res.failure(
						new InvalidSyntaxError(
							this.currentToken.posStart,
							this.currentToken.posEnd,
							"Expected 'END'"
						)
					)
				}
			} else {
				const expr = res.register(this.statement())
				if (res.error) return res
				else_case = [expr, false]
			}
		}

		return res.success(else_case)
	}

	ifExpressionCases(caseKeyword: string) {
		const res = new ResultParser()
		let cases: any[] = []
		let else_case: any = null

		if (!this.currentToken.matches(TT_KEYWORD, caseKeyword)) {
			return res.failure(
				new InvalidSyntaxError(
					this.currentToken.posStart,
					this.currentToken.posEnd,
					`Expected '${caseKeyword}'`
				)
			)
		}

		res.registerAdvance()
		this.advance()

		const condition = res.register(this.expression())
		if (res.error) return res

		if (!this.currentToken.matches(TT_KEYWORD, 'THEN')) {
			return res.failure(
				new InvalidSyntaxError(
					this.currentToken.posStart,
					this.currentToken.posEnd,
					"Expected 'THEN'"
				)
			)
		}

		res.registerAdvance()
		this.advance()

		if (this.currentToken.type === TT_NEWLINE) {
			res.registerAdvance()
			this.advance()

			const statements = res.register(this.statements())
			if (res.error) return res
			cases.push([condition, statements, true])

			if (this.currentToken.matches(TT_KEYWORD, 'END')) {
				res.registerAdvance()
				this.advance()
			} else {
				const all_cases = res.register(this.ifExpressionBorC())
				if (res.error) return res
				const [new_cases, new_else_case] = all_cases
				cases = cases.concat(new_cases)
				else_case = new_else_case
			}
		} else {
			const expr = res.register(this.statement())
			if (res.error) return res
			cases.push([condition, expr, false])

			const all_cases = res.register(this.ifExpressionBorC())
			if (res.error) return res
			const [new_cases, new_else_case] = all_cases
			cases = cases.concat(new_cases)
			else_case = new_else_case
		}

		return res.success([cases, else_case])
	}

	forExpression() {
		const res = new ResultParser()

		if (!this.currentToken.matches(TT_KEYWORD, 'for')) {
			return res.failure(
				new InvalidSyntaxError(
					this.currentToken.posStart,
					this.currentToken.posEnd,
					"Expected 'for'"
				)
			)
		}

		res.registerAdvance()
		this.advance()

		if (this.currentToken.type !== TT_IDENTIFIER) {
			return res.failure(
				new InvalidSyntaxError(
					this.currentToken.posStart,
					this.currentToken.posEnd,
					'Expected identifier'
				)
			)
		}

		const var_name = this.currentToken
		res.registerAdvance()
		this.advance()

		// @ts-ignore
		if (this.currentToken.type !== TT_EQ) {
			return res.failure(
				new InvalidSyntaxError(
					this.currentToken.posStart,
					this.currentToken.posEnd,
					"Expected '='"
				)
			)
		}

		res.registerAdvance()
		this.advance()

		const start_value = res.register(this.expression())
		if (res.error) return res

		if (!this.currentToken.matches(TT_KEYWORD, 'TO')) {
			return res.failure(
				new InvalidSyntaxError(
					this.currentToken.posStart,
					this.currentToken.posEnd,
					"Expected 'TO'"
				)
			)
		}

		res.registerAdvance()
		this.advance()

		const end_value = res.register(this.expression())
		if (res.error) return res

		let step_value: any = null
		if (this.currentToken.matches(TT_KEYWORD, 'step')) {
			res.registerAdvance()
			this.advance()

			step_value = res.register(this.expression())
			if (res.error) return res
		}

		if (!this.currentToken.matches(TT_KEYWORD, 'then')) {
			return res.failure(
				new InvalidSyntaxError(
					this.currentToken.posStart,
					this.currentToken.posEnd,
					"Expected 'then'"
				)
			)
		}

		res.registerAdvance()
		this.advance()

		if (this.currentToken.type === TT_NEWLINE) {
			res.registerAdvance()
			this.advance()

			const body = res.register(this.statements())
			if (res.error) return res

			if (!this.currentToken.matches(TT_KEYWORD, 'end')) {
				return res.failure(
					new InvalidSyntaxError(
						this.currentToken.posStart,
						this.currentToken.posEnd,
						"Expected 'END'"
					)
				)
			}

			res.registerAdvance()
			this.advance()

			return res.success(
				new ForNode(
					var_name,
					start_value,
					end_value,
					step_value,
					body,
					true
				)
			)
		}

		const body = res.register(this.statement())
		if (res.error) return res

		return res.success(
			new ForNode(
				var_name,
				start_value,
				end_value,
				step_value,
				body,
				false
			)
		)
	}

	ifExpression() {
		const res = new ResultParser()
		const allCases = res.register(this.ifExpressionCases('if'))
		if (res.error) return res
		const [cases, elseCase] = allCases
		return res.success(new IfNode(cases, elseCase))
	}

	whileExpression() {
		const res = new ResultParser()

		if (!this.currentToken.matches(TT_KEYWORD, 'while')) {
			return res.failure(
				new InvalidSyntaxError(
					this.currentToken.posStart,
					this.currentToken.posEnd,
					"Expected 'while'"
				)
			)
		}

		res.registerAdvance()
		this.advance()

		const condition = res.register(this.expression())
		if (res.error) return res

		if (!this.currentToken.matches(TT_KEYWORD, 'then')) {
			return res.failure(
				new InvalidSyntaxError(
					this.currentToken.posStart,
					this.currentToken.posEnd,
					"Expected 'then'"
				)
			)
		}

		res.registerAdvance()
		this.advance()

		if (this.currentToken.type === TT_NEWLINE) {
			res.registerAdvance()
			this.advance()

			const body = res.register(this.statements())
			if (res.error) return res

			if (!this.currentToken.matches(TT_KEYWORD, 'end')) {
				return res.failure(
					new InvalidSyntaxError(
						this.currentToken.posStart,
						this.currentToken.posEnd,
						"Expected 'end'"
					)
				)
			}

			res.registerAdvance()
			this.advance()

			return res.success(new WhileNode(condition, body, true))
		}

		const body = res.register(this.statement())
		if (res.error) return res

		return res.success(new WhileNode(condition, body, false))
	}

	functionDefinition(): ResultParser {
		const res = new ResultParser()

		if (!this.currentToken.matches(TT_KEYWORD, 'func')) {
			return res.failure(
				new InvalidSyntaxError(
					this.currentToken.posStart,
					this.currentToken.posEnd,
					"Expected 'func'"
				)
			)
		}

		res.registerAdvance()
		this.advance()

		let varNameToken: Token | null = null

		if (this.currentToken.type === TT_IDENTIFIER) {
			varNameToken = this.currentToken
			res.registerAdvance()
			this.advance()

			//@ts-ignore
			if (this.currentToken.type !== TT_LPAREN) {
				return res.failure(
					new InvalidSyntaxError(
						this.currentToken.posStart,
						this.currentToken.posEnd,
						"Expected '('"
					)
				)
			}
		} else {
			if (this.currentToken.type !== TT_LPAREN) {
				return res.failure(
					new InvalidSyntaxError(
						this.currentToken.posStart,
						this.currentToken.posEnd,
						"Expected identifier or '('"
					)
				)
			}
		}

		res.registerAdvance()
		this.advance()

		const argNameTokens: Token[] = []

		// @ts-ignore
		if (this.currentToken.type === TT_IDENTIFIER) {
			argNameTokens.push(this.currentToken)
			res.registerAdvance()
			this.advance()

			while (this.currentToken.type === TT_COMMA) {
				res.registerAdvance()
				this.advance()

				if (this.currentToken.type !== TT_IDENTIFIER) {
					return res.failure(
						new InvalidSyntaxError(
							this.currentToken.posStart,
							this.currentToken.posEnd,
							'Expected identifier'
						)
					)
				}

				argNameTokens.push(this.currentToken)
				res.registerAdvance()
				this.advance()
			}

			if (this.currentToken.type !== TT_RPAREN) {
				return res.failure(
					new InvalidSyntaxError(
						this.currentToken.posStart,
						this.currentToken.posEnd,
						"Expected ',' or ')'"
					)
				)
			}
		} else {
			// @ts-ignore
			if (this.currentToken.type !== TT_RPAREN) {
				return res.failure(
					new InvalidSyntaxError(
						this.currentToken.posStart,
						this.currentToken.posEnd,
						"Expected identifier or ')'"
					)
				)
			}
		}

		res.registerAdvance()
		this.advance()

		if (this.currentToken.type === TT_ARROW) {
			res.registerAdvance()
			this.advance()

			const body = res.register(this.expression())
			if (res.error) return res

			return res.success(
				new FunctionDefinitionNode(
					varNameToken as Token,
					argNameTokens,
					body,
					true
				)
			)
		}

		if (this.currentToken.type !== TT_NEWLINE) {
			return res.failure(
				new InvalidSyntaxError(
					this.currentToken.posStart,
					this.currentToken.posEnd,
					"Expected '->' or NEWLINE"
				)
			)
		}

		res.registerAdvance()
		this.advance()

		const body = res.register(this.statements())
		if (res.error) return res

		if (!this.currentToken.matches(TT_KEYWORD, 'end')) {
			return res.failure(
				new InvalidSyntaxError(
					this.currentToken.posStart,
					this.currentToken.posEnd,
					"Expected 'end'"
				)
			)
		}

		res.registerAdvance()
		this.advance()

		return res.success(
			new FunctionDefinitionNode(varNameToken, argNameTokens, body, false)
		)
	}

	call() {
		const res = new ResultParser()
		const atom = res.register(this.atom())
		if (res.error) return res

		if (this.currentToken.type === TT_LPAREN) {
			res.registerAdvance()
			this.advance()
			const argNodes = []

			// @ts-ignore
			if (this.currentToken.type === TT_RPAREN) {
				res.registerAdvance()
				this.advance()
			} else {
				argNodes.push(res.register(this.expression()))
				if (res.error) {
					return res.failure(
						new InvalidSyntaxError(
							this.currentToken.posStart,
							this.currentToken.posEnd,
							"Expected ')', 'let', 'if', 'for', 'while', 'fun', int, float, identifier, '+', '-', '(', '[' or 'not'"
						)
					)
				}

				// @ts-ignore
				while (this.currentToken.type === TT_COMMA) {
					res.registerAdvance()
					this.advance()

					argNodes.push(res.register(this.expression()))
					if (res.error) return res
				}

				// @ts-ignore
				if (this.currentToken.type !== TT_RPAREN) {
					return res.failure(
						new InvalidSyntaxError(
							this.currentToken.posStart,
							this.currentToken.posEnd,
							"Expected ',' or ')'"
						)
					)
				}

				res.registerAdvance()
				this.advance()
			}
			return res.success(new CallNode(atom, argNodes))
		}
		return res.success(atom)
	}

	atom() {
		let result = new ResultParser()
		let token = this.currentToken

		if (token.type === TT_INT || token.type === TT_FLOAT) {
			result.registerAdvance()
			this.advance()
			return result.success(new NumberNode(token))
		} else if (token.type === TT_STRING) {
			result.registerAdvance()
			this.advance()
			return result.success(new StringNode(token))
		} else if (token.type === TT_IDENTIFIER) {
			result.registerAdvance()
			this.advance()
			return result.success(new VarAccessNode(token))
		} else if (token.type === TT_LPAREN) {
			result.registerAdvance()
			this.advance()
			let expr = result.register(this.expression())
			if (result.error) return result
			if (this.currentToken.type === TT_RPAREN) {
				result.registerAdvance()
				this.advance()
				return result.success(expr)
			} else {
				return result.failure(
					new InvalidSyntaxError(
						this.currentToken.posStart,
						this.currentToken.posEnd,
						"Expected ')'"
					)
				)
			}
		} else if (token.type === TT_LSQUARE) {
			let listExpression = result.register(this.listExpression())
			if (result.error) return result
			return result.success(listExpression)
		} else if (token.matches(TT_KEYWORD, 'if')) {
			const ifExp = result.register(this.ifExpression())
			if (result.error) return result
			return result.success(ifExp)
		} else if (token.matches(TT_KEYWORD, 'for')) {
			const forExp = result.register(this.forExpression())
			if (result.error) return result
			return result.success(forExp)
		} else if (token.matches(TT_KEYWORD, 'while')) {
			const whileExp = result.register(this.whileExpression())
			if (result.error) return result
			return result.success(whileExp)
		} else if (token.matches(TT_KEYWORD, 'func')) {
			const funcDef = result.register(this.functionDefinition())
			if (result.error) return result
			return result.success(funcDef)
		}

		return result.failure(
			new InvalidSyntaxError(
				token.posStart,
				token.posEnd,
				"Expected int, float, identifier, '+', '-', '(', '[', if', 'for', 'while', 'fun'"
			)
		)
	}

	power() {
		return this.binaryOperation(this.call.bind(this), [TT_POW], this.factor)
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
		return this.power()
	}
	term() {
		return this.binaryOperation(this.factor.bind(this), [TT_MUL, TT_DIV])
	}

	complicatedExpression() {
		const res = new ResultParser()
		if (this.currentToken.matches(TT_KEYWORD, 'not')) {
			const operationToken = this.currentToken
			res.registerAdvance()
			this.advance()

			let node = res.register(this.complicatedExpression())
			if (res.error) return res
			return res.success(new UnaryOperatorNode(operationToken, node))
		}

		let node = res.register(
			this.binaryOperation(this.arithmeticExpression.bind(this), [
				TT_EE,
				TT_NE,
				TT_LT,
				TT_GT,
				TT_LTE,
				TT_GTE,
			])
		)

		if (res.error)
			return res.failure(
				new InvalidSyntaxError(
					this.currentToken.posStart,
					this.currentToken.posEnd,
					"Expected int, float, identifier, '+', '-', '(', '[', 'if', 'for', 'while', 'fun' or 'not'"
				)
			)
		return res.success(node)
	}

	arithmeticExpression() {
		return this.binaryOperation(this.term.bind(this), [TT_PLUS, TT_MINUS])
	}

	expression() {
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
			let expr = result.register(this.expression())
			if (result.error) return result
			return result.success(new VarAssignNode(varName, expr))
		}

		let node = result.register(
			this.binaryOperation(this.complicatedExpression.bind(this), [
				[TT_KEYWORD, 'and'],
				[TT_KEYWORD, 'or'],
			])
		)

		if (result.error)
			return result.failure(
				new InvalidSyntaxError(
					this.currentToken.posStart,
					this.currentToken.posEnd,
					"Expected 'let', 'if', 'for', 'while', 'fun', int, float, identifier, '+', '-', '(', '[' or 'not'"
				)
			)

		return result.success(node)
	}

	binaryOperation(
		funcOne: () => any,
		ops: string[] | any,
		funcTwo?: () => any | null
	) {
		if (funcTwo == null) funcTwo = funcOne

		const res = new ResultParser()
		let left = res.register(funcOne())
		if (res.error) {
			return res
		}
		while (
			ops.includes(this.currentToken.type) ||
			ops.includes([this.currentToken.type, this.currentToken.value])
		) {
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
