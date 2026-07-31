import { createTheme } from '@mui/material/styles'

/** Brand tokens shared with the landing hero */
export const fleetColors = {
  red: '#c8102e',
  redHover: '#a50d25',
  ash: '#f7f4ef',
  /** App canvas — mid charcoal, not near-black */
  ink: '#2f2e2c',
  /** Raised surfaces (panels, cards) */
  inkElevated: '#3d3c3a',
  muted: '#b5b0a8',
} as const

export const fleetTheme = createTheme({
  palette: {
    mode: 'dark',
    primary: {
      main: fleetColors.red,
      dark: fleetColors.redHover,
      contrastText: '#ffffff',
    },
    secondary: {
      main: fleetColors.muted,
      contrastText: fleetColors.ink,
    },
    error: {
      main: '#ef4444',
    },
    background: {
      default: fleetColors.ink,
      paper: fleetColors.inkElevated,
    },
    text: {
      primary: fleetColors.ash,
      secondary: fleetColors.muted,
    },
    divider: 'rgba(247, 244, 239, 0.14)',
    action: {
      hover: 'rgba(247, 244, 239, 0.08)',
      selected: 'rgba(200, 16, 46, 0.18)',
    },
  },
  typography: {
    fontFamily: '"Manrope", sans-serif',
    h1: {
      fontFamily: '"Bebas Neue", sans-serif',
      fontSize: '2.75rem',
      fontWeight: 400,
      letterSpacing: '0.04em',
      lineHeight: 1,
    },
    h2: {
      fontFamily: '"Manrope", sans-serif',
      fontSize: '1.35rem',
      fontWeight: 700,
      letterSpacing: '-0.02em',
    },
    h3: {
      fontFamily: '"Manrope", sans-serif',
      fontSize: '1.1rem',
      fontWeight: 600,
    },
    h6: {
      fontFamily: '"Bebas Neue", sans-serif',
      fontSize: '1.5rem',
      fontWeight: 400,
      letterSpacing: '0.06em',
      lineHeight: 1.1,
    },
    button: {
      fontFamily: '"Manrope", sans-serif',
      fontWeight: 700,
      letterSpacing: '0.04em',
      textTransform: 'uppercase',
    },
  },
  shape: {
    borderRadius: 8,
  },
  components: {
    MuiCssBaseline: {
      styleOverrides: {
        body: {
          backgroundColor: fleetColors.ink,
        },
      },
    },
    MuiButton: {
      defaultProps: {
        variant: 'contained',
        disableElevation: true,
      },
      styleOverrides: {
        root: {
          borderRadius: 8,
        },
        outlined: {
          borderColor: 'rgba(247, 244, 239, 0.32)',
        },
      },
    },
    MuiAppBar: {
      styleOverrides: {
        root: {
          backgroundImage: 'none',
          backgroundColor: fleetColors.ink,
        },
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
      styleOverrides: {
        outlined: {
          borderColor: 'rgba(247, 244, 239, 0.14)',
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          backgroundImage: 'none',
        },
      },
    },
    MuiLink: {
      styleOverrides: {
        root: {
          color: fleetColors.ash,
        },
      },
    },
  },
})
