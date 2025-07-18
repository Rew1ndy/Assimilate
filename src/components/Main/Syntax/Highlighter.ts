import type { ObjectProps } from "../../Types/Types";
import * as monaco from 'monaco-editor'

export const generateCompletionsFromTypes = (
    obj: ObjectProps,
    model: monaco.editor.ITextModel,
    position: monaco.Position
    ): monaco.languages.CompletionItem[] => {
        const range = new monaco.Range(
            position.lineNumber,
            Math.max(1, position.column),
            position.lineNumber,
            position.column
        )

        let match: RegExpMatchArray | null = ["", ""];
        let missMatch: Boolean = false;
        let startingLine = range.startLineNumber;
        for (let i = startingLine; i > 0; i--) {
            let mLine = model.getLineContent(i)
            if (mLine.trim() === "}," && !missMatch) {
                missMatch = true;
                console.log("Found missMatch: ", mLine);
            }
            console.log(mLine);
            match = mLine.match(/(\w+)\s*:\s*{?$/);
            if (match) {
                if (missMatch) {
                    missMatch = false;
                    console.log("Missmatch fixed")
                    continue;
                }
                break;
            }

        }

        const suggestions: monaco.languages.CompletionItem[] = []

        const traverse = (node: any, path: string[] = []) => {
            for (const key in node) {
            const newPath = [...path, key]
            const value = node[key]

            if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
                traverse(value, newPath)
            } else {
                let ind = null;

                for (let i = 0; i < newPath.length; i++) {
                    if (match && newPath[i] == match[1]) {
                        console.log("Index found: ", i) //
                        ind = i+2;
                    }
                }

                if (ind && newPath.length == ind) {
                suggestions.push({
                    label: key,
                    insertText: `"${key}": ${JSON.stringify(value)}`,
                    kind: monaco.languages.CompletionItemKind.Property,
                    documentation: `Тип: ${typeof value}`,
                    range,
                })
                }
            }
        }
    }

    traverse(obj);
    return suggestions;
}
