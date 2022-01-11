import { AppProps } from 'next/app';
import NextNProgress from 'nextjs-progressbar';
import Header from '../components/Header';
import '../styles/globals.scss';

function MyApp({ Component, pageProps }: AppProps): JSX.Element {
  return (
    <>
      <NextNProgress
        color="#FF57B2"
        startPosition={0.3}
        stopDelayMs={200}
        height={3}
      />
      <Header />
      <Component {...pageProps} />
    </>
  );
}

export default MyApp;
