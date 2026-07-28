import type { Meta, StoryObj } from '@storybook/react-vite'
import { LoginPage } from './LoginPage'

const meta = {
  title: 'Auth/LoginPage',
  component: LoginPage,
  parameters: {
    authUser: null,
  },
} satisfies Meta<typeof LoginPage>

export default meta
type Story = StoryObj<typeof meta>

export const SignInForm: Story = {}

export const CheckingSession: Story = {
  parameters: {
    isLoadingSession: true,
  },
}
