import { Context } from './Context'
import {
	BinaryOperatorNode,
	BreakNode,
	CallNode,
	ContinueNode,
	ForNode,
	FunctionDefinitionNode,
	IfNode,
	ListNode,
	NumberNode,
	ReturnNode,
	StringNode,
	UnaryOperatorNode,
	VarAccessNode,
	VarAssignNode,
	WhileNode,
} from './Nodes'
import { RunTimeResult } from './Parser'
import {
	TT_DIV,
	TT_EE,
	TT_GT,
	TT_GTE,
	TT_KEYWORD,
	TT_LT,
	TT_LTE,
	TT_MINUS,
	TT_MUL,
	TT_NE,
	TT_PLUS,
	TT_POW,
} from './Constants'
import { RunTimeError } from './Errors'
import { ListValue, NumberValue, StringValue, Value } from './Values'
import { Token } from './Token'
import { FunctionValue } from './Functions'

export type Node =
	| NumberNode
	| UnaryOperatorNode
	| BinaryOperatorNode
	| ForNode
	| IfNode
	| FunctionDefinitionNode
	| ListNode
	| NumberNode

export class Interpreter {
	visit(node: Node, context: Context): any {
		const methodName = `visit${node.constructor.name}`

		const method = (this as any)[methodName] || this.noVisitMethod
		return method.call(this, node, context)
	}

	noVisitMethod(node: Node) {
		throw new Error(`No visit${typeof node} method defined.`)
	}

	visitNumberNode(node: NumberNode, context: Context) {
		return new RunTimeResult().success(
			new NumberValue(node.token.value)
				.setContext(context)
				.setPos(node.posStart, node.posEnd)
		)
	}

	visitStringNode(node: StringNode, context: Context) {
		return new RunTimeResult().success(
			new StringValue(node.token.value)
				.setContext(context)
				.setPos(node.posStart, node.posEnd)
		)
	}

	visitListNode(node: ListNode, context: Context) {
		const res = new RunTimeResult()
		const elements: Node[] = []

		for (let elemNode of node.elementNodes) {
			elements.push(res.register(this.visit(elemNode, context)))
			if (res.shouldReturn()) return res
		}

		return res.success(
			new ListValue(elements)
				.setContext(context)
				.setPos(node.posStart, node.posEnd)
		)
	}

	visitBinaryOperatorNode(node: BinaryOperatorNode, context: Context) {
		let res = new RunTimeResult()
		let left = res.register(this.visit(node.leftNode, context))
		if (res.error) return res
		let result, error

		let right = res.register(this.visit(node.rightNode, context))

		if (node.operationToken.type === TT_PLUS) {
			;[result, error] = left.addTo(right)
		} else if (node.operationToken.type === TT_MINUS) {
			;[result, error] = left.subBy(right)
		} else if (node.operationToken.type === TT_MUL) {
			;[result, error] = left.multBy(right)
		} else if (node.operationToken.type === TT_DIV) {
			;[result, error] = left.divedBy(right)
		} else if (node.operationToken.type === TT_POW) {
			;[result, error] = left.powBy(right)
		} else if (node.operationToken.type === TT_EE) {
			;[result, error] = left.getComparisonEq(right)
		} else if (node.operationToken.type === TT_NE) {
			;[result, error] = left.getComparisonNe(right)
		} else if (node.operationToken.type === TT_GT) {
			;[result, error] = left.getComparisonGt(right)
		} else if (node.operationToken.type === TT_LT) {
			;[result, error] = left.getComparisonLt(right)
		} else if (node.operationToken.type === TT_GTE) {
			;[result, error] = left.getComparisonGte(right)
		} else if (node.operationToken.type === TT_LTE) {
			;[result, error] = left.getComparisonLte(right)
		} else if (node.operationToken.matches(TT_KEYWORD, 'and')) {
			;[result, error] = left.andBy(right)
		} else if (node.operationToken.matches(TT_KEYWORD, 'or')) {
			;[result, error] = left.orBy(right)
		}

		return error
			? res.failure(error)
			: res.success(result.setPos(node.posStart, node.posEnd))
	}
	visitUnaryOperatorNode(node: UnaryOperatorNode, context: Context) {
		let res = new RunTimeResult()
		let number = res.register(this.visit(node.node, context))
		if (res.error) return res

		let error
		if (node.operationToken.type === TT_MINUS) {
			;[number, error] = number.multBy(new NumberValue(-1))
		} else if (node.operationToken.matches(TT_KEYWORD, 'not')) {
			;[number, error] = number.notBy()
		}

		return error
			? res.failure(error)
			: res.success(number.setPos(node.posStart, node.posEnd))
	}

	visitVarAccessNode(node: VarAccessNode, context: Context) {
		let result = new RunTimeResult()
		let varName = node.varNameToken.value
		let value = context.symbolTable?.get(varName)

		if (!value) {
			return result.failure(
				new RunTimeError(
					node.posStart,
					node.posEnd,
					`'${varName}' is not defined`,
					context
				)
			)
		}
		value = value
			.copy()
			.setPos(node.posStart, node.posEnd)
			.setContext(context)
		return result.success(value)
	}

