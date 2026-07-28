import type { Meta, StoryObj } from '@storybook/react-vite'
import { Route, Routes } from 'react-router-dom'
import { VehicleListPage } from './VehicleListPage'

const meta = {
  title: 'Vehicles/VehicleListPage',
  component: VehicleListPage,
  parameters: {
    initialPath: '/vehicles',
  },
} satisfies Meta<typeof VehicleListPage>

export default meta
type Story = StoryObj<typeof meta>

export const WithVehicles: Story = {
  render: () => (
    <Routes>
      <Route path="/vehicles" element={<VehicleListPage />} />
    </Routes>
  ),
}
