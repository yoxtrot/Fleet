import type { Meta, StoryObj } from '@storybook/react-vite'
import { Typography } from '@mui/material'
import { PagePanel } from './PagePanel'

const meta = {
  title: 'Shared/PagePanel',
  component: PagePanel,
  parameters: { layout: 'padded' },
} satisfies Meta<typeof PagePanel>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  args: {
    children: (
      <>
        <Typography variant="h2" gutterBottom>
          Panel title
        </Typography>
        <Typography color="text.secondary">Shared content surface used across Fleet pages.</Typography>
      </>
    ),
  },
}
