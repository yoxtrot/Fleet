import { CssBaseline, ThemeProvider } from '@mui/material'
import { AppRouter } from './AppRouter'
import { fleetTheme } from './theme'

export function AppProviders() {
  return (
    <ThemeProvider theme={fleetTheme}>
      <CssBaseline />
      <AppRouter />
    </ThemeProvider>
  )
}
