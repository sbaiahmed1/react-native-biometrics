import type {ReactNode} from 'react';
import clsx from 'clsx';
import Link from '@docusaurus/Link';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';
import useBaseUrl from '@docusaurus/useBaseUrl';
import Layout from '@theme/Layout';
import HomepageFeatures from '@site/src/components/HomepageFeatures';
import Heading from '@theme/Heading';

import styles from './index.module.css';

function HomepageHeader() {
  const {siteConfig} = useDocusaurusContext();
  return (
    <header className={clsx('hero hero--primary', styles.heroBanner)}>
      <div className="container">
        <Heading as="h1" className="hero__title">
          🔐 {siteConfig.title}
        </Heading>
        <p className="hero__subtitle">{siteConfig.tagline}</p>
        <div className={styles.buttons}>
          <Link
            className="button button--secondary button--lg"
            to="/docs/getting-started/installation">
            Get Started →
          </Link>
          <Link
            className={clsx('button button--outline button--lg', styles.apiButton)}
            to="/docs/api">
            API Reference
          </Link>
        </div>
      </div>
    </header>
  );
}

function HomepageDemo() {
  return (
    <section className={styles.demo}>
      <div className="container">
        <Heading as="h2" className={styles.demoTitle}>
          See it in action
        </Heading>
        <div className={styles.demoVideos}>
          <figure className={styles.demoFigure}>
            <video
              className={styles.demoVideo}
              src={useBaseUrl('/video/ios-demo.mp4')}
              autoPlay
              loop
              muted
              playsInline
              controls
              width={300}
            />
            <figcaption>iOS — Face ID / Touch ID</figcaption>
          </figure>
          <figure className={styles.demoFigure}>
            <video
              className={styles.demoVideo}
              src={useBaseUrl('/video/android-demo.mp4')}
              autoPlay
              loop
              muted
              playsInline
              controls
              width={300}
            />
            <figcaption>Android — Fingerprint / Face</figcaption>
          </figure>
        </div>
      </div>
    </section>
  );
}

export default function Home(): ReactNode {
  const {siteConfig} = useDocusaurusContext();
  return (
    <Layout
      title="React Native Biometrics"
      description={siteConfig.tagline}>
      <HomepageHeader />
      <main>
        <HomepageFeatures />
        <HomepageDemo />
      </main>
    </Layout>
  );
}
