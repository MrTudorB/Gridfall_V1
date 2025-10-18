# Tailwind CSS v3 to v4 Migration Guide

## Key Differences Between v3 and v4

### Performance & Architecture
- **New Oxide Engine**: Built in Rust for up to 5x faster full builds and 100x faster incremental builds
- **Smaller Output**: Reduced bundle size thanks to CSS variables and internal handling of vendor prefixes
- **Modern CSS Features**: Built on cascade layers, registered custom properties with `@property`, and `color-mix()`

### Configuration Changes

#### v3: JavaScript Configuration
```javascript
// tailwind.config.js
module.exports = {
  theme: {
    extend: {
      colors: {
        'primary': '#3b82f6',
      }
    }
  }
}
```

#### v4: CSS-First Configuration
```css
@import "tailwindcss";

@theme {
  --color-primary: #3b82f6;
  --font-sans: "Inter", "system-ui", "sans-serif";
  --spacing-18: 4.5rem;
}
```

### Import Statement Changes

#### v3
```css
@tailwind base;
@tailwind components;
@tailwind utilities;
```

#### v4
```css
@import "tailwindcss";
```

### New Features in v4

- **Dynamic Utility Values**: Use any value without defining it beforehand (e.g., `w-103`, `grid-cols-15`, `z-40`)
- **Built-in Container Queries**: Support for `@container` without plugins
- **CSS Nesting**: Native support with modern syntax
- **CSS Variables for Theming**: All design tokens available as CSS variables for runtime access
- **Automatic Content Detection**: Template files discovered automatically
- **Built-in Import Handling**: No need for `postcss-import` or `autoprefixer`

---

## Browser Requirements

**v4 Targets:**
- Safari 16.4+
- Chrome 111+
- Firefox 128+

**Note**: If you need to support older browsers, stick with v3.4 until your requirements change.

---

## Migration Steps

### 1. Automated Migration (Recommended)

```bash
npx @tailwindcss/upgrade
```

**Requirements:**
- Node.js 20 or higher
- Run in a new branch
- Review the diff carefully
- Test thoroughly in browser

### 2. Manual Installation Updates

#### Using PostCSS

**v3:**
```javascript
// postcss.config.mjs
export default {
  plugins: {
    "postcss-import": {},
    tailwindcss: {},
    autoprefixer: {},
  },
};
```

**v4:**
```javascript
// postcss.config.mjs
export default {
  plugins: {
    "@tailwindcss/postcss": {},
  },
};
```

#### Using Vite (Recommended)

```javascript
// vite.config.ts
import { defineConfig } from "vite";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  plugins: [
    tailwindcss(),
  ],
});
```

#### Using Tailwind CLI

```bash
# v3
npx tailwindcss -i input.css -o output.css

# v4
npx @tailwindcss/cli -i input.css -o output.css
```

---

## Breaking Changes & How to Fix Them

### Removed Deprecated Utilities

Replace with modern alternatives:

| Deprecated | Replacement |
|------------|-------------|
| `bg-opacity-*` | `bg-black/50` |
| `text-opacity-*` | `text-black/50` |
| `border-opacity-*` | `border-black/50` |
| `divide-opacity-*` | `divide-black/50` |
| `ring-opacity-*` | `ring-black/50` |
| `placeholder-opacity-*` | `placeholder-black/50` |
| `flex-shrink-*` | `shrink-*` |
| `flex-grow-*` | `grow-*` |
| `overflow-ellipsis` | `text-ellipsis` |
| `decoration-slice` | `box-decoration-slice` |
| `decoration-clone` | `box-decoration-clone` |

### Renamed Utilities

| v3 | v4 |
|----|-----|
| `shadow-sm` | `shadow-xs` |
| `shadow` | `shadow-sm` |
| `drop-shadow-sm` | `drop-shadow-xs` |
| `drop-shadow` | `drop-shadow-sm` |
| `blur-sm` | `blur-xs` |
| `blur` | `blur-sm` |
| `backdrop-blur-sm` | `backdrop-blur-xs` |
| `backdrop-blur` | `backdrop-blur-sm` |
| `rounded-sm` | `rounded-xs` |
| `rounded` | `rounded-sm` |
| `outline-none` | `outline-hidden` |
| `ring` | `ring-3` |

**Example:**
```html
<!-- v3 -->
<input class="shadow-sm rounded focus:outline-none" />

<!-- v4 -->
<input class="shadow-xs rounded-xs focus:outline-hidden" />
```

### Border Colors Now Require Explicit Values

**v3:**
```html
<div class="border px-2 py-3">
```

**v4:**
```html
<div class="border border-gray-200 px-2 py-3">
```

