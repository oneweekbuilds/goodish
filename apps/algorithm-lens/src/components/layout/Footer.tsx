import { Linkedin, Github, Twitter } from 'lucide-react';

interface FooterProps {
  onNavigate: (page: string) => void;
}

export function Footer({ onNavigate }: FooterProps) {
  const footerLinks = {
    product: [
      { label: 'Home', page: 'landing' },
      { label: 'Dashboard', page: 'dashboard' },
      { label: 'Pricing', page: 'pricing' },
      { label: 'How It Works', page: 'about' },
      { label: 'Tier Demo', page: 'tier-demo' },
    ],
  };

  return (
    <footer 
      className="border-t"
      style={{ 
        background: 'var(--section-bg)',
        borderColor: 'var(--border)',
      }}
    >
      <div 
        className="container-content"
        style={{ 
          paddingTop: 'var(--spacing-3xl)',
          paddingBottom: 'var(--spacing-3xl)',
        }}
      >
        <div className="max-w-[1280px] mx-auto">
          <div className="grid md:grid-cols-3" style={{ gap: 'var(--spacing-4xl)' }}>
            {/* Column 1: Logo & Mission */}
            <div>
              <div 
                className="brand-gradient-text"
                style={{
                  fontFamily: 'var(--font-headline)',
                  fontSize: '20px',
                  fontWeight: 700,
                  marginBottom: 'var(--spacing-md)',
                }}
              >
                AlgorithmLens
              </div>
              <p 
                className="text-small"
                style={{ 
                  color: 'var(--foreground-secondary)',
                  lineHeight: '24px',
                  maxWidth: '280px',
                }}
              >
                See your algorithm. Understand your feed. Built at MIT by students passionate about ethical AI and digital transparency.
              </p>
              
              {/* Social Links */}
              <div 
                className="flex items-center"
                style={{ 
                  gap: 'var(--spacing-xs)',
                  marginTop: 'var(--spacing-md)',
                }}
              >
                <a
                  href="https://linkedin.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="transition-all"
                  style={{
                    width: '32px',
                    height: '32px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    borderRadius: 'var(--radius-button)',
                    color: 'var(--foreground-muted)',
                    transition: 'var(--transition-fast)',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.color = 'var(--brand-teal)';
                    e.currentTarget.style.background = 'var(--brand-bg-gradient)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.color = 'var(--foreground-muted)';
                    e.currentTarget.style.background = 'transparent';
                  }}
                  onFocus={(e) => {
                    e.currentTarget.style.outline = '1px solid var(--brand-purple)';
                    e.currentTarget.style.outlineOffset = '2px';
                  }}
                  onBlur={(e) => {
                    e.currentTarget.style.outline = 'none';
                  }}
                  aria-label="LinkedIn"
                >
                  <Linkedin size={18} />
                </a>
                <a
                  href="https://twitter.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="transition-all"
                  style={{
                    width: '32px',
                    height: '32px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    borderRadius: 'var(--radius-button)',
                    color: 'var(--foreground-muted)',
                    transition: 'var(--transition-fast)',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.color = 'var(--brand-teal)';
                    e.currentTarget.style.background = 'var(--brand-bg-gradient)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.color = 'var(--foreground-muted)';
                    e.currentTarget.style.background = 'transparent';
                  }}
                  onFocus={(e) => {
                    e.currentTarget.style.outline = '1px solid var(--brand-purple)';
                    e.currentTarget.style.outlineOffset = '2px';
                  }}
                  onBlur={(e) => {
                    e.currentTarget.style.outline = 'none';
                  }}
                  aria-label="Twitter/X"
                >
                  <Twitter size={18} />
                </a>
                <a
                  href="https://github.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="transition-all"
                  style={{
                    width: '32px',
                    height: '32px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    borderRadius: 'var(--radius-button)',
                    color: 'var(--foreground-muted)',
                    transition: 'var(--transition-fast)',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.color = 'var(--brand-teal)';
                    e.currentTarget.style.background = 'var(--brand-bg-gradient)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.color = 'var(--foreground-muted)';
                    e.currentTarget.style.background = 'transparent';
                  }}
                  onFocus={(e) => {
                    e.currentTarget.style.outline = '1px solid var(--brand-purple)';
                    e.currentTarget.style.outlineOffset = '2px';
                  }}
                  onBlur={(e) => {
                    e.currentTarget.style.outline = 'none';
                  }}
                  aria-label="GitHub"
                >
                  <Github size={18} />
                </a>
              </div>
            </div>

            {/* Column 2: Product Links */}
            <div>
              <h4 
                style={{
                  fontFamily: 'var(--font-headline)',
                  fontSize: '14px',
                  fontWeight: 600,
                  marginBottom: 'var(--spacing-md)',
                  color: 'var(--foreground)',
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                }}
              >
                Product
              </h4>
              <ul style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-sm)' }}>
                {footerLinks.product.map((link) => (
                  <li key={link.label}>
                    <button
                      onClick={() => onNavigate(link.page)}
                      className="text-small hover:underline transition-all"
                      style={{
                        color: 'var(--foreground-secondary)',
                        transition: 'var(--transition-fast)',
                        textAlign: 'left',
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.color = 'var(--brand-teal)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.color = 'var(--foreground-secondary)';
                      }}
                      onFocus={(e) => {
                        e.currentTarget.style.outline = '1px solid var(--brand-purple)';
                        e.currentTarget.style.outlineOffset = '2px';
                      }}
                      onBlur={(e) => {
                        e.currentTarget.style.outline = 'none';
                      }}
                    >
                      {link.label}
                    </button>
                  </li>
                ))}
              </ul>
            </div>

            {/* Column 3: Company Links */}
            <div>
              <h4 
                style={{
                  fontFamily: 'var(--font-headline)',
                  fontSize: '14px',
                  fontWeight: 600,
                  marginBottom: 'var(--spacing-md)',
                  color: 'var(--foreground)',
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                }}
              >
                Company
              </h4>
              <ul style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-sm)' }}>
                <li>
                  <button
                    onClick={() => onNavigate('about')}
                    className="text-small hover:underline transition-all"
                    style={{
                      color: 'var(--foreground-secondary)',
                      transition: 'var(--transition-fast)',
                      textAlign: 'left',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.color = 'var(--brand-teal)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.color = 'var(--foreground-secondary)';
                    }}
                    onFocus={(e) => {
                      e.currentTarget.style.outline = '1px solid var(--brand-purple)';
                      e.currentTarget.style.outlineOffset = '2px';
                    }}
                    onBlur={(e) => {
                      e.currentTarget.style.outline = 'none';
                    }}
                  >
                    About
                  </button>
                </li>
                <li>
                  <button
                    onClick={() => onNavigate('legal')}
                    style={{
                      fontSize: '16px',
                      lineHeight: '26px',
                      color: 'var(--foreground-secondary)',
                      transition: 'var(--transition-fast)',
                      textAlign: 'left',
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      padding: 0,
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.color = 'var(--brand-teal)';
                      e.currentTarget.style.textDecoration = 'underline';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.color = 'var(--foreground-secondary)';
                      e.currentTarget.style.textDecoration = 'none';
                    }}
                    onFocus={(e) => {
                      e.currentTarget.style.outline = '1px solid var(--brand-purple)';
                      e.currentTarget.style.outlineOffset = '2px';
                    }}
                    onBlur={(e) => {
                      e.currentTarget.style.outline = 'none';
                    }}
                  >
                    Privacy & Terms
                  </button>
                </li>
                <li>
                  <button
                    onClick={() => onNavigate('landing')}
                    className="text-small hover:underline transition-all"
                    style={{
                      color: 'var(--foreground-secondary)',
                      transition: 'var(--transition-fast)',
                      textAlign: 'left',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.color = 'var(--brand-teal)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.color = 'var(--foreground-secondary)';
                    }}
                    onFocus={(e) => {
                      e.currentTarget.style.outline = '1px solid var(--brand-purple)';
                      e.currentTarget.style.outlineOffset = '2px';
                    }}
                    onBlur={(e) => {
                      e.currentTarget.style.outline = 'none';
                    }}
                  >
                    Contact
                  </button>
                </li>
              </ul>
            </div>
          </div>

          {/* Bottom Bar */}
          <div 
            className="border-t"
            style={{ 
              marginTop: 'var(--spacing-3xl)',
              paddingTop: 'var(--spacing-md)',
              borderColor: 'var(--border)',
            }}
          >
            <p 
              className="text-small text-center"
              style={{ 
                color: 'var(--foreground-muted)',
              }}
            >
              © 2025 AlgorithmLens. All rights reserved.
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}
