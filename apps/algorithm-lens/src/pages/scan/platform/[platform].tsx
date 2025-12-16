import { useState, useCallback, useEffect } from 'react';
import { motion } from 'motion/react';
import { 
  ArrowLeft, 
  Chrome, 
  Smartphone, 
  Upload, 
  Monitor, 
  CheckCircle, 
  AlertCircle,
  ExternalLink,
  FileVideo
} from 'lucide-react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card } from '../../../components/ui/Card';
import { Button } from '../../../components/ui/Button';
import { PlatformIcon } from '../../../components/PlatformBadge';
import { PLATFORM_CONFIGS, SUPPORTED_PLATFORMS, uploadScan } from '../../../lib/scanApi';

// Detect if extension is installed
const useExtensionDetection = () => {
  const [hasExtension, setHasExtension] = useState<boolean | null>(null);

  useEffect(() => {
    const checkExtension = () => {
      // Method 1: Check for extension-injected element
      const extensionMarker = document.getElementById('alg-extension-marker');
      if (extensionMarker) {
        setHasExtension(true);
        return;
      }

      // Method 2: Try to ping the extension (if available)
      try {
        if (typeof chrome !== 'undefined' && chrome.runtime) {
          setHasExtension(true);
          return;
        }
      } catch {
        // Extension not available
      }

      // Default: assume no extension on mobile, maybe on desktop
      const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
        navigator.userAgent
      );
      setHasExtension(!isMobile ? null : false);
    };

    checkExtension();
  }, []);

  return hasExtension;
};

// Check if running on desktop
const isDesktop = () => {
  return !/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
    navigator.userAgent
  );
};

