import Head from "next/head";
import Index from "@/pages/Index";

// The landing page renders on the server so crawlers and link previews get real content.
// Every other route goes through the client-only app in [...slug].tsx.
export default function HomePage() {
  return (
    <>
      <Head>
        <link rel="canonical" href="https://www.localmetrics.net/" />
        <meta property="og:url" content="https://www.localmetrics.net/" />
      </Head>
      <Index />
    </>
  );
}
