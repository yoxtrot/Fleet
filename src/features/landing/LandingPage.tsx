import { Link as RouterLink, Navigate } from 'react-router-dom'
import { Box, Button, Link, Stack, Typography } from '@mui/material'
import { keyframes } from '@mui/system'
import { isDemoModeAvailable, useAuth } from '../../app/AuthProvider'
import { fleetColors } from '../../app/theme'
import { PageLoadingState } from '../../shared/PageLoadingState'

const fadeRise = keyframes`
  from {
    opacity: 0;
    transform: translateY(18px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
`

const heroDrift = keyframes`
  from {
    transform: scale(1.08);
  }
  to {
    transform: scale(1);
  }
`

const accentDraw = keyframes`
  from {
    transform: scaleX(0);
  }
  to {
    transform: scaleX(1);
  }
`

const topLinkSx = {
  color: 'text.primary',
  fontWeight: 600,
  letterSpacing: '0.04em',
  textTransform: 'uppercase',
  fontSize: '0.85rem',
} as const

export function LandingPage() {
  const { user, isLoadingSession, enterDemoMode } = useAuth()
  const showDemoLink = isDemoModeAvailable()

  if (isLoadingSession) {
    return <PageLoadingState label="Loading Fleet…" />
  }

  if (user) {
    return <Navigate to="/home" replace />
  }

  return (
    <Box
      sx={{
        minHeight: '100vh',
        position: 'relative',
        overflow: 'hidden',
        color: 'text.primary',
        bgcolor: 'background.default',
      }}
    >
      <Box
        aria-hidden
        sx={{
          position: 'absolute',
          inset: 0,
          backgroundImage: 'url(/landing/mustang-hero.jpg)',
          backgroundSize: 'cover',
          backgroundPosition: 'center 40%',
          animation: `${heroDrift} 4.5s ease-out forwards`,
          '&::after': {
            content: '""',
            position: 'absolute',
            inset: 0,
            background: `linear-gradient(90deg, rgba(47,46,44,0.82) 0%, rgba(47,46,44,0.48) 42%, rgba(47,46,44,0.14) 100%), linear-gradient(180deg, rgba(47,46,44,0.4) 0%, rgba(47,46,44,0.12) 35%, rgba(47,46,44,0.68) 100%)`,
          },
        }}
      />

      <Box
        sx={{
          position: 'relative',
          zIndex: 1,
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
          px: { xs: 2.5, sm: 4, md: 6 },
          py: { xs: 2, sm: 2.5 },
        }}
      >
        <Stack
          direction="row"
          spacing={2.5}
          sx={{
            justifyContent: 'flex-end',
            alignItems: 'center',
            animation: `${fadeRise} 0.7s ease-out both`,
          }}
        >
          <Link component={RouterLink} to="/login" underline="hover" sx={topLinkSx}>
            Login
          </Link>
          {showDemoLink ? (
            <Link
              component="button"
              type="button"
              underline="hover"
              onClick={() => enterDemoMode()}
              sx={{
                ...topLinkSx,
                background: 'none',
                border: 0,
                cursor: 'pointer',
                p: 0,
                font: 'inherit',
              }}
            >
              Demo
            </Link>
          ) : null}
        </Stack>

        <Box
          sx={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'flex-end',
            maxWidth: 720,
            pb: { xs: 5, md: 7 },
            pt: 8,
          }}
        >
          <Typography
            component="p"
            sx={{
              fontFamily: '"Bebas Neue", sans-serif',
              fontSize: { xs: '4.5rem', sm: '6.5rem', md: '8rem' },
              lineHeight: 0.9,
              letterSpacing: '0.04em',
              mb: 1.5,
              animation: `${fadeRise} 0.8s ease-out 0.1s both`,
            }}
          >
            Fleet
          </Typography>

          <Box
            sx={{
              width: 88,
              height: 4,
              bgcolor: 'primary.main',
              mb: 2.5,
              transformOrigin: 'left center',
              animation: `${accentDraw} 0.8s ease-out 0.35s both`,
            }}
          />

          <Typography
            component="h1"
            sx={{
              fontWeight: 700,
              fontSize: { xs: '1.35rem', sm: '1.7rem' },
              letterSpacing: '-0.02em',
              maxWidth: '20ch',
              mb: 1.5,
              animation: `${fadeRise} 0.8s ease-out 0.25s both`,
            }}
          >
            Your garage, finally organized.
          </Typography>

          <Typography
            sx={{
              fontSize: { xs: '1rem', sm: '1.1rem' },
              lineHeight: 1.55,
              color: 'rgba(247,244,239,0.82)',
              maxWidth: 440,
              mb: 3.5,
              animation: `${fadeRise} 0.8s ease-out 0.35s both`,
            }}
          >
            Track vehicles, projects, and research in one personal garage workspace.
          </Typography>

          <Stack
            direction={{ xs: 'column', sm: 'row' }}
            spacing={1.5}
            sx={{ animation: `${fadeRise} 0.8s ease-out 0.45s both` }}
          >
            <Button component={RouterLink} to="/login" sx={{ px: 3, py: 1.25 }}>
              Log in
            </Button>
            {showDemoLink ? (
              <Button
                variant="outlined"
                onClick={() => enterDemoMode()}
                sx={{
                  px: 3,
                  py: 1.25,
                  borderColor: 'rgba(247,244,239,0.55)',
                  color: fleetColors.ash,
                  '&:hover': {
                    borderColor: fleetColors.ash,
                    bgcolor: 'rgba(247,244,239,0.08)',
                  },
                }}
              >
                View demo
              </Button>
            ) : null}
          </Stack>
        </Box>
      </Box>
    </Box>
  )
}
