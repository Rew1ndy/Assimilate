export function formatCompactArrays(obj: any): string {
    const json = JSON.stringify(obj, null, 2)

    // Ищет массивы типа: [\n  0,\n  -3,\n  1\n]
    return json.replace(/\[\s*([\d\s.,-]+?)\s*\]/g, (match) => {
        const compact = match.replace(/\s+/g, ' ').trim()
        return compact
    })
}