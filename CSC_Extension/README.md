# CSC Extension

A browser extension built with Svelte + Vite for Chrome/Firefox.

## Development

1. Install dependencies:
   ```bash
   npm install
   ```

2. Build the extension:
   ```bash
   npm run build
   ```

3. For development with automatic rebuilding:
   ```bash
   npm run dev
   ```

## Loading the Extension

### Chrome/Chromium/Edge
1. Open Chrome and navigate to `chrome://extensions/`
2. Enable "Developer mode" in the top-right corner
3. Click "Load unpacked" and select the `dist` folder

### Firefox
1. Open Firefox and navigate to `about:debugging`
2. Click "This Firefox"
3. Click "Load Temporary Add-on"
4. Select the `manifest.json` file from the `dist` folder

## Features

- 🎨 **Beautiful Modern UI** - Gradient backgrounds, glass morphism effects, and smooth animations
- 📊 **Interactive Dashboard** - Real-time analytics with Chart.js integration
- 🕒 **Live Clock** - Shows current time in the header
- 📈 **Activity Tracking** - Visual representation of weekly data
- 🎯 **Action Buttons** - Interactive buttons with hover effects
- 🔥 **Responsive Design** - Optimized for browser extension popup
- ⚡ **Fast Performance** - Built with Svelte and Vite for optimal speed
- 🛠 **Developer Friendly** - Hot reload during development

## Design Features

- **Modern Gradient UI** with purple/indigo color scheme
- **Glass morphism effects** with backdrop blur
- **Smooth animations** and hover states
- **Professional typography** with system font stack
- **Interactive charts** showing weekly activity data
- **Real-time elements** like live clock display
- **Accessible design** with proper contrast ratios

Should you later need the extended capabilities and extensibility provided by SvelteKit, the template has been structured similarly to SvelteKit so that it is easy to migrate.

**Why include `.vscode/extensions.json`?**

Other templates indirectly recommend extensions via the README, but this file allows VS Code to prompt the user to install the recommended extension upon opening the project.

**Why enable `checkJs` in the JS template?**

It is likely that most cases of changing variable types in runtime are likely to be accidental, rather than deliberate. This provides advanced typechecking out of the box. Should you like to take advantage of the dynamically-typed nature of JavaScript, it is trivial to change the configuration.

**Why is HMR not preserving my local component state?**

HMR state preservation comes with a number of gotchas! It has been disabled by default in both `svelte-hmr` and `@sveltejs/vite-plugin-svelte` due to its often surprising behavior. You can read the details [here](https://github.com/sveltejs/svelte-hmr/tree/master/packages/svelte-hmr#preservation-of-local-state).

If you have state that's important to retain within a component, consider creating an external store which would not be replaced by HMR.

```js
// store.js
// An extremely simple external store
import { writable } from 'svelte/store'
export default writable(0)
```
