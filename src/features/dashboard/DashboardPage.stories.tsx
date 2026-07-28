import type { Meta, StoryObj } from '@storybook/react-vite'
import { Route, Routes } from 'react-router-dom'
import { DashboardPage } from './DashboardPage'

const meta = {
  title: 'Dashboard/DashboardPage',
  component: DashboardPage,
} satisfies Meta<typeof DashboardPage>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  render: () => (
    <Routes>
      <Route path="/" element={<DashboardPage />} />
    </Routes>
  ),
}
