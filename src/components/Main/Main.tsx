import { useEffect, useRef, useState } from "react";
import { Editor } from "@monaco-editor/react";
import { styled, ThemeProvider } from '@mui/material/styles';
import { Checkbox, Slider, Button, Box, Tabs, Tab, Collapse, FormControl, InputLabel, Select, MenuItem, TextField, Switch, FormControlLabel } from "@mui/material";
import { CloudUpload, ChevronLeft, ChevronRight, Info, PlayCircleOutline, ArrowBackIos } from '@mui/icons-material'

import { defaultObjectProps, DefaultTextureProps, TextureProps } from "../Types/Types";
import type { ObjectProps } from "../Types/Types";
import { DSLtoJSONString, stringifyToDsl } from "./Syntax/DslFormatter";
import { generateCompletionsFromTypes, language } from "./Syntax/Highlighter";
import * as monaco from 'monaco-editor'
import { customTheme } from "../../Themes/Theme";
import ModelCanvas from "../Model/ModelCanvas";
import { fragmentShader, vertexShader } from "../Model/Shaders";

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
};

export default function Main() {
    const [fileUpload, setFileUpload] = useState<File | null>(null);
    const [textureUpload, setTextureUpload] = useState<File[] | null>([]);
    const [fileURL, setFileURL] = useState<string>("");
    const [editorText, setEditorText] = useState<string | undefined>();
    const [objectProps, setObjectProps] = useState<ObjectProps>(defaultProps);
    const [vertexProps, setVertexProps] = useState<string>(vertexShader);
    const [fragmentProps, setFragmentProps] = useState<string>(fragmentShader);
    const [tabValue, setTabValue] = useState(0);
    const [isHint, setHint] = useState(true);
    const [panelWidth, setPanelWidth] = useState(30); // в процентах
    const [textureNavigator, setTextureNavigator] = useState("main");
    const [textureProps, setTextureProps] = useState<typeof DefaultTextureProps>(DefaultTextureProps)

    const editorRef = useRef<monaco.editor.IStandaloneCodeEditor | null>(null);
    const separatorDownRef = useRef<boolean>(false);
    const separatorRef = useRef<HTMLDivElement | null>(null);
    
    useEffect(() => {
        const separator = separatorRef.current;
        if (!separator) return;

        const onDown = () => handleSeparatorDown();
        const onMove = (e: MouseEvent) => handleSeparatorMove(e);
        const onUp = () => handleSeparatorUp();

        separator.addEventListener('mousedown', onDown);
        document.addEventListener('mousemove', onMove);
        document.addEventListener('mouseup', onUp);

        return () => {
            separator.removeEventListener('mousedown', onDown);
            document.removeEventListener('mousemove', onMove);
            document.removeEventListener('mouseup', onUp);
        };
    }, []); // Все обработчики стабильны
    
    const handleSeparatorMove = (e: MouseEvent) => {
        if (!separatorDownRef.current) return

        const rect = document.body.getBoundingClientRect();
        const newWidth = (1 - (e.clientX - rect.left) / rect.width) * 100;

        if (newWidth >= 20 && newWidth <= 80) {
            setPanelWidth(newWidth);
        }
    };

    const handleSeparatorDown = () => {
        separatorDownRef.current = true;
    };

    const handleSeparatorUp = () => {
        separatorDownRef.current = false;
    };

    const handleSwitchChange = (key, value) => {
        setTextureProps((prev) => ({ ...prev, [key]: value }));
    };


    const tabs = [
        { label: 'Config', content: 'Configure object and camera properties to define the scene layout.' },
        { label: 'Vertex', content: 'Use the vertex shader to manipulate geometry and control vertex positions.' },
        { label: 'Fragment', content: 'Use the fragment shader to define pixel colors, lighting, and visual effects.' },
        { label: 'Images', content: 'You can add multiple images and config in proper ways.' }
    ]

    const handleFileUpload = (obj: { target: HTMLInputElement; }) => {
        const file = obj.target.files?.[0] || null;
        setFileUpload(file);
    }

    const handleTextureUpload = (obj: { target: HTMLInputElement; }) => {
        const file = obj.target.files?.[0] || null;
        setTextureUpload([...textureUpload, file]);
        console.log(textureUpload);
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
            // console.log(editorText)
            try {
                switch (tabValue) {
                    case 0:
                        const value = JSON.parse(editorText);
                        if (isValidByTemplate(defaultProps, value)) setObjectProps(value);
                        else console.error("Check valid types pls");
                        break;
                    case 1: 
                        setVertexProps(editorText);
                        break;
                    case 2: 
                        setFragmentProps(editorText);
                        break;
                    default:
                        break;
                }
            } catch (error) {
                console.log(error) 
            }
        }
    }, [editorText]);

    return (
        <ThemeProvider theme={customTheme}>
            <div 
                className="main"
                style={{
                    '--right-panel-width': `${panelWidth}%`,
                } as React.CSSProperties}
            >
                <div className="canvas">
                    {/* <div className="d"></div> */}
                    <ModelCanvas url={fileURL} obj={objectProps} vertex={vertexProps} fragment={fragmentProps} />
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

                <div ref={separatorRef} className="separator-adjuster noselect"></div>

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
                        </Box>
                    </div>
                    { tabValue === 3 && 
                        <div className="texture-container">
                            <div className="texture-buttons">
                                <Button
                                    component="label"
                                    role={undefined}
                                    variant="contained"
                                    color="third"
                                    tabIndex={-1}
                                    startIcon={<CloudUpload />}
                                >
                                Upload Image
                                <VisuallyHiddenInput
                                    type="file"
                                    accept=".png,.jpeg,.jpg"
                                    onChange={handleTextureUpload} 
                                    multiple={false}
                                />
                                </Button>
                            </div>
                            <div className="texture-cards">
                                { textureUpload && textureNavigator == 'main' && textureUpload.map((element, i) => (
                                    <div key={i} className="img-card">
                                        <div className="img-wrapper">
                                            <img src={URL.createObjectURL(element)} alt="" />
                                        </div>
                                        <Button
                                            component="label"
                                            role={undefined}
                                            variant="contained"
                                            color="third"
                                            onClick={() => setTextureNavigator(`${element.name}`)}
                                            // startIcon={<CloudUpload />}
                                        >
                                            Configue
                                        </Button>
                                    </div>
                                )) }
                                { textureNavigator != 'main' && 
                                    <div className="img-ctrl"> {/*Если мы перейдем на карточку*/}
                                        <Button
                                            component="label"
                                            role={undefined}
                                            variant="contained"
                                            color="third"
                                            onClick={() => setTextureNavigator(`main`)}
                                            startIcon={<ArrowBackIos />}
                                        />
                                        <div className="img-selectors">
                                            {Object.entries(TextureProps.select).map(([key, options]) => (
                                                <FormControl fullWidth key={key} margin="dense">
                                                    <InputLabel id={`label-${key}`}>{key}</InputLabel>
                                                    <Select
                                                    labelId={`label-${key}`}
                                                    id={`select-${key}`}
                                                    value={textureProps[key]} // 👈 отслеживается выбранное значение
                                                    label={key}
                                                    onChange={(e) => handleSwitchChange(key, e.target.value)}
                                                    >
                                                    {options.map((option) => (
                                                        <MenuItem key={option} value={option}>
                                                        {option}
                                                        </MenuItem>
                                                    ))}
                                                    </Select>
                                                </FormControl>
                                            ))}
                                        </div>
                                        <div className="img-values">
                                            {Object.entries(TextureProps.values).map(([key, options]) => (
                                                <Box
                                                    key={key}
                                                    component="form"
                                                    sx={{ '& > :not(style)': { m: 1, width: '25ch' } }}
                                                    noValidate
                                                    autoComplete="off"
                                                    >
                                                    <TextField 
                                                        id={`input-${key}-x`} 
                                                        label={`${key}-x`} 
                                                        variant="outlined" 
                                                    />
                                                    <TextField 
                                                        id={`input-${key}-y`} 
                                                        label={`${key}-y`} 
                                                        variant="outlined" 
                                                    />
                                                </Box>
                                            ))}
                                        </div>
                                        <div className="img-slider">
                                            <div className="slider-info">
                                                <p>{Object.keys(TextureProps.slider)[0]}</p>
                                                <Slider
                                                    aria-label={textureProps.rotation}
                                                    defaultValue={0}
                                                    value={textureProps.rotation}
                                                    onChange={(_, value) => {
                                                        setTextureProps((prev) => ({ ...prev, rotation: value }));
                                                    }}
                                                    step={1}
                                                    marks
                                                    min={0}
                                                    max={360}
                                                    valueLabelDisplay="auto"
                                                />
                                            </div>
                                            <div className="slider-info">
                                                <p>{Object.keys(TextureProps.slider)[1]}</p>
                                                <Slider
                                                    aria-label={textureProps.anisotropy}
                                                    defaultValue={1}
                                                    value={textureProps.anisotropy}
                                                    onChange={(_, value) => {
                                                        setTextureProps((prev) => ({ ...prev, anisotropy: value }));
                                                    }}
                                                    step={1}
                                                    marks
                                                    min={1}
                                                    max={16}
                                                    valueLabelDisplay="auto"
                                                />
                                            </div>
                                        </div>
                                        <div className="img-switch">
                                            <FormControl>
                                                <FormControlLabel 
                                                    control={<Switch />} 
                                                    label={Object.keys(TextureProps.switch)[0]} 
                                                    onChange={(event) => setTextureProps((prev) => ({ ...prev, anisotropy: event.target.checked }))}
                                                />
                                            </FormControl>
                                        </div>

                                        {/* {TextureProps.select.map(el => (
                                            <FormControl fullWidth>
                                                <InputLabel id="demo-simple-select-label">Age</InputLabel>
                                                <Select
                                                    labelId="demo-simple-select-label"
                                                    id="demo-simple-select"
                                                    value={age}
                                                    label="Age"
                                                    onChange={handleChange}
                                                >
                                                    <MenuItem value={10}>Ten</MenuItem>
                                                    <MenuItem value={20}>Twenty</MenuItem>
                                                    <MenuItem value={30}>Thirty</MenuItem>
                                                </Select>
                                            </FormControl>
                                        ))} */}
                                    </div>
                                }
                            </div>
                        </div> 
                    }
                   { tabValue <= 2 && <Editor
                        value={
                            tabValue === 0 ? stringifyToDsl(objectProps) :
                            tabValue === 1 ? vertexProps :
                            tabValue === 2 ? fragmentProps : null
                        }
                        theme="myTheme"
                        language={tabValue === 0 ? 'dsl' : 'glsl'}
                        onMount={(editor, monaco) => {
                            editorRef.current = editor
                            editor.updateOptions({
                                // lineNumbers: 'off', // если нужно совсем убрать
                                lineNumbersMinChars: 1, // уменьшить ширину места под номера
                                glyphMargin: false,     // отключить левый марджин
                                fontSize: 14,
                                minimap: { enabled: false }
                            })
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
                                monaco.languages.register({ id: 'glsl' })
                                monaco.languages.setMonarchTokensProvider('glsl', language)
                                monaco.editor.defineTheme('myTheme', {
                                    base: 'vs-dark',
                                    inherit: true,
                                    rules: [
                                        { token: 'comment', foreground: '888888' },
                                        { token: 'keyword', foreground: 'FF007F', fontStyle: 'bold' },
                                        { token: 'number', foreground: '00FFDD' },
                                        { token: 'string', foreground: 'FFE377' },
                                    ],
                                    colors: {
                                        'editor.background': '#161619ff',
                                        'editor.lineHighlightBackground': '#2a2a3d',
                                        'editorCursor.foreground': '#ffcc00',
                                        'editorLineNumber.foreground': '#5c5c8a'
                                    },
                                })

                                monaco.editor.setTheme('myTheme')
                        }
                    }
                    />}
                    { tabValue !== 3 && 
                        <div className="editor-menu">
                            <div className="editor-buttons" style={{ display: 'flex', gap: 12 }}>
                                <Button 
                                    color="primary" 
                                    variant="outlined" 
                                    endIcon={<PlayCircleOutline />}
                                    onClick={() => {
                                        if (editorRef?.current) {
                                            // setEditorText(DSLtoJSONString(editorRef.current.getValue()))
                                            switch (tabValue) {
                                                case 0:
                                                    setEditorText(DSLtoJSONString(editorRef.current.getValue()))
                                                    break;
                                                case 1: 
                                                    setEditorText(editorRef.current.getValue())
                                                    break;
                                                case 2: 
                                                    setEditorText(editorRef.current.getValue())
                                                    break;
                                                default:
                                                    break;
                                            }
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
                                        updateObjectPath("object.rotation.isRotating", e.target.checked)
                                    }}
                                />
                                <Button variant="outlined" color="info" endIcon={<Info />} />
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
                    }
                </div>
            </div>
        </ThemeProvider>

    )
}