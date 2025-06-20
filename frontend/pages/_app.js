import '../styles/globals.css'; 
import 'bootstrap/dist/css/bootstrap.min.css'; 
import 'bootstrap-icons/font/bootstrap-icons.css';

export default function App({ Component, pageProps }) {
  return (
    <>
      <link href="https://fonts.googleapis.com/icon?family=Material+Icons" rel="stylesheet" />
      <Component {...pageProps} />
    </>
  );
}