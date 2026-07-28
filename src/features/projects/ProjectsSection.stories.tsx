import type { Meta, StoryObj } from '@storybook/react-vite'
import { PagePanel } from '../../shared/PagePanel'
import { ProjectsSection } from './ProjectsSection'

const meta = {
  title: 'Projects/ProjectsSection',
  component: ProjectsSection,
  parameters: { layout: 'padded' },
} satisfies Meta<typeof ProjectsSection>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  args: {
    vehicleId: 'vehicle-1',
  },
  render: (args) => (
    <PagePanel>
      <ProjectsSection {...args} />
    </PagePanel>
  ),
}
