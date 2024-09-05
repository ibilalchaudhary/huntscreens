import {NextIntlClientProvider} from 'next-intl';
import type { Metadata } from 'next';
import '../globals.css';
import Umami from '@/components/thirdparties/umami';
import { Toaster } from '@/components/ui/toaster';
import Footer from '@/components/layout/footer';
import { ThemeProvider } from '@/components/theme/theme-provider';
import { getMessages } from 'next-intl/server';
import HrefLangs from '@/components/seo/hreflangs';

export const metadata: Metadata = {
  title: 'Screenshots of Every New Product and Startup! - HuntScreens.com',
  description: 'Captures and organizes screenshots of the latest product and startup launches. Quickly browse newly released products and catch the latest innovations. Updated daily, never miss an exciting new product debut.',
  keywords: ['latest product launches', 'screenshots', 'snapshots', 'organizes', 'newly released products', 'producthunt', 'indiehackers', 'Y combinator', 'startups'],
  alternates: {
    types: {
      'application/rss+xml': [
        { url: `https://huntscreens.com/rss.xml` }
      ]
    }
  }
}

export default async function RootLayout({
  children,
  params: { locale }
}: {
  children: React.ReactNode,
  params: { locale: string }
}) {
  const messages = await getMessages();
  return (
    <html lang={locale} suppressHydrationWarning>
      <head></head>
      <body>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <NextIntlClientProvider locale={locale} messages={messages}>
            {children}
            <Footer />
            <Toaster />
            <Umami />
          </NextIntlClientProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}
