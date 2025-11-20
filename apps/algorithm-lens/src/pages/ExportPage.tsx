import { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../components/ui/Card';
import { Download, Copy, CheckCircle } from 'lucide-react';

type ExportFormat = 'csv' | 'json';

interface ExportSections {
  interests: boolean;
  accounts: boolean;
  topics: boolean;
  adAttributes: boolean;
  rawEvents: boolean;
}

const LS_KEY = 'algorithmlens:data:v1';

function downloadFile(content: string, filename: string, mimeType: string) {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

function generateCSV(data: any, sections: ExportSections): string {
  const rows: string[][] = [];

  // Add header row
  const headers: string[] = [];
  if (sections.interests) headers.push('Interest');
  if (sections.accounts) headers.push('Account');
  if (sections.topics) headers.push('Topic');
  if (sections.adAttributes) headers.push('Ad Attribute');
  if (sections.rawEvents) headers.push('Event ID', 'Timestamp', 'Platform');

  rows.push(headers);

  // Add sample data rows (this would be replaced with actual data processing)
  const sampleData = data?.items || [];
  if (sampleData.length > 0) {
    sampleData.slice(0, 10).forEach((item: any) => {
      const row: string[] = [];
      if (sections.interests) row.push(item.categories?.[0] || '');
      if (sections.accounts) row.push(item.author || '');
      if (sections.topics) row.push(item.categories?.join('; ') || '');
      if (sections.adAttributes) row.push(item.is_ad ? 'Ad' : 'Organic');
      if (sections.rawEvents) {
        row.push(item.id || '', item.timestamp || '', item.platform || '');
      }
      rows.push(row);
    });
  }

  // Convert to CSV string
  return rows.map(row =>
    row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(',')
  ).join('\n');
}

function generateJSON(data: any, sections: ExportSections): string {
  const output: any = {
    exportedAt: new Date().toISOString(),
    sections: {},
  };

  const items = data?.items || [];

  if (sections.interests) {
    const interests = new Map<string, number>();
    items.forEach((item: any) => {
      item.categories?.forEach((cat: string) => {
        interests.set(cat, (interests.get(cat) || 0) + 1);
      });
    });
    output.sections.interests = Array.from(interests.entries())
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count);
  }

  if (sections.accounts) {
    const accounts = new Map<string, number>();
    items.forEach((item: any) => {
      if (item.author) {
        accounts.set(item.author, (accounts.get(item.author) || 0) + 1);
      }
    });
    output.sections.accounts = Array.from(accounts.entries())
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count);
  }

  if (sections.topics) {
    const topics = new Map<string, number>();
    items.forEach((item: any) => {
      item.categories?.forEach((cat: string) => {
        topics.set(cat, (topics.get(cat) || 0) + 1);
      });
    });
    output.sections.topicBreakdown = Array.from(topics.entries())
      .map(([topic, count]) => ({ topic, count }))
      .sort((a, b) => b.count - a.count);
  }

  if (sections.adAttributes) {
    const ads = items.filter((item: any) => item.is_ad).length;
    const organic = items.length - ads;
    output.sections.adAttributes = {
      totalAds: ads,
      totalOrganic: organic,
      adPercentage: items.length > 0 ? ((ads / items.length) * 100).toFixed(1) : '0',
    };
  }

  if (sections.rawEvents) {
    output.sections.rawEvents = items.map((item: any) => ({
      id: item.id,
      timestamp: item.timestamp,
      platform: item.platform,
      author: item.author,
      content: item.content,
      categories: item.categories,
      is_ad: item.is_ad,
    }));
  }

  return JSON.stringify(output, null, 2);
}

