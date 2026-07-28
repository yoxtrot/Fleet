import type { StorybookConfig } from '@storybook/react-vite'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const storybookDir = path.dirname(fileURLToPath(import.meta.url))

const config: StorybookConfig = {
  stories: ['../src/**/*.mdx', '../src/**/*.stories.@(js|jsx|mjs|ts|tsx)'],
  addons: ['@storybook/addon-docs'],
  framework: '@storybook/react-vite',
  async viteFinal(config) {
    config.resolve ??= {}
    config.resolve.alias = {
      ...config.resolve.alias,
      [path.resolve(storybookDir, '../src/features/vehicles/vehiclesApi.ts')]: path.resolve(
        storybookDir,
        './mocks/vehiclesApi.ts',
      ),
      [path.resolve(storybookDir, '../src/features/maintenance/maintenanceApi.ts')]: path.resolve(
        storybookDir,
        './mocks/maintenanceApi.ts',
      ),
      [path.resolve(storybookDir, '../src/features/research/researchApi.ts')]: path.resolve(
        storybookDir,
        './mocks/researchApi.ts',
      ),
      [path.resolve(storybookDir, '../src/lib/supabase.ts')]: path.resolve(
        storybookDir,
        './mocks/supabase.ts',
      ),
    }
    return config
  },
}

export default config
