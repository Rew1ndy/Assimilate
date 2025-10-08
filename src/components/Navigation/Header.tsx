/// Left plane, reddit like
import Button from '@mui/material/Button';
import { Person, ArrowForwardOutlined, ChatBubble, NavigateNext } from '@mui/icons-material';
import './header.css'
import { Breadcrumbs, Link, ThemeProvider } from '@mui/material';
import { customTheme } from '../../Themes/Theme';
import { useLocation } from 'react-router';
import { Link as RouterLink } from 'react-router';

export default function Header(params: {isMenuOpen: boolean}) {
    const location = useLocation();

    // console.log(location)
    function calculateLocation() : string[] {
        const result = location.pathname.split("/").slice(1,);
        console.log("Result: ", result)
        return result;
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
                        <Button variant="text" color='white' startIcon={<Person />} component={RouterLink} to="/login">
                            Login
                        </Button>
                        <Button variant="outlined" color='white' endIcon={<ArrowForwardOutlined />}>
                            Get Manual
                        </Button>
                    </div>
                <div className="header-link">
                    <div role="presentation">
                        <Breadcrumbs 
                            aria-label="breadcrumb"
                            separator={<NavigateNext fontSize="small" />}
                        >
                            <Link component={RouterLink} to="/" underline="hover" color="text.primary">
                                Home
                            </Link>
                            {calculateLocation().map((value, index) => {
                                const to = value
                                return (
                                <Link
                                    key={to}
                                    component={RouterLink}
                                    // to={calculateLocation().slice(0, index)}
                                    to={ calculateLocation().slice(0, index+1).join("/") }
                                    underline="hover"
                                    color="inherit"
                                    sx={{ textTransform: 'capitalize' }}
                                >
                                    {value}
                                    {/* { calculateLocation().slice(0, index).join("/") } */}
                                </Link>
                                );
                            })}
                            {/* <Link
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
                            </Link> */}
                        </Breadcrumbs>
                    </div>
                </div>
            </ThemeProvider>
        </header>
    )
}