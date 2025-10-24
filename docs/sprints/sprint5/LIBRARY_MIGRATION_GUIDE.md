# Sprint 5 Library Migration Guide

**Created:** 2025-10-23
**Purpose:** Migration guide for replacing deprecated/proprietary libraries with open-source alternatives
**Status:** Ready for implementation

---

## Overview

Based on comprehensive research of all Sprint 5 library requirements, we identified **4 critical library changes** needed to ensure:

1. **100% Open Source:** All libraries use permissive licenses (MIT/BSD)
2. **Zero Cost:** No usage-based billing or proprietary licenses
3. **Active Maintenance:** All libraries actively maintained (2024-2025 updates)
4. **Production Ready:** Battle-tested libraries with large communities
5. **Security:** No known vulnerabilities or risky functions

---

## Migration Summary

| Old Library          | New Library                | Reason                                             | License      | Cost                |
| -------------------- | -------------------------- | -------------------------------------------------- | ------------ | ------------------- |
| Mapbox GL JS v2+     | MapLibre GL JS             | Mapbox changed to proprietary license              | BSD 3-Clause | FREE (was $5-20/mo) |
| react-image-annotate | Annotorious                | Unmaintained (5 years no updates)                  | BSD 3-Clause | FREE                |
| react-image-lightbox | Yet Another React Lightbox | Deprecated, no longer supported                    | MIT          | FREE                |
| mathjs               | expr-eval                  | Complex license (LGPL copyleft), security concerns | MIT          | FREE                |

**Total Savings:** $5-20/month (Mapbox elimination)
**Total Risk Reduction:** 3 unmaintained/deprecated libraries replaced

---

## Migration 1: Mapbox GL JS → MapLibre GL JS

### Problem

**Mapbox GL JS v2+ (December 2020):**

- Changed to proprietary "Mapbox License" (NOT open source)
- Requires billable Mapbox token
- Usage-based pricing: $5-20/month for construction app usage
- Tile requests are metered and charged

### Solution

**MapLibre GL JS:**

- BSD 3-Clause License (fully open source)
- Linux Foundation governance (Amazon, Meta, Microsoft backing)
- Community fork after Mapbox license change
- FREE (no tile billing)
- Modern WebGL2 renderer
- Self-hostable tiles (critical for offline construction sites)

### Installation

```bash
# Install MapLibre + React bindings
pnpm add maplibre-gl react-map-gl

# Remove Mapbox (DO NOT INSTALL)
# pnpm remove mapbox-gl
```

### Code Migration

**Before (Mapbox):**

```typescript
import Map from 'react-map-gl';
import 'mapbox-gl/dist/mapbox-gl.css';

<Map
  mapboxAccessToken={process.env.NEXT_PUBLIC_MAPBOX_TOKEN} // PAID
  initialViewState={{ longitude: -122.4, latitude: 37.8, zoom: 14 }}
  mapStyle="mapbox://styles/mapbox/streets-v11"
/>
```

**After (MapLibre):**

```typescript
import { Map } from 'react-map-gl/maplibre';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';

<Map
  mapLib={maplibregl}
  initialViewState={{ longitude: -122.4, latitude: 37.8, zoom: 14 }}
  mapStyle="https://tiles.stadiamaps.com/styles/osm_bright.json" // FREE
/>
```

### Free Tile Providers

**Recommended Options:**

1. **Stadia Maps (FREE tier):**
   - 200,000 tiles/month free
   - Multiple styles (OSM Bright, Alidade Smooth, Outdoors)
   - URL: `https://tiles.stadiamaps.com/styles/osm_bright.json`

2. **MapTiler (FREE tier):**
   - 100,000 tiles/month free
   - OSM Bright, Basic, Streets
   - URL: `https://api.maptiler.com/maps/basic-v2/style.json?key=YOUR_KEY`

3. **OpenStreetMap (Direct):**
   - Unlimited, no API key
   - Basic tile server
   - URL: `https://{a|b|c}.tile.openstreetmap.org/{z}/{x}/{y}.png`

4. **Self-Hosted (Offline):**
   - Download tiles for construction site areas
   - Zero dependency on external services
   - Store tiles locally for 30-day offline requirement

### Offline Tiles Setup

```typescript
// Download tiles for specific area and store locally
import { downloadTiles } from './utils/offline-tiles';

// Pre-download tiles for project location
await downloadTiles({
  bounds: projectBounds,
  minZoom: 10,
  maxZoom: 16,
  tileServer: 'https://tiles.stadiamaps.com',
  storage: 'indexedDB',
});

// Use offline tiles when no connectivity
<Map
  mapLib={maplibregl}
  mapStyle="indexeddb://offline-tiles"
  offline={true}
/>
```

