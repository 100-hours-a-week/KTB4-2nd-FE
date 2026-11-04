import type { ComponentProps, ReactNode } from 'react';

export type IconProps = Omit<ComponentProps<'svg'>, 'children'> & {
  size?: number | string;
};

/** 장식용 아이콘은 숨기고, 이름을 제공한 아이콘만 접근성 트리에 노출합니다. */
function SvgIcon({
  size = 24,
  width = size,
  height = size,
  children,
  ...props
}: IconProps & {
  children: ReactNode;
}) {
  const labelled = Boolean(props['aria-label'] || props['aria-labelledby']);

  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.8}
      width={width}
      height={height}
      focusable="false"
      aria-hidden={labelled ? undefined : true}
      role={labelled ? 'img' : undefined}
      {...props}
    >
      {children}
    </svg>
  );
}

function createIcon<V extends string>(
  name: string,
  variants: Record<V | 'default', ReactNode>,
  defaults: IconProps = {},
) {
  function Icon({ variant = 'default', ...props }: IconProps & { variant?: V | 'default' }) {
    return (
      <SvgIcon {...defaults} {...props}>
        {variants[variant]}
      </SvgIcon>
    );
  }
  Icon.displayName = name;
  return Icon;
}

export const ChevronLeftIcon = createIcon('ChevronLeftIcon', {
  default: <path d="m15 18-6-6 6-6" />,
});
export const ChevronRightIcon = createIcon('ChevronRightIcon', {
  default: <path d="m9 18 6-6-6-6" />,
  wide: <path d="m9 5 7 7-7 7" />,
});
export const ChevronDownIcon = createIcon('ChevronDownIcon', {
  default: <path d="m6 9 6 6 6-6" />,
});

export function ChevronIcon({
  direction,
  ...props
}: IconProps & {
  direction: 'left' | 'right';
}) {
  return direction === 'left' ? <ChevronLeftIcon {...props} /> : <ChevronRightIcon {...props} />;
}

