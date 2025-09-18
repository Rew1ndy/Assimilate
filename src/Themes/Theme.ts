import { createTheme } from '@mui/material/styles'
import { blueGrey, amber, cyan, teal, indigo } from '@mui/material/colors'

export const customTheme = createTheme({
  palette: {
    mode: 'dark',
    primary: {
      main: blueGrey[300],      // базовый цвет интерфейса
      contrastText: '#f0f8ff',
    },
    secondary: {
      main: amber[800],         // акцент
      contrastText: '#f0f8ff',
    },
    third: {
      main: teal[800],
      contrastText: '#f0f8ff',
    },
    lightBlur: {
      main: '#161922d6',
    },
    white: {
      main: indigo[50],
      contrastText: '#f0f8ff',
    },
    background: {
      default: blueGrey[900],   // фон страницы
      paper: blueGrey[800],     // фон компонентов
    },
    info: {
      main: cyan[400],          // для иконок, подсказок
    },
    divider: blueGrey[700],     // линии разделения
    text: {
      primary: '#ffffff',
      secondary: blueGrey[300],
    },
    action: {
      hover: blueGrey[700],
      selected: blueGrey[600],
      disabled: blueGrey[500],
      disabledBackground: blueGrey[800],
    },
  },

})
