import { AppProps } from 'next/app';
import "./globals.css"
import GlobalStyles from '../styles/GlobalStyles';

export default function App({ Component, pageProps }: AppProps) {
  return (
    <>
      <GlobalStyles />
      <Component {...pageProps} />
    </>
  );
}