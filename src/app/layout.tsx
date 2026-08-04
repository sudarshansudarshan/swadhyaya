import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Swadhyaya',
  description: 'Proctored learning platform for linear algebra',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
