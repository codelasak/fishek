// Generate static params for dynamic transaction routes
// This returns empty array - actual routes are handled client-side via navigation
export async function generateStaticParams() {
  return [];
}

// This layout wraps the dynamic transaction page
export default function TransactionLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
