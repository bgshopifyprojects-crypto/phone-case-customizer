// Serve the phone customizer CSS bundle
import { readFileSync } from 'fs';
import { join } from 'path';
import type { LoaderFunctionArgs } from 'react-router';

export async function loader({ request }: LoaderFunctionArgs) {
  try {
    const filePath = join(process.cwd(), 'extensions/phone-case-customizer/assets/phone-case-customizer.css');
    const content = readFileSync(filePath, 'utf-8');
    
    return new Response(content, {
      headers: {
        'Content-Type': 'text/css',
        'Cache-Control': 'public, max-age=3600',
        'Access-Control-Allow-Origin': '*',
      },
    });
  } catch (error) {
    console.error('Error serving phone-customizer.css:', error);
    return new Response('/* Failed to load phone customizer styles */', {
      status: 500,
      headers: {
        'Content-Type': 'text/css',
      },
    });
  }
}
