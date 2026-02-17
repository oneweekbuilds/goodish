# Asset Optimization Guide (#41)

This document covers best practices for optimizing images and other assets in the AlgorithmLens frontend.

## Image Optimization

### Current Asset Locations

- **Public Assets**: `/public/` - avatar images and static assets
- **Component Assets**: `src/assets/` - logos and component-specific images

### WebP Conversion (#41)

Avatar images in `/public/avatar-*.jpg` and `/public/avatar-*.png` should be converted to WebP format for better compression:

```bash
# Install imagemin globally (optional)
npm install -g imagemin imagemin-webp

# Convert images to WebP
imagemin public/avatar-*.jpg --out-dir=public --plugin=webp
```

### Image Compression

1. **JPEGs**: Use quality 75-85 for photos
```bash
imagemin public/*.jpg --plugin=mozjpeg --plugin-mozjpeg-quality=80
```

2. **PNGs**: Use lossy compression when possible
```bash
imagemin public/*.png --plugin=pngquant
```

3. **WebP**: Automatic fallback support for older browsers

### Avatar Images

Currently using:
- `avatar-jordan-new.jpg` (HeroDashboardPreview)
- `avatar-maya-new.jpg`
- `avatar-alexandra-new.jpg`
- `avatar-luis-fixed.png`

**Optimization Steps**:
1. Convert to WebP: `avatar-*.webp`
2. Compress originals to 50KB max per image
3. Update src to use WebP with JPG fallback:
```html
<picture>
  <source srcset="avatar-jordan.webp" type="image/webp" />
  <img src="avatar-jordan.jpg" alt="Jordan profile" />
</picture>
```

## Code Splitting (#40)

Vite is configured to split code into chunks:
- `vendor.js` - React, router, DOM
- `animations.js` - Framer Motion
- `stripe.js` - Stripe payment
- `supabase.js` - Supabase
- `ui.js` - UI utilities

See `vite.config.js` for configuration.

## CSS Optimization

### Tailwind CSS

- Uses purge in production to remove unused CSS
- Only classes actually used in code are included
- Tree-shaking removes unused utilities

### Current Build Size Estimates

- Vendor chunk: ~180KB (React, router, DOM)
- Main app: ~150KB (components, pages)
- Animations: ~60KB (Framer Motion)
- Other: ~100KB (Stripe, Supabase, etc.)
- **Total uncompressed**: ~490KB
- **Total gzipped**: ~130KB

## Performance Budgets

Target sizes for future optimization:

| Asset | Target | Current | Status |
|-------|--------|---------|--------|
| Main JS | <200KB | ~150KB | ✅ Good |
| Vendor JS | <200KB | ~180KB | ✅ Good |
| CSS (all) | <50KB | ~40KB (gzip) | ✅ Good |
| Images | <500KB total | TBD | ⚠️ Review |

## Recommended Tools

### Analysis

```bash
# Bundle analysis
npm install --save-dev rollup-plugin-visualizer

# Then add to vite.config.js:
import { visualizer } from 'rollup-plugin-visualizer';

export default defineConfig({
  plugins: [
    visualizer({
      filename: 'dist/stats.html',
      open: true,
    })
  ]
});
```

### Image Optimization CLI

```bash
# Install imagemin
npm install --save-dev imagemin imagemin-webp imagemin-mozjpeg imagemin-pngquant

# Then create a script in package.json:
"scripts": {
  "optimize:images": "imagemin public --out-dir=public --plugin=webp --plugin=mozjpeg --plugin=pngquant"
}
```

## Deployment Considerations

### Vercel (Recommended)

- Automatic image optimization via Image component
- Built-in compression and WebP serving
- CDN caching for static assets

### Netlify

- Supports custom build commands
- Can run image optimization during build
- Automatic gzip compression

## Monitoring

Monitor these metrics in production:

1. **Core Web Vitals** (Google Analytics)
   - LCP (Largest Contentful Paint)
   - FID (First Input Delay)
   - CLS (Cumulative Layout Shift)

2. **Bundle Size**
   - Track with each release
   - Use CI/CD to warn on increases >10%

3. **Image Metrics**
   - Average image size per page
   - WebP adoption rate
   - Download times

## Best Practices

1. **Images**
   - Always use WebP with fallback
   - Compress losslessly when possible
   - Use appropriate dimensions
   - Lazy load below-the-fold images

2. **Code**
   - Use dynamic imports for heavy components
   - Code split by route
   - Tree-shake unused dependencies

3. **Monitoring**
   - Track bundle size trends
   - Monitor Core Web Vitals
   - Alert on regressions

## Next Steps

1. Convert avatar images to WebP
2. Set up bundle analysis tool
3. Add image optimization script
4. Monitor Core Web Vitals continuously
5. Review and update budget targets quarterly
