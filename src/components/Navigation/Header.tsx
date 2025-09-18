/// Left plane, reddit like
import Button from '@mui/material/Button';
import { Person, ArrowForwardOutlined, ChatBubble, NavigateNext } from '@mui/icons-material';
import './header.css'
import { Breadcrumbs, Link, ThemeProvider } from '@mui/material';
import { customTheme } from '../../Themes/Theme';

export default function Header(params: {isMenuOpen: boolean}) {

    function handleClick(event: React.MouseEvent<HTMLDivElement, MouseEvent>) {
        event.preventDefault();
        console.info('You clicked a breadcrumb.');
    }

    return(
        <header className={params.isMenuOpen ? "menu-open" : ""}>
            <ThemeProvider theme={customTheme}>
                <div className="site-logo">
                    <ChatBubble className='logo-bubble' />
                    <p>Assimilate</p>
                </div>
                    <div className="header-main-left">
                        <Button variant="outlined" color='white' endIcon={<ArrowForwardOutlined />}>
                            Get Manual
                        </Button>
                        <Button variant="outlined" color='white' endIcon={<ArrowForwardOutlined />}>
                            Get Manual
                        </Button>
                        <Button variant="outlined" color='white' endIcon={<ArrowForwardOutlined />}>
                            Get Manual
                        </Button>
                    </div>
                    <div className="header-main-right">
                        <Button variant="text" color='white' startIcon={<Person />}>
                            Login
                        </Button>
                        <Button variant="outlined" color='white' endIcon={<ArrowForwardOutlined />}>
                            Get Manual
                        </Button>
                    </div>
                <div className="header-link">
                    <div role="presentation" onClick={handleClick}>
                        <Breadcrumbs 
                            aria-label="breadcrumb"
                            separator={<NavigateNext fontSize="small" />}
                        >
                            <Link 
                                underline="hover" 
                                color="text.primary" 
                                href="/"
                            >
                            MUI
                            </Link>
                            <Link
                                underline="hover"
                                color="inherit"
                                href="/material-ui/getting-started/installation/"
                            >
                            Core
                            </Link>
                            <Link
                                underline="hover"
                                color="inherit"
                                href="/material-ui/react-breadcrumbs/"
                                aria-current="page"
                            >
                            Breadcrumbs
                            </Link>
                        </Breadcrumbs>
                    </div>
                </div>
            </ThemeProvider>
        </header>
    )
}