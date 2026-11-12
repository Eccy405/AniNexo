import { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: ['/admin/', '/home/settings/', '/api/'],
    },
    sitemap: 'https://aninexo.com/sitemap.xml',
  };
}
