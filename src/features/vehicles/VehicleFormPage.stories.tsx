import type { Meta, StoryObj } from '@storybook/react-vite'
import { Route, Routes } from 'react-router-dom'
import { VehicleFormPage } from './VehicleFormPage'

const meta = {
  title: 'Vehicles/VehicleFormPage',
  component: VehicleFormPage,
} satisfies Meta<typeof VehicleFormPage>

export default meta
type Story = StoryObj<typeof meta>

export const Create: Story = {
  parameters: {
    initialPath: '/vehicles/new',
  },
  render: () => (
    <Routes>
      <Route path="/vehicles/new" element={<VehicleFormPage />} />
    </Routes>
  ),
}

export const Edit: Story = {
  parameters: {
    initialPath: '/vehicles/vehicle-1/edit',
  },
  render: () => (
    <Routes>
      <Route path="/vehicles/:vehicleId/edit" element={<VehicleFormPage />} />
    </Routes>
  ),
}
