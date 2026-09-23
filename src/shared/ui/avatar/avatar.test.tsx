import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { Avatar } from './avatar';

const IMAGE_URL = 'https://t1.kakaocdn.net/account_images/default_profile.jpeg';

describe('Avatar', () => {
  it('src가 있으면 이미지를 보여준다', () => {
    render(<Avatar src={IMAGE_URL} alt="혜준 프로필 사진" />);

    expect(screen.getByRole('img', { name: '혜준 프로필 사진' })).toBeInTheDocument();
  });

  it('src가 없으면 기본 아이콘만 보여준다', () => {
    render(<Avatar alt="혜준 프로필 사진" />);

    expect(screen.queryByRole('img')).not.toBeInTheDocument();
  });

  it('이미지를 불러오지 못하면 기본 아이콘으로 되돌린다', () => {
    render(<Avatar src={IMAGE_URL} alt="혜준 프로필 사진" />);

    fireEvent.error(screen.getByRole('img', { name: '혜준 프로필 사진' }));

    expect(screen.queryByRole('img')).not.toBeInTheDocument();
  });
});
