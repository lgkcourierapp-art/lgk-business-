export default function sitemap() {
  return [
    {
      url: 'https://lgk-business.vercel.app',
      lastModified: new Date('2026-05-30'),
      changeFrequency: 'weekly',
      priority: 1,
      alternates: {
        languages: {
          pl: 'https://lgk-business.vercel.app',
          en: 'https://lgk-business.vercel.app?lang=en',
          uk: 'https://lgk-business.vercel.app?lang=uk',
        },
      },
    },
    {
      url: 'https://lgk-business.vercel.app/register',
      lastModified: new Date('2026-05-30'),
      changeFrequency: 'monthly',
      priority: 0.8,
    },
    {
      url: 'https://lgk-business.vercel.app/login',
      lastModified: new Date('2026-05-30'),
      changeFrequency: 'monthly',
      priority: 0.5,
    },
  ]
}
