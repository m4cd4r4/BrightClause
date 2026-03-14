import type { MetadataRoute } from 'next'

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    { url: 'https://brightclause.com', lastModified: new Date(), priority: 1.0 },
    { url: 'https://brightclause.com/dashboard', lastModified: new Date(), priority: 0.9 },
    { url: 'https://brightclause.com/search', lastModified: new Date(), priority: 0.8 },
    { url: 'https://brightclause.com/analytics', lastModified: new Date(), priority: 0.8 },
    { url: 'https://brightclause.com/deals', lastModified: new Date(), priority: 0.7 },
    { url: 'https://brightclause.com/obligations', lastModified: new Date(), priority: 0.7 },
    { url: 'https://brightclause.com/compare', lastModified: new Date(), priority: 0.7 },
  ]
}
