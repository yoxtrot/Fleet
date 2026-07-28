import type { Meta, StoryObj } from '@storybook/react-vite'
import { PageLoadingState } from './PageLoadingState'

const meta = {
  title: 'Shared/PageLoadingState',
  component: PageLoadingState,
  parameters: { layout: 'padded' },
} satisfies Meta<typeof PageLoadingState>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  args: {
    label: 'Loading vehicles…',
  },
}

export const CheckingSession: Story = {
  args: {
    label: 'Checking your session…',
  },
}
