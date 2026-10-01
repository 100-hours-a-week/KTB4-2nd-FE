import Link from 'next/link';

import { KakaoLoginButton } from '@/features/kakaoLogin';

const CONTACT_EMAIL = 'leo@yeodam-2gether.com';

export function LoginPage() {
  return (
    <main className="page-enter flex h-full flex-col overflow-hidden px-6 pt-[max(24px,env(safe-area-inset-top))] pb-[max(24px,env(safe-area-inset-bottom))]">
      <header className="flex items-center gap-2">
        <BrandMark />
        <span className="text-brand text-lg font-extrabold tracking-[-0.02em]">여담</span>
        <span className="text-brand/60 text-xs font-semibold tracking-[0.08em] uppercase">
          yeodam
        </span>
      </header>

      <div className="relative -mx-6 min-h-0 flex-1">
        <ScatteredPhotosIllustration />
      </div>

      <section className="pt-2">
        <h1 className="text-brand text-[30px] leading-[1.3] font-extrabold tracking-[-0.03em]">
          흩어진 여행 사진을
          <br />
          하나의 기록으로
        </h1>

        <p className="text-field-border mt-3 text-[15px] leading-6">
          사진만 올리면 여담이 장소별로 정리해 드려요.
          <br />
          카카오 계정으로 바로 시작할 수 있어요.
        </p>

        <KakaoLoginButton />

        <p className="text-muted mt-4 text-center text-xs leading-5">
          시작하면 여담의{' '}
          <Link
            href="/terms/service"
            className="hover:text-brand underline underline-offset-2 transition-colors"
          >
            이용약관
          </Link>
          과
          <br />
          <Link
            href="/terms/privacy"
            className="hover:text-brand underline underline-offset-2 transition-colors"
          >
            개인정보처리방침
          </Link>
          에 동의하게 돼요.
        </p>
      </section>

      <footer className="border-border-subtle mt-6 flex items-center justify-center gap-2 border-t pt-4 text-xs">
        <span className="text-muted font-semibold">문의하기</span>
        <a
          href={`mailto:${CONTACT_EMAIL}`}
          className="text-field-border hover:text-brand focus-visible:outline-brand rounded underline-offset-2 transition-colors hover:underline focus-visible:outline-2 focus-visible:outline-offset-2"
        >
          {CONTACT_EMAIL}
        </a>
      </footer>
    </main>
  );
}

function BrandMark() {
  return (
    <span
      aria-hidden="true"
      className="bg-brand grid size-8 place-items-center rounded-[10px] text-white"
    >
      <svg
        width="18"
        height="18"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
      >
        <path d="M20 10c0 5-8 11-8 11S4 15 4 10a8 8 0 1 1 16 0Z" strokeLinejoin="round" />
        <circle cx="12" cy="10" r="2.6" fill="currentColor" stroke="none" />
      </svg>
    </span>
  );
}

const STROKE = '#3d5563';

/**
 * 여러 곳에서 찍은 여행 사진이 흩어져 있다가 하나의 핀(기록)으로 모이는 모습입니다.
 * 서비스 문구 '흩어진 여행 사진을 하나의 기록으로'를 그림으로 옮겼습니다.
 */
function ScatteredPhotosIllustration() {
  return (
    <svg
      aria-hidden="true"
      className="absolute inset-0 h-full w-full"
      viewBox="0 0 390 400"
      preserveAspectRatio="xMidYMid meet"
    >
      <defs>
        <filter id="login-card-shadow" x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="0" dy="6" stdDeviation="7" floodColor="#021730" floodOpacity="0.14" />
        </filter>
        <clipPath id="login-photo-clip">
          <rect width="116" height="110" rx="3" />
        </clipPath>
        <linearGradient id="login-dusk" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#f9dcc0" />
          <stop offset="100%" stopColor="#f2b8a2" />
        </linearGradient>
      </defs>

      {/* 사진마다 핀으로 이어지는 점선: 흩어진 사진이 하나로 모인다는 뜻 */}
      <g fill="none" stroke="#b7c6d3" strokeWidth="1.5" strokeDasharray="3 5" strokeLinecap="round">
        <path d="M110 120 Q150 150 195 200" />
        <path d="M282 112 Q240 150 195 200" />
        <path d="M112 284 Q150 240 195 200" />
        <path d="M280 290 Q240 244 195 200" />
      </g>

      <PhotoCard x={30} y={34} rotate={-7} caption="강릉">
        <SeaScene />
      </PhotoCard>
      <PhotoCard x={228} y={22} rotate={6} caption="설악산">
        <MountainScene />
      </PhotoCard>
      <PhotoCard x={44} y={216} rotate={5} caption="서울">
        <CityScene />
      </PhotoCard>
      <PhotoCard x={218} y={222} rotate={-5} caption="제주">
        <IslandScene />
      </PhotoCard>

      <circle cx="195" cy="200" r="32" fill="#021730" opacity="0.08" />
      <circle cx="195" cy="200" r="23" fill="#021730" />
      <path
        d="M195 187 c-6.6 0 -12 5.4 -12 12 c0 8.6 12 18.5 12 18.5 s12 -9.9 12 -18.5 c0 -6.6 -5.4 -12 -12 -12Z"
        fill="#ffffff"
      />
      <circle cx="195" cy="199" r="4.2" fill="#021730" />
    </svg>
  );
}

