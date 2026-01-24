// Serve the phone customizer JavaScript bundle
import { readFileSync } from 'fs';
import { join } from 'path';
import type { LoaderFunctionArgs } from 'react-router';

export async function loader({ request }: LoaderFunctionArgs) {
  try {
    const filePath = join(process.cwd(), 'extensions/phone-case-customizer/assets/phone-case-customizer.js');
    const content = readFileSync(filePath, 'utf-8');
    
    return new Response(content, {
      headers: {
        'Content-Type': 'application/javascript',
        'Cache-Control': 'public, max-age=3600',
        'Access-Control-Allow-Origin': '*',
      },
    });
  } catch (error) {
    console.error('Error serving phone-customizer.js:', error);
    return new Response('console.error("Failed to load phone customizer");', {
      status: 500,
      headers: {
        'Content-Type': 'application/javascript',
      },
    });
  }
}
