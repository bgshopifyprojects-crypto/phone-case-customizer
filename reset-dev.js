// Script to reset development environment
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function resetDev() {
  const shop = 'phone-case-test-2.myshopify.com';
  const offlineSessionId = `offline_${shop}`;
  
  console.log('\n🔄 Resetting development environment...\n');
  
  try {
    // Delete the old session
    await prisma.session.delete({
      where: { id: offlineSessionId }
    });
    console.log('✅ Old session deleted');
  } catch (error) {
    if (error.code === 'P2025') {
      console.log('ℹ️  No existing session found');
    } else {
      console.error('❌ Error deleting session:', error);
    }
  }
  
  console.log('\n📋 Next steps:');
  console.log('1. The dev server will start with a new tunnel URL');
  console.log('2. Click the preview link that appears');
  console.log('3. Install/reinstall the app');
  console.log('4. Both cart and frame should work! ✨\n');
  
  await prisma.$disconnect();
}

resetDev().catch(console.error);
