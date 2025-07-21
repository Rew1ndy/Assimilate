import type { ObjectProps } from "../../Types/Types";
import * as monaco from 'monaco-editor'
import type { languages } from 'monaco-editor'

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
                    insertText: `${key} = ${JSON.stringify(value)}`,
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

export const conf: languages.LanguageConfiguration = {
  comments: {
    lineComment: '//',
    blockComment: ['/*', '*/']
  },
  brackets: [
    ['{', '}'],
    ['[', ']'],
    ['(', ')']
  ],
  autoClosingPairs: [
    { open: '[', close: ']' },
    { open: '{', close: '}' },
    { open: '(', close: ')' },
    { open: "'", close: "'", notIn: ['string', 'comment'] },
    { open: '"', close: '"', notIn: ['string'] }
  ],
  surroundingPairs: [
    { open: '{', close: '}' },
    { open: '[', close: ']' },
    { open: '(', close: ')' },
    { open: '"', close: '"' },
    { open: "'", close: "'" }
  ]
}

export const GLSLKeywords = [
  'const', 'uniform', 'break', 'continue',
  'do', 'for', 'while', 'if', 'else', 'switch', 'case', 'in', 'out', 'inout', 'true', 'false',
  'invariant', 'discard', 'return', 'sampler2D', 'samplerCube', 'sampler3D', 'struct',
  'radians', 'degrees', 'sin', 'cos', 'tan', 'asin', 'acos', 'atan', 'pow', 'sinh', 'cosh', 'tanh', 'asinh', 'acosh', 'atanh',
  'exp', 'log', 'exp2', 'log2', 'sqrt', 'inversesqrt', 'abs', 'sign', 'floor', 'ceil', 'round', 'roundEven', 'trunc', 'fract', 'mod', 'modf',
  'min', 'max', 'clamp', 'mix', 'step', 'smoothstep', 'length', 'distance', 'dot', 'cross ',
  'determinant', 'inverse', 'normalize', 'faceforward', 'reflect', 'refract', 'matrixCompMult', 'outerProduct', 'transpose', 'lessThan ',
  'lessThanEqual', 'greaterThan', 'greaterThanEqual', 'equal', 'notEqual', 'any', 'all', 'not', 'packUnorm2x16', 'unpackUnorm2x16', 'packSnorm2x16', 'unpackSnorm2x16', 'packHalf2x16', 'unpackHalf2x16',
  'dFdx', 'dFdy', 'fwidth', 'textureSize', 'texture', 'textureProj', 'textureLod', 'textureGrad', 'texelFetch', 'texelFetchOffset',
  'textureProjLod', 'textureLodOffset', 'textureGradOffset', 'textureProjLodOffset', 'textureProjGrad', 'intBitsToFloat', 'uintBitsToFloat', 'floatBitsToInt', 'floatBitsToUint', 'isnan', 'isinf',
  'vec2', 'vec3', 'vec4', 'ivec2', 'ivec3', 'ivec4', 'uvec2', 'uvec3', 'uvec4', 'bvec2', 'bvec3', 'bvec4',
  'mat2', 'mat3', 'mat2x2', 'mat2x3', 'mat2x4', 'mat3x2', 'mat3x3', 'mat3x4', 'mat4x2', 'mat4x3', 'mat4x4', 'mat4',
  'float', 'int', 'uint', 'void', 'bool',
]

export const language: languages.IMonarchLanguage = {
  tokenPostfix: '.glsl',
  // Set defaultToken to invalid to see what you do not tokenize yet
  defaultToken: 'invalid',
  BaseKeywords: ['uniform', 'varying', 'attribute', 'void', 'float', 'vec2', 'vec3', 'vec4', 'mat4', 'return', 'main'],
  keywords: GLSLKeywords,
  operators: [
    '=',
    '>',
    '<',
    '!',
    '~',
    '?',
    ':',
    '==',
    '<=',
    '>=',
    '!=',
    '&&',
    '||',
    '++',
    '--',
    '+',
    '-',
    '*',
    '/',
    '&',
    '|',
    '^',
    '%',
    '<<',
    '>>',
    '>>>',
    '+=',
    '-=',
    '*=',
    '/=',
    '&=',
    '|=',
    '^=',
    '%=',
    '<<=',
    '>>=',
    '>>>='
  ],
  symbols: /[=><!~?:&|+\-*\/\^%]+/,
  escapes: /\\(?:[abfnrtv\\"']|x[0-9A-Fa-f]{1,4}|u[0-9A-Fa-f]{4}|U[0-9A-Fa-f]{8})/,
  integersuffix: /([uU](ll|LL|l|L)|(ll|LL|l|L)?[uU]?)/,
  floatsuffix: /[fFlL]?/,
  encoding: /u|u8|U|L/,

  tokenizer: {
    root: [
      // identifiers and keywords
      [
        /[a-zA-Z_]\w*/,
        {
          cases: {
            // '@keywords': { token: 'keyword.$0' },
            '@keywords': 'keyword',
            '@BaseKeywords': 'type.identifier',
            '@default': 'identifier'
          }
        }
      ],

      // Preprocessor directive (#define)
      [/^\s*#\s*\w+/, 'keyword.directive'],

      // whitespace
      { include: '@whitespace' },

      // delimiters and operators
      [/[{}()\[\]]/, '@brackets'],
      [/@symbols/, {
        cases: {
          '@operators': 'operator',
          '@default': ''
        }
      }],

      // numbers
      [/\d*\d+[eE]([\-+]?\d+)?(@floatsuffix)/, 'number.float'],
      [/\d*\.\d+([eE][\-+]?\d+)?(@floatsuffix)/, 'number.float'],
      [/0[xX][0-9a-fA-F']*[0-9a-fA-F](@integersuffix)/, 'number.hex'],
      [/0[0-7']*[0-7](@integersuffix)/, 'number.octal'],
      [/0[bB][0-1']*[0-1](@integersuffix)/, 'number.binary'],
      [/\d[\d']*\d(@integersuffix)/, 'number'],
      [/\d(@integersuffix)/, 'number'],

      // delimiter: after number because of .\d floats
      [/[;,.]/, 'delimiter']
    ],

    comment: [
      [/[^\/*]+/, 'comment'],
      [/\/\*/, 'comment', '@push'],
      ['\\*/', 'comment', '@pop'],
      [/[\/*]/, 'comment']
    ],

    // Does it have strings?
    string: [
      [/[^\\"]+/, 'string'],
      [/@escapes/, 'string.escape'],
      [/\\./, 'string.escape.invalid'],
      [/"/, {
        token: 'string.quote',
        bracket: '@close',
        next: '@pop'
      }]
    ],

    whitespace: [
      [/[ \t\r\n]+/, 'white'],
      [/\/\*/, 'comment', '@comment'],
      [/\/\/.*$/, 'comment']
    ]
  }
}