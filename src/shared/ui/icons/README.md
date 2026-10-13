# 공통 아이콘

아이콘의 SVG 도형과 기본 속성은 `icons.tsx`에서 관리합니다. 화면에는 도형을 직접 정의하지 않고 이름으로 가져와 사용합니다.

```tsx
import { ImageIcon, RestoreIcon } from '@/shared/ui/icons';

<RestoreIcon size={17} />;
<RestoreIcon size={13} strokeWidth={2} />;
<ImageIcon size={14} variant="story" />;
```

- 기본값: 24px, `viewBox="0 0 24 24"`, `stroke="currentColor"`, 선 두께 1.8.
- 크기는 `size`, 화면 스타일은 `className` 및 일반 SVG props로 조정합니다.
- 같은 도형은 재사용하고, 기존 디자인의 도형 차이는 `variant`로 구분합니다.
- 장식용 아이콘은 기본적으로 접근성 트리에서 숨깁니다. 의미를 직접 전달할 때는 `aria-label` 또는 `aria-labelledby`를 지정합니다. 아이콘 버튼의 이름은 버튼에 지정합니다.
- 카카오·반짝임·더보기처럼 채움형 아이콘은 기본적으로 윤곽선을 사용하지 않습니다.
- 새 아이콘은 이 모듈에 추가합니다. 로그인 일러스트와 스토리 생성 진행률 그래픽은 화면 전용 그래픽으로 별도 유지합니다.
