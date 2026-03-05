# Build: Aces Community Photo Gallery

Build a beautiful, production-ready single-page photo gallery website. This is for a private membership community called "Aces" (venture capital investors). There will be a SEPARATE site for "EAA Insiders" later.

## Requirements

### Core Features
1. **Password protection** - Simple shared password gate. Password stored in localStorage after entry. Clean login screen with community branding.
2. **Event grid homepage** - Cards showing event name, date, city, cover photo, photo count. Sorted newest first.
3. **City filter** - Pills/tabs at top: All | New York | San Francisco | Los Angeles
4. **Event detail view** - Click an event card to see all photos from that event in a masonry grid
5. **Lightbox** - Click any photo to open full-size with left/right navigation, close on click/escape
6. **Mobile responsive** - Must look great on phones (most members will browse on mobile)
7. **Fast loading** - Lazy load images, blur placeholder or skeleton loading

### Design
- Dark, modern, clean. Think: luxury private club meets modern tech.
- Color palette: Deep dark background (#0a0a0a), subtle borders, white text, purple accent (#8b5cf6)
- Font: Inter or similar clean sans-serif
- Minimal chrome, let the photos be the star
- Cards with subtle hover effects
- Event cards show: cover photo (blurred background + centered), event name, date, city pill, photo count
- Lightbox: dark overlay, photo centered, subtle controls

### Technical
- Single HTML file (like a SPA but no framework needed)
- Vanilla JS, no build step
- CSS in the file
- Photos will be loaded from Cloudflare R2 URLs later, but for now use a JS config object with demo/placeholder data
- Structure the config so it's easy to update:

```javascript
const GALLERY_CONFIG = {
  password: 'aces2026',  // simple shared password
  community: 'Aces',
  events: [
    {
      id: 'aces-sf-mar12',
      name: 'SF Dinner: Learning & Unlearning',
      date: '2026-03-12',
      city: 'San Francisco',
      host: 'Helen Min',
      photographer: 'TBD',
      coverIndex: 0,
      photos: [
        { url: 'https://picsum.photos/seed/sf1/800/600', caption: '' },
        { url: 'https://picsum.photos/seed/sf2/800/600', caption: '' },
        // etc
      ]
    },
    // more events...
  ]
};
```

### Demo Data
Include 4 demo events with 8-12 placeholder photos each (use picsum.photos with different seeds):
1. SF Dinner: Learning & Unlearning - Mar 12, 2026 - Helen Min hosting
2. NY Dinner: The Art of the Deal - Mar 17, 2026 - Jason Shuman hosting  
3. LA Dinner: Starting Over - Mar 27, 2026 - Karan Wadhera hosting
4. SF Dinner: February Fireside - Feb 19, 2026 - Alex Revelle hosting

### Password Screen
- Centered card with "Aces" branding
- Single password input + enter button
- "Private gallery. Enter password to continue."
- Store in localStorage so they don't re-enter every time
- Logout button somewhere subtle (footer or settings icon)

### Nice to have
- Smooth page transitions between event grid and event detail
- Photo download button in lightbox
- Event metadata in detail view (date, host, photographer credit)
- Subtle fade-in animations on scroll
- "Back to events" breadcrumb in event detail view

DO NOT use any external JavaScript libraries. Pure HTML/CSS/JS.
DO NOT use any external CSS frameworks.
DO use Google Fonts for Inter.

Build the complete index.html file. Make it production-ready and beautiful.