### Testing Checklist

- [ ] Map renders with free tile provider
- [ ] Zoom/pan functionality works
- [ ] GPS markers display correctly
- [ ] Offline tiles load from local storage
- [ ] No Mapbox API calls in network tab
- [ ] No API key errors in console

---

## Migration 2: react-image-annotate → Annotorious

### Problem

**react-image-annotate:**

- Last published: 5 years ago (2020)
- No security patches or updates
- No React 18+ support
- Unmaintained

### Solution

**Annotorious (@annotorious/react):**

- BSD 3-Clause License (fully open source)
- Actively maintained (updates through Sept 2025)
- Official React bindings
- Full TypeScript support
- Modern annotation features (shapes, tags, metadata)

### Installation

```bash
# Install Annotorious
pnpm add @annotorious/react @annotorious/annotorious

# Remove old library (DO NOT INSTALL)
# pnpm remove react-image-annotate
```

### Code Migration

**Before (react-image-annotate):**

```typescript
import ReactImageAnnotate from 'react-image-annotate';

<ReactImageAnnotate
  images={[{ src: photoUrl, name: "Inspection" }]}
  onExit={(data) => handleSave(data)}
  regionClsList={["defect", "compliant"]}
/>
```

**After (Annotorious):**

```typescript
import { Annotorious } from '@annotorious/react';
import { useAnnotator } from '@annotorious/react';

export function PhotoAnnotation({ photoUrl }) {
  const { anno } = useAnnotator();

  const handleSave = (annotation) => {
    // Save annotation with metadata
    saveAnnotation({
      photoId: photo.id,
      shapes: annotation.shapes,
      metadata: {
        user: currentUser,
        timestamp: new Date(),
        tags: annotation.tags,
      },
    });
  };

  return (
    <Annotorious>
      <img src={photoUrl} alt="Inspection photo" />
    </Annotorious>
  );
}
```

### Advanced Features

**Drawing Tools:**

```typescript
import { ShapeLabelsFormatter } from '@annotorious/react';

<Annotorious
  drawingEnabled={true}
  tools={['rect', 'polygon', 'circle', 'freehand']}
  formatter={ShapeLabelsFormatter}
>
  <img src={photoUrl} />
</Annotorious>
```

**Custom Annotation Metadata:**

```typescript
anno?.on('createAnnotation', (annotation) => {
  return {
    ...annotation,
    body: [
      {
        type: 'TextualBody',
        purpose: 'tagging',
        value: 'defect-found',
        creator: currentUser.name,
        created: new Date().toISOString(),
      },
    ],
  };
});
```

### Testing Checklist

- [ ] Annotation toolbar displays
- [ ] Drawing shapes works (rect, polygon, freehand)
- [ ] Annotations save with metadata
- [ ] Annotations load on page refresh
- [ ] Delete annotations works
- [ ] TypeScript types work correctly

---

## Migration 3: react-image-lightbox → Yet Another React Lightbox

### Problem

**react-image-lightbox:**

- Deprecated and no longer supported
- No React 18+ support
- No active maintenance

### Solution

**Yet Another React Lightbox:**

- MIT License (fully open source)
- Actively maintained
- React 19, 18, 17, 16.8+ support
- Plugins for zoom, thumbnails, video
- Responsive images (srcset/sizes)
- Recommended by Mantine community

### Installation

```bash
# Install Yet Another React Lightbox
pnpm add yet-another-react-lightbox

# Optional plugins
pnpm add yet-another-react-lightbox@^3.0.0

# Remove old library (DO NOT INSTALL)
# pnpm remove react-image-lightbox
```

### Code Migration

**Before (react-image-lightbox):**

```typescript
import Lightbox from 'react-image-lightbox';
import 'react-image-lightbox/style.css';

{isOpen && (
  <Lightbox
    mainSrc={photos[photoIndex]}
    nextSrc={photos[(photoIndex + 1) % photos.length]}
    prevSrc={photos[(photoIndex + photos.length - 1) % photos.length]}
    onCloseRequest={() => setIsOpen(false)}
    onMovePrevRequest={() => setPhotoIndex((photoIndex + photos.length - 1) % photos.length)}
    onMoveNextRequest={() => setPhotoIndex((photoIndex + 1) % photos.length)}
  />
)}
```

**After (Yet Another React Lightbox):**

