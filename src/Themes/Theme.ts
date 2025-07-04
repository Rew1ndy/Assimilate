import { createTheme } from '@mui/material/styles'
import { blueGrey, amber, cyan } from '@mui/material/colors'

export const customTheme = createTheme({
  palette: {
    mode: 'dark',
    primary: {
      main: blueGrey[300],      // базовый цвет интерфейса
      contrastText: '#ffffff',
    },
    secondary: {
      main: amber[800],         // акцент
      contrastText: '#ffffff',
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
