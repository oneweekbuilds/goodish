import { motion } from 'motion/react';
import { AlertCircle, Home, ArrowLeft } from 'lucide-react';
import { Button } from '../../../components/ui/Button';
import { Card } from '../../../components/ui/Card';

interface ErrorPageProps {
  onNavigate: (page: string) => void;
}

export function ErrorPage({ onNavigate }: ErrorPageProps) {
  return (
    <div className="min-h-screen flex items-center justify-center px-6 py-12">
      <motion.div
        className="text-center max-w-lg"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div className="inline-flex items-center justify-center w-24 h-24 rounded-2xl bg-destructive/10 mb-10">
          <AlertCircle size={48} className="text-destructive" />
        </div>

        <h1 className="text-8xl tracking-tight mb-6">404</h1>
        <h2 className="text-3xl tracking-tight mb-6">Page Not Found</h2>
        
        <p className="text-lg text-muted-foreground mb-10 leading-relaxed">
          The page you're looking for doesn't exist or has been moved. Let's get you back on track.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
          <Button onClick={() => window.history.back()} variant="outline" size="lg">
            <ArrowLeft size={20} className="mr-2" />
            Go Back
          </Button>
          <Button onClick={() => onNavigate('landing')} size="lg">
            <Home size={20} className="mr-2" />
            Back to Home
          </Button>
        </div>

        <Card className="p-8 bg-secondary/50">
          <p className="text-sm text-muted-foreground mb-4">Need help?</p>
          <div className="flex flex-wrap gap-3 justify-center">
            <button
              onClick={() => onNavigate('about')}
              className="text-sm text-primary hover:underline"
            >
              How It Works
            </button>
            <span className="text-muted-foreground">•</span>
            <button
              onClick={() => onNavigate('dashboard')}
              className="text-sm text-primary hover:underline"
            >
              Dashboard
            </button>
            <span className="text-muted-foreground">•</span>
            <button className="text-sm text-primary hover:underline">
              Contact Support
            </button>
          </div>
        </Card>
      </motion.div>
    </div>
  );
}




