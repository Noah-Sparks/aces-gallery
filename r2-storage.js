// R2 Storage Module for Aces Gallery
// This module handles all interactions with the Cloudflare Worker/R2 backend

class R2Storage {
  constructor(config) {
    this.workerUrl = config.WORKER_URL;
    this.apiKey = config.API_KEY;
    this.useFallback = config.USE_FALLBACK;
    this.debug = config.DEBUG;
  }

  log(...args) {
    if (this.debug) console.log('[R2Storage]', ...args);
  }

  // Upload a photo to R2
  async uploadPhoto(eventId, file) {
    try {
      const formData = new FormData();
      formData.append('eventId', eventId);
      formData.append('file', file);

      const response = await fetch(`${this.workerUrl}/upload`, {
        method: 'POST',
        headers: {
          'X-API-Key': this.apiKey
        },
        body: formData
      });

      if (!response.ok) {
        throw new Error(`Upload failed: ${response.statusText}`);
      }

      const result = await response.json();
      this.log('Photo uploaded:', result);
      
      // Return full URL
      return {
        ...result,
        url: this.workerUrl + result.url
      };
    } catch (error) {
      this.log('Upload error:', error);
      
      // Fallback to localStorage if enabled
      if (this.useFallback) {
        this.log('Using localStorage fallback');
        return await this.fallbackUpload(file);
      }
      
      throw error;
    }
  }

  // Fallback: store in localStorage as base64
  async fallbackUpload(file) {
    const dataUrl = await this.readFileAsDataURL(file);
    return {
      success: true,
      url: dataUrl,
      key: `local-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      filename: file.name,
      fallback: true
    };
  }

  // List photos for an event
  async listPhotos(eventId) {
    try {
      const response = await fetch(`${this.workerUrl}/list?prefix=events/${eventId}`);
      
      if (!response.ok) {
        throw new Error(`List failed: ${response.statusText}`);
      }

      const result = await response.json();
      this.log('Photos listed:', result);
      
      // Convert relative URLs to absolute
      return result.photos.map(photo => ({
        ...photo,
        url: this.workerUrl + photo.url
      }));
    } catch (error) {
      this.log('List error:', error);
      return [];
    }
  }

  // Delete a photo from R2
  async deletePhoto(key) {
    try {
      const response = await fetch(`${this.workerUrl}/photos/${key}`, {
        method: 'DELETE',
        headers: {
          'X-API-Key': this.apiKey
        }
      });

      if (!response.ok) {
        throw new Error(`Delete failed: ${response.statusText}`);
      }

      const result = await response.json();
      this.log('Photo deleted:', result);
      return result;
    } catch (error) {
      this.log('Delete error:', error);
      throw error;
    }
  }

  // Get event metadata
  async getMetadata(eventId) {
    try {
      const response = await fetch(`${this.workerUrl}/metadata?eventId=${eventId}`);
      
      if (!response.ok) {
        throw new Error(`Get metadata failed: ${response.statusText}`);
      }

      const result = await response.json();
      this.log('Metadata retrieved:', result);
      return result.metadata || result;
    } catch (error) {
      this.log('Get metadata error:', error);
      return null;
    }
  }

  // Save event metadata
  async saveMetadata(eventId, metadata) {
    try {
      const response = await fetch(`${this.workerUrl}/metadata`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-API-Key': this.apiKey
        },
        body: JSON.stringify({ eventId, metadata })
      });

      if (!response.ok) {
        throw new Error(`Save metadata failed: ${response.statusText}`);
      }

      const result = await response.json();
      this.log('Metadata saved:', result);
      return result;
    } catch (error) {
      this.log('Save metadata error:', error);
      
      // Fallback to localStorage
      if (this.useFallback) {
        this.log('Saving metadata to localStorage');
        localStorage.setItem(`metadata-${eventId}`, JSON.stringify(metadata));
        return { success: true, fallback: true };
      }
      
      throw error;
    }
  }

  // Helper: read file as data URL
  readFileAsDataURL(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }

  // Get photo URL (for displaying images)
  getPhotoUrl(photoData) {
    // If it's already a full URL, return it
    if (photoData.startsWith('http') || photoData.startsWith('data:')) {
      return photoData;
    }
    
    // If it's a key, construct the URL
    if (photoData.startsWith('events/')) {
      return `${this.workerUrl}/photos/${photoData}`;
    }
    
    // Otherwise return as-is (might be a relative URL)
    return this.workerUrl + photoData;
  }
}

// Export for use in main gallery script
if (typeof window !== 'undefined') {
  window.R2Storage = R2Storage;
}
