import { writable } from 'svelte/store';

/**
 * All Svelte stores related to a profile scan, grouped in one object.
 * Import this singleton wherever scan data is needed.
 */
export const scanStores = {
  status:          writable('Checking Instagram page...'),
  loading:         writable(false),
  bio:             writable('No bio scanned yet'),
  posts:           writable([]),
  highlights:      writable([]),
  profileInfo:     writable({}),
  results:         writable([]),
  numberOfPII:     writable(0),
  pii_types_number: writable([]),
};

/** Resets every scan store back to its initial value. */
export function resetScanStores() {
  scanStores.status.set('Please authenticate to continue');
  scanStores.loading.set(false);
  scanStores.bio.set('No bio scanned yet');
  scanStores.posts.set([]);
  scanStores.highlights.set([]);
  scanStores.profileInfo.set({});
  scanStores.results.set([]);
  scanStores.numberOfPII.set(0);
  scanStores.pii_types_number.set([]);
}
