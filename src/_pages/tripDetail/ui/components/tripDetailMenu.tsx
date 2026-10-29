import { DropdownMenu, type DropdownMenuItem } from '@/shared/ui/dropdownMenu';
import { EditIcon, LinkIcon, TrashIcon } from '@/shared/ui/icons';

type TripDetailMenuProps = {
  onEdit: () => void;
  onShare: () => void;
  onDelete: () => void;
};

export function TripDetailMenu({ onEdit, onShare, onDelete }: TripDetailMenuProps) {
  const menuItems: DropdownMenuItem[] = [
    {
      id: 'edit',
      label: '여행 수정',
      icon: <EditIcon size="20" />,
      onSelect: onEdit,
    },
    {
      id: 'share',
      label: '공유하기',
      icon: <LinkIcon size="20" />,
      onSelect: onShare,
    },
    {
      id: 'delete',
      label: '여행 삭제',
      icon: <TrashIcon size="20" />,
      destructive: true,
      dividerBefore: true,
      onSelect: onDelete,
    },
  ];

  return <DropdownMenu items={menuItems} label="여행 더보기 메뉴" />;
}
