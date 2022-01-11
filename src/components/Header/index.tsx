import Link, { LinkProps } from 'next/link';
import styles from './header.module.scss';

export default function Header() {
  return (
    <header className={styles.headerContainer}>
      <div className={styles.headerContent}>
        <Link href="/">
          <a>
            <img src="/logo.svg" alt="" />
          </a>
        </Link>
      </div>
    </header>
  );
}
