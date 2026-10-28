export function configureMapboxAccessToken(mapboxgl: { accessToken: string }): boolean {
  const token = window.__runtimeConfig?.mapboxAccessToken?.trim();
  if (!token) {
    console.error('Mapbox access token is not configured. Set it in the deployed runtime-config.js file.');
    return false;
  }

  mapboxgl.accessToken = token;
  return true;
}

declare global {
  interface Window {
    __runtimeConfig?: {
      mapboxAccessToken?: string;
    };
  }
}
