import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { useSyncExternalStore, type ReactNode } from 'react';

// 토큰 값은 CSS에서 읽습니다. 스토리에 색상·크기 값을 다시 정의하지 않습니다.
const subscribe = () => () => {};
function TokenValue({ name }: { name: string }) {
  const value = useSyncExternalStore(
    subscribe,
    () => getComputedStyle(document.documentElement).getPropertyValue(name).trim(),
    () => '',
  );
  return <code className="text-description text-muted break-all">{value}</code>;
}

function Page({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: ReactNode;
}) {
  return (
    <main className="mx-auto max-w-5xl space-y-8 p-6 text-brand sm:p-10">
      <header className="space-y-3 border-b border-border-subtle pb-6">
        <p className="text-label text-muted">여담 · FOUNDATIONS</p>
        <h1 className="text-page-title">{title}</h1>
        <p className="text-body text-muted">{description}</p>
      </header>
      {children}
    </main>
  );
}

function Token({ name, usage, children }: { name: string; usage: string; children: ReactNode }) {
  return (
    <li className="flex min-w-0 flex-col gap-4 rounded-card border border-border-subtle bg-surface p-5">
      {children}
      <div className="min-w-0 space-y-1">
        <code className="block text-label break-all">{name}</code>
        <TokenValue name={name} />
        <p className="text-description text-muted">{usage}</p>
      </div>
    </li>
  );
}

