import { ProtectedLayout } from '@/_app/ui/accessLayouts';

export default function Layout({ children }: { children: React.ReactNode }) {
  return <ProtectedLayout>{children}</ProtectedLayout>;
}
