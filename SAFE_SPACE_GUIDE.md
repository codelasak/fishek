# Safe Space Guide for Mobile Navigation

## Problem
On mobile devices, the bottom navigation menu (80px height) can overlap with content, buttons, and interactive elements, making them inaccessible to users.

## Solution
Global CSS utility classes have been added to `app/globals.css` to prevent content from being hidden under the navigation.

## Available Classes

### `.pb-nav-safe`
**Purpose:** Add bottom padding to page containers  
**Value:** 96px (80px nav height + 16px spacing)  
**Usage:** Apply to main page containers to ensure content doesn't hide under the nav

```tsx
<div className="min-h-screen bg-background-light dark:bg-background-dark pb-nav-safe">
  {/* Page content */}
</div>
```

### `.mb-nav-safe`
**Purpose:** Add bottom margin to elements  
**Value:** 96px (80px nav height + 16px spacing)  
**Usage:** Use when you need margin instead of padding

```tsx
<div className="mb-nav-safe">
  {/* Content */}
</div>
```

### `.bottom-nav-safe`
**Purpose:** Position fixed elements above the navigation  
**Value:** bottom: 96px  
**Usage:** Apply to floating action buttons, notifications, or any fixed bottom elements

```tsx
<div className="fixed bottom-nav-safe right-6">
  <button>+</button>
</div>
```

### `.pb-safe`
**Purpose:** Add safe area padding for device notches/home indicators  
**Value:** Uses CSS `env(safe-area-inset-bottom)`  
**Usage:** Apply to elements that need to respect device safe areas

```tsx
<div className="fixed bottom-0 left-0 right-0 p-4 pb-safe">
  <button>Save</button>
</div>
```

## When to Use Each Class

| Scenario | Class to Use | Example |
|----------|-------------|---------|
| Page container | `.pb-nav-safe` | Main content wrapper |
| Floating action button | `.bottom-nav-safe` | FAB above nav |
| Bulk action bar | `.bottom-nav-safe` | Bottom sheet above nav |
| Fixed save button | `.pb-safe` | Bottom button bar |
| Modal/Sheet content | `.pb-safe` | Modal with scrollable content |

## Implementation Examples

### ✅ Correct Implementation

```tsx
// Page with nav
<div className="min-h-screen pb-nav-safe">
  <header>...</header>
  <main>...</main>
</div>

// Floating button above nav
<div className="fixed bottom-nav-safe right-6">
  <button className="w-14 h-14 bg-primary rounded-full">+</button>
</div>

// Bottom action bar (no nav on page)
<div className="fixed bottom-0 left-0 right-0 p-4 pb-safe">
  <button>Save</button>
</div>
```

### ❌ Incorrect Implementation

```tsx
// This will be hidden under nav!
<div className="min-h-screen pb-24">  {/* Don't use fixed pixel values */}
  <main>...</main>
</div>

// This button will overlap with nav!
<div className="fixed bottom-24 right-6">  {/* Don't use fixed pixel values */}
  <button>+</button>
</div>
```

## Pages Updated

The following pages have been updated to use safe space classes:

- ✅ `/app/page.tsx` - Dashboard
- ✅ `/app/categories/page.tsx` - Categories management
- ✅ `/app/add-transaction/page.tsx` - Add transaction
- ✅ `/app/transaction/[id]/page.tsx` - Transaction detail
- ✅ `/app/family-settings/page.tsx` - Family settings

## Bottom Navigation Component

The `BottomNav` component has a fixed height of **80px** and is positioned at `bottom-0` with z-index of 50.

```tsx
// components/BottomNav.tsx
<div className="fixed bottom-0 left-0 right-0 bg-white dark:bg-[#1c2e22] border-t border-gray-200 dark:border-gray-800 pb-safe pt-2 px-6 flex justify-between items-center z-50 h-[80px]">
```

## Best Practices

1. **Always use semantic classes** - Use `.pb-nav-safe` instead of hardcoded pixel values
2. **Consider the context** - Use `.pb-safe` for pages without nav, `.pb-nav-safe` for pages with nav
3. **Test on mobile** - Always verify that buttons and content are accessible on mobile devices
4. **Modal scrolling** - Add `max-h-[90vh] overflow-y-auto` to modal content to prevent height issues
5. **Stacking context** - Ensure fixed elements have appropriate z-index values

## Troubleshooting

### Issue: Content still hidden under nav
**Solution:** Make sure you're using `.pb-nav-safe` on the container, not individual elements

### Issue: Too much space at bottom
**Solution:** Check if you're applying safe space classes multiple times or on nested elements

### Issue: Modal button not visible
**Solution:** Add `.pb-safe` to the modal container and `max-h-[90vh] overflow-y-auto` for scrolling

## Future Considerations

- Consider making nav height a CSS variable for easier maintenance
- Add safe space for top navigation if needed
- Create variants for different nav heights (e.g., tablet, desktop)
