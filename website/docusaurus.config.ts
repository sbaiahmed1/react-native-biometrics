import {themes as prismThemes} from 'prism-react-renderer';
import type {Config} from '@docusaurus/types';
import type * as Preset from '@docusaurus/preset-classic';

// This runs in Node.js - Don't use client-side code here (browser APIs, JSX...)

const config: Config = {
  title: 'React Native Biometrics',
  tagline:
    'A comprehensive React Native library for biometric authentication with advanced security features',
  favicon: 'img/logo.svg',

  future: {
    v4: true,
  },

  url: 'https://sbaiahmed1.github.io',
  baseUrl: '/react-native-biometrics/',

  // GitHub pages deployment config.
  organizationName: 'sbaiahmed1',
  projectName: 'react-native-biometrics',
  trailingSlash: false,

  // Any broken link, markdown link, or anchor fails the build — this is the
  // regression test for the README → site content port.
  onBrokenLinks: 'throw',
  onBrokenAnchors: 'throw',
  markdown: {
    hooks: {
      onBrokenMarkdownLinks: 'throw',
    },
  },

  i18n: {
    defaultLocale: 'en',
    locales: ['en'],
  },

  presets: [
    [
      'classic',
      {
        docs: {
          sidebarPath: './sidebars.ts',
          editUrl:
            'https://github.com/sbaiahmed1/react-native-biometrics/tree/main/website/',
        },
        blog: false,
        theme: {
          customCss: './src/css/custom.css',
        },
      } satisfies Preset.Options,
    ],
  ],

  themeConfig: {
    image: 'img/social-card.png',
    colorMode: {
      respectPrefersColorScheme: true,
    },
    navbar: {
      title: 'React Native Biometrics',
      logo: {
        alt: 'React Native Biometrics Logo',
        src: 'img/logo.svg',
      },
      items: [
        {
          type: 'docSidebar',
          sidebarId: 'docsSidebar',
          position: 'left',
          label: 'Docs',
        },
        {to: '/docs/api', label: 'API', position: 'left'},
        {
          href: 'https://www.npmjs.com/package/@sbaiahmed1/react-native-biometrics',
          label: 'npm',
          position: 'right',
        },
        {
          href: 'https://github.com/sbaiahmed1/react-native-biometrics',
          label: 'GitHub',
          position: 'right',
        },
      ],
    },
    footer: {
      style: 'dark',
      links: [
        {
          title: 'Docs',
          items: [
            {
              label: 'Getting Started',
              to: '/docs/getting-started/installation',
            },
            {
              label: 'API Reference',
              to: '/docs/api',
            },
            {
              label: 'Troubleshooting',
              to: '/docs/troubleshooting',
            },
          ],
        },
        {
          title: 'Community',
          items: [
            {
              label: 'GitHub Issues',
              href: 'https://github.com/sbaiahmed1/react-native-biometrics/issues',
            },
            {
              label: 'Contributing',
              to: '/docs/contributing',
            },
          ],
        },
        {
          title: 'More',
          items: [
            {
              label: 'npm',
              href: 'https://www.npmjs.com/package/@sbaiahmed1/react-native-biometrics',
            },
            {
              label: 'GitHub',
              href: 'https://github.com/sbaiahmed1/react-native-biometrics',
            },
            {
              label: 'License',
              href: 'https://github.com/sbaiahmed1/react-native-biometrics/blob/main/LICENSE',
            },
          ],
        },
      ],
      copyright: `Copyright © ${new Date().getFullYear()} Ahmed Sbai. Built with Docusaurus.`,
    },
    prism: {
      theme: prismThemes.github,
      darkTheme: prismThemes.dracula,
      additionalLanguages: ['bash', 'json', 'diff', 'gradle', 'groovy', 'java'],
    },
  } satisfies Preset.ThemeConfig,
};

export default config;
