import type { Meta, StoryObj } from '@storybook/react-vite'
import { Route, Routes } from 'react-router-dom'
import { ResearchListPage } from './ResearchListPage'

const meta = {
  title: 'Research/ResearchListPage',
  component: ResearchListPage,
  parameters: {
    initialPath: '/research',
  },
} satisfies Meta<typeof ResearchListPage>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  render: () => (
    <Routes>
      <Route path="/research" element={<ResearchListPage />} />
    </Routes>
  ),
}
