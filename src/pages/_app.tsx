import '../styles/globals.css'
import type { AppProps } from 'next/app'
import dynamic from 'next/dynamic';
import Head from 'next/head';
import WalletContextProvider from '../contexts/WalletContextProvider';

// const Navbar = dynamic(() => import('../components/Navbar'), { ssr: false });

function MyApp({ Component, pageProps }: AppProps) {
  return (
    <>
      <Head>
        <title>My App</title>
      </Head>
      <WalletContextProvider>
        <Component {...pageProps} />
      </WalletContextProvider>
    </>
  );
}

export default MyApp;
