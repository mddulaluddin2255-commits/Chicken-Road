/**
 * VAST 2.0/3.0/4.0 XML Parser and Ad Service for Chicken Road Points.
 * Handles fetch, CORS fallback, linear video extraction, tracking pings, and completion verification.
 */

export interface VastMediaFile {
  url: string;
  type: string;
  bitrate?: number;
  width?: number;
  height?: number;
}

export interface VastTrackingEvent {
  event: string;
  url: string;
}

export interface VastAdResult {
  success: boolean;
  mediaFiles: VastMediaFile[];
  durationSeconds: number;
  title: string;
  clickThroughUrl?: string;
  impressionUrls: string[];
  trackingEvents: VastTrackingEvent[];
  isFallback: boolean;
  errorMessage?: string;
}

export const OFFICIAL_VAST_URL =
  'https://crookedagreement.com/d.mjF/zTd/G/NYvxZDG/UW/Fe/mk9iuRZbUbl/krP/T/cD0EMXjyMg3/NRjrk/tEN/zuQdyrMIzucE3wMIwL';

// High-definition royalty-free safe fallback video clip if third-party ad server is blocked by browser CORS/Adblock
export const FALLBACK_SPONSORED_VIDEO =
  'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4';

/**
 * Parses VAST XML string into structured data
 */
export function parseVastXml(xmlString: string): VastAdResult {
  try {
    const parser = new DOMParser();
    const xmlDoc = parser.parseFromString(xmlString, 'text/xml');

    // Check for XML parse errors
    const parseError = xmlDoc.querySelector('parsererror');
    if (parseError) {
      throw new Error('XML parsing failed: ' + parseError.textContent);
    }

    // Extract Impression URLs
    const impressionEls = xmlDoc.querySelectorAll('Impression');
    const impressionUrls: string[] = [];
    impressionEls.forEach((el) => {
      const url = el.textContent?.trim();
      if (url) impressionUrls.push(url);
    });

    // Extract Title
    const titleEl = xmlDoc.querySelector('AdTitle');
    const title = titleEl?.textContent?.trim() || 'Sponsored Arcade Partner';

    // Extract ClickThrough
    const clickThroughEl = xmlDoc.querySelector('ClickThrough');
    const clickThroughUrl = clickThroughEl?.textContent?.trim();

    // Extract Tracking events
    const trackingEls = xmlDoc.querySelectorAll('Tracking');
    const trackingEvents: VastTrackingEvent[] = [];
    trackingEls.forEach((el) => {
      const event = el.getAttribute('event');
      const url = el.textContent?.trim();
      if (event && url) {
        trackingEvents.push({ event, url });
      }
    });

    // Extract Duration
    let durationSeconds = 15;
    const durationEl = xmlDoc.querySelector('Duration');
    if (durationEl?.textContent) {
      const parts = durationEl.textContent.trim().split(':');
      if (parts.length === 3) {
        const h = parseInt(parts[0], 10) || 0;
        const m = parseInt(parts[1], 10) || 0;
        const s = parseFloat(parts[2]) || 0;
        durationSeconds = Math.max(5, Math.min(60, h * 3600 + m * 60 + Math.round(s)));
      }
    }

    // Extract MediaFiles
    const mediaFileEls = xmlDoc.querySelectorAll('MediaFile');
    const mediaFiles: VastMediaFile[] = [];

    mediaFileEls.forEach((el) => {
      const url = el.textContent?.trim();
      const type = el.getAttribute('type') || 'video/mp4';
      const bitrate = parseInt(el.getAttribute('bitrate') || '0', 10);
      const width = parseInt(el.getAttribute('width') || '0', 10);
      const height = parseInt(el.getAttribute('height') || '0', 10);

      if (url && (type.includes('mp4') || type.includes('webm') || url.includes('.mp4'))) {
        mediaFiles.push({ url, type, bitrate, width, height });
      }
    });

    if (mediaFiles.length === 0) {
      throw new Error('No valid mp4/webm video MediaFile found in VAST XML');
    }

    return {
      success: true,
      mediaFiles,
      durationSeconds,
      title,
      clickThroughUrl,
      impressionUrls,
      trackingEvents,
      isFallback: false,
    };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return {
      success: false,
      mediaFiles: [],
      durationSeconds: 15,
      title: 'Sponsored Video',
      impressionUrls: [],
      trackingEvents: [],
      isFallback: true,
      errorMessage: msg,
    };
  }
}

/**
 * Fetches the VAST XML from the provided URL with server proxy, CORS safety, and fallback.
 */
export async function loadVastAd(vastUrl: string = OFFICIAL_VAST_URL): Promise<VastAdResult> {
  // Strategy 1: Try server-side proxy route (/api/vast) which bypasses CORS and forwards headers
  try {
    const proxyUrl = `/api/vast?url=${encodeURIComponent(vastUrl)}`;
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 7000);

    const response = await fetch(proxyUrl, {
      signal: controller.signal,
    });
    clearTimeout(timeoutId);

    if (response.ok) {
      const xmlText = await response.text();
      const parsed = parseVastXml(xmlText);
      if (parsed.success && parsed.mediaFiles.length > 0) {
        return parsed;
      }
    }
  } catch (err) {
    console.warn('[VAST Service] Local server proxy fetch attempted:', err);
  }

  // Strategy 2: Direct browser fetch (if CORS supported)
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 4000);

    const response = await fetch(vastUrl, {
      method: 'GET',
      mode: 'cors',
      signal: controller.signal,
    });
    clearTimeout(timeoutId);

    if (response.ok) {
      const xmlText = await response.text();
      const parsed = parseVastXml(xmlText);
      if (parsed.success && parsed.mediaFiles.length > 0) {
        return parsed;
      }
    }
  } catch (err) {
    console.warn('[VAST Service] Direct VAST fetch CORS restricted:', err);
  }

  // Strategy 3: Public CORS-free gateway fallback for static deployments
  try {
    const gatewayUrl = `https://api.allorigins.win/raw?url=${encodeURIComponent(vastUrl)}`;
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 4000);

    const response = await fetch(gatewayUrl, { signal: controller.signal });
    clearTimeout(timeoutId);

    if (response.ok) {
      const xmlText = await response.text();
      const parsed = parseVastXml(xmlText);
      if (parsed.success && parsed.mediaFiles.length > 0) {
        return parsed;
      }
    }
  } catch {
    // Gateway fallback failed
  }

  // Strategy 4: High-reliability video player fallback so user can always watch video and receive reward
  return {
    success: true,
    mediaFiles: [
      {
        url: FALLBACK_SPONSORED_VIDEO,
        type: 'video/mp4',
        width: 1280,
        height: 720,
      },
    ],
    durationSeconds: 15,
    title: 'Featured Sponsor • Chicken Road Arcade',
    clickThroughUrl: 'https://crookedagreement.com',
    impressionUrls: [],
    trackingEvents: [],
    isFallback: true,
  };
}

/**
 * Sends non-blocking tracking beacon to VAST event URLs
 */
export function sendTrackingBeacon(url: string) {
  if (!url || typeof window === 'undefined') return;
  try {
    if (navigator.sendBeacon) {
      navigator.sendBeacon(url);
    } else {
      const img = new Image();
      img.src = url;
    }
  } catch {
    // ignore beacon errors
  }
}
