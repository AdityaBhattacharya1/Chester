export class SymbolTable {
	symbols: any
	parent: SymbolTable | null
	constructor() {
		this.symbols = {}
		this.parent = null
	}

	get(name: string): any {
		let value = this.symbols ? this.symbols[name] : null
		if (value === null && this.parent) {
			return this.parent.get(name)
		}
		return value
	}

	set(name: string, value: any) {
		this.symbols[name] = value
	}

	remove(name: string) {
		delete this.symbols[name]
	}
}
