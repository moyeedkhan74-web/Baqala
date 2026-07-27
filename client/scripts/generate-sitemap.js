import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const BASE_URL = 'https://baqala-lovat.vercel.app';
const API_URL = 'https://baqala-kwt6.onrender.com/api/apps';

async function generateSitemap() {
  const staticRoutes = [
    '',
    '/about',
    '/login',
    '/register'
  ];

  let appRoutes = [];

  try {
    console.log('Fetching apps for sitemap...');
    const response = await fetch(API_URL, { signal: AbortSignal.timeout(10000) });
    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
    
    const { apps } = await response.json();
    appRoutes = (apps || []).map(app => `/apps/${app._id}`);
    console.log(`Fetched ${appRoutes.length} app routes.`);
  } catch (error) {
    // Non-fatal: build should NOT fail just because the API is down
    console.warn('⚠️  Could not fetch apps for sitemap (API may be sleeping). Building with static routes only.');
    console.warn(`   Reason: ${error.message}`);
  }

  const allRoutes = [...staticRoutes, ...appRoutes];

  const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${allRoutes.map(route => `  <url>
    <loc>${BASE_URL}${route}</loc>
    <changefreq>daily</changefreq>
    <priority>${route === '' ? '1.0' : '0.8'}</priority>
  </url>`).join('\n')}
</urlset>`;

  const outputPath = path.join(__dirname, '../public/sitemap.xml');
  fs.writeFileSync(outputPath, sitemap);
  console.log(`✅ Sitemap generated with ${allRoutes.length} routes at ${outputPath}`);
}

generateSitemap();
