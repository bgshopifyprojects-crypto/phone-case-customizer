// Script to delete expired session
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function deleteSession() {
  const shop = 'phone-case-test-2.myshopify.com';
  const offlineSessionId = `offline_${shop}`;
  
  console.log('\n=== Deleting Session ===');
  console.log('Shop:', shop);
  console.log('Session ID:', offlineSessionId);
  
  try {
    await prisma.session.delete({
      where: { id: offlineSessionId }
    });
    
    console.log('✅ Session deleted successfully!');
    console.log('\nNext steps:');
    console.log('1. Go to your Shopify admin');
    console.log('2. Uninstall the app completely');
    console.log('3. Reinstall the app');
    console.log('4. This will create a fresh session with a new access token');
    
  } catch (error) {
    if (error.code === 'P2025') {
      console.log('⚠️  Session not found (already deleted)');
    } else {
      console.error('❌ Error deleting session:', error);
    }
  }
  
  await prisma.$disconnect();
}

deleteSession().catch(console.error);
