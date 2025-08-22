import * as React from 'react';
import BottomNavigation from '@mui/material/BottomNavigation';
import BottomNavigationAction from '@mui/material/BottomNavigationAction';
import {Home, Favorite, Restore, Person} from '@mui/icons-material';

export default function Footer() {
    const [value, setValue] = React.useState('recents');

    const handleChange = (event: React.SyntheticEvent, newValue: string) => {
        setValue(newValue);
    };

    return(
        <footer>
            <div className="footer-wrapper">
                <BottomNavigationAction
                    label="Home"
                    value="home"
                    icon={<Home />}
                />
                <BottomNavigationAction
                    label="Favorites"
                    value="favorites"
                    icon={<Favorite />}
                />
                <BottomNavigationAction
                    label="Last"
                    value="last"
                    icon={<Restore />}
                />
                <BottomNavigationAction 
                    label="User" 
                    value="user" 
                    icon={<Person />} 
                />
            </div>
            {/* <BottomNavigation sx={{ width: 500 }} value={value} onChange={handleChange}>
                <BottomNavigationAction
                    label="Home"
                    value="home"
                    icon={<Home />}
                />
                <BottomNavigationAction
                    label="Favorites"
                    value="favorites"
                    icon={<Favorite />}
                />
                <BottomNavigationAction
                    label="Last"
                    value="last"
                    icon={<Restore />}
                />
                <BottomNavigationAction 
                    label="User" 
                    value="user" 
                    icon={<Person />} 
            />
            </BottomNavigation> */}
        </footer>
    )
}