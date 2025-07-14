import React, { useEffect, useRef, useState } from "react";
import { styled, ThemeProvider } from '@mui/material/styles';
import Button from '@mui/material/Button';
import Slider from '@mui/material/Slider';
import { CheckBox } from "@mui/icons-material";
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import { Editor } from "@monaco-editor/react";
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import InfoIcon from '@mui/icons-material/Info';
import PlayCircleOutlineIcon from '@mui/icons-material/PlayCircleOutline';
import { customTheme } from "../../Themes/Theme";
import * as monaco from 'monaco-editor'
import "./main.css";
import { defaultObjectProps, type ObjectProps } from "../Types/Types";
import ModelCanvas from "../Model/ModelCanvas";
import { Checkbox } from "@mui/material";

const VisuallyHiddenInput = styled('input')({
  clip: 'rect(0 0 0 0)',
  clipPath: 'inset(50%)',
  height: 1,
  overflow: 'hidden',
  position: 'absolute',
  bottom: 0,
  left: 0,
  whiteSpace: 'nowrap',
  width: 1,
});

export default function Main() {
    const [fileUpload, setFileUpload] = useState<File | null>(null);
    const [fileURL, setFileURL] = useState<string>("");
    const [editorText, setEditorText] = useState<string | undefined>();
    const editorRef = useRef<monaco.editor.IStandaloneCodeEditor | null>(null)
    const [objectProps, setObjectProps] = useState<ObjectProps>({
        object: {
            rotation: { 
                axis: 'z', 
                speed: 0.005, 
                direction: 1,
                isRotating: true,
            },
            scale: [1, 1, 1],
            position: [0, 0, 0],
        },
        camera: {
            fov: 60,
            position: [0, -3, 1],
        }
    })

    const handleFileUpload = (obj: { target: HTMLInputElement; }) => {
        const file = obj.target.files?.[0] || null;
        setFileUpload(file);
    }

    const updateObjectPath = (path: string, value: any, reverce: boolean = false) => {
        const keys = path.split('.')

        setObjectProps(prev => {
            const updated = structuredClone(prev)
            let pointer = updated

            for (let i = 0; i < keys.length - 1; i++) {
            pointer[keys[i]] = { ...pointer[keys[i]] }
            pointer = pointer[keys[i]]
            }

            pointer[keys.at(-1)!] = value
            return updated
        })
    }


    function formatCompactArrays(obj: any): string {
        const json = JSON.stringify(obj, null, 2)

        // Ищет массивы типа: [\n  0,\n  -3,\n  1\n]
        return json.replace(/\[\s*([\d\s.,-]+?)\s*\]/g, (match) => {
            const compact = match.replace(/\s+/g, ' ').trim()
            return compact
        })
    }

    useEffect(() => {
        console.log(fileUpload);
        if (fileUpload) {
            setFileURL(URL.createObjectURL(fileUpload));
        }
    }, [fileUpload])

    useEffect(() => {
        if (editorText) {
            try {
                setObjectProps(JSON.parse(editorText));
            } catch (error) {
                // console.log(JSON.parse(editorText));
                // setObjectProps(objBK);
                console.log(error) 
            }
        }
    }, [editorText]);

    const generateCompletionsFromTypes = (
        obj: ObjectProps,
        model: monaco.editor.ITextModel,
        position: monaco.Position
        ): monaco.languages.CompletionItem[] => {
            const word = model.getWordUntilPosition(position)
            const range = new monaco.Range(
                position.lineNumber,
                word.startColumn,
                position.lineNumber,
                word.endColumn
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
                match = mLine.match(/"(\w+)"\s*:\s*{?$/);
                if (match) {
                    if (missMatch) {
                        missMatch = false;
                        console.log("Missmatch fixed")
                        continue;
                    }
                    break;
                }

            }

            console.log(match);

            const suggestions: monaco.languages.CompletionItem[] = []

            const traverse = (node: any, path: string[] = []) => {
                for (const key in node) {
                const newPath = [...path, key]
                const value = node[key]
                const fullPath = newPath.join('.')

                if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
                    traverse(value, newPath)
                } else {
                    console.group();
                        let ind = null;

                        console.log(newPath) //

                        for (let i = 0; i < newPath.length; i++) {
                            if (match && newPath[i] == match[1]) {
                                console.log("Index found: ", i) //
                                ind = i+2;
                            }
                        }

                        console.log("Length: ", newPath.length); //

                        if (ind && newPath.length == ind) {
                            console.log(key); //
                        }
                    console.groupEnd();

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


    return (
        <ThemeProvider theme={customTheme}>
            <div className="main">
                <div className="canvas">
                    <div className="d"></div>
                    <ModelCanvas url={fileURL} obj={objectProps} />
                    <Button
                            component="label"
                            role={undefined}
                            variant="contained"
                            color="secondary"
                            tabIndex={-1}
                            startIcon={<CloudUploadIcon />}
                        >
                        Upload files
                        <VisuallyHiddenInput
                            type="file"
                            accept=".stl,.glb"
                            onChange={handleFileUpload} 
                            multiple={false}
                        />
                    </Button>
                </div>

                <div className="editor">
                   <Editor
                        // defaultLanguage="json"
                        value={formatCompactArrays(objectProps)}
                        theme="vs-dark"
                        language="json"
                        onMount={(editor, monaco) => {
                        editorRef.current = editor
                        monaco.languages.registerCompletionItemProvider('json', {
                            provideCompletionItems: (model, position) => {
                                return {
                                    // suggestions: generateCompletionsFromTypes(objectProps),
                                    suggestions: generateCompletionsFromTypes(defaultObjectProps, model, position),
                                }
                            }
                        })
                    }}
                    />
                    <div className="editor-buttons" style={{ display: 'flex', gap: 12 }}>
                        <Button 
                            color="primary" 
                            variant="outlined" 
                            endIcon={<PlayCircleOutlineIcon />}
                            onClick={() => {
                                setEditorText(editorRef.current?.getValue())
                            }}
                        />
                        <Button 
                            variant="contained" 
                            color="secondary" 
                            endIcon={<ChevronLeftIcon />} 
                            // onClick={() => updateDirection(-1)}
                            onClick={() => {
                                updateObjectPath("object.rotation.direction", -1)
                            }}
                        />
                        <Button 
                            variant="contained" 
                            color="secondary" 
                            endIcon={<ChevronRightIcon />} 
                            onClick={() => {
                                updateObjectPath("object.rotation.direction", 1)
                            }}
                        />
                        <Checkbox 
                            onChange={(e) => {
                                updateObjectPath("object.rotation.direction", e.target.checked)} 
                            }
                            defaultChecked 
                            />
                        <Button variant="outlined" color="info" endIcon={<InfoIcon />}>
                        </Button>
                    </div>
                    <Slider
                        aria-label="Rotation speed"
                        defaultValue={objectProps.object.rotation.speed}
                        value={objectProps.object.rotation.speed}
                        onChange={(e, value) => {
                            if (typeof value === 'number') {
                                updateObjectPath("object.rotation.speed", value)
                            }
                        }}
                        step={0.001}
                        marks
                        min={0.001}
                        max={0.01}
                        valueLabelDisplay="auto"
                    />
                </div>
            </div>
        </ThemeProvider>

    )
}