	visitVarAssignNode(node: VarAssignNode, context: Context) {
		let result = new RunTimeResult()
		let varName = node.varNameToken.value
		let value = result.register(this.visit(node.valueNode, context))
		if (result.shouldReturn()) return result

		context.symbolTable?.set(varName, value)
		return result.success(value)
	}

	visitIfNode(node: IfNode, context: Context) {
		const res = new RunTimeResult()

		for (const cases of node.cases) {
			const conditionValue = res.register(
				this.visit(cases.condition, context)
			)
			if (res.shouldReturn()) return res

			if (conditionValue.isTrue()) {
				const exprValue = res.register(this.visit(cases.expr, context))
				if (res.shouldReturn()) return res
				return res.success(
					cases.shouldReturnNull ? NumberValue.null : exprValue
				)
			}
		}

		if (node.elseCase) {
			console.log('else case', node.elseCase)
			const [expr, shouldReturnNull] = node.elseCase
			const exprValue = res.register(this.visit(expr, context))
			if (res.shouldReturn()) return res
			return res.success(shouldReturnNull ? NumberValue.null : exprValue)
		}

		return res.success(NumberValue.null)
	}

	visitForNode(node: ForNode, context: Context): RunTimeResult {
		const res = new RunTimeResult()
		const elements: Value[] = []

		const startValue = res.register(
			this.visit(node.startValueNode, context)
		)
		if (res.shouldReturn()) return res

		const endValue = res.register(this.visit(node.endValueNode, context))
		if (res.shouldReturn()) return res

		let stepValue: NumberValue
		if (node.stepValueNode) {
			stepValue = res.register(
				this.visit(node.stepValueNode, context)
			) as NumberValue
			if (res.shouldReturn()) return res
		} else {
			stepValue = new NumberValue(1)
		}

		let i = (startValue as NumberValue).value
		const condition =
			stepValue.value >= 0
				? () => i < (endValue as NumberValue).value
				: () => i > (endValue as NumberValue).value

		while (condition()) {
			context.symbolTable?.set(
				node.varNameToken.value,
				new NumberValue(i)
			)
			i += stepValue.value

			const value = res.register(this.visit(node.bodyNode, context))
			if (
				res.shouldReturn() &&
				!res.loopShouldContinue &&
				!res.loopShouldBreak
			)
				return res

			if (res.loopShouldContinue) continue
			if (res.loopShouldBreak) break

			elements.push(value)
		}

		return res.success(
			node.shouldReturnNull
				? NumberValue.null
				: new ListValue(elements)
						.setContext(context)
						.setPos(node.posStart, node.posEnd)
		)
	}

	visitWhileNode(node: WhileNode, context: Context): RunTimeResult {
		const res = new RunTimeResult()
		const elements: Value[] = []

		while (true) {
			const condition = res.register(
				this.visit(node.conditionNode, context)
			)
			if (res.shouldReturn()) return res

			if (!condition.isTrue()) break

			const value = res.register(this.visit(node.bodyNode, context))
			if (
				res.shouldReturn() &&
				!res.loopShouldContinue &&
				!res.loopShouldBreak
			)
				return res

			if (res.loopShouldContinue) continue
			if (res.loopShouldBreak) break

			elements.push(value)
		}

		return res.success(
			node.shouldReturnNull
				? NumberValue.null
				: new ListValue(elements)
						.setContext(context)
						.setPos(node.posStart, node.posEnd)
		)
	}

	visitFunctionDefinitionNode(
		node: FunctionDefinitionNode,
		context: Context
	): RunTimeResult {
		const res = new RunTimeResult()

		const funcName = node.varNameToken ? node.varNameToken.value : null
		const bodyNode = node.bodyNode
		const argNames = node.argNameTokens.map(
			(argName: Token) => argName.value
		)
		const funcValue = new FunctionValue(
			funcName,
			bodyNode,
			argNames,
			node.shouldAutoReturn
		)
			.setContext(context)
			.setPos(node.posStart, node.posEnd)

		if (node.varNameToken) {
			context.symbolTable?.set(funcName, funcValue)
		}

		return res.success(funcValue)
	}

	visitCallNode(node: CallNode, context: Context): RunTimeResult {
		const res = new RunTimeResult()
		const args: Value[] = []
		let valueToCall = res.register(this.visit(node.nodeToCall, context))
		if (res.shouldReturn()) return res
		valueToCall = valueToCall.copy().setPos(node.posStart, node.posEnd)

		for (const argNode of node.argNodes) {
			args.push(res.register(this.visit(argNode, context)))
			if (res.shouldReturn()) return res
		}

		const returnValue = res.register(valueToCall.execute(args))
		if (res.shouldReturn()) return res

		return res.success(
			returnValue
				.copy()
				.setPos(node.posStart, node.posEnd)
				.setContext(context)
		)
	}

	visitReturnNode(node: ReturnNode, context: Context): RunTimeResult {
		const res = new RunTimeResult()

		let value: Value
		if (node.nodeToReturn) {
			value = res.register(this.visit(node.nodeToReturn, context))
			if (res.shouldReturn()) return res
		} else {
			value = NumberValue.null
		}

		return res.successReturn(value)
	}

	visitContinueNode(node: ContinueNode, context: Context): RunTimeResult {
		return new RunTimeResult().successContinue()
	}

	visitBreakNode(node: BreakNode, context: Context): RunTimeResult {
		return new RunTimeResult().successBreak()
	}
}
