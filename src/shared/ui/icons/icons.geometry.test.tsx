import { render } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import {
  AlertCircleIcon,
  CalendarIcon,
  CheckIcon,
  ChevronDownIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  CloseIcon,
  DocumentIcon,
  DownloadIcon,
  EditIcon,
  ExpandIcon,
  FolderWarningIcon,
  HomeIcon,
  ImageIcon,
  ImageOffIcon,
  KakaoIcon,
  LinkIcon,
  ListIcon,
  MapIcon,
  MoreIcon,
  PersonIcon,
  PinIcon,
  PlusIcon,
  RestoreIcon,
  SearchIcon,
  ShieldIcon,
  SparkleIcon,
  StarIcon,
  TrashIcon,
  UploadIcon,
  WarningIcon,
} from './index';

// 공통화 이전 SVG에서 기록한 도형입니다. 화면별 모양을 바꾸지 않았는지 확인합니다.
const cases = [
  {
    name: 'ChevronLeftIcon/default',
    icon: <ChevronLeftIcon variant="default" />,
    expected: [{ tag: 'path', attributes: { d: 'm15 18-6-6 6-6' } }],
  },
  {
    name: 'ChevronRightIcon/default',
    icon: <ChevronRightIcon variant="default" />,
    expected: [{ tag: 'path', attributes: { d: 'm9 18 6-6-6-6' } }],
  },
  {
    name: 'ChevronRightIcon/wide',
    icon: <ChevronRightIcon variant="wide" />,
    expected: [{ tag: 'path', attributes: { d: 'm9 5 7 7-7 7' } }],
  },
  {
    name: 'ChevronDownIcon/default',
    icon: <ChevronDownIcon variant="default" />,
    expected: [{ tag: 'path', attributes: { d: 'm6 9 6 6 6-6' } }],
  },
  {
    name: 'RestoreIcon/default',
    icon: <RestoreIcon variant="default" />,
    expected: [
      { tag: 'path', attributes: { d: 'M3 12a9 9 0 1 0 3-6.7L3 8' } },
      { tag: 'path', attributes: { d: 'M3 3v5h5' } },
    ],
  },
  {
    name: 'TrashIcon/default',
    icon: <TrashIcon variant="default" />,
    expected: [{ tag: 'path', attributes: { d: 'M4 7h16M9 7V4h6v3m3 0-1 14H7L6 7m4 4v6m4-6v6' } }],
  },
  {
    name: 'DownloadIcon/default',
    icon: <DownloadIcon variant="default" />,
    expected: [{ tag: 'path', attributes: { d: 'M12 3v12m0 0 4-4m-4 4-4-4M5 20h14' } }],
  },
  {
    name: 'UploadIcon/default',
    icon: <UploadIcon variant="default" />,
    expected: [
      { tag: 'path', attributes: { d: 'M12 16V4m0 0L8 8m4-4 4 4' } },
      { tag: 'path', attributes: { d: 'M5 14v5h14v-5' } },
    ],
  },
  {
    name: 'CloseIcon/default',
    icon: <CloseIcon variant="default" />,
    expected: [{ tag: 'path', attributes: { d: 'M6 6l12 12M18 6 6 18' } }],
  },
  {
    name: 'ImageIcon/default',
    icon: <ImageIcon variant="default" />,
    expected: [
      { tag: 'rect', attributes: { x: '3', y: '4', width: '18', height: '16', rx: '2' } },
      { tag: 'circle', attributes: { cx: '8.5', cy: '9', r: '1.5' } },
      { tag: 'path', attributes: { d: 'm4 17 5-5 4 4 2-2 5 5' } },
    ],
  },
  {
    name: 'ImageIcon/story',
    icon: <ImageIcon variant="story" />,
    expected: [
      { tag: 'rect', attributes: { x: '3', y: '4', width: '18', height: '16', rx: '2' } },
      { tag: 'circle', attributes: { cx: '8', cy: '9', r: '1.5' } },
      { tag: 'path', attributes: { d: 'm3 17 6-6 4 4 3-3 5 5' } },
    ],
  },
  {
    name: 'ImageOffIcon/default',
    icon: <ImageOffIcon variant="default" />,
    expected: [
      { tag: 'rect', attributes: { x: '3', y: '3', width: '18', height: '18', rx: '3' } },
      { tag: 'path', attributes: { d: 'm3 16 5-5 5 5 3-3 5 5M2 2l20 20' } },
    ],
  },
  {
    name: 'PinIcon/default',
    icon: <PinIcon variant="default" />,
    expected: [
      { tag: 'path', attributes: { d: 'M20 10c0 5-8 11-8 11S4 15 4 10a8 8 0 1 1 16 0Z' } },
      { tag: 'circle', attributes: { cx: '12', cy: '10', r: '2.5' } },
    ],
  },
  {
    name: 'PinIcon/brand',
    icon: <PinIcon variant="brand" />,
    expected: [
      {
        tag: 'path',
        attributes: {
          d: 'M20 10c0 5-8 11-8 11S4 15 4 10a8 8 0 1 1 16 0Z',
          'stroke-linejoin': 'round',
        },
      },
      {
        tag: 'circle',
        attributes: { cx: '12', cy: '10', r: '2.6', fill: 'currentColor', stroke: 'none' },
      },
    ],
  },
  {
    name: 'CalendarIcon/default',
    icon: <CalendarIcon variant="default" />,
    expected: [
      { tag: 'rect', attributes: { x: '3', y: '5', width: '18', height: '16', rx: '2' } },
      { tag: 'path', attributes: { d: 'M8 3v4m8-4v4M3 10h18' } },
    ],
  },
  {
    name: 'CalendarIcon/rounded',
    icon: <CalendarIcon variant="rounded" />,
    expected: [
      { tag: 'rect', attributes: { x: '3', y: '5', width: '18', height: '16', rx: '3' } },
      { tag: 'path', attributes: { d: 'M3 10h18M8 3v4M16 3v4', 'stroke-linecap': 'round' } },
    ],
  },
  {
    name: 'DocumentIcon/default',
    icon: <DocumentIcon variant="default" />,
    expected: [
      { tag: 'rect', attributes: { x: '4', y: '2.5', width: '16', height: '19', rx: '3' } },
      { tag: 'path', attributes: { d: 'M8 8h8M8 12h8M8 16h5' } },
    ],
  },
  {
    name: 'DocumentIcon/story',
    icon: <DocumentIcon variant="story" />,
    expected: [
      { tag: 'rect', attributes: { x: '5', y: '3', width: '14', height: '18', rx: '2' } },
      { tag: 'path', attributes: { d: 'M9 8h6M9 12h6M9 16h4' } },
    ],
  },
  {
    name: 'FolderWarningIcon/default',
    icon: <FolderWarningIcon variant="default" />,
    expected: [
      { tag: 'path', attributes: { d: 'M4 5a2 2 0 0 1 2-2h5l2 2h5a2 2 0 0 1 2 2v12H4Z' } },
      { tag: 'path', attributes: { d: 'M12 9v4m0 3v.01' } },
    ],
  },
  {
    name: 'EditIcon/default',
    icon: <EditIcon variant="default" />,
    expected: [
      { tag: 'path', attributes: { d: 'M12 20h9' } },
      { tag: 'path', attributes: { d: 'M16.5 3.5a2.1 2.1 0 0 1 3 3L8 18l-4 1 1-4Z' } },
    ],
  },
  {
    name: 'EditIcon/story',
    icon: <EditIcon variant="story" />,
    expected: [
      { tag: 'path', attributes: { d: 'm16 3 5 5-12 12-6 1 1-6Z' } },
      { tag: 'path', attributes: { d: 'm14 5 5 5' } },
    ],
  },
  {
    name: 'LinkIcon/default',
    icon: <LinkIcon variant="default" />,
    expected: [
      { tag: 'path', attributes: { d: 'M10 13a5 5 0 0 0 7.1.1l2-2a5 5 0 0 0-7.1-7.1l-1.1 1.1' } },
      { tag: 'path', attributes: { d: 'M14 11a5 5 0 0 0-7.1-.1l-2 2A5 5 0 0 0 12 20l1.1-1.1' } },
    ],
  },
  {
    name: 'WarningIcon/default',
    icon: <WarningIcon variant="default" />,
    expected: [
      {
        tag: 'path',
        attributes: {
          d: 'M10.3 3.7 2.5 18a2 2 0 0 0 1.8 3h15.4a2 2 0 0 0 1.8-3L13.7 3.7a2 2 0 0 0-3.4 0Z',
        },
      },
      { tag: 'path', attributes: { d: 'M12 9v4m0 4h.01' } },
    ],
  },
  {
    name: 'WarningIcon/input',
    icon: <WarningIcon variant="input" />,
    expected: [
      {
        tag: 'path',
        attributes: {
          d: 'M10.3 3.9 2.5 17.4A2 2 0 0 0 4.2 20.4h15.6a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0Z',
        },
      },
      { tag: 'path', attributes: { d: 'M12 9v4m0 3h.01' } },
    ],
  },
  {
    name: 'AlertCircleIcon/default',
    icon: <AlertCircleIcon variant="default" />,
    expected: [
      { tag: 'circle', attributes: { cx: '12', cy: '12', r: '9' } },
      { tag: 'path', attributes: { d: 'M12 8v5M12 16.5h.01' } },
    ],
  },
  {
    name: 'CheckIcon/default',
    icon: <CheckIcon variant="default" />,
    expected: [{ tag: 'path', attributes: { d: 'm5 12 5 5 9-10' } }],
  },
  {
    name: 'CheckIcon/compact',
    icon: <CheckIcon variant="compact" />,
    expected: [{ tag: 'path', attributes: { d: 'm5 12 4 4L19 6' } }],
  },
  {
    name: 'CheckIcon/selection',
    icon: <CheckIcon variant="selection" />,
    expected: [{ tag: 'path', attributes: { d: 'M5 12.5l4.5 4.5L19 7.5' } }],
  },
  {
    name: 'SearchIcon/default',
    icon: <SearchIcon variant="default" />,
    expected: [
      { tag: 'circle', attributes: { cx: '11', cy: '11', r: '7' } },
      { tag: 'path', attributes: { d: 'm20 20-4-4' } },
    ],
  },
  {
    name: 'SparkleIcon/default',
    icon: <SparkleIcon variant="default" />,
    expected: [
      {
        tag: 'path',
        attributes: {
          d: 'M12 2.5c.5 4.6 2.4 6.5 7 7-4.6.5-6.5 2.4-7 7-.5-4.6-2.4-6.5-7-7 4.6-.5 6.5-2.4 7-7Z',
        },
      },
      {
        tag: 'path',
        attributes: {
          d: 'M19 15c.2 1.8.9 2.6 2.7 2.8-1.8.2-2.5.9-2.7 2.7-.2-1.8-.9-2.5-2.7-2.7 1.8-.2 2.5-1 2.7-2.8Z',
        },
      },
    ],
  },
  {
    name: 'StarIcon/default',
    icon: <StarIcon variant="default" />,
    expected: [
      {
        tag: 'path',
        attributes: {
          d: 'm12 2.5 2.9 5.88 6.49.94-4.7 4.58 1.11 6.47L12 17.32l-5.8 3.05 1.11-6.47-4.7-4.58 6.49-.94L12 2.5Z',
        },
      },
    ],
  },
  {
    name: 'MapIcon/default',
    icon: <MapIcon variant="default" />,
    expected: [
      { tag: 'path', attributes: { d: 'm3 6 6-3 6 3 6-3v15l-6 3-6-3-6 3V6Z' } },
      { tag: 'path', attributes: { d: 'M9 3v15M15 6v15' } },
    ],
  },
  {
    name: 'ShieldIcon/default',
    icon: <ShieldIcon variant="default" />,
    expected: [
      {
        tag: 'path',
        attributes: { d: 'M12 2.5 4.5 5.5v6c0 4.3 3 8.2 7.5 10 4.5-1.8 7.5-5.7 7.5-10v-6Z' },
      },
      { tag: 'path', attributes: { d: 'm9 12 2 2 4-4' } },
    ],
  },
  {
    name: 'PersonIcon/default',
    icon: <PersonIcon variant="default" />,
    expected: [
      { tag: 'circle', attributes: { cx: '12', cy: '9', r: '3.6' } },
      { tag: 'path', attributes: { d: 'M5 20a7 7 0 0 1 14 0' } },
    ],
  },
  {
    name: 'PersonIcon/navigation',
    icon: <PersonIcon variant="navigation" />,
    expected: [
      { tag: 'circle', attributes: { cx: '12', cy: '8', r: '4' } },
      { tag: 'path', attributes: { d: 'M4.5 21a7.5 7.5 0 0 1 15 0' } },
    ],
  },
  {
    name: 'HomeIcon/default',
    icon: <HomeIcon variant="default" />,
    expected: [
      {
        tag: 'path',
        attributes: { d: 'm3 10 9-7 9 7v10a1 1 0 0 1-1 1h-5v-7H9v7H4a1 1 0 0 1-1-1V10Z' },
      },
    ],
  },
  {
    name: 'ListIcon/default',
    icon: <ListIcon variant="default" />,
    expected: [
      { tag: 'path', attributes: { d: 'M8 6h13M8 12h13M8 18h13' } },
      {
        tag: 'circle',
        attributes: { cx: '4', cy: '6', r: '1', fill: 'currentColor', stroke: 'none' },
      },
      {
        tag: 'circle',
        attributes: { cx: '4', cy: '12', r: '1', fill: 'currentColor', stroke: 'none' },
      },
      {
        tag: 'circle',
        attributes: { cx: '4', cy: '18', r: '1', fill: 'currentColor', stroke: 'none' },
      },
    ],
  },
  {
    name: 'PlusIcon/default',
    icon: <PlusIcon variant="default" />,
    expected: [{ tag: 'path', attributes: { d: 'M12 5v14M5 12h14' } }],
  },
  {
    name: 'MoreIcon/default',
    icon: <MoreIcon variant="default" />,
    expected: [
      { tag: 'circle', attributes: { cx: '5', cy: '12', r: '1.8' } },
      { tag: 'circle', attributes: { cx: '12', cy: '12', r: '1.8' } },
      { tag: 'circle', attributes: { cx: '19', cy: '12', r: '1.8' } },
    ],
  },
  {
    name: 'ExpandIcon/default',
    icon: <ExpandIcon variant="default" />,
    expected: [{ tag: 'path', attributes: { d: 'M14 3h7v7M21 3l-8 8M10 21H3v-7M3 21l8-8' } }],
  },
  {
    name: 'KakaoIcon/default',
    icon: <KakaoIcon variant="default" />,
    expected: [
      {
        tag: 'path',
        attributes: {
          d: 'M12 3C6.5 3 2 6.5 2 10.8c0 2.8 1.9 5.3 4.8 6.6l-1 3.5c-.1.4.3.7.6.5l4.3-2.8c.4 0 .8.1 1.3.1 5.5 0 10-3.5 10-7.9S17.5 3 12 3Z',
        },
      },
    ],
  },
  {
    name: 'KakaoIcon/badge',
    icon: <KakaoIcon variant="badge" />,
    expected: [
      {
        tag: 'path',
        attributes: {
          d: 'M12 4C6.48 4 2 7.36 2 11.5c0 2.68 1.88 5.03 4.7 6.36l-.95 3.5c-.08.31.27.56.54.38l4.13-2.73c.52.06 1.05.09 1.58.09 5.52 0 10-3.36 10-7.6S17.52 4 12 4Z',
        },
      },
    ],
  },
];

describe('기존 아이콘 도형 보존', () => {
  it.each(cases)('$name', ({ icon, expected }) => {
    const { container } = render(icon);
    const actual = Array.from(container.querySelector('svg')!.children).map((element) => ({
      tag: element.tagName,
      attributes: Object.fromEntries(
        Array.from(element.attributes).map((attr) => [attr.name, attr.value]),
      ),
    }));
    expect(actual).toEqual(expected);
  });
});