function generateSummary(data: any, sections: ExportSections): string {
  const items = data?.items || [];
  const lines: string[] = [
    'AlgorithmLens Export Summary',
    '============================',
    '',
    `Total items analyzed: ${items.length}`,
    `Export date: ${new Date().toLocaleString()}`,
    '',
  ];

  if (sections.interests) {
    const interests = new Map<string, number>();
    items.forEach((item: any) => {
      item.categories?.forEach((cat: string) => {
        interests.set(cat, (interests.get(cat) || 0) + 1);
      });
    });
    const top5 = Array.from(interests.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5);

    lines.push('Top 5 Interests:');
    top5.forEach(([name, count], i) => {
      lines.push(`  ${i + 1}. ${name} (${count} items)`);
    });
    lines.push('');
  }

  if (sections.accounts) {
    const accounts = new Map<string, number>();
    items.forEach((item: any) => {
      if (item.author) {
        accounts.set(item.author, (accounts.get(item.author) || 0) + 1);
      }
    });
    const top5 = Array.from(accounts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5);

    lines.push('Top 5 Accounts:');
    top5.forEach(([name, count], i) => {
      lines.push(`  ${i + 1}. ${name} (${count} items)`);
    });
    lines.push('');
  }

  if (sections.adAttributes) {
    const ads = items.filter((item: any) => item.is_ad).length;
    const organic = items.length - ads;
    const adPct = items.length > 0 ? ((ads / items.length) * 100).toFixed(1) : '0';

    lines.push('Ad Targeting:');
    lines.push(`  Total ads: ${ads}`);
    lines.push(`  Organic content: ${organic}`);
    lines.push(`  Ad percentage: ${adPct}%`);
    lines.push('');
  }

  return lines.join('\n');
}

