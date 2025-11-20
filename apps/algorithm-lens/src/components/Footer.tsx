import { Link } from 'react-router-dom'

export default function Footer() {
  return (
    <footer className="border-t bg-background">
      <div className="container-content py-12 text-sm">
        <div className="max-w-[1280px] mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
          <div className="md:col-span-4 md:col-start-1 flex justify-center">
            <div style={{ maxWidth: '280px' }}>
              <h3 className="font-semibold mb-2 text-center">AlgorithmLens</h3>
              <p className="text-muted-foreground text-center">
                See your algorithm. Understand your feed. Built at MIT by students
                passionate about ethical AI and digital transparency.
              </p>
            </div>
          </div>

          <div className="md:col-span-4 md:col-start-5 flex justify-center">
            <div>
              <h4 className="font-semibold mb-2 text-center">Product</h4>
              <ul className="space-y-2 text-muted-foreground text-center">
                <li><Link to="/">Home</Link></li>
                <li><Link to="/dashboard">Dashboard</Link></li>
                <li><Link to="/pricing">Pricing</Link></li>
                <li><Link to="/how-it-works">How It Works</Link></li>
              </ul>
            </div>
          </div>

          <div className="md:col-span-4 md:col-start-9 flex justify-center">
            <div>
              <h4 className="font-semibold mb-2 text-center">Company</h4>
              <ul className="space-y-2 text-muted-foreground text-center">
                <li><Link to="/privacy-terms">Privacy & Terms</Link></li>
                <li><a href="mailto:support@algorithmlens.com">Contact</a></li>
              </ul>
            </div>
          </div>
        </div>
        </div>
      </div>
      <div className="text-center text-xs text-muted-foreground py-6 border-t">
        © 2025 AlgorithmLens. All rights reserved.
      </div>
    </footer>
  )
}
