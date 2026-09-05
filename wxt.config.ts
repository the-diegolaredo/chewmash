import { defineConfig } from 'wxt';

export default defineConfig({
  manifestVersion: 3,
  modules: ['@wxt-dev/module-react'],
  manifest: {
    name: 'chewmash',
    description: 'Privacy-first Dining Dollars budgeting for Cal Poly students.',
    homepage_url: 'https://github.com/the-diegolaredo/chewmash',
    permissions: ['storage', 'tabs'],
    host_permissions: ['https://get.cbord.com/calpoly/*'],
    action: {
      default_title: 'Open chewmash',
    },
  },
});