```typescript
import Lightbox from "yet-another-react-lightbox";
import "yet-another-react-lightbox/styles.css";

// Optional plugins
import Zoom from "yet-another-react-lightbox/plugins/zoom";
import Thumbnails from "yet-another-react-lightbox/plugins/thumbnails";

<Lightbox
  open={isOpen}
  close={() => setIsOpen(false)}
  slides={photos.map(url => ({ src: url }))}
  index={photoIndex}
  plugins={[Zoom, Thumbnails]}
/>
```

### Advanced Features

**Responsive Images (Performance):**

```typescript
const slides = photos.map(photo => ({
  src: photo.url,
  srcSet: [
    { src: photo.thumbnail, width: 320, height: 240 },
    { src: photo.medium, width: 640, height: 480 },
    { src: photo.large, width: 1280, height: 960 },
    { src: photo.original, width: 1920, height: 1440 },
  ],
  alt: photo.description,
}));

<Lightbox slides={slides} />
```

**Zoom Plugin:**

```typescript
import Zoom from "yet-another-react-lightbox/plugins/zoom";

<Lightbox
  plugins={[Zoom]}
  zoom={{
    maxZoomPixelRatio: 3,
    scrollToZoom: true,
  }}
  slides={slides}
/>
```

**Thumbnails Plugin:**

```typescript
import Thumbnails from "yet-another-react-lightbox/plugins/thumbnails";
import "yet-another-react-lightbox/plugins/thumbnails.css";

<Lightbox
  plugins={[Thumbnails]}
  thumbnails={{
    position: "bottom",
    width: 120,
    height: 80,
    border: 1,
    borderRadius: 4,
    padding: 4,
    gap: 16,
  }}
  slides={slides}
/>
```

### Testing Checklist

- [ ] Lightbox opens on thumbnail click
- [ ] Swipe left/right navigation works (mobile)
- [ ] Arrow key navigation works (desktop)
- [ ] Zoom plugin works
- [ ] Thumbnails display correctly
- [ ] ESC key closes lightbox
- [ ] Responsive images load correct size

---

## Migration 4: mathjs → expr-eval

### Problem

**mathjs:**

- **License:** Apache 2.0 + LGPL-2.1+ (CSparse component has copyleft concerns)
- **Size:** Heavy package (much larger than needed)
- **Security:** `import` and `createUnit` functions can alter built-in functionality
- **Complexity:** Overkill for simple calculated fields

### Solution

**expr-eval:**

- **License:** MIT (simple, permissive, NO copyleft)
- **Size:** 5KB minified (lightweight, focused)
- **Security:** No dangerous functions
- **Performance:** Optimized for expression evaluation
- **Features:** Sufficient for our needs (basic operators + SUM, AVG, MIN, MAX)

### Installation

```bash
# Install expr-eval
pnpm add expr-eval

# Remove mathjs (DO NOT INSTALL)
# pnpm remove mathjs
```

### Code Migration

**Before (mathjs):**

```typescript
import { evaluate, parse } from 'mathjs';

// Evaluate expression
const result = evaluate('2 * (3 + 4)'); // 14

// With variables
const result = evaluate('field1 + field2', { field1: 10, field2: 20 }); // 30

// Functions
const result = evaluate('sum(a, b, c)', { a: 10, b: 20, c: 30 }); // 60
```

**After (expr-eval):**

```typescript
import { Parser } from 'expr-eval';

const parser = new Parser();

// Evaluate expression
const result = parser.evaluate('2 * (3 + 4)'); // 14

// With variables
const result = parser.evaluate('field1 + field2', { field1: 10, field2: 20 }); // 30

// Functions (case-sensitive, uppercase)
const result = parser.evaluate('SUM(a, b, c)', { a: 10, b: 20, c: 30 }); // 60
```

### Calculated Fields Implementation

**Form Builder Calculated Field Editor:**

