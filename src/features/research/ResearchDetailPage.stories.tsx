import type { Meta, StoryObj } from '@storybook/react-vite'
import { Route, Routes } from 'react-router-dom'
import { ResearchDetailPage } from './ResearchDetailPage'

const meta = {
  title: 'Research/ResearchDetailPage',
  component: ResearchDetailPage,
  parameters: {
    initialPath: '/research/note-1',
  },
} satisfies Meta<typeof ResearchDetailPage>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  render: () => (
    <Routes>
      <Route path="/research/:noteId" element={<ResearchDetailPage />} />
    </Routes>
  ),
}
