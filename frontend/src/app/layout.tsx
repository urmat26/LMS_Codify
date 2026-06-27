import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Codify — CodeCoin Manager',
  description: 'Управление списанием CodeCoin у студентов',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ru">
      <body>{children}</body>
    </html>
  );
}