```typescript
import { Parser } from 'expr-eval';

export function CalculatedFieldEditor({ field, allFields }) {
  const [formula, setFormula] = useState(field.formula || '');
  const [error, setError] = useState<string | null>(null);
  const [preview, setPreview] = useState<number | null>(null);

  const parser = new Parser();

  const validateFormula = (formula: string) => {
    try {
      // Test parse
      parser.parse(formula);

      // Check field references exist
      const fieldRefs = formula.match(/\{(\w+)\}/g) || [];
      const invalidRefs = fieldRefs.filter(ref => {
        const fieldName = ref.slice(1, -1);
        return !allFields.find(f => f.name === fieldName);
      });

      if (invalidRefs.length > 0) {
        throw new Error(`Unknown fields: ${invalidRefs.join(', ')}`);
      }

      setError(null);
      return true;
    } catch (err) {
      setError(err.message);
      return false;
    }
  };

  const calculatePreview = (formula: string, fieldValues: Record<string, number>) => {
    try {
      // Replace field references {fieldName} with actual field names
      let expression = formula;
      const fieldRefs = formula.match(/\{(\w+)\}/g) || [];

      fieldRefs.forEach(ref => {
        const fieldName = ref.slice(1, -1);
        expression = expression.replace(ref, fieldName);
      });

      const result = parser.evaluate(expression, fieldValues);
      setPreview(result);
    } catch (err) {
      setPreview(null);
    }
  };

  return (
    <div>
      <TextInput
        label="Formula"
        placeholder="SUM({field1}, {field2})"
        value={formula}
        onChange={(e) => {
          const newFormula = e.target.value;
          setFormula(newFormula);
          validateFormula(newFormula);
          calculatePreview(newFormula, getCurrentFieldValues());
        }}
        error={error}
      />

      {preview !== null && (
        <Text size="sm" c="dimmed">Preview: {preview}</Text>
      )}

      <Text size="xs" c="dimmed">
        Supported operators: +, -, *, /, ()
        <br />
        Supported functions: SUM, AVG, MIN, MAX
        <br />
        Field references: {'{fieldName}'}
      </Text>
    </div>
  );
}
```

**Supported Operations:**

```typescript
// Operators
parser.evaluate('10 + 5'); // 15
parser.evaluate('10 - 5'); // 5
parser.evaluate('10 * 5'); // 50
parser.evaluate('10 / 5'); // 2
parser.evaluate('(10 + 5) * 2'); // 30

// Functions
parser.evaluate('SUM(10, 20, 30)'); // 60
parser.evaluate('AVG(10, 20, 30)'); // 20
parser.evaluate('MIN(10, 20, 30)'); // 10
parser.evaluate('MAX(10, 20, 30)'); // 30

// With field references
const values = { quantity: 10, price: 25.5 };
parser.evaluate('quantity * price', values); // 255
```

### Security Best Practices

**1. Sanitize User Input:**

```typescript
const sanitizeFormula = (formula: string): string => {
  // Remove any dangerous characters
  return formula.replace(/[^0-9a-zA-Z+\-*/(){},._ ]/g, '');
};
```

**2. Validate Field References:**

```typescript
const validateFieldReferences = (formula: string, allowedFields: string[]): boolean => {
  const fieldRefs = formula.match(/\{(\w+)\}/g) || [];
  return fieldRefs.every((ref) => {
    const fieldName = ref.slice(1, -1);
    return allowedFields.includes(fieldName);
  });
};
```

**3. Detect Circular Dependencies:**

```typescript
const detectCircularDependency = (
  field: Field,
  allFields: Field[],
  visited: Set<string> = new Set()
): boolean => {
  if (visited.has(field.id)) {
    return true; // Circular dependency found
  }

  visited.add(field.id);

  const dependencies = getFieldDependencies(field.formula);
  for (const depName of dependencies) {
    const depField = allFields.find((f) => f.name === depName);
    if (depField?.type === 'calculated') {
      if (detectCircularDependency(depField, allFields, new Set(visited))) {
        return true;
      }
    }
  }

  return false;
};
```

### Testing Checklist

- [ ] Basic arithmetic works (+, -, \*, /)
- [ ] Parentheses grouping works
- [ ] SUM function works
- [ ] AVG function works
- [ ] MIN/MAX functions work
- [ ] Field references resolve correctly
- [ ] Invalid field references show error
- [ ] Circular dependencies detected
- [ ] Invalid syntax shows error
- [ ] Live preview updates correctly

---

## Security Considerations

### npm Supply Chain Attacks (Sept 2025)

**WARNING:** Major npm supply chain attacks occurred in September 2025:

1. **Shai-Hulud Worm:** 500+ packages compromised
2. **Chalk/Debug Attack:** 2 billion weekly downloads affected
3. **S1ngularity Attack:** Nx project tokens stolen

**Mitigations:**

**1. Pin Dependencies (CRITICAL):**

Create `.npmrc`:

```
package-lock=true
audit=true
audit-level=moderate
```

Lock versions in `package.json`:

