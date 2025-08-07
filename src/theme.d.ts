// theme.d.ts
import { PaletteColorOptions, PaletteColor } from '@mui/material/styles';
import '@mui/material/Button';

declare module '@mui/material/styles' {
  interface Palette {
    third: PaletteColor;
  }
  interface PaletteOptions {
    third?: PaletteColorOptions;
  }
}

declare module '@mui/material/Button' {
  interface ButtonPropsColorOverrides {
    third: true;
  }
}
