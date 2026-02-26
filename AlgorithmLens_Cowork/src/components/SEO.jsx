import { Helmet } from 'react-helmet-async';

const DEFAULT_TITLE = 'AlgorithmLens';
const DEFAULT_DESCRIPTION = 'See what\u2019s really in your feed. Understand the ads, themes, and patterns that shape what you see.';
const SITE_URL = 'https://algorithmlens.com';
const DEFAULT_IMAGE = '/og.png';

const SEO = ({ title, description, path = '', image, noIndex = false }) => {
  const fullTitle = title ? `${title} | AlgorithmLens` : DEFAULT_TITLE;
  const desc = description || DEFAULT_DESCRIPTION;
  const url = `${SITE_URL}${path}`;
  const img = image || DEFAULT_IMAGE;

  return (
    <Helmet>
      <title>{fullTitle}</title>
      <meta name="description" content={desc} />
      <link rel="canonical" href={url} />

      {/* Open Graph */}
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={desc} />
      <meta property="og:url" content={url} />
      <meta property="og:image" content={img} />
      <meta property="og:type" content="website" />

      {/* Twitter */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={desc} />
      <meta name="twitter:image" content={img} />

      {noIndex && <meta name="robots" content="noindex,nofollow" />}
    </Helmet>
  );
};

export default SEO;
