import { run } from './index'
import fs from 'fs'

const filename = process.argv[2]

if (!filename) {
	console.log('Usage: node cli.js <filename>')
	process.exit(1)
}

try {
	const fileContent = fs.readFileSync(filename, 'utf8')
	let [result, error] = run(filename, fileContent)

	if (error) {
		console.log(error.asString())
	} else if (result !== null && result !== undefined) {
		let shouldPrint = true
		if (
			result.constructor &&
			result.constructor.name === 'ListValue' &&
			Array.isArray(result.elements)
		) {
			const filtered = result.elements.filter(
				(e: any) =>
					e !== null &&
					e !== undefined &&
					!(
						typeof e.asString === 'function' &&
						(e.asString() === '' || e.asString() === '[]')
					)
			)
			// Heuristic: if file content is a single line and starts with '[', treat as list literal
			if (fileContent.trim().startsWith('[')) {
				console.log(
					'[' +
						filtered
							.map((e: any) =>
								typeof e.asString === 'function'
									? e.asString()
									: String(e)
							)
							.join(', ') +
						']'
				)
				shouldPrint = false
			} else if (filtered.length > 0) {
				const last = filtered[filtered.length - 1]
				// If the last statement is a print statement, don't print its value again
				const lines = fileContent
					.trim()
					.split(/\r?\n/)
					.filter((l) => l.trim() !== '')
				const lastLine = lines[lines.length - 1].trim()
				if (/^print\s*\(/.test(lastLine)) {
					shouldPrint = false
				}
				if (shouldPrint) {
					if (last && typeof last.asString === 'function') {
						console.log(last.asString())
					} else {
						console.log(last)
					}
				}
				shouldPrint = false
			}
		} else if (
			typeof result.asString === 'function' &&
			result.asString() !== '' &&
			result.asString() !== '[]'
		) {
			// If the file is a single print statement, don't print again
			const lines = fileContent
				.trim()
				.split(/\r?\n/)
				.filter((l) => l.trim() !== '')
			const lastLine = lines[lines.length - 1].trim()
			if (!/^print\s*\(/.test(lastLine)) {
				console.log(result.asString())
			}
		}
	}
} catch (err) {
	console.log(`Error reading file: ${(err as Error).message}`)
}
