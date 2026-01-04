# Lumo Project Development Guidelines

## 1. Design System Philosophy
This project strictly adheres to **Material Design 3 (M3)** guidelines. We aim for a premium, modern, and consistent user interface. 
*   **Theme**: Dark Mode is the default.
*   **Primary Color Palette**: Indigo / Violet based (M3 Tonal Palettes).
*   **Component Library**: **MUI (Material UI)** is the sole UI library.

---

## 2. Core Development Rules

### 🚫 DO NOT USE (Anti-Patterns)
*   **Raw HTML Elements**: Avoid `<div>`, `<span>`, `<h1>`, `<button>`, `<input>` for UI components.
*   **Tailwind CSS for Styling**: Do not use Tailwind classes like `bg-blue-500`, `rounded-lg`, `text-xl` for styling components. Tailwind should only be used for very specific layout edge cases if MUI cannot handle it (which is rare).
*   **Hardcoded Colors**: Never use hex codes (e.g., `#FFFFFF`, `#000000`) directly in components.
*   **Global CSS**: Avoid adding styles to `globals.css` unless it's a browser reset or global animation.

### ✅ DO USE (Best Practices)
*   **MUI Components**: Always use MUI counterparts.
    *   `<div>` → `<Box>`
    *   `<div class="flex">` → `<Stack>` or `<Grid>`
    *   `<h1>`...`<h6>`, `<p>` → `<Typography variant="...">`
    *   `<button>` → `<Button>` or `<IconButton>`
    *   `<input>` → `<TextField>`
*   **SX Prop**: Use the `sx` prop for custom styling. It has direct access to the theme.
*   **Theme Variables**: Use theme keys for colors and spacing.
    *   Color: `color: 'primary.main'`, `bgcolor: 'background.paper'`
    *   Spacing: `p: 2` (scales to 8px * 2 = 16px)

---

## 3. Implementation Examples

### Typography (Text)
❌ **Incorrect (Tailwind/HTML)**
```tsx
<h1 className="text-3xl font-bold text-white mb-4">
  Hello World
</h1>
```

✅ **Correct (MUI)**
```tsx
<Typography variant="h4" fontWeight="bold" gutterBottom color="text.primary">
  Hello World
</Typography>
```

### Layout (Flexbox)
❌ **Incorrect (Tailwind/HTML)**
```tsx
<div className="flex flex-col gap-4 p-4 text-center">
  <div>Item 1</div>
  <div>Item 2</div>
</div>
```

✅ **Correct (MUI)**
```tsx
<Stack spacing={2} p={4} textAlign="center">
  <Box>Item 1</Box>
  <Box>Item 2</Box>
</Stack>
```

### Buttons
❌ **Incorrect (Tailwind/HTML)**
```tsx
<button className="bg-blue-500 hover:bg-blue-600 text-white py-2 px-4 rounded">
  Submit
</button>
```

✅ **Correct (MUI)**
```tsx
<Button variant="contained" size="large">
  Submit
</Button>
```

### Cards & Surfaces
❌ **Incorrect (Tailwind/HTML)**
```tsx
<div className="bg-gray-800 rounded-xl p-6 shadow-lg border border-gray-700">
  Content
</div>
```

✅ **Correct (MUI)**
```tsx
<Paper sx={{ p: 4, borderRadius: 4 }} elevation={0} variant="outlined">
  Content
</Paper>
// OR
<Card sx={{ borderRadius: 4 }}>
    <CardContent>Content</CardContent>
</Card>
```

---

## 4. Components & Icons
*   **Icons**: Always use `@mui/icons-material`.
    ```tsx
    import { Add, Search, Person } from '@mui/icons-material';
    ```
*   **Interaction**: Use `Button`, `IconButton`, `Fab` which come with built-in Ripple effects.
*   **Feedback**: Use `CircularProgress` for loading and `Alert` or `Snackbar` for messages.

## 5. Responsive Design
Use the `sx` prop's responsive syntax instead of media queries.
```tsx
<Box sx={{ 
  width: { xs: '100%', md: '50%' }, // 100% on mobile, 50% on desktop
  flexDirection: { xs: 'column', md: 'row' } 
}}>
```

## 6. Directory Structure
*   `src/theme`: Contains `theme.ts` (Theme Definition) and `ThemeRegistry.tsx` (Provider).
*   `src/components`: Reusable UI components (must use MUI).

---

**Please strictly define all future UI tasks based on this document.**
