import './styles.css';

export const metadata = {
  title: 'Social AI Publisher',
  description: 'Multi-brand AI social media publisher with approval flow.'
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="nl">
      <body>
        <main>{children}</main>
      </body>
    </html>
  );
}
