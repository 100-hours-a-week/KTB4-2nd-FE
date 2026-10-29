'use client';

import { useState, type FormEvent } from 'react';

import { Button } from '@/shared/ui/button';
import { Dialog } from '@/shared/ui/dialog';
import { MailIcon } from '@/shared/ui/icons';
import { SelectDropdown } from '@/shared/ui/selectDropdown';
import { toast } from '@/shared/ui/toast';

import { getShareCreateErrorMessage, getShareSearchErrorMessage } from '../model/shareError';
import type { TripSharePermission } from '../model/types';
import { useTripShare } from '../model/useTripShare';

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const PERMISSION_OPTIONS = [
  { value: 'READ', label: '읽기 허용' },
  { value: 'WRITE', label: '편집 허용' },
] as const satisfies readonly { value: TripSharePermission; label: string }[];

const PERMISSION_LABEL: Record<TripSharePermission, string> = {
  READ: '읽기',
  WRITE: '편집',
};

const expiryFormat = new Intl.DateTimeFormat('ko-KR', {
  month: 'long',
  day: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
  hour12: false,
  timeZone: 'Asia/Seoul',
});

type TripShareDialogProps = {
  open: boolean;
  tripId: number;
  tripName: string;
  onClose: () => void;
};

export function TripShareDialog({ open, tripId, tripName, onClose }: TripShareDialogProps) {
  return (
    <Dialog
      open={open}
      onClose={onClose}
      size="wide"
      title="공유할 이메일을 입력해주세요"
      description={`‘${tripName}’을 함께 볼 사람을 초대해요`}
    >
      {/* 닫으면 입력과 검색 결과를 비우도록 열려 있을 때만 그린다. */}
      {open && <TripShareForm tripId={tripId} onClose={onClose} />}
    </Dialog>
  );
}

function TripShareForm({ tripId, onClose }: { tripId: number; onClose: () => void }) {
  const { shares, search, create } = useTripShare(tripId);
  const [email, setEmail] = useState('');
  const [permission, setPermission] = useState<TripSharePermission>('READ');
  const [formatError, setFormatError] = useState(false);
  const foundUser = search.data;
  const searchError = formatError
    ? '이메일 형식을 확인해주세요.'
    : search.isError
      ? getShareSearchErrorMessage(search.error)
      : null;

  function handleSearch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const value = email.trim();
    if (!value || search.isPending) return;
    create.reset();
    if (!EMAIL_PATTERN.test(value)) {
      search.reset();
      setFormatError(true);
      return;
    }
    setFormatError(false);
    search.mutate(value);
  }

  function changeEmail(value: string) {
    setEmail(value);
    setFormatError(false);
    search.reset();
    create.reset();
  }

  function share() {
    if (!foundUser) return;
    create.mutate(
      { user: foundUser, permission },
      {
        onSuccess: () => {
          toast.success(`${foundUser.nickname}님에게 공유했어요.`);
          setEmail('');
          setPermission('READ');
          search.reset();
        },
      },
    );
  }

  return (
    <div className="text-left">
      <form onSubmit={handleSearch} noValidate>
        <div className="border-field-border focus-within:border-brand flex min-h-12 items-center gap-2.5 rounded-[12px] border-2 pr-1.5 pl-3.5">
          <MailIcon size={20} className="text-muted shrink-0" />
          <label className="min-w-0 flex-1">
            <span className="sr-only">공유할 이메일</span>
            <input
              type="email"
              inputMode="email"
              autoComplete="off"
              value={email}
              onChange={(event) => changeEmail(event.target.value)}
              placeholder="email@example.com"
              aria-invalid={searchError ? true : undefined}
              className="text-brand w-full bg-transparent text-sm outline-none placeholder:text-slate-400"
            />
          </label>
          <Button
            type="submit"
            variant="secondary"
            disabled={!email.trim()}
            isLoading={search.isPending}
            className="min-h-9 shrink-0 px-3 text-xs"
          >
            찾기
          </Button>
        </div>
      </form>

      {searchError && (
        <p role="alert" className="text-danger mt-2 text-xs font-semibold">
          {searchError}
        </p>
      )}

      {foundUser && (
        <div className="bg-surface-subtle mt-3 rounded-[14px] p-3">
          <div className="flex items-center gap-2">
            <div className="min-w-0 flex-1">
              <p className="text-brand truncate text-[13px] font-extrabold">{foundUser.nickname}</p>
              <p className="text-muted truncate text-xs">{foundUser.email}</p>
            </div>
            <SelectDropdown
              label={`${foundUser.nickname} 공유 권한`}
              value={permission}
              options={PERMISSION_OPTIONS}
              onChange={setPermission}
            />
          </div>
          {create.isError && (
            <p role="alert" className="text-danger mt-2 text-xs font-semibold">
              {getShareCreateErrorMessage(create.error)}
            </p>
          )}
        </div>
      )}

      {shares.length > 0 && (
        <>
          <p className="text-muted mt-4 text-xs font-bold">공유한 사람 {shares.length}</p>
          <ul className="bg-surface-subtle mt-2 rounded-[14px]">
            {shares.map((item) => (
              <li
                key={item.tripShareId}
                className="border-border-subtle flex min-h-14 items-center gap-2 border-b px-3 py-2 last:border-b-0"
              >
                <div className="min-w-0 flex-1">
                  <p className="text-brand truncate text-[13px] font-semibold">
                    {item.user.nickname}
                  </p>
                  <p className="text-muted truncate text-[11px]">
                    {expiryFormat.format(new Date(item.expiresAt))}까지 볼 수 있어요
                  </p>
                </div>
                <span className="text-muted shrink-0 rounded-full bg-white px-2 py-1 text-[11px] font-bold">
                  {PERMISSION_LABEL[item.permission]}
                </span>
              </li>
            ))}
          </ul>
        </>
      )}

      <Button
        onClick={share}
        disabled={!foundUser}
        isLoading={create.isPending}
        className="mt-5 w-full text-sm"
      >
        추가하기
      </Button>
      <button
        type="button"
        onClick={onClose}
        className="text-muted hover:text-brand focus-visible:outline-brand mx-auto mt-4 block cursor-pointer rounded text-sm font-semibold focus-visible:outline-2"
      >
        {shares.length > 0 ? '닫기' : '나중에 할게요'}
      </button>
    </div>
  );
}
