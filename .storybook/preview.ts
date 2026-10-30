import type { Preview } from '@storybook/nextjs-vite';

import '../src/shared/styles/base.css';
import './preview.css';

const preview: Preview = {
  tags: ['autodocs'],
  parameters: {
    layout: 'centered',
    nextjs: { appDirectory: true },
    controls: { matchers: { color: /(background|color)$/i, date: /Date$/i } },
    options: { storySort: { order: ['Foundations', 'Components'] } },
  },
};

export default preview;
