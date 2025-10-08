import { Avatar, Box, Button, Card, CardHeader, Collapse, IconButton, styled, Tab, Tabs, TextField, ThemeProvider } from '@mui/material'
import './home.css'
import { ArrowForwardOutlined } from '@mui/icons-material'
import { customTheme } from '../../Themes/Theme'
import { useState } from 'react';

import CardMedia from '@mui/material/CardMedia';
import CardContent from '@mui/material/CardContent';
import CardActions from '@mui/material/CardActions';
import { IconButtonProps } from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';
import { indigo, red } from '@mui/material/colors';
import FavoriteIcon from '@mui/icons-material/Favorite';
import ShareIcon from '@mui/icons-material/Share';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import { Link } from 'react-router';

export function Home() {
    const [tabValue, setTabValue] = useState(0); /// 0 = News ///
    const tabs = [
        { label: 'News', key: 'news' }, /// 0
        { label: 'Recent Works', key: 'recent' }, /// 1
        { label: 'About', key: 'about' }, /// 2 ...
    ]

    interface ExpandMoreProps extends IconButtonProps {
        expand: boolean;
    }

    const ExpandMore = styled((props: ExpandMoreProps) => {
    const { expand, ...other } = props;
    return <IconButton {...other} />;
    })(({ theme }) => ({
    marginLeft: 'auto',
    transition: theme.transitions.create('transform', {
        duration: theme.transitions.duration.shortest,
    }),
    variants: [
        {
        props: ({ expand }) => !expand,
        style: {
            transform: 'rotate(0deg)',
        },
        },
        {
        props: ({ expand }) => !!expand,
        style: {
            transform: 'rotate(180deg)',
        },
        },
    ],
    }));

    const [expanded, setExpanded] = useState(false);

    const handleExpandClick = () => {
        setExpanded(!expanded);
    };

    return (
        <ThemeProvider theme={customTheme}>
            <div className="home-wrapper">
                <div className="home-background">
                    <video autoPlay muted loop playsInline className="background-video">
                        <source src="/imgs/background_v2.webm" type="video/webm" />
                        {/* <source src="your-video.mp4" type="video/mp4" /> */}
                    </video>
                </div>
                <div className="home-content">
                    <div className="content-text">
                        <div className="content-header">
                            <h1>Rewiring the way we see the world!</h1>
                            <p>An experimental editor where code, visuals, and logic converge into a playground for ideas. Built to challenge conventions, teach through interaction, and empower creators to shape their own digital realities. From shader validation to playful UX, every detail is designed to provoke curiosity and reward exploration.</p>
                        </div>
                        <div className="content-finder">
                            <TextField id="outlined-basic" label="Outlined" variant="outlined" />
                            <Button variant="outlined" color='white' endIcon={<ArrowForwardOutlined />}>
                                Find
                            </Button>
                        </div>
                    </div>
                    <div className="content-start">
                        <div className="start-person-block">
                            <h3>"Hi Guys!"</h3>
                            <div className="start-avatar-wrapper">
                                <div className="start-avatar"></div>
                                <p>Mr. Rew1nd</p>
                            </div>
                        </div>
                        <Button 
                            variant="outlined" 
                            color='white' 
                            endIcon={<ArrowForwardOutlined />}
                            component={Link}
                            to="/project"
                        >
                            Explore
                        </Button>
                    </div>
                </div>
                <div className="home-news">
                    <div className="news-tabs">
                        <Box sx={{ width: '100%' }}>
                            <Tabs 
                                value={tabValue} 
                                onChange={(_, c) => { 
                                    setTabValue(c); 
                                }} 
                                textColor="primary" 
                                indicatorColor="primary"
                                variant='fullWidth'
                            >
                                {tabs.map((tab, i) => (
                                <Tab 
                                    key={i} 
                                    label={tab.label} 
                                    className='tablist'
                                />
                                ))}
                            </Tabs>
                        </Box>
                    </div>
                    { tabValue == 0 && /// News ///
                        <div className="news-about tabs-base"> 
                            <Card sx={{ 
                                    maxWidth: 345, 
                                    bgcolor: "lightBlur.main",
                                    padding: "0 1rem",
                                    borderRadius: ".33rem"
                                }}>
                                <CardHeader
                                    avatar={
                                    <Avatar 
                                        sx={{ bgcolor: indigo[50] }}
                                        src="/imgs/avatar.jpeg"
                                        aria-label="recipe">
                                    </Avatar>
                                    }
                                    title="Shrimp and Chorizo Paella"
                                    subheader="September 14, 2016"
                                />
                                <CardMedia
                                    component="img"
                                    height="194"
                                    image="/imgs/GrayLines.png"
                                    alt="Paella dish"
                                    sx={{ borderRadius: "0.33rem" }}
                                />
                                <CardContent>
                                    <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                                    This impressive paella is a perfect party dish and a fun meal to cook
                                    together with your guests. Add 1 cup of frozen peas along with the mussels,
                                    if you like.
                                    </Typography>
                                </CardContent>
                                <CardActions disableSpacing>
                                    <IconButton aria-label="add to favorites">
                                    <FavoriteIcon />
                                    </IconButton>
                                    <IconButton aria-label="share">
                                    </IconButton>
                                    <ExpandMore
                                        expand={expanded}
                                        onClick={handleExpandClick}
                                        aria-expanded={expanded}
                                        aria-label="show more"
                                    >
                                    <ExpandMoreIcon />
                                    </ExpandMore>
                                </CardActions>
                                <Collapse in={expanded} timeout="auto" unmountOnExit>
                                    <CardContent sx={{ 
                                        backgroundColor: "#0101015c", 
                                        borderRadius: "0.33rem",
                                        marginBottom: "1rem"
                                    }}>
                                    <Typography sx={{ marginBottom: 2 }}>Method:</Typography>
                                    <Typography sx={{ marginBottom: 2 }}>
                                        Heat 1/2 cup of the broth in a pot until simmering, add saffron and set
                                        aside for 10 minutes.
                                    </Typography>
                                    <Typography sx={{ marginBottom: 2 }}>
                                        Heat oil in a (14- to 16-inch) paella pan or a large, deep skillet over
                                        medium-high heat. Add chicken, shrimp and chorizo, and cook, stirring
                                        occasionally until lightly browned, 6 to 8 minutes. Transfer shrimp to a
                                        large plate and set aside, leaving chicken and chorizo in the pan. Add
                                        pimentón, bay leaves, garlic, tomatoes, onion, salt and pepper, and cook,
                                        stirring often until thickened and fragrant, about 10 minutes. Add
                                        saffron broth and remaining 4 1/2 cups chicken broth; bring to a boil.
                                    </Typography>
                                    <Typography sx={{ marginBottom: 2 }}>
                                        Add rice and stir very gently to distribute. Top with artichokes and
                                        peppers, and cook without stirring, until most of the liquid is absorbed,
                                        15 to 18 minutes. Reduce heat to medium-low, add reserved shrimp and
                                        mussels, tucking them down into the rice, and cook again without
                                        stirring, until mussels have opened and rice is just tender, 5 to 7
                                        minutes more. (Discard any mussels that don&apos;t open.)
                                    </Typography>
                                    <Typography>
                                        Set aside off of the heat to let rest for 10 minutes, and then serve.
                                    </Typography>
                                    </CardContent>
                                </Collapse>
                                </Card>
                        </div> 
                    }
                    {
                        tabValue === 1 && 
                        <div className="recent-works tabs-base">
                            <Card sx={{ 
                                    maxWidth: 345, 
                                    bgcolor: "lightBlur.main",
                                    padding: "0 1rem",
                                    borderRadius: ".33rem"
                                }}>
                                <CardHeader
                                    avatar={
                                    <Avatar 
                                        sx={{ bgcolor: indigo[50] }}
                                        src="/imgs/avatar.jpeg"
                                        aria-label="recipe">
                                    </Avatar>
                                    }
                                    title="Shrimp and Chorizo Paella"
                                    subheader="likes info"
                                />
                                <CardMedia
                                    component="img"
                                    height="194"
                                    image="/imgs/GrayLines.png"
                                    alt="Paella dish"
                                    sx={{ borderRadius: "0.33rem" }}
                                />
                                <CardContent>
                                    <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                                        Lorem ipsum dolor sit amet.
                                    </Typography>
                                </CardContent>
                                <CardActions disableSpacing>
                                    <IconButton aria-label="add to favorites">
                                    <FavoriteIcon />
                                    </IconButton>
                                    <IconButton aria-label="share">
                                    </IconButton>
                                    <Button 
                                        variant='outlined'
                                        sx={{ width:"100%" }}
                                    >Explore</Button>
                                </CardActions>
                            </Card>
                        </div>
                    }
                    {
                        tabValue === 2 && 
                        <div className="about-site tabs-base">
                            <h2>Hi User</h2>
                            <h3>This site just my project</h3>
                            <p>Lorem ipsum dolor, sit amet consectetur adipisicing elit. Corporis deleniti soluta sapiente tempore quisquam ad minima sequi cumque, quam dolores, molestiae numquam temporibus. Doloribus debitis temporibus perspiciatis recusandae cum expedita.</p>
                        </div>
                    }
                </div>
            </div>
        </ThemeProvider>
    )
}