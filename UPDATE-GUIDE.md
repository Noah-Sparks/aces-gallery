# Gallery Update Guide - R2 Integration

## Overview

The gallery has been updated to use Cloudflare R2 for persistent photo storage instead of localStorage. This guide explains what changed and how to apply the updates.

## Files Added

1. **config.js** - Configuration file with Worker URL and API key
2. **r2-storage.js** - R2 storage module that handles all API calls
3. **index.html.backup** - Backup of original gallery

## Changes Required to index.html

### 1. Add Script Includes

Add these lines in the `<head>` section, before the closing `</head>` tag:

```html
<script src="config.js"></script>
<script src="r2-storage.js"></script>
```

### 2. Update JavaScript - Initialize R2Storage

Add this near the top of the `<script>` section (around line 301):

```javascript
// Initialize R2 storage
const r2Storage = new R2Storage(GALLERY_CONFIG);

// Keep localStorage for event list and as fallback
const STORAGE_KEY = 'aces-gallery-data';
const AUTH_KEY = 'aces-gallery-auth';
const PASSWORD = GALLERY_CONFIG.PASSWORD;
```

### 3. Update Upload Function

Replace the `uploadSubmitBtn` click handler with:

```javascript
document.getElementById('uploadSubmitBtn').addEventListener('click', async () => {
  if (!currentEvent || pendingFiles.length === 0) return;
  const progressEl = document.getElementById('uploadProgress');
  const progressBar = document.getElementById('uploadProgressBar');
  progressEl.classList.add('active');
  progressBar.style.width = '0%';

  const total = pendingFiles.length;
  let done = 0;
  const errors = [];

  for (const file of pendingFiles) {
    try {
      // Upload to R2 via Worker
      const result = await r2Storage.uploadPhoto(currentEvent.id, file);
      
      currentEvent.photos.push({
        key: result.key,
        url: result.url,
        filename: result.filename,
        name: file.name,
        added: new Date().toISOString(),
        fallback: result.fallback || false
      });
      
      done++;
      progressBar.style.width = ((done / total) * 100) + '%';
    } catch (error) {
      console.error('Upload error:', error);
      errors.push({ file: file.name, error: error.message });
      done++;
      progressBar.style.width = ((done / total) * 100) + '%';
    }
  }

  if (!currentEvent.cover && currentEvent.photos.length > 0) {
    currentEvent.cover = currentEvent.photos[0].url;
  }

  // Save event metadata (photos list stored in R2, event info in localStorage)
  await r2Storage.saveMetadata(currentEvent.id, {
    name: currentEvent.name,
    date: currentEvent.date,
    city: currentEvent.city,
    host: currentEvent.host,
    photographer: currentEvent.photographer,
    cover: currentEvent.cover,
    photoCount: currentEvent.photos.length,
    photos: currentEvent.photos
  });

  saveData(galleryData); // Still save event list to localStorage
  pendingFiles = [];
  document.getElementById('uploadModal').classList.remove('active');
  renderMasonry();
  document.getElementById('detailMeta').querySelector('span:last-child').textContent = `${currentEvent.photos.length} photos`;
  
  if (errors.length > 0) {
    showToast(`${done - errors.length} uploaded, ${errors.length} failed`, 'error');
  } else {
    showToast(`${total} photo${total > 1 ? 's' : ''} uploaded`, 'success');
  }
});
```

### 4. Update renderMasonry Function

Replace the `renderMasonry` function with:

```javascript
function renderMasonry() {
  const masonry = document.getElementById('masonry');
  masonry.innerHTML = '';
  if (!currentEvent) return;

  currentEvent.photos.forEach((photo, i) => {
    const item = document.createElement('div');
    item.className = 'masonry-item';
    
    // Use the full URL from R2
    const photoUrl = photo.url || photo.data || '';
    
    item.innerHTML = `
      <img src="${photoUrl}" alt="" loading="lazy" onload="this.classList.add('loaded')">
      <button class="delete-photo" title="Remove photo" data-index="${i}">&times;</button>
    `;
    item.querySelector('img').addEventListener('click', () => openLightbox(i));
    item.querySelector('.delete-photo').addEventListener('click', async (e) => {
      e.stopPropagation();
      if (confirm('Remove this photo?')) {
        try {
          // Delete from R2 if it's not a fallback/localStorage photo
          if (photo.key && !photo.fallback) {
            await r2Storage.deletePhoto(photo.key);
          }
          
          currentEvent.photos.splice(i, 1);
          if (currentEvent.cover === photoUrl) {
            currentEvent.cover = currentEvent.photos[0]?.url || currentEvent.photos[0]?.data || '';
          }
          
          // Update metadata in R2
          await r2Storage.saveMetadata(currentEvent.id, {
            name: currentEvent.name,
            date: currentEvent.date,
            city: currentEvent.city,
            host: currentEvent.host,
            photographer: currentEvent.photographer,
            cover: currentEvent.cover,
            photoCount: currentEvent.photos.length,
            photos: currentEvent.photos
          });
          
          saveData(galleryData);
          renderMasonry();
          document.getElementById('detailMeta').querySelector('span:last-child').textContent = `${currentEvent.photos.length} photos`;
          showToast('Photo removed', 'success');
        } catch (error) {
          console.error('Delete error:', error);
          showToast('Failed to delete photo', 'error');
        }
      }
    });
    masonry.appendChild(item);
  });
}
```

### 5. Update updateLightbox Function

Replace the `updateLightbox` function:

```javascript
function updateLightbox() {
  const photo = currentEvent.photos[lbIndex];
  const photoUrl = photo.url || photo.data || '';
  document.getElementById('lbImg').src = photoUrl;
  document.getElementById('lbCounter').textContent = `${lbIndex + 1} / ${currentEvent.photos.length}`;
}
```

### 6. Update renderEvents Function

Update the cover image part in `renderEvents`:

```javascript
const coverUrl = ev.cover || (ev.photos[0]?.url) || (ev.photos[0]?.data) || '';
```

## Migration Strategy

### For Existing Photos

Existing photos in localStorage will continue to work. The gallery supports both:

1. **New photos**: Stored in R2 via Worker (has `key` and `url` properties)
2. **Old photos**: Stored as base64 in localStorage (has `data` property)

Over time, you can:
1. Re-upload old events to move them to R2
2. Create a migration script to transfer localStorage photos to R2
3. Or keep them as-is (they'll continue working)

### Event Metadata

- **Event list** stays in localStorage for now (quick access)
- **Photo metadata** moves to R2 (per-event JSON files)
- Both storage methods work together seamlessly

## Testing After Update

1. **First, update config.js** with your Worker URL
2. Make the HTML changes above
3. Commit and push to GitHub
4. Wait for GitHub Pages to deploy
5. Test:
   - Create a new event
   - Upload photos
   - Verify photos load from R2 (check Network tab in DevTools)
   - Delete a photo
   - Check that old events still work

## Rollback Plan

If something breaks:

```bash
cd /Users/clanker/.openclaw/workspace/aces-gallery
cp index.html.backup index.html
git commit -am "Rollback to localStorage version"
git push origin main
```

## Alternative: Automated Update

I can create a script that automatically applies these changes. Let me know if you'd prefer that approach.

## Next Steps

After confirming R2 integration works:

1. Consider migrating old photos to R2
2. Add image optimization/resizing
3. Add batch upload support
4. Add photo captions/metadata
5. Add download all photos for an event