export default function ExportPage() {
  const [format, setFormat] = useState<ExportFormat>('json');
  const [sections, setSections] = useState<ExportSections>({
    interests: true,
    accounts: true,
    topics: true,
    adAttributes: true,
    rawEvents: false,
  });
  const [isDownloading, setIsDownloading] = useState(false);
  const [copySuccess, setCopySuccess] = useState(false);
  const [summaryPreview, setSummaryPreview] = useState('');
  const [hasData, setHasData] = useState(false);

  useEffect(() => {
    // Check if data exists
    const stored = localStorage.getItem(LS_KEY);
    setHasData(!!stored);

    // Generate initial preview
    if (stored) {
      try {
        const data = JSON.parse(stored);
        setSummaryPreview(generateSummary(data, sections));
      } catch {
        setSummaryPreview('No data available for preview.');
      }
    } else {
      setSummaryPreview('No data available. Import data first to enable export.');
    }
  }, []);

  useEffect(() => {
    // Regenerate preview when selections change
    const stored = localStorage.getItem(LS_KEY);
    if (stored) {
      try {
        const data = JSON.parse(stored);
        setSummaryPreview(generateSummary(data, sections));
      } catch {
        setSummaryPreview('Error generating preview.');
      }
    }
  }, [sections]);

  const handleSectionToggle = (key: keyof ExportSections) => {
    setSections(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const handleDownload = async () => {
    if (!hasData) return;

    setIsDownloading(true);

    try {
      const stored = localStorage.getItem(LS_KEY);
      if (!stored) throw new Error('No data found');

      const data = JSON.parse(stored);

      let content: string;
      let filename: string;
      let mimeType: string;

      if (format === 'csv') {
        content = generateCSV(data, sections);
        filename = `algorithmlens-export-${Date.now()}.csv`;
        mimeType = 'text/csv;charset=utf-8;';
      } else {
        content = generateJSON(data, sections);
        filename = `algorithmlens-export-${Date.now()}.json`;
        mimeType = 'application/json;charset=utf-8;';
      }

      downloadFile(content, filename, mimeType);
    } catch (error) {
      console.error('Export failed:', error);
    } finally {
      // Simulate processing time for better UX
      setTimeout(() => setIsDownloading(false), 500);
    }
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(summaryPreview);
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000);
    } catch (error) {
      console.error('Copy failed:', error);
    }
  };

  const handleRefreshPreview = () => {
    const stored = localStorage.getItem(LS_KEY);
    if (stored) {
      try {
        const data = JSON.parse(stored);
        setSummaryPreview(generateSummary(data, sections));
      } catch {
        setSummaryPreview('Error generating preview.');
      }
    }
  };

  return (
    <div
      className="min-h-screen"
      style={{
        background: 'linear-gradient(180deg, #FAFBFF 0%, rgba(240, 253, 250, 0.85) 40%, rgba(250, 245, 255, 0.85) 100%)',
        paddingTop: 'var(--navbar-height)',
      }}
    >
      <div
        className="container-content"
        style={{
          maxWidth: '1200px',
          margin: '0 auto',
          paddingTop: 'var(--spacing-3xl)',
          paddingBottom: 'var(--spacing-3xl)',
        }}
      >
        {/* Header */}
        <header className="mb-12">
          <h1
            style={{
              fontFamily: 'var(--font-headline)',
              fontSize: '48px',
              lineHeight: '1.2',
              fontWeight: 800,
              color: 'var(--foreground)',
              marginBottom: '12px',
              marginTop: 0,
            }}
          >
            Export your results
          </h1>
          <p
            style={{
              fontSize: '16px',
              lineHeight: '1.5',
              color: 'var(--foreground-muted)',
              marginTop: 0,
              marginBottom: 0,
            }}
          >
            Download your insights as CSV or JSON, or copy a summary for sharing.
          </p>
        </header>

        {/* Main export card */}
        <Card
          className="mb-8"
          style={{
            background: 'white',
            border: '1px solid rgba(123, 97, 255, 0.1)',
          }}
        >
          <CardContent className="space-y-8">
            {/* Section 1: Choose format */}
            <div>
              <h2
                style={{
                  fontFamily: 'var(--font-headline)',
                  fontSize: '20px',
                  lineHeight: '1.3',
                  fontWeight: 600,
                  color: 'var(--foreground)',
                  marginBottom: '12px',
                  marginTop: 0,
                }}
              >
                Choose format
              </h2>

              <div className="flex gap-4">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="format"
                    value="csv"
                    checked={format === 'csv'}
                    onChange={() => setFormat('csv')}
                    className="w-4 h-4 accent-[var(--brand-teal)]"
                  />
                  <span style={{ fontSize: '15px', color: 'var(--foreground)' }}>CSV</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="format"
                    value="json"
                    checked={format === 'json'}
                    onChange={() => setFormat('json')}
                    className="w-4 h-4 accent-[var(--brand-teal)]"
                  />
                  <span style={{ fontSize: '15px', color: 'var(--foreground)' }}>JSON</span>
                </label>
              </div>

              <p
                style={{
                  fontSize: '14px',
                  lineHeight: '1.5',
                  color: 'var(--foreground-muted)',
                  marginTop: '8px',
                  marginBottom: 0,
                }}
              >
                CSV is best for spreadsheets; JSON is best for programmatic access.
              </p>
            </div>

            {/* Section 2: What to include */}
            <div>
              <h2
                style={{
                  fontFamily: 'var(--font-headline)',
                  fontSize: '20px',
                  lineHeight: '1.3',
                  fontWeight: 600,
                  color: 'var(--foreground)',
                  marginBottom: '12px',
                  marginTop: 0,
                }}
              >
                What to include
              </h2>

              <div className="space-y-3">
                {[
                  { key: 'interests' as const, label: 'Inferred interests' },
                  { key: 'accounts' as const, label: 'Accounts most shown to you' },
                  { key: 'topics' as const, label: 'Topic breakdown' },
                  { key: 'adAttributes' as const, label: 'Ad targeting attributes' },
                  { key: 'rawEvents' as const, label: 'Raw parsed events' },
                ].map(({ key, label }) => (
                  <label key={key} className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={sections[key]}
                      onChange={() => handleSectionToggle(key)}
                      className="w-4 h-4 accent-[var(--brand-teal)]"
                    />
                    <span style={{ fontSize: '15px', color: 'var(--foreground)' }}>{label}</span>
                  </label>
                ))}
              </div>

              <p
                style={{
                  fontSize: '14px',
                  lineHeight: '1.5',
                  color: 'var(--foreground-muted)',
                  marginTop: '8px',
                  marginBottom: 0,
                }}
              >
                Selecting more items can increase file size.
              </p>
            </div>

            {/* Section 3: Privacy note */}
            <div
              style={{
                padding: '12px 16px',
                background: 'rgba(62, 214, 178, 0.05)',
                borderRadius: '8px',
                border: '1px solid rgba(62, 214, 178, 0.2)',
              }}
            >
              <p
                style={{
                  fontSize: '14px',
                  lineHeight: '1.5',
                  color: 'var(--foreground-secondary)',
                  margin: 0,
                }}
              >
                🔒 Exports are generated locally in your browser. Nothing is uploaded.
              </p>
            </div>

            {/* Action buttons */}
            <div className="flex flex-col sm:flex-row gap-3">
              <button
                type="button"
                onClick={handleDownload}
                disabled={isDownloading || !hasData}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  padding: '12px 24px',
                  fontSize: '15px',
                  fontWeight: 600,
                  borderRadius: 'var(--radius-button)',
                  background: hasData ? 'var(--brand-gradient)' : '#E5E7EB',
                  color: hasData ? 'white' : '#9CA3AF',
                  border: 'none',
                  cursor: hasData ? 'pointer' : 'not-allowed',
                  transition: 'var(--transition-fast)',
                  opacity: isDownloading ? 0.6 : 1,
                }}
                onMouseEnter={(e) => {
                  if (hasData && !isDownloading) {
                    e.currentTarget.style.opacity = '0.9';
                  }
                }}
                onMouseLeave={(e) => {
                  if (hasData && !isDownloading) {
                    e.currentTarget.style.opacity = '1';
                  }
                }}
              >
                <Download size={18} />
                {isDownloading ? 'Preparing…' : 'Download'}
              </button>

              <button
                type="button"
                onClick={handleCopy}
                disabled={!hasData}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  padding: '12px 24px',
                  fontSize: '15px',
                  fontWeight: 600,
                  borderRadius: 'var(--radius-button)',
                  background: 'white',
                  color: hasData ? 'var(--brand-teal)' : '#9CA3AF',
                  border: hasData ? '1px solid var(--brand-teal)' : '1px solid #E5E7EB',
                  cursor: hasData ? 'pointer' : 'not-allowed',
                  transition: 'var(--transition-fast)',
                }}
                onMouseEnter={(e) => {
                  if (hasData) {
                    e.currentTarget.style.background = 'rgba(62, 214, 178, 0.05)';
                  }
                }}
                onMouseLeave={(e) => {
                  if (hasData) {
                    e.currentTarget.style.background = 'white';
                  }
                }}
              >
                {copySuccess ? <CheckCircle size={18} /> : <Copy size={18} />}
                {copySuccess ? 'Copied!' : 'Copy summary'}
              </button>
            </div>

            {copySuccess && (
              <div
                style={{
                  padding: '8px 12px',
                  background: 'rgba(34, 197, 94, 0.1)',
                  borderRadius: '8px',
                  fontSize: '14px',
                  color: '#16a34a',
                }}
              >
                Summary copied to clipboard!
              </div>
            )}

            {!hasData && (
              <div
                style={{
                  padding: '12px 16px',
                  background: 'rgba(239, 68, 68, 0.05)',
                  borderRadius: '8px',
                  border: '1px solid rgba(239, 68, 68, 0.2)',
                }}
              >
                <p
                  style={{
                    fontSize: '14px',
                    lineHeight: '1.5',
                    color: '#dc2626',
                    margin: 0,
                  }}
                >
                  No data available. Please <a href="/import" style={{ textDecoration: 'underline', color: '#dc2626', fontWeight: 600 }}>import data</a> first.
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Summary preview card */}
        <Card
          style={{
            background: 'white',
            border: '1px solid rgba(123, 97, 255, 0.1)',
          }}
        >
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle
                  style={{
                    fontFamily: 'var(--font-headline)',
                    fontSize: '20px',
                    lineHeight: '1.3',
                    fontWeight: 600,
                    color: 'var(--foreground)',
                  }}
                >
                  Shareable summary preview
                </CardTitle>
                <CardDescription
                  style={{
                    fontSize: '14px',
                    color: 'var(--foreground-muted)',
                    marginTop: '4px',
                  }}
                >
                  This is what will be copied when you click "Copy summary"
                </CardDescription>
              </div>
              <button
                type="button"
                onClick={handleRefreshPreview}
                disabled={!hasData}
                style={{
                  fontSize: '14px',
                  color: hasData ? 'var(--brand-teal)' : '#9CA3AF',
                  background: 'none',
                  border: 'none',
                  cursor: hasData ? 'pointer' : 'not-allowed',
                  textDecoration: 'underline',
                }}
              >
                Refresh preview
              </button>
            </div>
          </CardHeader>
          <CardContent>
            <pre
              style={{
                fontFamily: 'monospace',
                fontSize: '13px',
                lineHeight: '1.6',
                color: 'var(--foreground-secondary)',
                background: 'rgba(0, 0, 0, 0.02)',
                padding: '16px',
                borderRadius: '8px',
                overflow: 'auto',
                whiteSpace: 'pre-wrap',
                wordWrap: 'break-word',
                maxHeight: '400px',
              }}
            >
              {summaryPreview}
            </pre>
          </CardContent>
        </Card>

        {/* Footer note */}
        <div
          style={{
            marginTop: 'var(--spacing-xl)',
            textAlign: 'center',
          }}
        >
          <p
            style={{
              fontSize: '14px',
              lineHeight: '1.5',
              color: 'var(--foreground-muted)',
              margin: 0,
            }}
          >
            Data is stored locally under <code style={{ background: 'rgba(0, 0, 0, 0.05)', padding: '2px 6px', borderRadius: '4px' }}>{LS_KEY}</code>.
            Clear it anytime from your browser storage.
          </p>
        </div>
      </div>
    </div>
  );
}
