import type { Meta, StoryObj } from '@storybook/react-vite'
import { PagePanel } from '../../shared/PagePanel'
import { MaintenanceSection } from './MaintenanceSection'

const meta = {
  title: 'Maintenance/MaintenanceSection',
  component: MaintenanceSection,
  parameters: { layout: 'padded' },
} satisfies Meta<typeof MaintenanceSection>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  args: {
    vehicleId: 'vehicle-1',
    userId: 'user-storybook',
  },
  render: (args) => (
    <PagePanel>
      <MaintenanceSection {...args} />
    </PagePanel>
  ),
}
