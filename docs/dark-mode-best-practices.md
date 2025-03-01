# Dark Mode Best Practices

This document outlines best practices for implementing dark mode in web applications, with a focus on color selection, contrast, and accessibility.

## Table of Contents

1. [Color Palette Principles](#color-palette-principles)
2. [CSS Variables for Theming](#css-variables-for-theming)
3. [Text and Background Contrast](#text-and-background-contrast)
4. [UI Component Considerations](#ui-component-considerations)
5. [Accessibility Guidelines](#accessibility-guidelines)
6. [Implementation Strategies](#implementation-strategies)
7. [Testing and Validation](#testing-and-validation)

## Color Palette Principles

### Base Colors

When designing a dark mode color palette, start with these fundamental colors:

- **Background Colors**: Use dark grays with subtle blue/purple undertones rather than pure black
  - Primary background: `#121212` (very dark gray)
  - Surface/component background: `#1e1e1e` (dark gray)
  - Elevated surface: `#2c2c2e` (slightly lighter gray)

- **Text Colors**: Use off-whites rather than pure white to reduce eye strain
  - Primary text: `#e0e0e0` (off-white)
  - Secondary text: `#aaaaaa` (light gray)
  - Disabled text: `#666666` (medium gray)

- **Accent Colors**: Use more saturated and vibrant colors than in light mode
  - Primary accent: `#bb86fc` (lavender)
  - Secondary accent: `#03dac6` (teal)
  - Error/warning: `#cf6679` (pink/red)

### Color Temperature

- Dark interfaces should generally use cooler colors (blues, purples) for large surfaces
- Warm colors (reds, oranges) should be used sparingly as they can be visually dominant
- Reduce overall saturation for background elements, but increase saturation for interactive elements

## CSS Variables for Theming

### Variable Structure

Define a comprehensive set of semantic variables:

```css
:root {
  /* Base theme colors */
  --primary-color: #bb86fc;
  --primary-dark: #3700b3;
  --text-color: #e0e0e0;
  --text-secondary: #aaa;
  --background-color: #121212;
  --surface-color: #1e1e1e;
  --surface-color-secondary: #2c2c2e;
  --border-color: #333;
  
  /* Functional colors */
  --input-background: #2c2c2e;
  --hover-color: #3c3c3e;
  --disabled-color: #404040;
  --disabled-text: #666;
  
  /* Component-specific colors */
  --button-primary: #7c5ddf;
  --button-primary-hover: #9579f0;
  --button-secondary: #2c2c2e;
  --button-secondary-hover: #3c3c3e;
  --button-text-primary: #ffffff;
  --button-text-secondary: var(--text-color);
}
```

### Best Practices for Variables

1. **Use semantic naming**: Name variables by their purpose, not their color
2. **Provide fallbacks**: Always include fallback colors for CSS variables
3. **Layer variables**: Create base color variables and derived component variables
4. **Maintain consistency**: Reuse variables across similar components

## Text and Background Contrast

### Contrast Ratios

- Maintain a minimum contrast ratio of 4.5:1 for normal text (WCAG AA)
- Aim for 7:1 contrast ratio for enhanced accessibility (WCAG AAA)
- For large text (18pt+), a minimum contrast ratio of 3:1 is acceptable

### Practical Guidelines

- Text on dark backgrounds should be lighter than `#aaaaaa`
- Avoid pure white text (`#ffffff`) on dark backgrounds to reduce eye strain
- Use slightly darker borders than in light mode to create subtle separation
- Increase the brightness of focus indicators and interactive elements

## UI Component Considerations

### Inputs and Form Elements

- Input fields should have a slightly lighter background than the page
- Use subtle borders or background changes to indicate input boundaries
- Placeholder text should be visibly different from input text but still readable

```css
.input-field {
  background: var(--input-background, #2c2c2e);
  color: var(--text-color, #e0e0e0);
  border: 1px solid var(--border-color, #333);
}

.input-field::placeholder {
  color: var(--text-secondary, #aaa);
}
```

### Buttons and Interactive Elements

- Primary buttons should use vibrant accent colors
- Secondary buttons should use more subtle colors but remain distinguishable
- Hover and active states should be clearly visible through brightness or saturation changes

```css
.primary-button {
  background: var(--button-primary, #7c5ddf);
  color: var(--button-text-primary, #ffffff);
}

.primary-button:hover {
  background: var(--button-primary-hover, #9579f0);
}

.secondary-button {
  background: var(--button-secondary, #2c2c2e);
  color: var(--text-color, #e0e0e0);
  border: 1px solid var(--border-color, #333);
}

.secondary-button:hover {
  background: var(--button-secondary-hover, #3c3c3e);
}
```

### Cards and Containers

- Use subtle elevation through slightly lighter backgrounds
- Add thin borders or subtle shadows to create separation
- Maintain consistent padding and spacing patterns

```css
.card {
  background: var(--surface-color-secondary, #2c2c2e);
  border: 1px solid var(--border-color, #333);
  border-radius: 6px;
}
```

## Accessibility Guidelines

### Focus States

- Focus indicators should be highly visible in dark mode
- Use bright accent colors for focus rings
- Consider using a combination of outline and box-shadow for focus states

```css
.interactive-element:focus-visible {
  outline: 2px solid var(--primary-color, #bb86fc);
  box-shadow: 0 0 0 4px rgba(187, 134, 252, 0.3);
}
```

### Color Blindness Considerations

- Don't rely solely on color to convey information
- Test your dark mode palette with color blindness simulators
- Ensure sufficient contrast even when colors are perceived differently

### Motion and Animation

- Consider reducing animation intensity in dark mode
- Provide options to reduce motion for users with vestibular disorders
- Ensure transitions are smooth and not jarring

## Implementation Strategies

### CSS Variables Approach

1. Define a comprehensive set of variables in your root CSS
2. Use media queries or JavaScript to switch between themes
3. Apply variables consistently across components

```css
@media (prefers-color-scheme: dark) {
  :root {
    /* Dark theme variables */
  }
}
```

### Component-Level Considerations

- Test each component individually in dark mode
- Ensure consistent styling across similar components
- Create dark mode variants for complex visualizations or charts

### Handling Images and Media

- Provide dark mode alternatives for logos and icons
- Consider applying subtle filters to images in dark mode
- Use `prefers-color-scheme` in image queries when possible

```css
.logo {
  content: url('/images/logo-light.svg');
}

@media (prefers-color-scheme: dark) {
  .logo {
    content: url('/images/logo-dark.svg');
  }
}
```

## Testing and Validation

### Tools for Testing

- Use browser dev tools to simulate dark mode
- Test with actual devices in dark mode
- Use contrast checkers to validate text legibility
- Test with screen readers and keyboard navigation

### Common Issues to Watch For

- Insufficient contrast between text and background
- Hard-to-see focus indicators
- Inconsistent component styling
- "Flashlight effect" (very bright elements on dark backgrounds)
- Border and shadow visibility problems

### Validation Checklist

- All text meets WCAG AA contrast requirements (minimum 4.5:1)
- Interactive elements are clearly distinguishable
- Focus states are highly visible
- Content is readable at various screen sizes
- No unintended color inversions or artifacts

## Conclusion

Effective dark mode implementation requires careful color selection, consistent application of design principles, and thorough testing. By following these best practices, you can create a dark mode experience that is not only aesthetically pleasing but also accessible and user-friendly.

Remember that dark mode is not just about inverting colors—it's about creating a thoughtful alternative visual experience that reduces eye strain and works well in low-light environments. 