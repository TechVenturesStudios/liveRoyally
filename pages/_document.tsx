import { Head, Html, Main, NextScript } from "next/document";

export default function Document() {
  return (
    <Html lang="en">
      <Head>
        {/* The app renders client-side only, so search engines read these tags from here. */}
        <meta
          name="description"
          content="Local Metrics is a community economic development platform connecting members, local businesses, and partner organizations through events, rewards, and shared data."
        />
        <meta property="og:site_name" content="Local Metrics" />
        <meta property="og:title" content="Local Metrics" />
        <meta
          property="og:description"
          content="A community economic development platform connecting members, local businesses, and partner organizations."
        />
        <meta property="og:url" content="https://www.localmetrics.net/" />
        <meta property="og:image" content="https://www.localmetrics.net/apple-touch-icon.png" />
        <link rel="canonical" href="https://www.localmetrics.net/" />
        {/* Local Metrics trend-arrow logo (lucide TrendingUp in brand pink). */}
        <link rel="icon" href="/favicon.svg" type="image/svg+xml" />
        <link rel="icon" href="/favicon.ico" sizes="16x16 32x32 48x48" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
      </Head>
      <body>
        <Main />
        <NextScript />
      </body>
    </Html>
  );
}
