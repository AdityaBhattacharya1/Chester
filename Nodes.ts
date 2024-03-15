import { Position } from './Position'
import { Token } from './Token'

export class NumberNode {
	token: Token
	posStart: Position
	posEnd: Position
	constructor(token: Token) {
		this.token = token
		this.posStart = this.token.posStart
		this.posEnd = this.token.posEnd
	}
}
export class BinaryOperatorNode {
	leftNode: any
	operationToken: Token
	rightNode: any
	posStart: Position
	posEnd: Position
	constructor(leftNode: any, operationToken: Token, rightNode: any) {
		this.leftNode = leftNode
		this.operationToken = operationToken
		this.rightNode = rightNode

		this.posStart = this.leftNode.posStart
		this.posEnd = this.rightNode.posEnd
	}
}
export class UnaryOperatorNode {
	operationToken: Token
	node: any
	posStart: Position
	posEnd: Position
	constructor(operationToken: Token, node: any) {
		this.operationToken = operationToken
		this.node = node

		this.posStart = this.operationToken.posStart
		this.posEnd = node.posEnd
	}
}

export class VarAccessNode {
	varNameToken: Token
	posStart: Position
	posEnd: Position
	constructor(varNameToken: Token) {
		this.varNameToken = varNameToken
		this.posStart = this.varNameToken.posStart
		this.posEnd = this.varNameToken.posEnd
	}
}

export class VarAssignNode {
	varNameToken: Token
	valueNode: any
	posStart: Position
	posEnd: Position
	constructor(varNameToken: Token, valueNode: any) {
		this.varNameToken = varNameToken
		this.valueNode = valueNode
		this.posStart = this.varNameToken.posStart
		this.posEnd = this.varNameToken.posEnd
	}
}
