export function EmptyTabResult({ message }: { message: string }) {
  return (
    <p className="text-muted flex min-h-[200px] items-center justify-center text-xs">{message}</p>
  );
}
