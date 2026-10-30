import type { Preview } from '@storybook/nextjs-vite';

import '../src/_app/styles/globals.css';
import './preview.css';

const preview: Preview = {
  tags: ['autodocs'],
  parameters: {
    layout: 'centered',
    nextjs: { appDirectory: true },
    controls: { matchers: { color: /(background|color)$/i, date: /Date$/i } },
    options: { storySort: { order: ['Components'] } },
  },
};

export default preview;
