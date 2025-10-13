
export default function UnauthenticatedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen w-full items-center justify-center bg-background">
      <main>{children}</main>
    </div>
  );
}
