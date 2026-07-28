import type { Meta, StoryObj } from '@storybook/react-vite'
import { Route, Routes } from 'react-router-dom'
import { VehicleDetailPage } from './VehicleDetailPage'

const meta = {
  title: 'Vehicles/VehicleDetailPage',
  component: VehicleDetailPage,
  parameters: {
    initialPath: '/vehicles/vehicle-1',
  },
} satisfies Meta<typeof VehicleDetailPage>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  render: () => (
    <Routes>
      <Route path="/vehicles/:vehicleId" element={<VehicleDetailPage />} />
    </Routes>
  ),
}
