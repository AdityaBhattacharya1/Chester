import { Context } from './Context'
import {
	BinaryOperatorNode,
	NumberNode,
	UnaryOperatorNode,
	VarAccessNode,
	VarAssignNode,
} from './Nodes'
import { RunTimeResult } from './Parser'
import { Number } from './Number'
import { TT_DIV, TT_MINUS, TT_MUL, TT_PLUS, TT_POW } from './Constants'
import { RunTimeError } from './Errors'
import { Position } from './Position'

type Node = NumberNode | UnaryOperatorNode | BinaryOperatorNode

export class Interpreter {
	visit(node: Node, context: Context): any {
		let methodName
		if (node instanceof NumberNode) methodName = 'visitNumberNode'
		if (node instanceof BinaryOperatorNode)
			methodName = 'visitBinaryOperatorNode'
		if (node instanceof UnaryOperatorNode)
			methodName = 'visitUnaryOperatorNode'
		if (node instanceof VarAccessNode) methodName = 'visitVarAccessNode'
		if (node instanceof VarAssignNode) methodName = 'visitVarAssignNode'
		switch (methodName) {
			case 'visitNumberNode':
				return this.visitNumberNode(node as NumberNode, context)
			case 'visitBinaryOperatorNode':
				return this.visitBinaryOperatorNode(
					node as BinaryOperatorNode,
					context
				)
			case 'visitUnaryOperatorNode':
				return this.visitUnaryOperatorNode(
					node as UnaryOperatorNode,
					context
				)
			case 'visitVarAccessNode':
				return this.visitVarAccessNode(
					node as unknown as VarAccessNode,
					context
				)
			case 'visitVarAssignNode':
				return this.visitVarAssignNode(
					node as unknown as VarAssignNode,
					context
				)
			default:
				return this.noVisitMethod(node)
		}
	}

	noVisitMethod(node: Node) {
		throw new Error(`No visit${typeof node} method defined.`)
	}

	visitNumberNode(node: NumberNode, context: Context) {
		return new RunTimeResult().success(
			new Number(node.token.value)
				.setContext(context)
				.setPosition(node.posStart, node.posEnd)
		)
	}
	visitBinaryOperatorNode(node: BinaryOperatorNode, context: Context) {
		let res = new RunTimeResult()
		let left = res.register(this.visit(node.leftNode, context))
		if (res.error) return res
		let result, error

		let right = res.register(this.visit(node.rightNode, context))

		if (node.operationToken.type === TT_PLUS) {
			;[result, error] = left.addition(right)
		} else if (node.operationToken.type === TT_MINUS) {
			;[result, error] = left.subtraction(right)
		} else if (node.operationToken.type === TT_MUL) {
			;[result, error] = left.multiplication(right)
		} else if (node.operationToken.type === TT_DIV) {
			;[result, error] = left.division(right)
		} else if (node.operationToken.type === TT_POW) {
			;[result, error] = left.exponent(right)
		}

		return error
			? res.failure(error)
			: res.success(result.setPosition(node.posStart, node.posEnd))
	}
	visitUnaryOperatorNode(node: UnaryOperatorNode, context: Context) {
		let res = new RunTimeResult()
		let number = res.register(this.visit(node.node, context))
		if (res.error) return res

		let error
		if (node.operationToken.type === TT_MINUS) {
			;[number, error] = number.multiplication(new Number(-1))
		}

		return error
			? res.failure(error)
			: res.success(number.setPosition(node.posStart, node.posEnd))
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
		value = value.copy().setPosition(node.posStart, node.posEnd)
		return result.success(value)
	}

	visitVarAssignNode(node: VarAssignNode, context: Context) {
		let result = new RunTimeResult()
		let varName = node.varNameToken.value
		let value = result.register(this.visit(node.valueNode, context))
		if (result.error) return result

		context.symbolTable?.set(varName, value)
		return result.success(value)
	}
}
