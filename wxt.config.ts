import { defineConfig } from 'wxt';

export default defineConfig({
  manifestVersion: 3,
  modules: ['@wxt-dev/module-react'],
  manifest: {
    name: 'ChewMash',
    description: 'Privacy-first Cal Poly Dining Dollars dashboard.',
    permissions: ['storage', 'tabs'],
    host_permissions: ['https://get.cbord.com/calpoly/*'],
    action: {
      default_title: 'Open ChewMash',
    },
  },
});
