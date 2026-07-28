import type { Meta, StoryObj } from '@storybook/react-vite'
import { Typography } from '@mui/material'
import { Route, Routes } from 'react-router-dom'
import { AppShell } from './AppShell'

const meta = {
  title: 'App/AppShell',
  component: AppShell,
} satisfies Meta<typeof AppShell>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  render: () => (
    <Routes>
      <Route element={<AppShell />}>
        <Route
          index
          element={
            <Typography color="text.secondary">Outlet content rendered inside the Fleet shell.</Typography>
          }
        />
      </Route>
    </Routes>
  ),
}