export default function PlatformScanPage() {
  const { platform } = useParams<{ platform: string }>();
  const navigate = useNavigate();
  const hasExtension = useExtensionDetection();

  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dragActive, setDragActive] = useState(false);

  const config = platform ? PLATFORM_CONFIGS[platform] : null;
  const isSupported = platform ? SUPPORTED_PLATFORMS.includes(platform) : false;
  const isDisabled = config?.disabled || false;

  // Handle drag events
  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  }, []);

  // Handle drop
  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const droppedFile = e.dataTransfer.files[0];
      if (droppedFile.type.startsWith('video/')) {
        setFile(droppedFile);
        setError(null);
      } else {
        setError('Please upload a video file (MP4, MOV, etc.)');
      }
    }
  }, []);

  // Handle file selection
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      if (selectedFile.type.startsWith('video/')) {
        setFile(selectedFile);
        setError(null);
      } else {
        setError('Please upload a video file (MP4, MOV, etc.)');
      }
    }
  };

  // Handle upload
  const handleUpload = async () => {
    if (!file || !platform) return;

    setUploading(true);
    setError(null);

    try {
      const result = await uploadScan(file, platform);
      // Store result in sessionStorage for processing page
      sessionStorage.setItem('pendingScanResult', JSON.stringify(result));
      sessionStorage.setItem('pendingScanPlatform', platform);
      navigate('/scan/processing');
    } catch (err) {
      console.error('Upload error:', err);
      setError(err instanceof Error ? err.message : 'Upload failed. Please try again.');
      setUploading(false);
    }
  };

  // Show disabled state for Facebook
  if (isDisabled) {
    return (
      <div className="min-h-screen px-6 pt-32 pb-16" style={{ backgroundColor: '#fdfaf4' }}>
        <div className="max-w-2xl mx-auto">
          <button
            onClick={() => navigate('/start')}
            className="flex items-center gap-2 text-slate-600 hover:text-slate-900 mb-8 transition-colors"
          >
            <ArrowLeft size={20} />
            <span>Back to platforms</span>
          </button>

          <Card
            className="p-12 text-center bg-white"
            style={{ borderRadius: '24px' }}
          >
            <div
              className="w-24 h-24 mx-auto mb-6 rounded-3xl flex items-center justify-center opacity-50"
              style={{
                backgroundColor: config?.bgColor || '#F3F4F6',
                color: config?.color || '#6B7280',
              }}
            >
              <PlatformIcon platform={platform || ''} className="w-12 h-12" />
            </div>

            <h1 className="text-3xl font-bold text-slate-400 mb-4">
              {config?.name || 'Platform'} Scanning
            </h1>

            <div className="inline-flex items-center gap-2 px-4 py-2 bg-amber-50 text-amber-700 rounded-full mb-6">
              <AlertCircle size={18} />
              <span className="font-medium">Coming Soon</span>
            </div>

            <p className="text-slate-500 mb-8 max-w-md mx-auto">
              Facebook scanning is currently in development and will be available soon.
              We're working hard to bring you comprehensive feed analysis for this platform.
            </p>

            <Button
              onClick={() => navigate('/start')}
              className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-xl"
            >
              Choose Another Platform
            </Button>
          </Card>
        </div>
      </div>
    );
  }

  // Show error for unsupported platforms
  if (!isSupported && platform !== 'facebook') {
    return (
      <div className="min-h-screen px-6 pt-32 pb-16" style={{ backgroundColor: '#fdfaf4' }}>
        <div className="max-w-2xl mx-auto text-center">
          <AlertCircle size={64} className="mx-auto text-red-500 mb-6" />
          <h1 className="text-3xl font-bold text-slate-900 mb-4">Platform Not Found</h1>
          <p className="text-slate-600 mb-8">
            The platform "{platform}" is not currently supported.
          </p>
          <Button
            onClick={() => navigate('/start')}
            className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-xl"
          >
            Choose a Platform
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen px-6 pt-32 pb-16" style={{ backgroundColor: '#fdfaf4' }}>
      <div className="max-w-4xl mx-auto">
        {/* Back button */}
        <motion.button
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          onClick={() => navigate('/start')}
          className="flex items-center gap-2 text-slate-600 hover:text-slate-900 mb-8 transition-colors"
        >
          <ArrowLeft size={20} />
          <span>Back to platforms</span>
        </motion.button>

        {/* Platform Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-6 mb-10"
        >
          <div
            className="w-20 h-20 rounded-2xl flex items-center justify-center shadow-lg"
            style={{
              backgroundColor: config?.bgColor || '#F3F4F6',
              color: config?.color || '#374151',
            }}
          >
            <PlatformIcon platform={platform || ''} className="w-10 h-10" />
          </div>
          <div>
            <h1 className="text-4xl font-bold text-slate-900">
              Scan {config?.name || 'Your Feed'}
            </h1>
            <p className="text-slate-600 mt-1">
              Choose how you'd like to capture your {config?.name} feed
            </p>
          </div>
        </motion.div>

        {/* Scan Method Cards */}
        <div className="grid md:grid-cols-2 gap-6 mb-8">
          {/* Desktop Extension Card */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <Card
              className="h-full p-8 relative overflow-hidden bg-white"
              style={{
                borderRadius: '24px',
                border: isDesktop() ? '2px solid #E5E7EB' : '2px solid #F3F4F6',
              }}
            >
              {/* Desktop only badge */}
              <div className="absolute top-4 right-4">
                <span className="inline-flex items-center gap-1 px-3 py-1 bg-slate-100 text-slate-600 rounded-full text-xs font-medium">
                  <Monitor size={12} />
                  Desktop Only
                </span>
              </div>

              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center">
                  <Chrome size={24} />
                </div>
                <h3 className="text-xl font-bold text-slate-900">Scan with Chrome Extension</h3>
              </div>

              <p className="text-slate-600 mb-6">
                Use our browser extension to capture your feed in real-time while you browse.
                Best for desktop users.
              </p>

              {/* Extension Status */}
              {isDesktop() && (
                <div className="mb-6">
                  {hasExtension === true ? (
                    <div className="flex items-center gap-2 text-green-600 text-sm">
                      <CheckCircle size={16} />
                      <span>Extension detected</span>
                    </div>
                  ) : hasExtension === false ? (
                    <div className="flex items-center gap-2 text-amber-600 text-sm">
                      <AlertCircle size={16} />
                      <span>Extension not detected</span>
                    </div>
                  ) : null}
                </div>
              )}

              {/* Instructions */}
              <div className="space-y-3 mb-6">
                <h4 className="text-sm font-semibold text-slate-500 uppercase tracking-wider">
                  How to scan:
                </h4>
                <ol className="space-y-2 text-sm text-slate-600">
                  <li className="flex items-start gap-2">
                    <span className="flex-shrink-0 w-5 h-5 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-xs font-medium">
                      1
                    </span>
                    <span>Open the AlgorithmLens extension</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="flex-shrink-0 w-5 h-5 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-xs font-medium">
                      2
                    </span>
                    <span>Click "Start Scan"</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="flex-shrink-0 w-5 h-5 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-xs font-medium">
                      3
                    </span>
                    <span>Scroll your feed for 20-30 seconds</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="flex-shrink-0 w-5 h-5 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-xs font-medium">
                      4
                    </span>
                    <span>Click "Stop Scan"</span>
                  </li>
                </ol>
              </div>

              {isDesktop() ? (
                <a
                  href="https://chrome.google.com/webstore"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-semibold transition-colors"
                >
                  {hasExtension ? 'Open Extension' : 'Install the AlgorithmLens Chrome Extension'}
                  <ExternalLink size={18} />
                </a>
              ) : (
                <Button
                  disabled
                  className="opacity-50 cursor-not-allowed bg-slate-200 text-slate-500 px-6 py-3 rounded-xl"
                >
                  Desktop Only
                </Button>
              )}
            </Card>
          </motion.div>

          {/* Mobile Upload Card */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <Card
              className="h-full p-8 bg-white relative"
              style={{
                borderRadius: '24px',
                border: '2px solid #E5E7EB',
              }}
            >
              {/* Mobile badge */}
              <div className="absolute top-4 right-4">
                <span className="inline-flex items-center gap-1 px-3 py-1 bg-emerald-100 text-emerald-600 rounded-full text-xs font-medium">
                  <Smartphone size={12} />
                  Mobile Friendly
                </span>
              </div>

              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 rounded-xl bg-emerald-100 text-emerald-600 flex items-center justify-center">
                  <Upload size={24} />
                </div>
                <h3 className="text-xl font-bold text-slate-900">Upload Mobile Recording</h3>
              </div>

              <p className="text-slate-600 mb-6">
                Record your feed on your phone and upload the video for analysis.
                Works on any device.
              </p>

              {/* Instructions */}
              <div className="space-y-3 mb-6">
                <h4 className="text-sm font-semibold text-slate-500 uppercase tracking-wider">
                  How to record:
                </h4>
                <ol className="space-y-2 text-sm text-slate-600">
                  <li className="flex items-start gap-2">
                    <span className="flex-shrink-0 w-5 h-5 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center text-xs font-medium">
                      1
                    </span>
                    <span>Open {config?.name} on your phone</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="flex-shrink-0 w-5 h-5 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center text-xs font-medium">
                      2
                    </span>
                    <span>Start screen recording</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="flex-shrink-0 w-5 h-5 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center text-xs font-medium">
                      3
                    </span>
                    <span>Scroll through your feed for 30-60 seconds</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="flex-shrink-0 w-5 h-5 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center text-xs font-medium">
                      4
                    </span>
                    <span>Stop recording and upload below</span>
                  </li>
                </ol>
              </div>

              {/* Upload Zone */}
              <div
                className={`relative border-2 border-dashed rounded-xl p-6 text-center transition-all ${
                  dragActive
                    ? 'border-blue-500 bg-blue-50'
                    : file
                    ? 'border-green-500 bg-green-50'
                    : 'border-slate-300 hover:border-blue-400 hover:bg-slate-50'
                }`}
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
              >
                <input
                  type="file"
                  accept="video/*,.mp4,.mov"
                  onChange={handleFileChange}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  disabled={uploading}
                />

                {file ? (
                  <div className="flex items-center justify-center gap-3">
                    <FileVideo size={24} className="text-green-600" />
                    <div className="text-left">
                      <p className="font-medium text-green-700 truncate max-w-[200px]">
                        {file.name}
                      </p>
                      <p className="text-sm text-green-600">
                        {(file.size / (1024 * 1024)).toFixed(2)} MB
                      </p>
                    </div>
                    <CheckCircle size={20} className="text-green-600" />
                  </div>
                ) : (
                  <div>
                    <Upload size={32} className="mx-auto text-slate-400 mb-2" />
                    <p className="text-slate-600 font-medium">
                      Drop video here or click to browse
                    </p>
                    <p className="text-sm text-slate-400 mt-1">MP4, MOV up to 500MB</p>
                  </div>
                )}
              </div>

              {/* Error message */}
              {error && (
                <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-red-600 text-sm">{error}</p>
                </div>
              )}

              {/* Upload button */}
              <Button
                onClick={handleUpload}
                disabled={!file || uploading}
                className={`w-full mt-4 py-3 rounded-xl font-semibold transition-all ${
                  !file || uploading
                    ? 'bg-slate-200 text-slate-500 cursor-not-allowed'
                    : 'bg-blue-600 hover:bg-blue-700 text-white'
                }`}
              >
                {uploading ? (
                  <span className="flex items-center justify-center gap-2">
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Uploading...
                  </span>
                ) : (
                  <span className="flex items-center justify-center gap-2">
                    <Upload size={20} />
                    Upload & Analyze
                  </span>
                )}
              </Button>
            </Card>
          </motion.div>
        </div>

        {/* Privacy Note */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="text-center text-sm text-slate-500"
        >
          <p>
            🔒 Your recordings are processed securely. Video files are deleted after analysis.
          </p>
        </motion.div>
      </div>
    </div>
  );
}
