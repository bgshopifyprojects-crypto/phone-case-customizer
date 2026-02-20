import { sessionStorage } from "../shopify.server";

/**
 * Get offline session ID for a shop
 */
function getOfflineSessionId(shop: string): string {
  return `offline_${shop}`;
}

/**
 * Refresh an expired offline access token using the refresh token
 */
export async function refreshOfflineToken(shop: string): Promise<boolean> {
  try {
    console.log(`Attempting to refresh token for shop: ${shop}`);
    
    const sessionId = getOfflineSessionId(shop);
    const session = await sessionStorage.loadSession(sessionId);
    
    if (!session) {
      console.error('No session found for shop:', shop);
      return false;
    }
    
    if (!session.refreshToken) {
      console.error('No refresh token available');
      return false;
    }
    
    // Check if refresh token is expired
    if (session.refreshTokenExpires && new Date(session.refreshTokenExpires) < new Date()) {
      console.error('Refresh token has expired');
      return false;
    }
    
    // Make request to Shopify to refresh the token
    // Use application/x-www-form-urlencoded as per Shopify OAuth spec
    const params = new URLSearchParams({
      client_id: process.env.SHOPIFY_API_KEY!,
      client_secret: process.env.SHOPIFY_API_SECRET!,
      grant_type: 'refresh_token',
      refresh_token: session.refreshToken,
    });
    
    const response = await fetch(`https://${shop}/admin/oauth/access_token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: params.toString(),
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('Token refresh failed:', response.status, errorText);
      return false;
    }
    
    const data = await response.json();
    
    // Update session with new tokens
    session.accessToken = data.access_token;
    
    if (data.expires_in) {
      const expiresAt = new Date();
      expiresAt.setSeconds(expiresAt.getSeconds() + data.expires_in);
      session.expires = expiresAt;
    }
    
    if (data.refresh_token) {
      session.refreshToken = data.refresh_token;
    }
    
    // Save updated session
    await sessionStorage.storeSession(session);
    
    console.log('Token refreshed successfully');
    return true;
    
  } catch (error) {
    console.error('Error refreshing token:', error);
    return false;
  }
}

/**
 * Check if a session's access token is expired and refresh if needed
 */
export async function ensureValidToken(shop: string): Promise<boolean> {
  try {
    const sessionId = getOfflineSessionId(shop);
    const session = await sessionStorage.loadSession(sessionId);
    
    if (!session) {
      console.error('No session found');
      return false;
    }
    
    // Check if token is expired
    if (session.expires && new Date(session.expires) < new Date()) {
      console.log('Access token expired, attempting refresh...');
      return await refreshOfflineToken(shop);
    }
    
    console.log('Access token is still valid');
    return true;
    
  } catch (error) {
    console.error('Error checking token validity:', error);
    return false;
  }
}
