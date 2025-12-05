# TechHub Presentation Generator - Usage Guide

## Quick Commands

```bash
# Generate sample presentation
npx tsx scripts/presentations/generate-techhub-presentation.ts

# Output location
open scripts/presentations/generated/techhub-presentation-sample.pdf
```

## Creating Custom Presentations

### Example: Add a New Slide

```typescript
// In generate-techhub-presentation.ts

// Add method to TechHubPresentation class
public addCustomSlide() {
  this.addPage();
  this.drawHeader('My Custom Title');

  // Add content
  this.doc
    .fontSize(24)
    .font('Helvetica-Bold')
    .fillColor(COLORS.foreground)
    .text('Hello TechHub!', PAGE.margin, 150);

  this.drawFooter();
}

// In main execution section
const presentation = new TechHubPresentation(outputPath);
presentation.addTitleSlide();
presentation.addCustomSlide(); // Your new slide
presentation.addClosingSlide();
presentation.save();
```

### Common Patterns

#### 1. Text Block

```typescript
this.doc
  .fontSize(16)
  .font('Helvetica')
  .fillColor(COLORS.foreground)
  .text('Your text here', x, y, {
    width: 400,
    align: 'left' // or 'center', 'right'
  });
```

#### 2. Card with Accent

```typescript
// Card background
this.doc
  .roundedRect(x, y, width, height, 8)
  .fill(COLORS.card);

// Top accent bar
this.doc
  .roundedRect(x, y, width, 5, 8)
  .fill(COLORS.chart1);
```

#### 3. Bullet List

```typescript
const items = ['Item 1', 'Item 2', 'Item 3'];
items.forEach((item, index) => {
  const y = startY + index * 40;

  // Bullet
  this.doc
    .fontSize(16)
    .fillColor(COLORS.chart1)
    .text('•', x, y);

  // Text
  this.doc
    .fontSize(14)
    .fillColor(COLORS.foreground)
    .text(item, x + 20, y);
});
```

#### 4. Two-Column Layout

```typescript
const leftX = PAGE.margin;
const rightX = PAGE.width / 2 + 20;
const columnWidth = PAGE.width / 2 - PAGE.margin - 40;

// Left column
this.doc.text('Left content', leftX, y, { width: columnWidth });

// Right column
this.doc.text('Right content', rightX, y, { width: columnWidth });
```

## Color Reference

Use the `COLORS` constant for consistent theming:

```typescript
COLORS.background    // #333333 - Main dark background
COLORS.card          // #404040 - Card/panel background
COLORS.foreground    // #FAFAFA - Primary text (white)
COLORS.muted         // #B5B5B5 - Secondary text (gray)
COLORS.chart1        // #6366F1 - Indigo accent
COLORS.chart2        // #10B981 - Emerald accent
COLORS.chart3        // #F59E0B - Amber accent
COLORS.chart4        // #8B5CF6 - Violet accent
COLORS.chart5        // #EF4444 - Red accent
COLORS.success       // #4CAF50 - Green
COLORS.warning       // #FFC107 - Yellow
COLORS.info          // #2196F3 - Blue
```

## Page Layout

```
┌─────────────────────────────────────────────┐
│ Header (80px)                               │ ← COLORS.card
│ Logo | Title | Navigation                   │
├─────────────────────────────────────────────┤
│                                             │
│                                             │
│                                             │
│           Content Area                      │ ← COLORS.background
│           (595 - 120 = 475px)              │
│                                             │
│                                             │
│                                             │
├─────────────────────────────────────────────┤
│ Footer (40px)                               │ ← COLORS.card
│ Copyright | Tagline | Page #               │
└─────────────────────────────────────────────┘
    842px (A4 Landscape)
```

## Best Practices

1. **Consistent spacing**: Use multiples of 10px for margins/padding
2. **Font hierarchy**: 48px (titles) → 24px (headers) → 16px (body) → 12px (captions)
3. **Color contrast**: Always use light text on dark backgrounds
4. **Card design**: Use `COLORS.card` with rounded corners (radius: 8px)
5. **Accent colors**: Use chart colors for visual hierarchy
6. **Margins**: Keep 60px margins on all sides
7. **Alignment**: Center important content, left-align body text

## Troubleshooting

### PDF won't open
- Ensure all color values are valid hex codes
- Check that page dimensions are correct
- Verify `doc.end()` is called

### Text is cut off
- Increase the `width` parameter in text options
- Check x/y coordinates are within page bounds
- Use `.text()` with options object for better control

### Colors look wrong
- Verify hex color format (`#RRGGBB`)
- Use `COLORS` constants instead of hardcoded values
- Test with `.fillColor()` before drawing

## Tips

- **Preview changes**: Regenerate PDF after each modification
- **Reuse layouts**: Extract common patterns into private methods
- **Test responsiveness**: Ensure content fits at different text lengths
- **Brand consistency**: Always use TechHub colors and fonts
- **Accessibility**: Maintain high contrast ratios (WCAG AA minimum)

## Resources

- [PDFKit Documentation](https://pdfkit.org/)
- [TechHub Branding Guide](../../src/config/branding.ts)
- [Dark Mode Colors](../../src/app/globals.css)
