import { PublicLayout } from '@/_app/ui/accessLayouts';

export default function Layout({ children }: { children: React.ReactNode }) {
  return <PublicLayout>{children}</PublicLayout>;
}
