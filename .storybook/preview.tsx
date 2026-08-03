import type { Preview, Decorator } from '@storybook/react-vite'
import { CssBaseline, ThemeProvider } from '@mui/material'
import { MemoryRouter } from 'react-router-dom'
import type { User } from '@supabase/supabase-js'
import { fleetTheme } from '../src/app/theme'
import { StorybookAuthProvider } from '../src/app/AuthProvider'
import { VehicleScopeProvider } from '../src/features/assistant/VehicleScopeProvider'
import '../src/index.css'

const sampleUser = {
  id: 'user-storybook',
  email: 'garage@example.com',
  app_metadata: {},
  user_metadata: {},
  aud: 'authenticated',
  created_at: '2026-01-01T00:00:00.000Z',
} as User

const withFleetProviders: Decorator = (Story, context) => {
  const initialPath = (context.parameters.initialPath as string | undefined) ?? '/'
  const authUser =
    context.parameters.authUser === null
      ? null
      : ((context.parameters.authUser as User | undefined) ?? sampleUser)
  const isLoadingSession = Boolean(context.parameters.isLoadingSession)

  return (
    <ThemeProvider theme={fleetTheme}>
      <CssBaseline />
      <StorybookAuthProvider user={authUser} isLoadingSession={isLoadingSession}>
        <MemoryRouter initialEntries={[initialPath]}>
          <VehicleScopeProvider>
            <Story />
          </VehicleScopeProvider>
        </MemoryRouter>
      </StorybookAuthProvider>
    </ThemeProvider>
  )
}

const preview: Preview = {
  decorators: [withFleetProviders],
  parameters: {
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/i,
      },
    },
    layout: 'fullscreen',
  },
}

export default preview
