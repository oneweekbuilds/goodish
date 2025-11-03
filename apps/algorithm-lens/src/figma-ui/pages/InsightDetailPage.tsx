import { motion } from 'motion/react';
import { ChevronRight, Share2, Download, ArrowLeft, AlertCircle } from 'lucide-react';
import { Button } from '../ui/button';
import { Card } from '../ui/card';

interface InsightDetailPageProps {
  onNavigate: (page: string) => void;
  topic?: string;
}

export function InsightDetailPage({ onNavigate, topic = 'wellness' }: InsightDetailPageProps) {
  const comparisonData = [
    { category: 'Your Feed', value: 65, color: '#14b8a6' },
    { category: 'Average User', value: 38, color: '#d1d5db' },
  ];

  const examplePosts = [
    {
      type: 'Article',
      title: '10 Morning Habits for Better Mental Health',
      source: 'Wellness Today',
      engagement: 'High',
    },
    {
      type: 'Video',
      title: 'Meditation Techniques for Beginners',
      source: 'Mindful Living',
      engagement: 'Medium',
    },
    {
      type: 'Image',
      title: 'Healthy Meal Prep Ideas',
      source: 'Nutrition Guide',
      engagement: 'High',
    },
    {
      type: 'Article',
      title: 'The Science of Sleep Quality',
      source: 'Health Research',
      engagement: 'Medium',
    },
  ];

  return (
    <div className="alg-fm min-h-screen pt-32 pb-16 px-6 bg-background">
      <div className="max-w-[1200px] mx-auto">
        {/* Back Button */}
        <motion.div
          className="mb-12"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <Button
            onClick={() => onNavigate('dashboard')}
            className="mb-6 -ml-4"
            style={{ background: 'transparent', color: 'var(--foreground)' }}
          >
            <ArrowLeft size={18} className="mr-2" />
            Back to Dashboard
          </Button>
        </motion.div>

        {/* Header */}
        <motion.div
          className="mb-12"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <h1 className="mb-4 text-5xl" style={{ fontFamily: 'var(--font-headline)' }}>Health & Wellness Bias</h1>
          <p className="text-xl max-w-3xl leading-relaxed" style={{ color: 'var(--foreground-secondary)' }}>
            Your feed features <span style={{ color: 'var(--primary)' }}>37% more</span> health content than the average user. Here's how it might shape your perspective.
          </p>

          <div className="flex gap-3 mt-8">
            <Button variant="outline" size="lg">
              <Share2 size={18} className="mr-2" />
              Share
            </Button>
            <Button variant="outline" size="lg">
              <Download size={18} className="mr-2" />
              Export Data
            </Button>
          </div>
        </motion.div>

        {/* Comparison Chart */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="mb-10"
        >
          <Card className="p-10">
            <h2 className="mb-3 text-3xl" style={{ fontFamily: 'var(--font-headline)' }}>Comparative Exposure</h2>
            <p className="text-lg mb-10 leading-relaxed" style={{ color: 'var(--foreground-secondary)' }}>
              How your health & wellness content compares to the average user
            </p>

            <div className="space-y-6">
              {comparisonData.map((item, i) => (
                <div key={i} className="space-y-2">
                  <div className="flex justify-between">
                    <span style={{ fontSize: '16px', fontWeight: 500 }}>{item.category}</span>
                    <span style={{ fontSize: '18px', fontWeight: 700 }}>{item.value}%</span>
                  </div>
                  <div className="h-12 rounded-xl overflow-hidden" style={{ background: '#f3f4f6' }}>
                    <motion.div
                      className="h-full rounded-xl"
                      style={{ background: item.color, width: `${item.value}%` }}
                      initial={{ width: 0 }}
                      animate={{ width: `${item.value}%` }}
                      transition={{ duration: 1, delay: i * 0.2 }}
                    />
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-8 p-6 rounded-xl border" style={{ background: 'rgba(123, 97, 255, 0.05)', borderColor: 'rgba(123, 97, 255, 0.2)' }}>
              <div className="flex items-start gap-4">
                <AlertCircle size={24} style={{ color: 'var(--primary)', flexShrink: 0, marginTop: '4px' }} />
                <div>
                  <p className="mb-2 text-lg" style={{ fontWeight: 600 }}>What this means</p>
                  <p style={{ color: 'var(--foreground-secondary)', lineHeight: '1.6' }}>
                    Your algorithm has learned you're interested in health topics and prioritizes this content. While this can be helpful, it may create an echo chamber that reinforces certain perspectives while filtering out others.
                  </p>
                </div>
              </div>
            </div>
          </Card>
        </motion.div>

        {/* Example Content */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="mb-10"
        >
          <Card className="p-10">
            <h2 className="mb-3 text-3xl" style={{ fontFamily: 'var(--font-headline)' }}>Representative Content</h2>
            <p className="text-lg mb-10 leading-relaxed" style={{ color: 'var(--foreground-secondary)' }}>
              Examples of health & wellness content frequently shown in your feed
            </p>

            <div className="grid gap-4">
              {examplePosts.map((post, i) => (
                <motion.div
                  key={i}
                  className="p-6 border rounded-xl hover:shadow-md transition-all duration-300"
                  style={{ borderColor: 'var(--border)' }}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.4 + i * 0.1 }}
                >
                  <div className="flex items-start justify-between gap-6">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-3">
                        <span className="px-3 py-1 rounded-lg text-sm" style={{ background: 'var(--secondary)' }}>
                          {post.type}
                        </span>
                        <span className="text-sm" style={{ color: 'var(--foreground-muted)' }}>
                          {post.source}
                        </span>
                      </div>
                      <p className="mb-2 text-lg">{post.title}</p>
                      <span className={`text-sm ${post.engagement === 'High' ? '' : ''}`} style={{ color: post.engagement === 'High' ? 'var(--primary)' : 'var(--foreground-muted)' }}>
                        {post.engagement} Engagement
                      </span>
                    </div>
                    <div className="w-20 h-20 rounded-xl flex-shrink-0" style={{ background: 'linear-gradient(135deg, rgba(123, 97, 255, 0.2), rgba(62, 214, 178, 0.2))' }} />
                  </div>
                </motion.div>
              ))}
            </div>
          </Card>
        </motion.div>

        {/* Recommendations */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          <Card className="p-10" style={{ background: 'linear-gradient(135deg, rgba(62, 214, 178, 0.1), rgba(123, 97, 255, 0.1))', borderColor: 'rgba(62, 214, 178, 0.2)' }}>
            <h2 className="mb-6 text-3xl" style={{ fontFamily: 'var(--font-headline)' }}>Recommendations</h2>
            <p className="text-lg mb-8 leading-relaxed" style={{ color: 'var(--foreground-secondary)' }}>
              Try exploring balanced sources about nutrition and fitness
            </p>

            <ul className="space-y-4 mb-10">
              {[
                'Follow diverse health professionals with different approaches',
                'Balance wellness content with other interest areas',
                'Seek out evidence-based sources alongside lifestyle content',
              ].map((rec, i) => (
                <li key={i} className="flex items-start gap-4">
                  <div className="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 mt-1" style={{ background: 'rgba(62, 214, 178, 0.2)' }}>
                    <ChevronRight size={14} style={{ color: 'var(--brand-teal)' }} />
                  </div>
                  <p className="text-lg leading-relaxed" style={{ color: 'var(--foreground-secondary)' }}>
                    {rec}
                  </p>
                </li>
              ))}
            </ul>

            <Button size="lg" onClick={() => onNavigate('dashboard')} style={{ background: 'var(--brand-gradient)' }}>
              Back to Dashboard
            </Button>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}

