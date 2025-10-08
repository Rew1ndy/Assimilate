import { Button, FormControlLabel, TextField, ThemeProvider } from "@mui/material";

import { customTheme } from '../../Themes/Theme';
import { ChatBubble, Key, Person, Google, X, Facebook, CheckBox } from "@mui/icons-material";
import { useRef, useState } from "react";
import "./login.css"

export function Login() {
    const [tabValue, setTabValue] = useState("login");
    const loginRef = useRef(undefined);
    const registerRef = useRef(undefined);
    const buttonState = useRef(undefined);

    const handleAuthState = (stateValue) => {
        if (stateValue !== tabValue) {
            setTabValue(stateValue);
        }
        if (stateValue === tabValue) {
            if (stateValue === "login") {
                // Login process
            }
            if (stateValue === "register") {
                // Register process
            }
        }
    }

    return (
        <div className="login">
                    <div className="login-wrapper">
            <ThemeProvider theme={customTheme}>
                <form className="login-content">
                    <div className="login-content-info">
                        <div className="site-logo">
                            <ChatBubble className='logo-bubble' />
                            <p>Assimilate</p>
                        </div>
                        <h3>Glad to see you !</h3>
                    </div>
                    <div className="login-content-input">
                        {tabValue === "login" && 
                            <div className="login-i-content">
                                <div className="login-input">
                                    <Person viewBox="0 0 20 20" /><TextField id="outlined-basic" label="Login" variant="outlined" />
                                </div>
                                <div className="login-input">
                                    <Key viewBox="0 0 20 20" /><TextField id="outlined-basic" label="Password" variant="outlined" />
                                </div>
                            </div>
                        }
                        {tabValue === "register" &&
                            <div className="login-i-content">
                                <div className="login-input">
                                    <Person viewBox="0 0 20 20" /><TextField id="outlined-basic" label="Login" variant="outlined" />
                                </div>
                                <div className="login-input">
                                    <Key viewBox="0 0 20 20" /><TextField id="outlined-basic" label="Password" variant="outlined" />
                                </div>
                                <div className="login-input">
                                    <Key viewBox="0 0 20 20" /><TextField id="outlined-basic" label="Confirm-Password" variant="outlined" />
                                </div>
                                <FormControlLabel required control={<CheckBox />} label="Licence read" />
                            </div>
                        }
                    </div>
                    <div className="login-content-buttons">
                        <div className="login-buttons-wrapper">
                            <Button
                                onClick={() => handleAuthState("login")}
                                className={`button-login ${tabValue === "login" ? "active" : ""}`}
                            >
                                Login
                            </Button>
                            <Button
                                onClick={() => handleAuthState("register")}
                                className={`button-register ${tabValue === "register" ? "active" : ""}`}
                            >
                                Register
                            </Button>
                            <span className={`indicator ${tabValue}`} />
                        </div>
                    </div>
                    <div className="login-separator">
                        or
                    </div>
                    <div className="login-content-platforms">
                        <Button variant="outlined" color='white'>
                         <Google/>
                        </Button>
                        <Button variant="outlined" color='white' disabled>
                         <X/>
                        </Button>
                        <Button variant="outlined" color='white' disabled>
                         <Facebook/>
                        </Button>
                    </div>
                </form>
            </ThemeProvider>
        </div>
        <div className="login-background">
            <video autoPlay muted loop playsInline>
                <source src="/imgs/login-background.mkv" type="video/webm" />
            </video>
        </div>
        </div>
    )    
}