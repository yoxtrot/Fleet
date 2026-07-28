import type { Meta, StoryObj } from '@storybook/react-vite'
import { Typography } from '@mui/material'
import { Route, Routes } from 'react-router-dom'
import { ProtectedRoute } from './ProtectedRoute'

const meta = {
  title: 'App/ProtectedRoute',
  component: ProtectedRoute,
} satisfies Meta<typeof ProtectedRoute>

export default meta
type Story = StoryObj<typeof meta>

function ProtectedDemo() {
  return (
    <Routes>
      <Route element={<ProtectedRoute />}>
        <Route index element={<Typography>Signed-in content</Typography>} />
      </Route>
      <Route path="/login" element={<Typography>Redirected to login</Typography>} />
    </Routes>
  )
}

export const Authenticated: Story = {
  render: () => <ProtectedDemo />,
}

export const LoadingSession: Story = {
  parameters: {
    isLoadingSession: true,
  },
  render: () => <ProtectedDemo />,
}

export const SignedOutRedirect: Story = {
  parameters: {
    authUser: null,
  },
  render: () => <ProtectedDemo />,
}
