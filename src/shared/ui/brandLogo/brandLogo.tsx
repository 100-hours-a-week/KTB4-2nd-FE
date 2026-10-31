import type { ComponentProps } from 'react';

export const BRAND_LOGO_PATH =
  'M367.86,611.81 C349.30,582.09 330.87,548.67 317.79,512.83 A206.64,206.64 0 1 1 699.25,529.48 C657.48,619.08 572.72,708.88 509.45,788.48 C459.70,737.46 415.69,667.30 418.88,619.47 C417.61,552.50 473.10,448.54 537.45,417.10 C523.48,445.99 483.94,498.29 482.66,530.18 C482.66,568.44 490.25,610.47 521.31,607.16 A156.26,156.26 0 1 0 348.73,451.73 C348.73,491.91 350.64,569.72 367.86,611.81 Z M483.62,412.89 Q538.34,376.28 602.82,363.27 Q581.01,420.86 550.08,474.12 L553.26,405.49 Z';

export const BRAND_LOGO_VIEWBOX = '235.5 235.5 553 553';

export type BrandLogoProps = Omit<ComponentProps<'svg'>, 'children'> & {
  size?: number | string;
  title?: string;
};

export function BrandLogo({ size = 24, title, ...props }: BrandLogoProps) {
  return (
    <svg
      viewBox={BRAND_LOGO_VIEWBOX}
      width={size}
      height={size}
      fill="currentColor"
      role={title ? 'img' : undefined}
      aria-hidden={title ? undefined : true}
      focusable="false"
      {...props}
    >
      {title && <title>{title}</title>}
      <path d={BRAND_LOGO_PATH} />
    </svg>
  );
}
