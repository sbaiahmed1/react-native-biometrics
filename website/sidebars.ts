import type {SidebarsConfig} from '@docusaurus/plugin-content-docs';

const sidebars: SidebarsConfig = {
  docsSidebar: [
    {
      type: 'category',
      label: 'Getting Started',
      collapsed: false,
      items: [
        'getting-started/installation',
        'getting-started/quick-start',
        'getting-started/migration',
      ],
    },
    {
      type: 'category',
      label: 'Usage',
      items: [
        'usage/authentication',
        'usage/key-management',
        'usage/non-biometric-signing',
        'usage/debugging',
      ],
    },
    {
      type: 'category',
      label: 'API Reference',
      link: {type: 'doc', id: 'api/index'},
      items: [
        'api/configuration',
        'api/core-functions',
        'api/key-management',
        'api/device-security',
        'api/debugging',
        'api/logging',
        'api/key-integrity',
        'api/biometric-change-detection',
        'api/error-codes',
      ],
    },
    {
      type: 'category',
      label: 'Guides',
      items: [
        'guides/biometric-change-detection',
        'guides/key-alias-security',
        'guides/cryptographic-keys',
        'guides/logging',
        'guides/security',
      ],
    },
    'example-app',
    'comparison',
    'troubleshooting',
    'contributing',
    'roadmap',
  ],
};

export default sidebars;