```json
{
  "dependencies": {
    "maplibre-gl": "4.0.0", // No ^ or ~
    "@annotorious/react": "3.0.0",
    "yet-another-react-lightbox": "3.0.0",
    "expr-eval": "2.0.2",
    "@dnd-kit/core": "6.3.1"
  }
}
```

**2. Audit Regularly:**

```bash
# Weekly audits
npm audit

# Consider additional scanning
npx socket-security-cli
```

**3. Use package-lock.json:**

```bash
# Commit package-lock.json to repo
git add package-lock.json
git commit -m "chore: lock dependencies to pre-Sept 16, 2025 versions"
```

**4. Verify Integrity:**

```bash
# Check for unexpected changes
npm audit signatures
```

### Production Deployment Checklist

**React Hook Form + Zod Security:**

- [ ] Dual-layer validation (client + server)
- [ ] Server-side validation NEVER trusts client
- [ ] Input sanitization (use sanitize-html)
- [ ] HTTPS for all form transmission
- [ ] Shared Zod schemas (client/server consistency)
- [ ] Rate limiting on form submissions
- [ ] CSRF protection enabled

**Code Example:**

```typescript
// Shared schema (client + server)
export const formSchema = z.object({
  email: z.string().email(),
  content: z.string().min(1).max(5000),
});

// Client validation
const { handleSubmit } = useForm({
  resolver: zodResolver(formSchema),
});

// Server validation (CRITICAL - client can be bypassed)
app.post('/api/forms', async (req, res) => {
  try {
    // ALWAYS validate on server
    const validated = formSchema.parse(req.body);

    // Sanitize
    const sanitized = {
      ...validated,
      content: sanitizeHtml(validated.content),
    };

    // Process...
  } catch (err) {
    res.status(400).json({ error: 'Invalid input' });
  }
});
```

---

## Implementation Checklist

### Pre-Implementation

- [ ] Review all library documentation
- [ ] Understand migration paths
- [ ] Plan testing strategy
- [ ] Backup current code
- [ ] Create feature branch

### During Implementation

- [ ] Install new libraries (pnpm add)
- [ ] DO NOT install old libraries
- [ ] Update code following migration guides
- [ ] Run linting (pnpm lint)
- [ ] Run type checking (pnpm type-check)
- [ ] Run tests (pnpm test)
- [ ] Test manually in browser
- [ ] Verify offline functionality
- [ ] Check bundle size impact

### Post-Implementation

- [ ] All tests passing
- [ ] No TypeScript errors
- [ ] No console errors
- [ ] Bundle size acceptable
- [ ] Performance metrics OK
- [ ] Security audit clean
- [ ] Documentation updated
- [ ] Evidence collected (screenshots, metrics)

---

## Rollback Plan

If migration causes issues, rollback procedure:

1. **Revert Git Commit:**

   ```bash
   git revert <commit-hash>
   ```

2. **Remove New Libraries:**

   ```bash
   pnpm remove maplibre-gl @annotorious/react yet-another-react-lightbox expr-eval
   ```

3. **Reinstall Dependencies:**

   ```bash
   pnpm install
   ```

4. **Run Tests:**

   ```bash
   pnpm test
   ```

5. **Document Issues:**
   - What went wrong?
   - Why did it fail?
   - What's needed to fix?

---

## Support & Resources

### MapLibre GL JS

- **Docs:** https://maplibre.org/maplibre-gl-js/docs/
- **React Map GL:** https://visgl.github.io/react-map-gl/
- **Examples:** https://maplibre.org/maplibre-gl-js/docs/examples/
- **GitHub:** https://github.com/maplibre/maplibre-gl-js

### Annotorious

- **Docs:** https://annotorious.dev/
- **React Guide:** https://annotorious.dev/react/image-annotation/
- **Examples:** https://annotorious.dev/examples/
- **GitHub:** https://github.com/annotorious/annotorious

### Yet Another React Lightbox

- **Docs:** https://yet-another-react-lightbox.com/documentation
- **Plugins:** https://yet-another-react-lightbox.com/plugins
- **Examples:** https://yet-another-react-lightbox.com/examples
- **GitHub:** https://github.com/igordanchenko/yet-another-react-lightbox

### expr-eval

- **Docs:** https://github.com/silentmatt/expr-eval
- **NPM:** https://www.npmjs.com/package/expr-eval
- **Examples:** https://silentmatt.com/javascript-expression-evaluator/
- **GitHub:** https://github.com/silentmatt/expr-eval

---

**Last Updated:** 2025-10-23
**Maintained By:** Development Team
**Sprint:** Sprint 5
**Status:** Ready for Implementation
