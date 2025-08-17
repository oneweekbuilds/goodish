import Head from 'next/head'

interface SocialMetaTagsProps {
  title: string
  description: string
  url: string
  image?: string
  superpowerName?: string
}

export function SocialMetaTags({ 
  title, 
  description, 
  url, 
  image = '/images/goodheart-logo-bold-yellow.png',
  superpowerName 
}: SocialMetaTagsProps) {
  const fullTitle = superpowerName ? `I'm ${superpowerName}! | GoodHeart` : title
  const fullDescription = superpowerName 
    ? `I just discovered my giving superpower: ${superpowerName}. Find yours at GoodHeart!`
    : description

  return (
    <Head>
      {/* Primary Meta Tags */}
      <title>{fullTitle}</title>
      <meta name="title" content={fullTitle} />
      <meta name="description" content={fullDescription} />

      {/* Open Graph / Facebook */}
      <meta property="og:type" content="website" />
      <meta property="og:url" content={url} />
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={fullDescription} />
      <meta property="og:image" content={image} />
      <meta property="og:site_name" content="GoodHeart" />

      {/* Twitter */}
      <meta property="twitter:card" content="summary_large_image" />
      <meta property="twitter:url" content={url} />
      <meta property="twitter:title" content={fullTitle} />
      <meta property="twitter:description" content={fullDescription} />
      <meta property="twitter:image" content={image} />

      {/* Additional SEO */}
      <meta name="robots" content="index, follow" />
      <meta name="author" content="GoodHeart" />
      <meta name="keywords" content="charity, donation, giving, effective altruism, superpower, quiz" />
      
      {/* Canonical URL */}
      <link rel="canonical" href={url} />
    </Head>
  )
}