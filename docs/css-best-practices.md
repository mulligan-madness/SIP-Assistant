# CSS Best Practices for SIP Assistant

This document outlines CSS best practices for the SIP Assistant project to ensure consistent styling, avoid conflicts, and maintain a scalable codebase.

## Table of Contents

1. [CSS Architecture](#css-architecture)
2. [Naming Conventions](#naming-conventions)
3. [Scoped vs. Global Styles](#scoped-vs-global-styles)
4. [CSS Variables](#css-variables)
5. [Component-Specific Styling](#component-specific-styling)
6. [Responsive Design](#responsive-design)
7. [Troubleshooting Common Issues](#troubleshooting-common-issues)

## CSS Architecture

### Layered Approach

Our CSS follows a layered approach:

1. **Base Layer**: Global styles, CSS variables, and resets in `main.css`
2. **Component Layer**: Component-specific styles using Vue's scoped CSS
3. **Utility Layer**: Utility classes for common patterns

### File Organization

- `src/assets/main.css`: Global styles, variables, and utility classes
- Component-specific styles: Within each `.vue` file using `<style scoped>`
- Shared component styles: Consider extracting to separate CSS files if used across multiple components

## Naming Conventions

### BEM (Block Element Modifier)

We follow a simplified BEM approach:

- **Block**: The component name (e.g., `.settings-modal`)
- **Element**: A part of the block (e.g., `.settings-modal__content`)
- **Modifier**: A variation of a block or element (e.g., `.settings-modal--large`)

```css
/* Example */
.chat-message {                  /* Block */
  padding: 10px;
}

.chat-message__content {         /* Element */
  margin-bottom: 5px;
}

.chat-message--user {            /* Modifier */
  background-color: var(--surface-color-secondary);
}
```

### Global Utility Classes

Utility classes should be descriptive and follow a consistent pattern:

```css
.flex { display: flex; }
.flex-col { flex-direction: column; }
.gap-2 { gap: 0.5rem; }
```

## Scoped vs. Global Styles

### When to Use Scoped Styles

- Component-specific styles that shouldn't affect other components
- Styles that might conflict with other components

```vue
<style scoped>
.title {
  font-size: 1.2rem;
}
</style>
```

### When to Use Global Styles

- Reusable components like buttons, inputs, and cards
- Utility classes
- Theme variables
- Reset styles

```css
/* In main.css */
.action-button {
  /* Button styles that are used across multiple components */
}
```

### Deep Selectors

Use deep selectors (`::v-deep` or `:deep()`) only when necessary to target child components:

```vue
<style scoped>
:deep(.child-component-class) {
  /* Styles that need to penetrate into child components */
}
</style>
```

## CSS Variables

### Theme Variables

Define all theme variables in `main.css` under `:root`:

```css
:root {
  --primary-color: #7c5ddf;
  --text-color: #e0e0e0;
  /* etc. */
}
```

### Using Variables

Always use CSS variables for colors, spacing, and other theme-related values:

```css
.element {
  color: var(--text-color);
  background: var(--surface-color);
  border: 1px solid var(--border-color);
}
```

### Fallback Values

Provide fallback values for CSS variables:

```css
.element {
  color: var(--text-color, #e0e0e0);
}
```

## Component-Specific Styling

### Button Styles

For buttons, we have standardized classes:

- `.action-button`: Primary action buttons
- `.control-button`: Secondary control buttons
- `.icon-button`: Icon-only buttons

Always use these classes instead of creating new button styles.

### Active States

For active states, use the `.active` class:

```html
<button 
  class="action-button" 
  :class="{ 'active': isActive }"
>
  Button Text
</button>
```

## Responsive Design

### Mobile-First Approach

Start with mobile styles and then add media queries for larger screens:

```css
.container {
  flex-direction: column;
}

@media (min-width: 768px) {
  .container {
    flex-direction: row;
  }
}
```

### Standard Breakpoints

Use these standard breakpoints:

```css
/* Mobile first (default) */

/* Tablet */
@media (min-width: 768px) {
  /* Tablet styles */
}

/* Desktop */
@media (min-width: 1024px) {
  /* Desktop styles */
}

/* Large Desktop */
@media (min-width: 1280px) {
  /* Large desktop styles */
}
```

## Troubleshooting Common Issues

### Style Conflicts

If styles aren't applying as expected:

1. Check browser dev tools to see which styles are being applied and which are being overridden
2. Look for specificity issues (ID selectors, !important flags)
3. Ensure scoped styles aren't conflicting with global styles
4. Check for CSS variable definitions

### Button Styling Issues

If buttons don't look consistent:

1. Make sure you're using the standard button classes (`.action-button`, `.control-button`)
2. Check for conflicting global button styles in `main.css`
3. Ensure the component isn't overriding the global styles
4. Verify CSS variables are properly defined

### Layout Problems

For layout issues:

1. Check flex or grid container properties
2. Verify media queries are working correctly
3. Look for conflicting width/height settings
4. Check for unexpected margin or padding

### Debugging Process

1. Isolate the component with the issue
2. Use browser dev tools to inspect the element
3. Check which styles are being applied and which are being overridden
4. Look for unexpected inheritance or specificity issues
5. Test changes directly in dev tools before updating code

## Best Practices Summary

1. **Use CSS variables** for colors, spacing, and other theme values
2. **Follow BEM naming** for component-specific styles
3. **Use scoped styles** for component-specific styling
4. **Use global styles** for reusable components and utilities
5. **Standardize common components** like buttons and inputs
6. **Take a mobile-first approach** to responsive design
7. **Avoid !important** unless absolutely necessary
8. **Minimize specificity** to avoid conflicts
9. **Document complex styles** with comments
10. **Keep selectors simple** and avoid deep nesting 