const meta = {
  title: 'Foundations/Design Tokens',
  tags: ['!autodocs'],
  parameters: { layout: 'fullscreen', controls: { disable: true } },
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

export const Overview: Story = {
  name: '사용 원칙',
  render: () => (
    <Page
      title="디자인의 공통 기준"
      description="화면마다 따로 결정하던 색상, 글자, 간격과 형태를 한 곳에서 관리합니다."
    >
      <section className="space-y-4">
        <h2 className="text-section-title">토큰 → 컴포넌트 → 화면</h2>
        <p className="text-body">
          색상과 크기의 원본은 tokens.css입니다. 앱과 Storybook이 같은 base.css를 읽으며, 컴포넌트는
          이름이 있는 토큰을 사용합니다.
        </p>
        <div className="rounded-card bg-surface-subtle p-5">
          <code className="text-label break-all">
            bg-brand · text-muted · rounded-control · text-body · min-h-control-md
          </code>
        </div>
      </section>
      <section className="space-y-4">
        <h2 className="text-section-title">이번 단계의 적용 범위</h2>
        <ul className="list-disc space-y-2 pl-5 text-body">
          <li>기존 색상과 모서리 토큰의 이름·값을 유지합니다.</li>
          <li>타이포 역할, 컨트롤 높이, 그림자, 레이어와 모션 기준을 추가합니다.</li>
          <li>기존 화면의 개별 스타일은 후속 컴포넌트 PR에서 전환합니다.</li>
          <li>카카오 브랜드, 일러스트, 지도 좌표·사진 비율은 용도에 맞는 예외를 허용합니다.</li>
        </ul>
      </section>
      <aside className="rounded-card border border-border-subtle p-5 text-description text-muted">
        Button은 sm·md·lg 크기를 지원하고, Input은 두 형태 모두 기본 48px입니다. 화면별 개별 스타일
        전환은 단계적으로 진행합니다.
      </aside>
    </Page>
  ),
};

const colorGroups = [
  {
    title: '액션',
    tokens: [
      ['--brand', '주요 액션과 브랜드 강조 · bg-brand'],
      ['--brand-hover', '주요 액션 hover'],
      ['--brand-active', '주요 액션 active'],
      ['--danger-strong', '위험 액션 배경 · 흰색 텍스트와 조합'],
      ['--danger-strong-hover', '위험 액션 hover'],
      ['--danger-strong-active', '위험 액션 active'],
    ],
  },
  {
    title: '배경과 경계',
    tokens: [
      ['--surface', '기본 표면 · bg-surface'],
      ['--surface-subtle', '보조 패널과 액션 배경'],
      ['--surface-subtle-hover', '보조 표면 hover'],
      ['--app-background', '앱 배경'],
      ['--app-backdrop', '데스크톱 프레임 바깥 배경'],
      ['--border-subtle', '표면 구분용 경계 · 입력 식별 경계와 구분'],
      ['--field-border', '입력 경계와 안내'],
    ],
  },
  {
    title: '텍스트와 상태',
    tokens: [
      ['--foreground', '기본 본문'],
      ['--muted', '보조 텍스트'],
      ['--danger', '기존 오류 강조 · 작은 본문 대비는 별도 확인'],
      ['--success', '성공 상태'],
      ['--warning', '주의 상태 · 작은 본문 대비는 별도 확인'],
    ],
  },
] as const;

export const Colors: Story = {
  name: '색상',
  render: () => (
    <Page
      title="색상"
      description="색상 값보다 역할을 선택합니다. 상태는 문구·아이콘과 함께 전달하고, 텍스트와 배경 조합의 대비를 확인합니다."
    >
      {colorGroups.map((group) => (
        <section key={group.title} className="space-y-4">
          <h2 className="text-section-title">{group.title}</h2>
          <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {group.tokens.map(([name, usage]) => (
              <Token key={name} name={name} usage={usage}>
                <div
                  aria-hidden="true"
                  className="h-20 rounded-control border border-border-subtle"
                  style={{ background: `var(${name})` }}
                />
              </Token>
            ))}
          </ul>
        </section>
      ))}
    </Page>
  ),
};

const typography = [
  ['page-title', '화면 제목', 'text-page-title'],
  ['section-title', '섹션·헤더 제목', 'text-section-title'],
  ['body', '기본 본문', 'text-body'],
  ['label', '입력 라벨과 짧은 강조', 'text-label'],
  ['description', '안내·보조 설명', 'text-description'],
  ['caption', '날짜·개수 등 짧은 메타 정보', 'text-caption'],
] as const;

export const Typography: Story = {
  name: '타이포그래피',
  render: () => (
    <Page
      title="타이포그래피"
      description="SUIT를 사용합니다. 역할별 text-* 유틸리티에 크기, 줄 높이, 굵기와 자간이 포함됩니다. 작은 글자는 짧은 보조 정보에만 사용합니다."
    >
      <ul className="space-y-4">
        {typography.map(([role, usage, className]) => (
          <Token key={role} name={`--text-${role}`} usage={`${usage} · ${className}`}>
            <p className={className}>사진으로 남긴 여행, 이야기로 이어지는 순간</p>
            <p className="text-description text-muted">
              줄 높이 <TokenValue name={`--text-${role}--line-height`} /> · 굵기{' '}
              <TokenValue name={`--text-${role}--font-weight`} /> · 자간{' '}
              <TokenValue name={`--text-${role}--letter-spacing`} />
            </p>
          </Token>
        ))}
      </ul>
    </Page>
  ),
};

export const Spacing: Story = {
  name: '간격',
  render: () => (
    <Page
      title="간격"
      description="Tailwind 기본 4px 단위를 유지합니다. gap-*, p-*, m-*를 우선 사용하고, CSS에서는 --space-*를 참조합니다. 기본 rem 크기에서의 기준입니다."
    >
      <ul className="grid gap-4 sm:grid-cols-2">
        {[1, 2, 3, 4, 6, 8, 12].map((step) => (
          <Token key={step} name={`--space-${step}`} usage={`gap-${step} · p-${step} · m-${step}`}>
            <div className="flex h-14 items-center rounded-control bg-surface-subtle px-4">
              <span
                aria-hidden="true"
                className="h-6 rounded-sm bg-brand"
                style={{ width: `var(--space-${step})` }}
              />
            </div>
          </Token>
        ))}
      </ul>
    </Page>
  ),
};

export const ControlSizes: Story = {
  name: '컨트롤 높이',
  render: () => (
    <Page
      title="컨트롤 높이"
      description="한 줄 버튼과 입력의 공통 높이 기준입니다. Button의 size props는 sm·md·lg를 지원하며 기본은 md입니다. Input의 기본 높이는 md입니다."
    >
      <ul className="grid items-start gap-4 sm:grid-cols-3">
        {(['sm', 'md', 'lg'] as const).map((size) => (
          <Token
            key={size}
            name={`--control-height-${size}`}
            usage={`min-h-control-${size}${size === 'md' ? ' · 기본 높이' : ''}`}
          >
            <div
              className="flex items-center justify-center rounded-control border border-field-border px-4 text-label"
              style={{ minHeight: `var(--control-height-${size})` }}
            >
              {size.toUpperCase()} · 컨트롤 예시
            </div>
          </Token>
        ))}
      </ul>
      <p className="text-description text-muted">
        아이콘 버튼은 아이콘 그림의 크기와 클릭 영역을 구분합니다. 최소 클릭 영역은 44px을 기준으로
        하고, 작은 시각 요소도 여백으로 영역을 확보합니다.
      </p>
    </Page>
  ),
};

export const ShapeAndElevation: Story = {
  name: '모서리와 그림자',
  render: () => (
    <Page
      title="모서리와 그림자"
      description="표면의 역할에 따라 형태를 선택합니다. 그림자는 현재 메뉴·다이얼로그·하단 내비게이션의 대표 값을 기준으로 정리했습니다."
    >
      <section className="space-y-4">
        <h2 className="text-section-title">모서리</h2>
        <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {(
            [
              ['--control-radius', 'rounded-control · 컨트롤'],
              ['--row-radius', 'rounded-row · 행'],
              ['--card-radius', 'rounded-card · 카드'],
              ['--sheet-radius', 'rounded-sheet · 오버레이'],
              ['--pill-radius', 'rounded-pill · 칩'],
            ] as const
          ).map(([name, usage]) => (
            <Token key={name} name={name} usage={usage}>
              <div
                aria-hidden="true"
                className="h-20 border border-field-border bg-surface-subtle"
                style={{ borderRadius: `var(${name})` }}
              />
            </Token>
          ))}
        </ul>
      </section>
      <section className="space-y-4">
        <h2 className="text-section-title">그림자</h2>
        <ul className="grid gap-8 sm:grid-cols-3">
          {(['menu', 'dialog', 'navigation'] as const).map((role) => (
            <Token key={role} name={`--shadow-${role}`} usage={`shadow-${role}`}>
              <div
                aria-hidden="true"
                className="my-4 h-20 rounded-card bg-surface"
                style={{ boxShadow: `var(--shadow-${role})` }}
              />
            </Token>
          ))}
        </ul>
      </section>
    </Page>
  ),
};

export const LayersAndMotion: Story = {
  name: '레이어와 모션',
  render: () => (
    <Page
      title="레이어와 모션"
      description="레이어는 화면 전체의 상대적인 순서를 나타냅니다. 모션은 조작을 보조하며, 필수 정보를 애니메이션에만 의존하지 않습니다."
    >
      <section className="space-y-4">
        <h2 className="text-section-title">레이어 순서</h2>
        <ul className="grid gap-4 sm:grid-cols-2">
          {(
            [
              ['base', '기본 콘텐츠'],
              ['header', '고정 헤더·페이지 내부 팝오버'],
              ['navigation', '하단 내비게이션·전체 화면 뷰어'],
              ['overlay', '다이얼로그·오버레이 메뉴'],
              ['toast', '사용자 알림'],
            ] as const
          ).map(([role, usage]) => (
            <Token key={role} name={`--layer-${role}`} usage={usage}>
              <code className="text-description">z-(--layer-{role})</code>
            </Token>
          ))}
        </ul>
        <p className="text-description text-muted">
          z-index는 같은 stacking context 안에서 비교됩니다. 오버레이는 Portal 배치를 함께 확인해야
          합니다.
        </p>
      </section>
      <section className="space-y-4">
        <h2 className="text-section-title">시간과 easing</h2>
        <ul className="grid gap-4 sm:grid-cols-2">
          {(
            [
              ['--motion-fast', '짧은 선택·피드백'],
              ['--motion-normal', '일반적인 색상·상태 전환'],
              ['--motion-enter', '화면 진입'],
              ['--motion-ease-out', 'ease-(--motion-ease-out)'],
            ] as const
          ).map(([name, usage]) => (
            <Token key={name} name={name} usage={usage}>
              <span className="text-label">
                {name === '--motion-ease-out' ? '감속하며 마무리' : '전환 시간'}
              </span>
            </Token>
          ))}
        </ul>
        <div className="space-y-3 rounded-card border border-border-subtle p-5">
          <p className="text-description text-muted">
            마우스 또는 키보드 포커스로 확인하세요. reduced motion 설정에서는 전환을 생략합니다.
          </p>
          <button
            type="button"
            className="min-h-control-md rounded-control bg-brand px-6 text-label text-white hover:bg-brand-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand motion-safe:transition-colors motion-safe:duration-(--motion-normal) motion-safe:ease-(--motion-ease-out)"
          >
            상태 전환 예시
          </button>
        </div>
      </section>
    </Page>
  ),
};
