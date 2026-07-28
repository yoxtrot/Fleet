import type { Meta, StoryObj } from '@storybook/react-vite'
import { Route, Routes } from 'react-router-dom'
import { ResearchFormPage } from './ResearchFormPage'

const meta = {
  title: 'Research/ResearchFormPage',
  component: ResearchFormPage,
} satisfies Meta<typeof ResearchFormPage>

export default meta
type Story = StoryObj<typeof meta>

export const Create: Story = {
  parameters: {
    initialPath: '/research/new',
  },
  render: () => (
    <Routes>
      <Route path="/research/new" element={<ResearchFormPage />} />
    </Routes>
  ),
}

export const Edit: Story = {
  parameters: {
    initialPath: '/research/note-1/edit',
  },
  render: () => (
    <Routes>
      <Route path="/research/:noteId/edit" element={<ResearchFormPage />} />
    </Routes>
  ),
}
