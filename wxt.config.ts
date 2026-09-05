import { defineConfig } from 'wxt';

export default defineConfig({
  manifestVersion: 3,
  modules: ['@wxt-dev/module-react'],
  manifest: {
    name: 'chewmash connector',
    description: 'Privacy-first Cal Poly GET connector for the chewmash Dining Dollars website.',
    homepage_url: 'https://the-diegolaredo.github.io/chewmash/',
    permissions: ['storage', 'tabs'],
    host_permissions: [
      'https://get.cbord.com/calpoly/*',
      'https://apiv4.dineoncampus.com/*',
    ],
    action: {
      default_title: 'Open chewmash',
    },
  },
});
