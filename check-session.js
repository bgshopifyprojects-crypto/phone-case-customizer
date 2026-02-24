// Diagnostic script to check session status
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkSession() {
  const shop = 'phone-case-test-2.myshopify.com';
  
  // Check for offline session
  const offlineSessionId = `offline_${shop}`;
  const session = await prisma.session.findUnique({
    where: { id: offlineSessionId }
  });
  
  console.log('\n=== Session Status ===');
  console.log('Shop:', shop);
  console.log('Session ID:', offlineSessionId);
  
  if (!session) {
    console.log('❌ No offline session found!');
    console.log('Solution: Reinstall the app to create a new session');
  } else {
    console.log('✅ Session found');
    console.log('Access Token:', session.accessToken ? '***' + session.accessToken.slice(-10) : 'MISSING');
    console.log('Expires:', session.expires);
    console.log('Refresh Token:', session.refreshToken ? 'Present' : 'MISSING');
    console.log('Refresh Token Expires:', session.refreshTokenExpires);
    
    const now = new Date();
    if (session.expires && session.expires < now) {
      console.log('❌ ACCESS TOKEN EXPIRED!');
      console.log('Expired on:', session.expires);
      console.log('Current time:', now);
      
      if (session.refreshToken && session.refreshTokenExpires) {
        if (session.refreshTokenExpires > now) {
          console.log('✅ Refresh token is still valid');
          console.log('Solution: Implement token refresh logic');
        } else {
          console.log('❌ Refresh token also expired!');
          console.log('Solution: Reinstall the app');
        }
      } else {
        console.log('⚠️  No refresh token available');
        console.log('Solution: Reinstall the app');
      }
    } else {
      console.log('✅ Access token is still valid');
      if (session.expires) {
        const timeLeft = session.expires - now;
        const daysLeft = Math.floor(timeLeft / (1000 * 60 * 60 * 24));
        console.log(`Token expires in ${daysLeft} days`);
      }
    }
  }
  
  await prisma.$disconnect();
}

checkSession().catch(console.error);
