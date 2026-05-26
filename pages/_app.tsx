import type { AppProps } from "next/app";
import { useEffect } from "react";
import { Buffer } from "buffer";
import process from "process";
import "@/index.css";

declare global {
  interface Window {
    Buffer: typeof Buffer;
    process: typeof process;
  }
}

export default function App({ Component, pageProps }: AppProps) {
  useEffect(() => {
    window.Buffer = Buffer;
    window.process = process;
  }, []);

  return <Component {...pageProps} />;
}
