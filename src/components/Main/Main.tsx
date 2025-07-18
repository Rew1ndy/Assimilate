import { useEffect, useRef, useState } from "react";
import { Editor } from "@monaco-editor/react";
import { styled, ThemeProvider } from '@mui/material/styles';
import { Checkbox, Slider, Button, Box, Tabs, Tab, Collapse } from "@mui/material";
import { CloudUpload, ChevronLeft, ChevronRight, Info, PlayCircleOutline } from '@mui/icons-material'

import { defaultObjectProps, type ObjectProps } from "../Types/Types";
import { DSLtoJSONString, stringifyToDsl } from "./Syntax/DslFormatter";
import { generateCompletionsFromTypes } from "./Syntax/Highlighter";
import * as monaco from 'monaco-editor'
import { customTheme } from "../../Themes/Theme";
import ModelCanvas from "../Model/ModelCanvas";

import "./main.css";

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

interface TabPanelProps {
  children: React.ReactNode
  value: number
  index: number
}

const TabPanel = ({ children, value, index }: TabPanelProps) => (
  value === index ? <Box sx={{ p: 2 }}>{children}</Box> : null
)

const defaultProps: ObjectProps = {
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
}

export default function Main() {
    const [fileUpload, setFileUpload] = useState<File | null>(null);
    const [fileURL, setFileURL] = useState<string>("");
    const [editorText, setEditorText] = useState<string | undefined>();
    const editorRef = useRef<monaco.editor.IStandaloneCodeEditor | null>(null);
    const [objectProps, setObjectProps] = useState<ObjectProps>(defaultProps);
    const [tabValue, setTabValue] = useState(0);
    const [isHint, setHint] = useState(true);

    const tabs = [
        { label: 'Config', content: 'Configure object and camera properties to define the scene layout.' },
        { label: 'Vertex', content: 'Use the vertex shader to manipulate geometry and control vertex positions.' },
        { label: 'Fragment', content: 'Use the fragment shader to define pixel colors, lighting, and visual effects.' }
    ]

    const handleFileUpload = (obj: { target: HTMLInputElement; }) => {
        const file = obj.target.files?.[0] || null;
        setFileUpload(file);
    }

    const updateObjectPath = (path: string, value: any) => {
        const keys: string[] = path.split('.')

        setObjectProps(prev => {
            const updated = structuredClone(prev)
            let pointer: any = updated

            for (let i = 0; i < keys.length - 1; i++) {
                pointer[keys[i]] = { ...pointer[keys[i]] }
                pointer = pointer[keys[i]]
            }

            pointer[keys.at(-1)!] = value
            return updated
        })
    }

    const isValidByTemplate = (template: any, obj: any): boolean => {
        if (typeof template !== typeof obj) return false
        if (Array.isArray(template)) {
            return Array.isArray(obj) && obj.length === template.length
        }
        if (typeof template === 'object' && template !== null) {
            for (const key in template) {
            if (!(key in obj)) return false
            if (!isValidByTemplate(template[key], obj[key])) return false
            }
        }
        return true
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
                const value = JSON.parse(editorText);
                // console.log("Editor text: ", editorText);
                if (isValidByTemplate(defaultProps, value)) setObjectProps(value);
                else console.error("Check valid types pls");
            } catch (error) {
                console.log(error) 
            }
        }
    }, [editorText]);

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
                            startIcon={<CloudUpload />}
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
                    <div className="editor-tabs">
                        <Box sx={{ width: '100%' }}>
                            <Tabs 
                                value={tabValue} 
                                onChange={(_, c) => { 
                                    setTabValue(c); 
                                    setTimeout(() => {
                                        setHint(true)
                                    }, 100);
                                }} 
                                textColor="primary" 
                                indicatorColor="primary"
                            >
                                {tabs.map((tab, i) => (
                                <Tab 
                                    key={i} 
                                    label={tab.label} 
                                    onClick={() => {
                                        if (i === tabValue) {
                                            setHint(!isHint);
                                        }
                                    }}
                                />
                                ))}
                            </Tabs>
                            {tabs.map((tab, i) => (
                                <TabPanel key={i} value={tabValue} index={i}>
                                    <Collapse in={isHint} timeout="auto" unmountOnExit>
                                        {tab.content}
                                    </Collapse>
                                </TabPanel>
                            ))}
                            {/* { isHint && tabs.map((tab, i) => (
                                <TabPanel key={i} value={tabValue} index={i}>
                                    {tab.content}
                                </TabPanel>
                            ))} */}
                        </Box>
                    </div>
                   <Editor
                        value={stringifyToDsl(objectProps)}
                        theme="vs-dark"
                        language="dsl"
                        onMount={(editor, monaco) => {
                            editorRef.current = editor
                            monaco.languages.register({ id: 'dsl' })
                                monaco.languages.setMonarchTokensProvider('dsl', {
                                    tokenizer: {
                                        root: [
                                        // Комментарии
                                        [/^\s*#.*$/, 'comment'],

                                        // Заголовки секций: object.rotation:
                                        [/^[\w.]+:/, 'type.identifier'],

                                        // Ключ = значение
                                        [/\b\w+\b(?=\s*=)/, 'variable.name'],
                                        [/=/, 'operator'],

                                        // Строки
                                        [/"[^"]*"/, 'string'],

                                        // Числа
                                        [/\b\d+(\.\d+)?\b/, 'number'],

                                        // Массивы (простые)
                                        [/\[.*?\]/, 'number'],

                                        // Булевы
                                        [/\b(true|false)\b/, 'keyword.constant'],

                                        // Прочее
                                        [/[{}[\],]/, 'delimiter']
                                        ]
                                    }
                                })
                            monaco.languages.registerCompletionItemProvider('dsl', {
                                provideCompletionItems: (model, position) => {
                                    return {
                                        suggestions: generateCompletionsFromTypes(defaultObjectProps, model, position),
                                    }
                                }
                            })
                            monaco.languages.json.jsonDefaults.setDiagnosticsOptions({
                                validate: false,
                                allowComments: true,
                                schemas: []
                            })
                        }
                    }
                    />
                    <div className="editor-buttons" style={{ display: 'flex', gap: 12 }}>
                        <Button 
                            color="primary" 
                            variant="outlined" 
                            endIcon={<PlayCircleOutline />}
                            onClick={() => {
                                if (editorRef?.current) {
                                    setEditorText(DSLtoJSONString(editorRef.current.getValue()))
                                }
                            }}
                        />
                        <Button 
                            variant="contained" 
                            color="secondary" 
                            endIcon={<ChevronLeft />} 
                            onClick={() => {
                                updateObjectPath("object.rotation.direction", -1)
                            }}
                        />
                        <Button 
                            variant="contained" 
                            color="secondary" 
                            endIcon={<ChevronRight />} 
                            onClick={() => {
                                updateObjectPath("object.rotation.direction", 1)
                            }}
                        />
                        <Checkbox 
                            defaultChecked 
                            onChange={(e) => {
                                updateObjectPath("object.rotation.direction", e.target.checked)
                            }}
                            />
                        <Button variant="outlined" color="info" endIcon={<Info />}>
                        </Button>
                    </div>
                    <Slider
                        aria-label="Rotation speed"
                        defaultValue={objectProps.object.rotation.speed}
                        value={objectProps.object.rotation.speed}
                        onChange={(_, value) => {
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