import type { StorybookConfig } from '@storybook/nextjs-vite';

const config: StorybookConfig = {
  stories: ['../src/shared/{styles,ui}/**/*.stories.@(ts|tsx)', './examples/**/*.stories.tsx'],
  addons: ['@storybook/addon-docs', '@storybook/addon-a11y'],
  framework: '@storybook/nextjs-vite',
  staticDirs: ['../public'],
};

export default config;
