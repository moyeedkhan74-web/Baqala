import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const BASE_URL = 'https://baqala-lovat.vercel.app';
const API_URL = 'https://baqala-kwt6.onrender.com/api/apps';

async function generateSitemap() {
  try {
    console.log('Fetching apps for sitemap...');
    const response = await fetch(API_URL);
    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
    
    const { apps } = await response.json();
    
    const staticRoutes = [
      '',
      '/about',
      '/login',
      '/register'
    ];

    const appRoutes = apps.map(app => `/apps/${app._id}`);
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
    console.log(`Sitemap generated successfully at ${outputPath}`);
  } catch (error) {
    console.error('Error generating sitemap:', error);
    process.exit(1);
  }
}

generateSitemap();
