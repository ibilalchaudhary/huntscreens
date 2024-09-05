import { locales } from '@/i18n/routing';
import { productTypes } from '@/types/product.types';
import { MetadataRoute } from 'next';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const sitemaps = productTypes.flatMap(category => 
    locales.flatMap(lang => [
      {
        url: `https://huntscreens.com/${lang}/${category}`,
        lastModified: new Date()
      },
      {
        url: `https://huntscreens.com/${lang}/sitemaps/${category}`,
        lastModified: new Date()
      }
    ])
  );

  const homepages = locales.map(lang => ({
    url: `https://huntscreens.com/${lang}`,
    lastModified: new Date()
  }));

  return [
    {
      url: "https://huntscreens.com",
      lastModified: new Date()
    },
    ...homepages,
    ...sitemaps
  ];
}