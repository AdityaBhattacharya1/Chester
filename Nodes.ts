import { Node } from './Interpreter'
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

	asString() {
		return this.token.asString()
	}
}

export class StringNode {
	token: Token
	posStart: Position
	posEnd: Position

	constructor(token: Token) {
		this.token = token
		this.posStart = this.token.posStart
		this.posEnd = this.token.posEnd
	}

	asString() {
		return this.token.asString()
	}
}

export class ListNode {
	elementNodes: Node[]
	posStart: Position
	posEnd: Position

	constructor(elementNodes: Node[], posStart: Position, posEnd: Position) {
		this.elementNodes = elementNodes
		this.posStart = posStart
		this.posEnd = posEnd
	}
}

export class BinaryOperatorNode {
	leftNode: Node
	operationToken: Token
	rightNode: Node
	posStart: Position
	posEnd: Position
	constructor(leftNode: Node, operationToken: Token, rightNode: Node) {
		this.leftNode = leftNode
		this.operationToken = operationToken
		this.rightNode = rightNode

		this.posStart = this.leftNode.posStart
		this.posEnd = this.rightNode.posEnd
	}

	asString() {
		return `(${this.leftNode}, ${this.operationToken}, ${this.rightNode})`
	}
}

export class UnaryOperatorNode {
	operationToken: Token
	node: Node
	posStart: Position
	posEnd: Position
	constructor(operationToken: Token, node: Node) {
		this.operationToken = operationToken
		this.node = node

		this.posStart = this.operationToken.posStart
		this.posEnd = node.posEnd
	}

	asString() {
		return `(${this.operationToken}, ${this.node})`
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
	valueNode: Node
	posStart: Position
	posEnd: Position
	constructor(varNameToken: Token, valueNode: Node) {
		this.varNameToken = varNameToken
		this.valueNode = valueNode
		this.posStart = this.varNameToken.posStart
		this.posEnd = this.varNameToken.posEnd
	}
}

export class IfNode {
	cases: any
	elseCase: any
	posStart: Position
	posEnd: Position

	constructor(cases: any, elseCase: any) {
		this.cases = cases
		this.elseCase = elseCase
		this.posStart = this.cases[0][0].posStart
		this.posEnd = (this.elseCase ||
			this.cases[this.cases.length - 1])[0].posEnd
	}
}

export class ForNode {
	varNameToken: Token
	startValueNode: Node
	endValueNode: Node
	stepValueNode: Node
	bodyNode: Node
	shouldReturnNull: any

	posStart: Position
	posEnd: Position

	constructor(
		varNameToken: Token,
		startValueNode: Node,
		endValueNode: Node,
		stepValueNode: Node,
		bodyNode: Node,
		shouldReturnNull: any
	) {
		this.varNameToken = varNameToken
		this.startValueNode = startValueNode
		this.endValueNode = endValueNode
		this.stepValueNode = stepValueNode
		this.bodyNode = bodyNode
		this.shouldReturnNull = shouldReturnNull

		this.posStart = this.varNameToken.posStart
		this.posEnd = this.bodyNode.posEnd
	}
}

export class WhileNode {
	conditionNode: Node
	bodyNode: Node
	shouldReturnNull: boolean

	posStart: Position
	posEnd: Position

	constructor(
		conditionNode: Node,
		bodyNode: Node,
		shouldReturnNull: boolean
	) {
		this.conditionNode = conditionNode
		this.bodyNode = bodyNode
		this.shouldReturnNull = shouldReturnNull

		this.posStart = this.conditionNode.posStart
		this.posEnd = this.bodyNode.posEnd
	}
}

export class FunctionDefinitionNode {
	varNameToken: Token | null
	argNameTokens: Token[]
	bodyNode: Node
	shouldAutoReturn: any

	posStart: Position
	posEnd: Position

	constructor(
		varNameToken: Token | null,
		argNameTokens: Token[],
		bodyNode: Node,
		shouldAutoReturn: any
	) {
		this.varNameToken = varNameToken
		this.argNameTokens = argNameTokens
		this.bodyNode = bodyNode

		this.shouldAutoReturn = shouldAutoReturn

		if (this.varNameToken) {
			this.posStart = this.varNameToken.posStart
		} else if (this.argNameTokens.length > 0) {
			this.posStart = this.argNameTokens[0].posStart
		} else {
			this.posStart = this.bodyNode.posStart
		}

		this.posEnd = this.bodyNode.posEnd
	}
}

export class CallNode {
	nodeToCall: Node
	argNodes: Node[]
	posStart: Position
	posEnd: Position

	constructor(nodeToCall: Node, argNodes: Node[]) {
		this.nodeToCall = nodeToCall
		this.argNodes = argNodes
		this.posStart = this.nodeToCall.posStart

		if (this.argNodes.length > 0) {
			this.posEnd = this.argNodes[this.argNodes.length - 1].posEnd
		} else {
			this.posEnd = this.nodeToCall.posEnd
		}
	}
}

export class ReturnNode {
	nodeToReturn: Node
	posStart: Position
	posEnd: Position

	constructor(nodeToReturn: Node, posStart: Position, posEnd: Position) {
		this.nodeToReturn = nodeToReturn
		this.posStart = posStart
		this.posEnd = posEnd
	}
}

export class ContinueNode {
	posStart: Position
	posEnd: Position
	constructor(posStart: Position, posEnd: Position) {
		this.posStart = posStart
		this.posEnd = posEnd
	}
}

export class BreakNode {
	posStart: Position
	posEnd: Position
	constructor(posStart: Position, posEnd: Position) {
		this.posStart = posStart
		this.posEnd = posEnd
	}
}
