/// Left plane, reddit like
import Button from '@mui/material/Button';
import { Person, ArrowForwardOutlined, ChatBubble } from '@mui/icons-material';
import './header.css'

export default function Header() {
    return(
        <header>
            <div className="site-logo">
                <ChatBubble className='logo-bubble' />
                <p>Assimilate</p>
            </div>
                <div className="header-main-left">
                    <Button variant="outlined" color='third' endIcon={<ArrowForwardOutlined />}>
                        Get Manual
                    </Button>
                    <Button variant="outlined" color='third' endIcon={<ArrowForwardOutlined />}>
                        Get Manual
                    </Button>
                    <Button variant="outlined" color='third' endIcon={<ArrowForwardOutlined />}>
                        Get Manual
                    </Button>
                </div>
                <div className="header-main-right">
                    <Button variant="text" color='third' startIcon={<Person />}>
                        Login
                    </Button>
                    <Button variant="outlined" color='third' endIcon={<ArrowForwardOutlined />}>
                        Get Manual
                    </Button>
                </div>
            <div className="header-link">
                link / link2
            </div>
        </header>
    )
}