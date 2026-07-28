import { createTheme } from '@mui/material/styles'

export const fleetTheme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: '#0f766e',
      contrastText: '#f0fdfa',
    },
    secondary: {
      main: '#78716c',
    },
    error: {
      main: '#b91c1c',
    },
    background: {
      default: '#f5f1eb',
      paper: '#fffdf9',
    },
    text: {
      primary: '#1c1917',
      secondary: '#78716c',
    },
  },
  typography: {
    fontFamily: '"Segoe UI", "IBM Plex Sans", sans-serif',
    h1: {
      fontSize: '2rem',
      fontWeight: 700,
      letterSpacing: '-0.03em',
    },
    h2: {
      fontSize: '1.35rem',
      fontWeight: 700,
      letterSpacing: '-0.02em',
    },
    h3: {
      fontSize: '1.1rem',
      fontWeight: 600,
    },
  },
  shape: {
    borderRadius: 10,
  },
  components: {
    MuiButton: {
      defaultProps: {
        variant: 'contained',
        disableElevation: true,
      },
    },
    MuiTextField: {
      defaultProps: {
        fullWidth: true,
        size: 'small',
      },
    },
    MuiPaper: {
      defaultProps: {
        elevation: 0,
        variant: 'outlined',
      },
    },
  },
})
