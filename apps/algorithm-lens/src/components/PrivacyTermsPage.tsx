import { motion } from 'motion/react';
import { Shield, Lock, Eye, Ban, Database, Key } from 'lucide-react';
import { Card } from './ui/Card';

interface PrivacyTermsPageProps {
  onNavigate: (page: string) => void;
}

export function PrivacyTermsPage({ onNavigate }: PrivacyTermsPageProps) {
  const today = new Date().toLocaleDateString('en-US', { 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  });

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
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          {/* Header */}
          <div className="mb-16 text-center">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="inline-flex items-center justify-center w-20 h-20 rounded-2xl mb-8"
              style={{
                background: 'linear-gradient(135deg, #7B61FF 0%, #3ED6B2 100%)',
                boxShadow: '0 8px 24px rgba(123, 97, 255, 0.25)',
              }}
            >
              <Shield size={40} style={{ color: 'white' }} />
            </motion.div>
            <h1 
              style={{
                fontFamily: 'var(--font-headline)',
                fontSize: '48px',
                lineHeight: '1.2',
                fontWeight: 800,
                color: 'var(--foreground)',
                marginBottom: '12px',
                marginTop: 0,
                background: 'linear-gradient(90deg, #7B61FF 0%, #3ED6B2 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
              }}
            >
              Privacy & Terms
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
              Last updated: {today}
            </p>
          </div>

          {/* Summary */}
          <motion.section 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            style={{ marginBottom: '64px' }}
          >
            <Card 
              className="p-8 max-w-3xl mx-auto"
              style={{ 
                boxShadow: '0 4px 12px rgba(0, 0, 0, 0.05)', 
                borderRadius: '20px',
                background: 'white',
                border: '1px solid rgba(123, 97, 255, 0.1)',
              }}
            >
              <h2 
                style={{
                  fontFamily: 'var(--font-headline)',
                  fontSize: '32px',
                  lineHeight: '1.2',
                  fontWeight: 700,
                  color: 'var(--foreground)',
                  marginBottom: '16px',
                  textAlign: 'center',
                }}
              >
                Summary
              </h2>
              <p 
                style={{
                  fontSize: '16px',
                  lineHeight: '1.6',
                  color: 'var(--foreground-secondary)',
                  margin: 0,
                  textAlign: 'center',
                }}
              >
                AlgorithmLens aims to help you understand what your feeds show you. By default, your data stays on your device unless you explicitly choose to share it.
              </p>
            </Card>
          </motion.section>

          {/* Privacy */}
          <motion.section 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            style={{ marginBottom: '64px' }}
          >
            <h2 
              style={{
                fontFamily: 'var(--font-headline)',
                fontSize: '32px',
                lineHeight: '1.2',
                fontWeight: 700,
                color: 'var(--foreground)',
                marginBottom: '24px',
                textAlign: 'center',
              }}
            >
              Privacy
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto">
              <Card 
                className="p-6"
                style={{ 
                  boxShadow: '0 4px 12px rgba(0, 0, 0, 0.05)', 
                  borderRadius: '16px',
                  background: 'white',
                  border: '1px solid rgba(123, 97, 255, 0.1)',
                  transition: 'all 0.3s ease',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-4px)';
                  e.currentTarget.style.boxShadow = '0 8px 24px rgba(0, 0, 0, 0.08)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.05)';
                }}
              >
                <div className="flex flex-col items-center text-center gap-4">
                  <div 
                    className="w-12 h-12 rounded-xl flex items-center justify-center"
                    style={{ background: 'linear-gradient(135deg, rgba(62, 214, 178, 0.1) 0%, rgba(62, 214, 178, 0.2) 100%)' }}
                  >
                    <Database size={24} style={{ color: '#3ED6B2' }} />
                  </div>
                  <div className="w-full">
                    <h3 
                      style={{
                        fontFamily: 'var(--font-headline)',
                        fontSize: '18px',
                        lineHeight: '1.3',
                        fontWeight: 600,
                        color: 'var(--foreground)',
                        marginBottom: '8px',
                        marginTop: 0,
                      }}
                    >
                      Local processing
                    </h3>
                    <p 
                      style={{
                        fontSize: '15px',
                        lineHeight: '1.6',
                        color: 'var(--foreground-secondary)',
                        margin: 0,
                      }}
                    >
                      By default, analysis is designed to happen on your device or in your browser, though some features may require server processing.
                    </p>
                  </div>
                </div>
              </Card>

              <Card 
                className="p-6"
                style={{ 
                  boxShadow: '0 4px 12px rgba(0, 0, 0, 0.05)', 
                  borderRadius: '16px',
                  background: 'white',
                  border: '1px solid rgba(123, 97, 255, 0.1)',
                  transition: 'all 0.3s ease',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-4px)';
                  e.currentTarget.style.boxShadow = '0 8px 24px rgba(0, 0, 0, 0.08)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.05)';
                }}
              >
                <div className="flex flex-col items-center text-center gap-4">
                  <div 
                    className="w-12 h-12 rounded-xl flex items-center justify-center"
                    style={{ background: 'linear-gradient(135deg, rgba(123, 97, 255, 0.1) 0%, rgba(123, 97, 255, 0.2) 100%)' }}
                  >
                    <Eye size={24} style={{ color: '#7B61FF' }} />
                  </div>
                  <div className="w-full">
                    <h3 
                      style={{
                        fontFamily: 'var(--font-headline)',
                        fontSize: '18px',
                        lineHeight: '1.3',
                        fontWeight: 600,
                        color: 'var(--foreground)',
                        marginBottom: '8px',
                        marginTop: 0,
                      }}
                    >
                      Minimal data
                    </h3>
                    <p 
                      style={{
                        fontSize: '15px',
                        lineHeight: '1.6',
                        color: 'var(--foreground-secondary)',
                        margin: 0,
                      }}
                    >
                      If any data is sent to our servers (e.g., for optional features you enable), we aim to limit it to what's required to provide that feature.
                    </p>
                  </div>
                </div>
              </Card>

              <Card 
                className="p-6"
                style={{ 
                  boxShadow: '0 4px 12px rgba(0, 0, 0, 0.05)', 
                  borderRadius: '16px',
                  background: 'white',
                  border: '1px solid rgba(123, 97, 255, 0.1)',
                  transition: 'all 0.3s ease',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-4px)';
                  e.currentTarget.style.boxShadow = '0 8px 24px rgba(0, 0, 0, 0.08)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.05)';
                }}
              >
                <div className="flex flex-col items-center text-center gap-4">
                  <div 
                    className="w-12 h-12 rounded-xl flex items-center justify-center"
                    style={{ background: 'linear-gradient(135deg, rgba(239, 68, 68, 0.1) 0%, rgba(239, 68, 68, 0.2) 100%)' }}
                  >
                    <Ban size={24} style={{ color: '#ef4444' }} />
                  </div>
                  <div className="w-full">
                    <h3 
                      style={{
                        fontFamily: 'var(--font-headline)',
                        fontSize: '18px',
                        lineHeight: '1.3',
                        fontWeight: 600,
                        color: 'var(--foreground)',
                        marginBottom: '8px',
                        marginTop: 0,
                      }}
                    >
                      No selling data
                    </h3>
                    <p 
                      style={{
                        fontSize: '15px',
                        lineHeight: '1.6',
                        color: 'var(--foreground-secondary)',
                        margin: 0,
                      }}
                    >
                      We do not sell your personal data.
                    </p>
                  </div>
                </div>
              </Card>

              <Card 
                className="p-6"
                style={{ 
                  boxShadow: '0 4px 12px rgba(0, 0, 0, 0.05)', 
                  borderRadius: '16px',
                  background: 'white',
                  border: '1px solid rgba(123, 97, 255, 0.1)',
                  transition: 'all 0.3s ease',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-4px)';
                  e.currentTarget.style.boxShadow = '0 8px 24px rgba(0, 0, 0, 0.08)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.05)';
                }}
              >
                <div className="flex flex-col items-center text-center gap-4">
                  <div 
                    className="w-12 h-12 rounded-xl flex items-center justify-center"
                    style={{ background: 'linear-gradient(135deg, rgba(123, 97, 255, 0.1) 0%, rgba(123, 97, 255, 0.2) 100%)' }}
                  >
                    <Ban size={24} style={{ color: '#7B61FF' }} />
                  </div>
                  <div className="w-full">
                    <h3 
                      style={{
                        fontFamily: 'var(--font-headline)',
                        fontSize: '18px',
                        lineHeight: '1.3',
                        fontWeight: 600,
                        color: 'var(--foreground)',
                        marginBottom: '8px',
                        marginTop: 0,
                      }}
                    >
                      No third-party ads
                    </h3>
                    <p 
                      style={{
                        fontSize: '15px',
                        lineHeight: '1.6',
                        color: 'var(--foreground-secondary)',
                        margin: 0,
                      }}
                    >
                      We do not run targeted third-party advertising based on your data.
                    </p>
                  </div>
                </div>
              </Card>

              <Card 
                className="p-6"
                style={{ 
                  boxShadow: '0 4px 12px rgba(0, 0, 0, 0.05)', 
                  borderRadius: '16px',
                  background: 'white',
                  border: '1px solid rgba(123, 97, 255, 0.1)',
                  transition: 'all 0.3s ease',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-4px)';
                  e.currentTarget.style.boxShadow = '0 8px 24px rgba(0, 0, 0, 0.08)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.05)';
                }}
              >
                <div className="flex flex-col items-center text-center gap-4">
                  <div 
                    className="w-12 h-12 rounded-xl flex items-center justify-center"
                    style={{ background: 'linear-gradient(135deg, rgba(62, 214, 178, 0.1) 0%, rgba(62, 214, 178, 0.2) 100%)' }}
                  >
                    <Database size={24} style={{ color: '#3ED6B2' }} />
                  </div>
                  <div className="w-full">
                    <h3 
                      style={{
                        fontFamily: 'var(--font-headline)',
                        fontSize: '18px',
                        lineHeight: '1.3',
                        fontWeight: 600,
                        color: 'var(--foreground)',
                        marginBottom: '8px',
                        marginTop: 0,
                      }}
                    >
                      Retention
                    </h3>
                    <p 
                      style={{
                        fontSize: '15px',
                        lineHeight: '1.6',
                        color: 'var(--foreground-secondary)',
                        margin: 0,
                      }}
                    >
                      If you create an account, we typically store only what's needed for your account and billing. You can request deletion at any time, though some data may be retained as required by law or for legitimate business purposes.
                    </p>
                  </div>
                </div>
              </Card>

              <Card 
                className="p-6"
                style={{ 
                  boxShadow: '0 4px 12px rgba(0, 0, 0, 0.05)', 
                  borderRadius: '16px',
                  background: 'white',
                  border: '1px solid rgba(123, 97, 255, 0.1)',
                  transition: 'all 0.3s ease',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-4px)';
                  e.currentTarget.style.boxShadow = '0 8px 24px rgba(0, 0, 0, 0.08)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.05)';
                }}
              >
                <div className="flex flex-col items-center text-center gap-4">
                  <div 
                    className="w-12 h-12 rounded-xl flex items-center justify-center"
                    style={{ background: 'linear-gradient(135deg, rgba(123, 97, 255, 0.1) 0%, rgba(123, 97, 255, 0.2) 100%)' }}
                  >
                    <Lock size={24} style={{ color: '#7B61FF' }} />
                  </div>
                  <div className="w-full">
                    <h3 
                      style={{
                        fontFamily: 'var(--font-headline)',
                        fontSize: '18px',
                        lineHeight: '1.3',
                        fontWeight: 600,
                        color: 'var(--foreground)',
                        marginBottom: '8px',
                        marginTop: 0,
                      }}
                    >
                      Security
                    </h3>
                    <p 
                      style={{
                        fontSize: '15px',
                        lineHeight: '1.6',
                        color: 'var(--foreground-secondary)',
                        margin: 0,
                      }}
                    >
                      We use industry-standard security practices where possible. No method is perfect, and we cannot guarantee absolute security, but we work to protect your data.
                    </p>
                  </div>
                </div>
              </Card>

              <Card 
                className="p-6"
                style={{ 
                  boxShadow: '0 4px 12px rgba(0, 0, 0, 0.05)', 
                  borderRadius: '16px',
                  background: 'white',
                  border: '1px solid rgba(123, 97, 255, 0.1)',
                  transition: 'all 0.3s ease',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-4px)';
                  e.currentTarget.style.boxShadow = '0 8px 24px rgba(0, 0, 0, 0.08)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.05)';
                }}
              >
                <div className="flex flex-col items-center text-center gap-4">
                  <div 
                    className="w-12 h-12 rounded-xl flex items-center justify-center"
                    style={{ background: 'linear-gradient(135deg, rgba(62, 214, 178, 0.1) 0%, rgba(62, 214, 178, 0.2) 100%)' }}
                  >
                    <Key size={24} style={{ color: '#3ED6B2' }} />
                  </div>
                  <div className="w-full">
                    <h3 
                      style={{
                        fontFamily: 'var(--font-headline)',
                        fontSize: '18px',
                        lineHeight: '1.3',
                        fontWeight: 600,
                        color: 'var(--foreground)',
                        marginBottom: '8px',
                        marginTop: 0,
                      }}
                    >
                      Your choices
                    </h3>
                    <p 
                      style={{
                        fontSize: '15px',
                        lineHeight: '1.6',
                        color: 'var(--foreground-secondary)',
                        margin: 0,
                      }}
                    >
                      You can export or delete your data from settings where available. Some features may stop working after deletion, and deletion may not be immediate.
                    </p>
                  </div>
                </div>
              </Card>
            </div>
          </motion.section>

          {/* Terms of Use */}
          <motion.section 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            style={{ marginBottom: '64px' }}
          >
            <h2 
              style={{
                fontFamily: 'var(--font-headline)',
                fontSize: '32px',
                lineHeight: '1.2',
                fontWeight: 700,
                color: 'var(--foreground)',
                marginBottom: '24px',
                textAlign: 'center',
              }}
            >
              Terms of Use
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto">
              <Card 
                className="p-6"
                style={{ 
                  boxShadow: '0 4px 12px rgba(0, 0, 0, 0.05)', 
                  borderRadius: '16px',
                  background: 'white',
                  border: '1px solid rgba(123, 97, 255, 0.1)',
                  transition: 'all 0.3s ease',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-4px)';
                  e.currentTarget.style.boxShadow = '0 8px 24px rgba(0, 0, 0, 0.08)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.05)';
                }}
              >
                <div className="flex flex-col items-center text-center gap-4">
                  <div 
                    className="w-12 h-12 rounded-xl flex items-center justify-center"
                    style={{ background: 'linear-gradient(135deg, rgba(62, 214, 178, 0.1) 0%, rgba(62, 214, 178, 0.2) 100%)' }}
                  >
                    <Eye size={24} style={{ color: '#3ED6B2' }} />
                  </div>
                  <div className="w-full">
                    <h3 
                      style={{
                        fontFamily: 'var(--font-headline)',
                        fontSize: '18px',
                        lineHeight: '1.3',
                        fontWeight: 600,
                        color: 'var(--foreground)',
                        marginBottom: '8px',
                        marginTop: 0,
                      }}
                    >
                      Purpose
                    </h3>
                    <p 
                      style={{
                        fontSize: '15px',
                        lineHeight: '1.6',
                        color: 'var(--foreground-secondary)',
                        margin: 0,
                      }}
                    >
                      AlgorithmLens aims to provide analytics and educational insights about your content feeds. Results are estimates based on available data.
                    </p>
                  </div>
                </div>
              </Card>

              <Card 
                className="p-6"
                style={{ 
                  boxShadow: '0 4px 12px rgba(0, 0, 0, 0.05)', 
                  borderRadius: '16px',
                  background: 'white',
                  border: '1px solid rgba(123, 97, 255, 0.1)',
                  transition: 'all 0.3s ease',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-4px)';
                  e.currentTarget.style.boxShadow = '0 8px 24px rgba(0, 0, 0, 0.08)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.05)';
                }}
              >
                <div className="flex flex-col items-center text-center gap-4">
                  <div 
                    className="w-12 h-12 rounded-xl flex items-center justify-center"
                    style={{ background: 'linear-gradient(135deg, rgba(123, 97, 255, 0.1) 0%, rgba(123, 97, 255, 0.2) 100%)' }}
                  >
                    <Shield size={24} style={{ color: '#7B61FF' }} />
                  </div>
                  <div className="w-full">
                    <h3 
                      style={{
                        fontFamily: 'var(--font-headline)',
                        fontSize: '18px',
                        lineHeight: '1.3',
                        fontWeight: 600,
                        color: 'var(--foreground)',
                        marginBottom: '8px',
                        marginTop: 0,
                      }}
                    >
                      No guarantees
                    </h3>
                    <p 
                      style={{
                        fontSize: '15px',
                        lineHeight: '1.6',
                        color: 'var(--foreground-secondary)',
                        margin: 0,
                      }}
                    >
                      We try to be accurate, but insights are estimates based on available data and may not be complete or fully accurate. Use your own judgment and do not rely solely on these insights for important decisions.
                    </p>
                  </div>
                </div>
              </Card>

              <Card 
                className="p-6"
                style={{ 
                  boxShadow: '0 4px 12px rgba(0, 0, 0, 0.05)', 
                  borderRadius: '16px',
                  background: 'white',
                  border: '1px solid rgba(123, 97, 255, 0.1)',
                  transition: 'all 0.3s ease',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-4px)';
                  e.currentTarget.style.boxShadow = '0 8px 24px rgba(0, 0, 0, 0.08)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.05)';
                }}
              >
                <div className="flex flex-col items-center text-center gap-4">
                  <div 
                    className="w-12 h-12 rounded-xl flex items-center justify-center"
                    style={{ background: 'linear-gradient(135deg, rgba(239, 68, 68, 0.1) 0%, rgba(239, 68, 68, 0.2) 100%)' }}
                  >
                    <Ban size={24} style={{ color: '#ef4444' }} />
                  </div>
                  <div className="w-full">
                    <h3 
                      style={{
                        fontFamily: 'var(--font-headline)',
                        fontSize: '18px',
                        lineHeight: '1.3',
                        fontWeight: 600,
                        color: 'var(--foreground)',
                        marginBottom: '8px',
                        marginTop: 0,
                      }}
                    >
                      Acceptable use
                    </h3>
                    <p 
                      style={{
                        fontSize: '15px',
                        lineHeight: '1.6',
                        color: 'var(--foreground-secondary)',
                        margin: 0,
                      }}
                    >
                      Don't misuse the service, violate laws, or attempt to access other users' data.
                    </p>
                  </div>
                </div>
              </Card>

              <Card 
                className="p-6"
                style={{ 
                  boxShadow: '0 4px 12px rgba(0, 0, 0, 0.05)', 
                  borderRadius: '16px',
                  background: 'white',
                  border: '1px solid rgba(123, 97, 255, 0.1)',
                  transition: 'all 0.3s ease',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-4px)';
                  e.currentTarget.style.boxShadow = '0 8px 24px rgba(0, 0, 0, 0.08)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.05)';
                }}
              >
                <div className="flex flex-col items-center text-center gap-4">
                  <div 
                    className="w-12 h-12 rounded-xl flex items-center justify-center"
                    style={{ background: 'linear-gradient(135deg, rgba(123, 97, 255, 0.1) 0%, rgba(123, 97, 255, 0.2) 100%)' }}
                  >
                    <Key size={24} style={{ color: '#7B61FF' }} />
                  </div>
                  <div className="w-full">
                    <h3 
                      style={{
                        fontFamily: 'var(--font-headline)',
                        fontSize: '18px',
                        lineHeight: '1.3',
                        fontWeight: 600,
                        color: 'var(--foreground)',
                        marginBottom: '8px',
                        marginTop: 0,
                      }}
                    >
                      Account
                    </h3>
                    <p 
                      style={{
                        fontSize: '15px',
                        lineHeight: '1.6',
                        color: 'var(--foreground-secondary)',
                        margin: 0,
                      }}
                    >
                      You're responsible for your account and keeping your credentials secure.
                    </p>
                  </div>
                </div>
              </Card>

              <Card 
                className="p-6"
                style={{ 
                  boxShadow: '0 4px 12px rgba(0, 0, 0, 0.05)', 
                  borderRadius: '16px',
                  background: 'white',
                  border: '1px solid rgba(123, 97, 255, 0.1)',
                  transition: 'all 0.3s ease',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-4px)';
                  e.currentTarget.style.boxShadow = '0 8px 24px rgba(0, 0, 0, 0.08)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.05)';
                }}
              >
                <div className="flex flex-col items-center text-center gap-4">
                  <div 
                    className="w-12 h-12 rounded-xl flex items-center justify-center"
                    style={{ background: 'linear-gradient(135deg, rgba(62, 214, 178, 0.1) 0%, rgba(62, 214, 178, 0.2) 100%)' }}
                  >
                    <Database size={24} style={{ color: '#3ED6B2' }} />
                  </div>
                  <div className="w-full">
                    <h3 
                      style={{
                        fontFamily: 'var(--font-headline)',
                        fontSize: '18px',
                        lineHeight: '1.3',
                        fontWeight: 600,
                        color: 'var(--foreground)',
                        marginBottom: '8px',
                        marginTop: 0,
                      }}
                    >
                      Changes
                    </h3>
                    <p 
                      style={{
                        fontSize: '15px',
                        lineHeight: '1.6',
                        color: 'var(--foreground-secondary)',
                        margin: 0,
                      }}
                    >
                      We may update the service or these terms at any time. We'll post updates here and update the date above. Continued use of the service after changes constitutes acceptance of the new terms.
                    </p>
                  </div>
                </div>
              </Card>

              <Card 
                className="p-6"
                style={{ 
                  boxShadow: '0 4px 12px rgba(0, 0, 0, 0.05)', 
                  borderRadius: '16px',
                  background: 'white',
                  border: '1px solid rgba(123, 97, 255, 0.1)',
                  transition: 'all 0.3s ease',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-4px)';
                  e.currentTarget.style.boxShadow = '0 8px 24px rgba(0, 0, 0, 0.08)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.05)';
                }}
              >
                <div className="flex flex-col items-center text-center gap-4">
                  <div 
                    className="w-12 h-12 rounded-xl flex items-center justify-center"
                    style={{ background: 'linear-gradient(135deg, rgba(123, 97, 255, 0.1) 0%, rgba(123, 97, 255, 0.2) 100%)' }}
                  >
                    <Shield size={24} style={{ color: '#7B61FF' }} />
                  </div>
                  <div className="w-full">
                    <h3 
                      style={{
                        fontFamily: 'var(--font-headline)',
                        fontSize: '18px',
                        lineHeight: '1.3',
                        fontWeight: 600,
                        color: 'var(--foreground)',
                        marginBottom: '8px',
                        marginTop: 0,
                      }}
                    >
                      Liability
                    </h3>
                    <p 
                      style={{
                        fontSize: '15px',
                        lineHeight: '1.6',
                        color: 'var(--foreground-secondary)',
                        margin: 0,
                      }}
                    >
                      To the maximum extent allowed by law, AlgorithmLens isn't liable for indirect or consequential damages.
                    </p>
                  </div>
                </div>
              </Card>
            </div>
          </motion.section>

        </motion.div>
      </div>
    </div>
  );
}
