import type {ReactNode} from 'react';
import clsx from 'clsx';
import Heading from '@theme/Heading';
import styles from './styles.module.css';

type FeatureItem = {
  title: string;
  emoji: string;
  description: ReactNode;
};

const FeatureList: FeatureItem[] = [
  {
    title: 'Unified API',
    emoji: '🔒',
    description: (
      <>
        A single interface for Face ID, Touch ID, Fingerprint, and more — the
        same code on iOS and Android.
      </>
    ),
  },
  {
    title: 'Key Management',
    emoji: '🔑',
    description: (
      <>
        Create and manage cryptographic keys (EC256/RSA2048) for secure
        operations, backed by Secure Enclave and Android Keystore.
      </>
    ),
  },
  {
    title: 'Non-Biometric Signing',
    emoji: '🔏',
    description: (
      <>
        Keystore/Keychain-backed RSA/EC signing without prompts — a modern{' '}
        <code>react-native-rsa-native</code> alternative.
      </>
    ),
  },
  {
    title: 'Device Integrity',
    emoji: '🛡️',
    description: (
      <>
        Detect compromised devices (rooted/jailbroken) and runtime
        instrumentation (Frida/Xposed) for enhanced security.
      </>
    ),
  },
  {
    title: 'Biometric Change Detection',
    emoji: '🔔',
    description: (
      <>
        Real-time monitoring of biometric enrollment changes with event-driven
        updates.
      </>
    ),
  },
  {
    title: 'StrongBox Support',
    emoji: '🏗️',
    description: (
      <>
        Automatic use of Android StrongBox hardware security with TEE fallback.
      </>
    ),
  },
  {
    title: 'TypeScript',
    emoji: '🎯',
    description: (
      <>Full TypeScript support with detailed type definitions.</>
    ),
  },
  {
    title: 'New & Old Architecture',
    emoji: '🔄',
    description: (
      <>
        TurboModule-based with full backward compatibility for the old
        architecture.
      </>
    ),
  },
  {
    title: 'Expo Compatible',
    emoji: '🌟',
    description: (
      <>Works seamlessly with the Expo development workflow.</>
    ),
  },
];

function Feature({title, emoji, description}: FeatureItem) {
  return (
    <div className={clsx('col col--4', styles.feature)}>
      <div className="text--center">
        <span className={styles.featureEmoji} role="img" aria-hidden="true">
          {emoji}
        </span>
      </div>
      <div className="text--center padding-horiz--md">
        <Heading as="h3">{title}</Heading>
        <p>{description}</p>
      </div>
    </div>
  );
}

export default function HomepageFeatures(): ReactNode {
  return (
    <section className={styles.features}>
      <div className="container">
        <div className="row">
          {FeatureList.map((props, idx) => (
            <Feature key={idx} {...props} />
          ))}
        </div>
      </div>
    </section>
  );
}
