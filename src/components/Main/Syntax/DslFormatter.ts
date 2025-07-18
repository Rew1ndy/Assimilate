export function stringifyToDsl(obj: any): string {
    const lines: string[] = []

    const traverse = (node: any, path: string[] = []) => {
        const indent = '  '
        const section = path.join('.')
        const contentLines: string[] = []

        for (const key in node) {
        const value = node[key]

        if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
            // вложенный объект — новая секция
            traverse(value, [...path, key])
        } else {
            const serialized =
            Array.isArray(value) ? `[${value.join(', ')}]` :
            typeof value === 'string' ? `"${value}"` :
            `${value}`

            contentLines.push(`${indent}${key} = ${serialized}`)
        }
        }

        if (contentLines.length) {
        lines.push(`${section}:`)
        lines.push(...contentLines)
        lines.push('')
        }
    }
    lines.push("# Object Settings:")
    traverse(obj)
    return lines.join('\n')
}

export function DSLtoJSONString(str: string): string {
    const lines = str.split('\n')
    const result: any = {}
    let currentPath: string[] = []

    for (const raw of lines) {
        const line = raw.trim()
        if (!line || line.startsWith('//') || line.startsWith('#')) continue

        const sectionMatch = line.match(/^([\w.]+):$/)
        if (sectionMatch) {
        currentPath = sectionMatch[1].split('.')
        continue
        }

        const kvMatch = line.match(/^(\w+)\s*=\s*(.+)$/)
        if (!kvMatch || currentPath.length === 0) continue

        const [ , key, rawValue ] = kvMatch
        let value: any = rawValue.trim()

        // Типизация значений
        if (value === 'true') value = true
        else if (value === 'false') value = false
        else if (/^".*"$/.test(value)) value = value.slice(1, -1)
        else if (/^\[.*\]$/.test(value)) {
        try { value = JSON.parse(value) } catch { value = [] }
        }
        else if (!isNaN(Number(value))) value = parseFloat(value)

        // Вставка по вложенному пути
        let pointer = result
        for (const segment of currentPath) {
        if (!(segment in pointer)) pointer[segment] = {}
        pointer = pointer[segment]
        }
        pointer[key] = value
    }

    return JSON.stringify(result, null, 2)
}