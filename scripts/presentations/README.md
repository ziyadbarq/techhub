# TechHub Presentation Generator

Generate branded PDF presentations using TechHub's dark mode theme and corporate identity.

## Features

- **Landscape format** (A4, 842x595 pixels)
- **Dark mode theme** matching TechHub's color palette
- **Professional layout** with headers, footers, and page numbers
- **Reusable templates** for common slide types
- **Brand compliance** following Barq's branding guidelines

## Quick Start

```bash
# Generate standard presentation
npx tsx scripts/presentations/generate-standard.ts

# Generate professional presentation
npx tsx scripts/presentations/generate-professional.ts
```

Output: `scripts/presentations/generated/`


## Color Palette

The generator uses TechHub's dark mode colors from [globals.css](../../src/app/globals.css):

| Color | Hex | Usage |
|-------|-----|-------|
| Background | `#333333` | Main background |
| Card | `#404040` | Content cards |
| Foreground | `#FAFAFA` | Primary text |
| Muted | `#B5B5B5` | Secondary text |
| Chart 1 | `#6366F1` | Indigo accent |
| Chart 2 | `#10B981` | Emerald accent |
| Chart 3 | `#F59E0B` | Amber accent |
| Chart 4 | `#8B5CF6` | Violet accent |
| Chart 5 | `#EF4444` | Red accent |

## Slide Templates

The sample includes 5 slide types:

1. **Title Slide** - Hero introduction with branding
2. **Feature Overview** - List features with icons and descriptions
3. **Stats/Metrics** - Display key numbers in cards
4. **Architecture** - Show layered architecture
5. **Closing Slide** - Call to action with contact info

## Customization

Edit [generate-techhub-presentation.ts](generate-techhub-presentation.ts) to:

- Add new slide types
- Modify layouts
- Update content
- Change dimensions
- Add images or charts

## Technical Details

- **Library**: PDFKit
- **Format**: PDF 1.3
- **Layout**: Landscape (842x595)
- **Fonts**: Helvetica (built-in)
- **Margins**: 60px all sides

## Branding Guidelines

Follows [BRANDING.md](../../src/config/branding.ts):

- App name: "TechHub" (not "barq TechHub" in headers)
- Company name: "barq" (lowercase)
- Copyright: "© 2025 barq. All rights reserved."
- Logo: White version for dark backgrounds
- Tagline: "Enterprise CMDB & IT Asset Management"

## Future Enhancements

- [ ] Add image support (logo, screenshots)
- [ ] Chart generation (bar, line, pie)
- [ ] Table layouts
- [ ] Multi-language support
- [ ] Theme variants (light mode)
- [ ] Export to PowerPoint format