export const RestoreIcon = createIcon('RestoreIcon', {
  default: (
    <>
      <path d="M3 12a9 9 0 1 0 3-6.7L3 8" />
      <path d="M3 3v5h5" />
    </>
  ),
});
export const TrashIcon = createIcon('TrashIcon', {
  default: <path d="M4 7h16M9 7V4h6v3m3 0-1 14H7L6 7m4 4v6m4-6v6" />,
});
export const DownloadIcon = createIcon('DownloadIcon', {
  default: <path d="M12 3v12m0 0 4-4m-4 4-4-4M5 20h14" />,
});
export const UploadIcon = createIcon('UploadIcon', {
  default: (
    <>
      <path d="M12 16V4m0 0L8 8m4-4 4 4" />
      <path d="M5 14v5h14v-5" />
    </>
  ),
});
export const CloseIcon = createIcon('CloseIcon', {
  default: <path d="M6 6l12 12M18 6 6 18" />,
});
export const ImageIcon = createIcon('ImageIcon', {
  default: (
    <>
      <rect x="3" y="4" width="18" height="16" rx="2" />
      <circle cx="8.5" cy="9" r="1.5" />
      <path d="m4 17 5-5 4 4 2-2 5 5" />
    </>
  ),
  story: (
    <>
      <rect x="3" y="4" width="18" height="16" rx="2" />
      <circle cx="8" cy="9" r="1.5" />
      <path d="m3 17 6-6 4 4 3-3 5 5" />
    </>
  ),
});
export const ImageOffIcon = createIcon('ImageOffIcon', {
  default: (
    <>
      <rect x="3" y="3" width="18" height="18" rx="3" />
      <path d="m3 16 5-5 5 5 3-3 5 5M2 2l20 20" />
    </>
  ),
});
export const PinIcon = createIcon('PinIcon', {
  default: (
    <>
      <path d="M20 10c0 5-8 11-8 11S4 15 4 10a8 8 0 1 1 16 0Z" />
      <circle cx="12" cy="10" r="2.5" />
    </>
  ),
  brand: (
    <>
      <path d="M20 10c0 5-8 11-8 11S4 15 4 10a8 8 0 1 1 16 0Z" strokeLinejoin="round" />
      <circle cx="12" cy="10" r="2.6" fill="currentColor" stroke="none" />
    </>
  ),
});
export const CalendarIcon = createIcon('CalendarIcon', {
  default: (
    <>
      <rect x="3" y="5" width="18" height="16" rx="2" />
      <path d="M8 3v4m8-4v4M3 10h18" />
    </>
  ),
  rounded: (
    <>
      <rect x="3" y="5" width="18" height="16" rx="3" />
      <path d="M3 10h18M8 3v4M16 3v4" strokeLinecap="round" />
    </>
  ),
});
export const DocumentIcon = createIcon('DocumentIcon', {
  default: (
    <>
      <rect x="4" y="2.5" width="16" height="19" rx="3" />
      <path d="M8 8h8M8 12h8M8 16h5" />
    </>
  ),
  story: (
    <>
      <rect x="5" y="3" width="14" height="18" rx="2" />
      <path d="M9 8h6M9 12h6M9 16h4" />
    </>
  ),
});
export const FolderWarningIcon = createIcon('FolderWarningIcon', {
  default: (
    <>
      <path d="M4 5a2 2 0 0 1 2-2h5l2 2h5a2 2 0 0 1 2 2v12H4Z" />
      <path d="M12 9v4m0 3v.01" />
    </>
  ),
});
export const EditIcon = createIcon('EditIcon', {
  default: (
    <>
      <path d="M12 20h9" />
      <path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L8 18l-4 1 1-4Z" />
    </>
  ),
  story: (
    <>
      <path d="m16 3 5 5-12 12-6 1 1-6Z" />
      <path d="m14 5 5 5" />
    </>
  ),
});
export const LinkIcon = createIcon('LinkIcon', {
  default: (
    <>
      <path d="M10 13a5 5 0 0 0 7.1.1l2-2a5 5 0 0 0-7.1-7.1l-1.1 1.1" />
      <path d="M14 11a5 5 0 0 0-7.1-.1l-2 2A5 5 0 0 0 12 20l1.1-1.1" />
    </>
  ),
});
export const MailIcon = createIcon('MailIcon', {
  default: (
    <>
      <rect x="3" y="5" width="18" height="14" rx="2" />
      <path d="m4 7 8 6 8-6" />
    </>
  ),
});
export const WarningIcon = createIcon('WarningIcon', {
  default: (
    <>
      <path d="M10.3 3.7 2.5 18a2 2 0 0 0 1.8 3h15.4a2 2 0 0 0 1.8-3L13.7 3.7a2 2 0 0 0-3.4 0Z" />
      <path d="M12 9v4m0 4h.01" />
    </>
  ),
  input: (
    <>
      <path d="M10.3 3.9 2.5 17.4A2 2 0 0 0 4.2 20.4h15.6a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0Z" />
      <path d="M12 9v4m0 3h.01" />
    </>
  ),
});
export const AlertCircleIcon = createIcon('AlertCircleIcon', {
  default: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 8v5M12 16.5h.01" />
    </>
  ),
});
export const CheckIcon = createIcon('CheckIcon', {
  default: <path d="m5 12 5 5 9-10" />,
  compact: <path d="m5 12 4 4L19 6" />,
  selection: <path d="M5 12.5l4.5 4.5L19 7.5" />,
});
export const SearchIcon = createIcon('SearchIcon', {
  default: (
    <>
      <circle cx="11" cy="11" r="7" />
      <path d="m20 20-4-4" />
    </>
  ),
});
export const SparkleIcon = createIcon(
  'SparkleIcon',
  {
    default: (
      <>
        <path d="M12 2.5c.5 4.6 2.4 6.5 7 7-4.6.5-6.5 2.4-7 7-.5-4.6-2.4-6.5-7-7 4.6-.5 6.5-2.4 7-7Z" />
        <path d="M19 15c.2 1.8.9 2.6 2.7 2.8-1.8.2-2.5.9-2.7 2.7-.2-1.8-.9-2.5-2.7-2.7 1.8-.2 2.5-1 2.7-2.8Z" />
      </>
    ),
  },
  { fill: 'currentColor', stroke: 'none' },
);
export const StarIcon = createIcon('StarIcon', {
  default: (
    <path d="m12 2.5 2.9 5.88 6.49.94-4.7 4.58 1.11 6.47L12 17.32l-5.8 3.05 1.11-6.47-4.7-4.58 6.49-.94L12 2.5Z" />
  ),
});
export const MapIcon = createIcon('MapIcon', {
  default: (
    <>
      <path d="m3 6 6-3 6 3 6-3v15l-6 3-6-3-6 3V6Z" />
      <path d="M9 3v15M15 6v15" />
    </>
  ),
});
export const ShieldIcon = createIcon('ShieldIcon', {
  default: (
    <>
      <path d="M12 2.5 4.5 5.5v6c0 4.3 3 8.2 7.5 10 4.5-1.8 7.5-5.7 7.5-10v-6Z" />
      <path d="m9 12 2 2 4-4" />
    </>
  ),
});
export const PersonIcon = createIcon('PersonIcon', {
  default: (
    <>
      <circle cx="12" cy="9" r="3.6" />
      <path d="M5 20a7 7 0 0 1 14 0" />
    </>
  ),
  navigation: (
    <>
      <circle cx="12" cy="8" r="4" />
      <path d="M4.5 21a7.5 7.5 0 0 1 15 0" />
    </>
  ),
});
export const HomeIcon = createIcon('HomeIcon', {
  default: <path d="m3 10 9-7 9 7v10a1 1 0 0 1-1 1h-5v-7H9v7H4a1 1 0 0 1-1-1V10Z" />,
});
export const ListIcon = createIcon('ListIcon', {
  default: (
    <>
      <path d="M8 6h13M8 12h13M8 18h13" />
      <circle cx="4" cy="6" r="1" fill="currentColor" stroke="none" />
      <circle cx="4" cy="12" r="1" fill="currentColor" stroke="none" />
      <circle cx="4" cy="18" r="1" fill="currentColor" stroke="none" />
    </>
  ),
});
export const PlusIcon = createIcon('PlusIcon', {
  default: <path d="M12 5v14M5 12h14" />,
});
export const MoreIcon = createIcon(
  'MoreIcon',
  {
    default: (
      <>
        <circle cx="5" cy="12" r="1.8" />
        <circle cx="12" cy="12" r="1.8" />
        <circle cx="19" cy="12" r="1.8" />
      </>
    ),
  },
  { fill: 'currentColor', stroke: 'none' },
);
export const ExpandIcon = createIcon('ExpandIcon', {
  default: <path d="M14 3h7v7M21 3l-8 8M10 21H3v-7M3 21l8-8" />,
});
export const KakaoIcon = createIcon(
  'KakaoIcon',
  {
    default: (
      <path d="M12 3C6.5 3 2 6.5 2 10.8c0 2.8 1.9 5.3 4.8 6.6l-1 3.5c-.1.4.3.7.6.5l4.3-2.8c.4 0 .8.1 1.3.1 5.5 0 10-3.5 10-7.9S17.5 3 12 3Z" />
    ),
    badge: (
      <path d="M12 4C6.48 4 2 7.36 2 11.5c0 2.68 1.88 5.03 4.7 6.36l-.95 3.5c-.08.31.27.56.54.38l4.13-2.73c.52.06 1.05.09 1.58.09 5.52 0 10-3.36 10-7.6S17.52 4 12 4Z" />
    ),
  },
  { fill: 'currentColor', stroke: 'none' },
);

export type NavigationIconName = 'home' | 'list' | 'plus' | 'search' | 'profile';

export function NavigationIcon({ name, ...props }: IconProps & { name: NavigationIconName }) {
  const appearance: IconProps = {
    strokeWidth: name === 'plus' ? 2.4 : 1.8,
    strokeLinecap: 'round',
    strokeLinejoin: 'round',
    ...props,
  };
  if (name === 'profile') return <PersonIcon variant="navigation" {...appearance} />;
  const icons = { home: HomeIcon, list: ListIcon, plus: PlusIcon, search: SearchIcon };
  const Icon = icons[name];
  return <Icon {...appearance} />;
}
