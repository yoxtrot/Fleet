import {
  Alert,
  AppBar,
  Box,
  Button,
  Container,
  Link,
  Stack,
  Toolbar,
  Typography,
} from '@mui/material'
import { NavLink, Outlet } from 'react-router-dom'
import { useAuth } from './AuthProvider'

const navLinkSx = {
  color: 'inherit',
  textDecoration: 'none',
  fontWeight: 600,
  opacity: 0.8,
  '&.active': {
    opacity: 1,
    color: 'primary.main',
  },
}

export function AppShell() {
  const { user, isDemoMode, exitDemoMode, signOut } = useAuth()

  return (
    <Box sx={{ minHeight: '100vh' }}>
      {isDemoMode ? (
        <Alert
          severity="info"
          sx={{ borderRadius: 0, py: 0.5 }}
          action={
            <Button color="inherit" size="small" onClick={() => exitDemoMode()}>
              Exit demo
            </Button>
          }
        >
          Viewing demo garage (read-only)
        </Alert>
      ) : null}
      <AppBar position="sticky" color="inherit" elevation={0} sx={{ borderBottom: 1, borderColor: 'divider' }}>
        <Toolbar sx={{ gap: 2, flexWrap: 'wrap', py: 1 }}>
          <Box sx={{ mr: { md: 2 } }}>
            <Typography
              component={NavLink}
              to="/"
              variant="h6"
              sx={{ color: 'text.primary', textDecoration: 'none', fontWeight: 700 }}
            >
              Fleet
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Personal garage
            </Typography>
          </Box>

          <Stack direction="row" spacing={2} sx={{ flexGrow: 1 }}>
            <Link component={NavLink} to="/" end sx={navLinkSx}>
              Home
            </Link>
            <Link component={NavLink} to="/vehicles" sx={navLinkSx}>
              Vehicles
            </Link>
            <Link component={NavLink} to="/research" sx={navLinkSx}>
              Research
            </Link>
          </Stack>

          <Stack direction="row" spacing={1.5} sx={{ alignItems: 'center' }}>
            <Typography variant="body2" color="text.secondary" sx={{ display: { xs: 'none', sm: 'block' } }}>
              {user?.email}
            </Typography>
            <Button
              variant="outlined"
              color="inherit"
              onClick={() => void (isDemoMode ? exitDemoMode() : signOut())}
            >
              {isDemoMode ? 'Exit demo' : 'Sign out'}
            </Button>
          </Stack>
        </Toolbar>
      </AppBar>

      <Container maxWidth="md" sx={{ py: 3 }}>
        <Outlet />
      </Container>
    </Box>
  )
}
