import { run } from './index'
const prompt = require('prompt-sync')()

while (true) {
	let textInput = prompt('REPL > ')
	let [result, error] = run('<stdin>', textInput)

	error ? console.log(error.asString()) : console.log(result)
}
