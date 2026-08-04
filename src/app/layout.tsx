import type { Metadata, Viewport } from 'next';
import { DM_Sans, Source_Serif_4 } from 'next/font/google';
import './globals.css';

const body = DM_Sans({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-tenali-body',
  weight: ['400', '500', '600', '700'],
});

const display = Source_Serif_4({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-tenali-display',
  weight: ['600', '700'],
});

export const metadata: Metadata = {
  title: {
    default: 'Swadhyaya',
    template: '%s · Swadhyaya',
  },
  description:
    'Proctored self-study platform — videos, interactive activities, conceptual quizzes, and viva approval.',
};

export const viewport: Viewport = {
  themeColor: '#1a1614',
  width: 'device-width',
  initialScale: 1,
};

const themeScript = `
(function() {
  try {
    var t = localStorage.getItem('swadhyaya-theme');
    if (t === 'light') document.documentElement.setAttribute('data-theme', 'light');
  } catch (e) {}
})();
`;

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${body.variable} ${display.variable}`}>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body>{children}</body>
    </html>
  );
}