**Alternative: Preserve v3 Behavior**
```css
@layer base {
  *,
  ::after,
  ::before,
  ::backdrop,
  ::file-selector-button {
    border-color: var(--color-gray-200, currentColor);
  }
}
```

### Ring Utility Changes

**v3:**
```html
<button class="focus:ring ring-blue-500">
```

**v4:**
```html
<button class="focus:ring-3 focus:ring-blue-500">
```

**Alternative: Preserve v3 Behavior**
```css
@theme {
  --default-ring-width: 3px;
  --default-ring-color: var(--color-blue-500);
}
```

### Outline Utility Changes

**v3:**
```html
<input class="outline outline-2" />
<input class="focus:outline-none" />
```

**v4:**
```html
<input class="outline-2" />
<input class="focus:outline-hidden" />
```

### CSS Variables in Arbitrary Values

**v3:**
```html
<div class="bg-[--brand-color]"></div>
```

**v4:**
```html
<div class="bg-(--brand-color)"></div>
```

### Custom Utilities

**v3:**
```css
@layer utilities {
  .tab-4 {
    tab-size: 4;
  }
}
```

**v4:**
```css
@utility tab-4 {
  tab-size: 4;
}
```

### Custom Components

**v3:**
```css
@layer components {
  .btn {
    border-radius: 0.5rem;
    padding: 0.5rem 1rem;
    background-color: ButtonFace;
  }
}
```

**v4:**
```css
@utility btn {
  border-radius: 0.5rem;
  padding: 0.5rem 1rem;
  background-color: ButtonFace;
}
```

### Container Customization

**v3:**
```javascript
// tailwind.config.js
module.exports = {
  theme: {
    container: {
      center: true,
      padding: '2rem',
    }
  }
}
```

**v4:**
```css
@utility container {
  margin-inline: auto;
  padding-inline: 2rem;
}
```

### Space Between Utilities

**v3:**
```html
<div class="space-y-4 p-4">
  <label for="name">Name</label>
  <input type="text" name="name" />
</div>
```

**v4 (Recommended):**
```html
<div class="flex flex-col gap-4 p-4">
  <label for="name">Name</label>
  <input type="text" name="name" />
</div>
```

### Variant Stacking Order

**v3:** Right to left
```html
<ul class="py-4 first:*:pt-0 last:*:pb-0">
```

**v4:** Left to right
```html
<ul class="py-4 *:first:pt-0 *:last:pb-0">
```

### Gradients with Variants

**v3:**
```html
<div class="bg-gradient-to-r from-red-500 to-yellow-400 dark:from-blue-500">
```

**v4:**
```html
<div class="bg-linear-to-r from-red-500 via-orange-400 to-yellow-400 
     dark:via-none dark:from-blue-500 dark:to-teal-400">
```

### Hover on Touch Devices

v4 now only applies hover styles when the device supports hover:

```css
@media (hover: hover) {
  .hover\:underline:hover {
    text-decoration: underline;
  }
}
```

**To restore v3 behavior:**
```css
@custom-variant hover (&:hover);
```

---

## Plugin Configuration

### v3: JavaScript Config
```javascript
// tailwind.config.js
module.exports = {
  plugins: [
    require('@tailwindcss/typography'),
    require('@tailwindcss/forms'),
  ]
}
```

### v4: CSS Import
```css
@import "tailwindcss";

@plugin "@tailwindcss/typography";
@plugin "@tailwindcss/forms";
```

---

## Dark Mode Configuration

### v3: Class-based
```javascript
// tailwind.config.js
module.exports = {
  darkMode: 'class',
}
```

### v4: Class-based
```css
@import "tailwindcss";

@custom-variant dark (&:where(.dark, .dark *));
```

**Note:** v4 uses `prefers-color-scheme` by default. Add the custom variant above for class-based dark mode.

---

## Using @apply in Component Files

### Vue, Svelte, Astro

**v4 requires `@reference` directive:**

```vue
<template>
  <h1>Hello world!</h1>
</template>

<style>
  @reference "../../app.css";
  
  h1 {
    @apply text-2xl font-bold text-red-500;
  }
</style>
```

**Alternative: Use CSS variables directly**
```vue
<template>
  <h1>Hello world!</h1>
</template>

<style>
  h1 {
    font-size: var(--text-2xl);
    font-weight: var(--font-bold);
    color: var(--color-red-500);
  }
</style>
```

---

## Using theme() Function

### v3
```css
.my-class {
  background-color: theme(colors.red.500);
}

@media (width >= theme(screens.xl)) {
  /* ... */
}
```

### v4
```css
.my-class {
  background-color: var(--color-red-500);
}

@media (width >= theme(--breakpoint-xl)) {
  /* ... */
}
```