function PhotoCard({
  x,
  y,
  rotate,
  caption,
  children,
}: {
  x: number;
  y: number;
  rotate: number;
  caption: string;
  children: React.ReactNode;
}) {
  return (
    <g transform={`translate(${x} ${y}) rotate(${rotate} 65 75)`} filter="url(#login-card-shadow)">
      <rect width="130" height="150" rx="6" fill="#ffffff" />
      <g transform="translate(7 7)" clipPath="url(#login-photo-clip)">
        {children}
      </g>
      <text x="65" y="137" textAnchor="middle" fontSize="11" fontWeight="700" fill="#64748b">
        {caption}
      </text>
    </g>
  );
}

function SeaScene() {
  return (
    <>
      <rect width="116" height="110" fill="#cfe9f4" />
      <ellipse cx="30" cy="22" rx="14" ry="5" fill="#ffffff" opacity="0.9" />
      <rect y="52" width="116" height="40" fill="#76c4df" />
      <line x1="0" y1="52" x2="116" y2="52" stroke={STROKE} strokeOpacity="0.4" />
      <path
        d="M10 62h18M48 60h12M74 66h22M20 74h14M58 78h20M92 76h12M8 84h16M40 86h22"
        stroke="#aadcef"
        strokeWidth="1.4"
        strokeLinecap="round"
      />
      <path
        d="M34 68h10M84 84h14M62 70h8"
        stroke="#58adcf"
        strokeWidth="1.4"
        strokeLinecap="round"
      />
      <rect y="92" width="116" height="18" fill="#ece6d3" />
      <line x1="0" y1="92" x2="116" y2="92" stroke={STROKE} strokeOpacity="0.4" />
      <g stroke={STROKE} strokeWidth="0.9" strokeLinejoin="round">
        <line x1="80" y1="32" x2="80" y2="50" />
        <path d="M81 34 L81 48 L91 48 Z" fill="#ffffff" />
        <path d="M79 39 L79 48 L72 48 Z" fill="#eef6fa" />
        <path d="M69 50 L92 50 L88 55 L73 55 Z" fill={STROKE} />
      </g>
    </>
  );
}

function MountainScene() {
  return (
    <>
      <rect width="116" height="110" fill="#dcecf6" />
      <circle cx="88" cy="26" r="11" fill="#ffe2a8" />
      <path d="M0 70 L30 36 L52 58 L76 30 L116 72 V110 H0 Z" fill="#a9c3da" />
      <path d="M76 30 L69 38 L76 36 L82 39 Z M30 36 L25 42 L30 40 L34 43 Z" fill="#ffffff" />
      <path d="M0 84 C24 70 44 78 62 72 C84 64 100 74 116 70 V110 H0 Z" fill="#7da3c4" />
      <path d="M0 98 C30 88 64 98 116 90 V110 H0 Z" fill="#4f7aa3" />
    </>
  );
}

function CityScene() {
  return (
    <>
      <rect width="116" height="110" fill="url(#login-dusk)" />
      <circle cx="28" cy="68" r="12" fill="#ffe9c7" opacity="0.9" />
      <g stroke="#3d4c5c" strokeWidth="2">
        <line x1="88" y1="20" x2="88" y2="74" />
      </g>
      <ellipse cx="88" cy="40" rx="6" ry="3.5" fill="#3d4c5c" />
      <g fill="#52657a">
        <rect x="4" y="62" width="16" height="48" />
        <rect x="40" y="70" width="18" height="40" />
        <rect x="76" y="74" width="20" height="36" />
      </g>
      <g fill="#6b7f95">
        <rect x="22" y="50" width="16" height="60" />
        <rect x="60" y="58" width="14" height="52" />
        <rect x="98" y="64" width="16" height="46" />
      </g>
      <g fill="#ffe2a8">
        <rect x="8" y="68" width="3" height="3" />
        <rect x="14" y="76" width="3" height="3" />
        <rect x="26" y="58" width="3" height="3" />
        <rect x="32" y="70" width="3" height="3" />
        <rect x="45" y="78" width="3" height="3" />
        <rect x="64" y="64" width="3" height="3" />
        <rect x="68" y="80" width="3" height="3" />
        <rect x="81" y="82" width="3" height="3" />
        <rect x="102" y="72" width="3" height="3" />
      </g>
      <rect y="104" width="116" height="6" fill="#3d4c5c" />
    </>
  );
}

function IslandScene() {
  return (
    <>
      <rect width="116" height="110" fill="#d6edf6" />
      <ellipse cx="84" cy="20" rx="13" ry="5" fill="#ffffff" opacity="0.9" />
      <path d="M0 64 C30 50 64 60 116 48 V110 H0 Z" fill="#a8d29a" />
      <path d="M0 82 C40 70 80 86 116 74 V110 H0 Z" fill="#77b36c" />
      <path
        d="M58 110 C54 98 70 92 62 84 C56 78 66 74 64 68"
        fill="none"
        stroke="#f1ead6"
        strokeWidth="5"
        strokeLinecap="round"
      />
      <g stroke="#6b5a45" strokeWidth="2" strokeLinecap="round">
        <line x1="24" y1="70" x2="24" y2="80" />
        <line x1="96" y1="62" x2="96" y2="72" />
      </g>
      <circle cx="24" cy="64" r="9" fill="#4f8f52" />
      <circle cx="96" cy="57" r="8" fill="#4f8f52" />
      <g fill="#f39a3d">
        <circle cx="20" cy="62" r="1.8" />
        <circle cx="28" cy="66" r="1.8" />
        <circle cx="25" cy="59" r="1.8" />
        <circle cx="93" cy="55" r="1.6" />
        <circle cx="99" cy="59" r="1.6" />
      </g>
    </>
  );
}
