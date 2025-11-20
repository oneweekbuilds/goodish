import { Link } from 'react-router-dom'

export default function Footer() {
  return (
    <footer className="border-t bg-background">
      <div className="max-w-[1200px] mx-auto px-4 md:px-6 py-12 grid md:grid-cols-3 gap-8 text-sm">
        <div>
          <h3 className="font-semibold mb-2">AlgorithmLens</h3>
          <p className="text-muted-foreground">
            See your algorithm. Understand your feed. Built at MIT by students
            passionate about ethical AI and digital transparency.
          </p>
        </div>

        <div>
          <h4 className="font-semibold mb-2">Product</h4>
          <ul className="space-y-2 text-muted-foreground">
            <li><Link to="/">Home</Link></li>
            <li><Link to="/dashboard">Dashboard</Link></li>
            <li><Link to="/pricing">Pricing</Link></li>
            <li><Link to="/how-it-works">How It Works</Link></li>
          </ul>
        </div>

        <div>
          <h4 className="font-semibold mb-2">Company</h4>
          <ul className="space-y-2 text-muted-foreground">
            <li><Link to="/privacy-terms">Privacy & Terms</Link></li>
            <li><a href="mailto:support@algorithmlens.com">Contact</a></li>
          </ul>
        </div>
      </div>
      <div className="text-center text-xs text-muted-foreground py-6 border-t">
        © 2025 AlgorithmLens. All rights reserved.
      </div>
    </footer>
  )
}