---

## JavaScript Config Files

JavaScript config files are still supported but not auto-detected in v4.

**To use explicitly:**
```css
@config "../../tailwind.config.js";
```

**Note:** `corePlugins`, `safelist`, and `separator` options are not supported in v4.

---

## Preflight Changes

### Placeholder Color
**v3:** Used `gray-400`  
**v4:** Uses current text color at 50% opacity

**To preserve v3:**
```css
@layer base {
  input::placeholder,
  textarea::placeholder {
    color: var(--color-gray-400);
  }
}
```

### Button Cursor
**v3:** `cursor: pointer`  
**v4:** `cursor: default`

**To preserve v3:**
```css
@layer base {
  button:not(:disabled),
  [role="button"]:not(:disabled) {
    cursor: pointer;
  }
}
```

### Dialog Margins
**v4** resets dialog margins.

**To preserve v3:**
```css
@layer base {
  dialog {
    margin: auto;
  }
}
```

### Hidden Attribute
Display classes like `block` or `flex` no longer override the `hidden` attribute.

---

## Accessing Theme Values in JavaScript

### v3
```javascript
import resolveConfig from 'tailwindcss/resolveConfig';
import tailwindConfig from './tailwind.config.js';

const fullConfig = resolveConfig(tailwindConfig);
```

### v4
```javascript
// Use CSS variables directly
let styles = getComputedStyle(document.documentElement);
let shadow = styles.getPropertyValue("--shadow-xl");

// Or with animation libraries
<motion.div animate={{ backgroundColor: "var(--color-blue-500)" }} />
```

---

## Prefix Usage

### v3
```html
<div class="tw-flex tw-bg-red-500">
```

### v4
```html
<div class="tw:flex tw:bg-red-500 tw:hover:bg-red-600">
```

**Configuration:**
```css
@import "tailwindcss" prefix(tw);

@theme {
  --color-brand: #3b82f6;
}
```

**Generated CSS variables will be prefixed:**
```css
:root {
  --tw-color-brand: #3b82f6;
}
```

---

## CSS Preprocessors

**v4 is NOT designed to work with Sass, Less, or Stylus.**

Think of Tailwind CSS v4 itself as your preprocessor. You should not use Tailwind with Sass for the same reason you wouldn't use Sass with Stylus.

---

## Common Issues & Solutions

### Issue: Larger CSS Bundle Size

Some users report larger CSS files after upgrading. This can happen with extensive use of `@apply`.

**Solutions:**
1. Minimize `@apply` usage
2. Use utility classes directly in HTML
3. Use CSS variables instead of `@apply` where possible

### Issue: UI Libraries (shadcn, etc.)

Some UI libraries expect `tailwind.config.js` to exist.

**Solution:** Use `@config` directive or check library documentation for v4 compatibility.

### Issue: Styling Not Applied

**Common causes:**
1. Missing `@reference` directive in component styles
2. Old deprecated utilities still in use
3. PostCSS configuration not updated

**Solutions:**
1. Add `@reference` to component files
2. Run the upgrade tool
3. Update PostCSS config to use `@tailwindcss/postcss`

---

## Migration Checklist

- [ ] Run `npx @tailwindcss/upgrade` in a new branch
- [ ] Update PostCSS/Vite configuration
- [ ] Replace `@tailwind` directives with `@import "tailwindcss"`
- [ ] Move JavaScript config to CSS `@theme`
- [ ] Update renamed utilities (shadow, rounded, blur, outline, ring)
- [ ] Replace deprecated utilities (opacity modifiers, flex-shrink/grow)
- [ ] Add explicit border colors
- [ ] Update custom utilities from `@layer` to `@utility`
- [ ] Update plugin imports to CSS
- [ ] Add `@reference` to component style blocks
- [ ] Configure dark mode if using class-based
- [ ] Test thoroughly in all target browsers
- [ ] Review and test hover behavior on touch devices
- [ ] Update any JavaScript that accesses theme values

---

## Resources

- [Official Upgrade Guide](https://tailwindcss.com/docs/upgrade-guide)
- [Tailwind CSS v4.0 Announcement](https://tailwindcss.com/blog/tailwindcss-v4)
- [GitHub Discussions](https://github.com/tailwindlabs/tailwindcss/discussions)
- Upgrade Tool: `npx @tailwindcss/upgrade`

---

## When NOT to Upgrade

Consider staying on v3 if:
- You need to support older browsers (pre-Safari 16.4)
- Your project heavily relies on Sass/Less/Stylus
- Critical UI libraries aren't v4-compatible yet
- Your team isn't ready for the CSS-first approach

v3 will continue to be supported for legacy projects.