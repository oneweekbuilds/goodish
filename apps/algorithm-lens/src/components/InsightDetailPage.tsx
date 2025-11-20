import { motion } from 'motion/react';
import { ChevronRight, Share2, Download, ArrowLeft, AlertCircle } from 'lucide-react';
import { Button } from './ui/Button';
import { Card } from './ui/Card';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from './ui/breadcrumb';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  ResponsiveContainer,
  Cell,
} from 'recharts';

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
    <div className="min-h-screen pt-32 pb-16 px-6 bg-background">
      <div className="max-w-[1200px] mx-auto">
        {/* Back Button & Breadcrumb - Better Spacing */}
        <motion.div
          className="mb-12"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <Button
            variant="ghost"
            onClick={() => onNavigate('dashboard')}
            className="mb-6 -ml-4"
          >
            <ArrowLeft size={18} className="mr-2" />
            Back to Dashboard
          </Button>

          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem>
                <BreadcrumbLink onClick={() => onNavigate('dashboard')}>
                  Dashboard
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator>
                <ChevronRight size={16} />
              </BreadcrumbSeparator>
              <BreadcrumbItem>
                <BreadcrumbLink>Biases</BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator>
                <ChevronRight size={16} />
              </BreadcrumbSeparator>
              <BreadcrumbItem>
                <BreadcrumbPage>Health & Wellness</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </motion.div>

        {/* Header - Enhanced Typography */}
        <motion.div
          className="mb-12"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <h1 className="mb-4 text-5xl">Health & Wellness Bias</h1>
          <p className="text-xl text-muted-foreground max-w-3xl leading-relaxed">
            Your feed features <span className="text-primary">37% more</span> health content than the average user. Here's how it might shape your perspective.
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

        {/* Comparison Chart - Better Layout */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="mb-10"
        >
          <Card className="p-10">
            <h2 className="mb-3 text-3xl">Comparative Exposure</h2>
            <p className="text-lg text-muted-foreground mb-10 leading-relaxed">
              How your health & wellness content compares to the average user
            </p>

            <ResponsiveContainer width="100%" height={320}>
              <BarChart data={comparisonData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e5e5" horizontal={false} />
                <XAxis type="number" domain={[0, 100]} />
                <YAxis type="category" dataKey="category" width={140} />
                <Bar dataKey="value" radius={[0, 8, 8, 0]}>
                  {comparisonData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>

            <div className="mt-8 p-6 bg-primary/5 rounded-xl border border-primary/20">
              <div className="flex items-start gap-4">
                <AlertCircle size={24} className="text-primary flex-shrink-0 mt-1" />
                <div>
                  <p className="mb-2 text-lg">What this means</p>
                  <p className="text-muted-foreground leading-relaxed">
                    Your algorithm has learned you're interested in health topics and prioritizes this content. While this can be helpful, it may create an echo chamber that reinforces certain perspectives while filtering out others.
                  </p>
                </div>
              </div>
            </div>
          </Card>
        </motion.div>

        {/* Example Content - Better Card Design */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="mb-10"
        >
          <Card className="p-10">
            <h2 className="mb-3 text-3xl">Representative Content</h2>
            <p className="text-lg text-muted-foreground mb-10 leading-relaxed">
              Examples of health & wellness content frequently shown in your feed
            </p>

            <div className="grid gap-4">
              {examplePosts.map((post, i) => (
                <motion.div
                  key={i}
                  className="p-6 border border-border rounded-xl hover:border-primary/30 hover:shadow-md transition-all duration-300"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.4 + i * 0.1 }}
                >
                  <div className="flex items-start justify-between gap-6">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-3">
                        <span className="px-3 py-1 bg-secondary rounded-lg text-sm">
                          {post.type}
                        </span>
                        <span className="text-sm text-muted-foreground">
                          {post.source}
                        </span>
                      </div>
                      <p className="mb-2 text-lg">{post.title}</p>
                      <span className={`text-sm ${
                        post.engagement === 'High' ? 'text-primary' : 'text-muted-foreground'
                      }`}>
                        {post.engagement} Engagement
                      </span>
                    </div>
                    <div className="w-20 h-20 bg-gradient-to-br from-primary/20 to-accent/20 rounded-xl flex-shrink-0" />
                  </div>
                </motion.div>
              ))}
            </div>
          </Card>
        </motion.div>

        {/* Recommendations - Enhanced Visual */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          <Card className="p-10 bg-gradient-to-br from-accent/10 to-primary/10 border-accent/20">
            <h2 className="mb-6 text-3xl">Recommendations</h2>
            <p className="text-lg text-muted-foreground mb-8 leading-relaxed">
              Try exploring balanced sources about nutrition and fitness
            </p>

            <ul className="space-y-4 mb-10">
              <li className="flex items-start gap-4">
                <div className="w-6 h-6 rounded-full bg-accent/20 flex items-center justify-center flex-shrink-0 mt-1">
                  <ChevronRight size={14} className="text-accent" />
                </div>
                <p className="text-muted-foreground text-lg leading-relaxed">
                  Follow diverse health professionals with different approaches
                </p>
              </li>
              <li className="flex items-start gap-4">
                <div className="w-6 h-6 rounded-full bg-accent/20 flex items-center justify-center flex-shrink-0 mt-1">
                  <ChevronRight size={14} className="text-accent" />
                </div>
                <p className="text-muted-foreground text-lg leading-relaxed">
                  Balance wellness content with other interest areas
                </p>
              </li>
              <li className="flex items-start gap-4">
                <div className="w-6 h-6 rounded-full bg-accent/20 flex items-center justify-center flex-shrink-0 mt-1">
                  <ChevronRight size={14} className="text-accent" />
                </div>
                <p className="text-muted-foreground text-lg leading-relaxed">
                  Seek out evidence-based sources alongside lifestyle content
                </p>
              </li>
            </ul>

            <Button size="lg" onClick={() => onNavigate('dashboard')}>
              Back to Dashboard
            </Button>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}
