import type { Metadata, Viewport } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
});

export const metadata: Metadata = {
  title: {
    default: 'Swadhyaya — Proctored Self-Study',
    template: '%s · Swadhyaya',
  },
  description:
    'Self-study with proctored videos, interactive activities, and teacher-led viva approval.',
  applicationName: 'Swadhyaya',
  authors: [{ name: 'IIT Ropar' }],
};

export const viewport: Viewport = {
  themeColor: '#1F6F5C',
  width: 'device-width',
  initialScale: 1,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={inter.variable}>
      <body className="font-sans">{children}</body>
    </html>
  );
}
