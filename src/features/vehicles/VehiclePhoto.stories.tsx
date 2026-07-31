import type { Meta, StoryObj } from '@storybook/react-vite'
import { VehiclePhoto } from './VehiclePhoto'

const meta = {
  title: 'Vehicles/VehiclePhoto',
  component: VehiclePhoto,
  parameters: { layout: 'padded' },
} satisfies Meta<typeof VehiclePhoto>

export default meta
type Story = StoryObj<typeof meta>

export const WithPhoto: Story = {
  args: {
    photoPath: 'user-storybook/vehicle-1/photo.jpg',
    nickname: 'Daily Driver',
    maxHeight: 220,
  },
}

export const MissingPhoto: Story = {
  args: {
    photoPath: null,
    nickname: 'Weekend Moto',
    maxHeight: 220,
  },
}
