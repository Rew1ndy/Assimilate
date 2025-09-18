// theme.d.ts
import { PaletteColorOptions, PaletteColor } from '@mui/material/styles';
import '@mui/material/Button';

declare module '@mui/material/styles' {
  interface Palette {
    third: PaletteColor;
    white: PaletteColor;
    lightBlur: PaletteColor;
  }
  interface PaletteOptions {
    third?: PaletteColorOptions;
    white?: PaletteColorOptions;
    lightBlur: PaletteColorOptions;
  }
}

declare module '@mui/material/Button' {
  interface ButtonPropsColorOverrides {
    third: true;
  }
}
