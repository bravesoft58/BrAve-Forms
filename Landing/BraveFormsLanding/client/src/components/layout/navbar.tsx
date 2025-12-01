import { Link } from 'wouter';
import { Button } from '@/components/ui/button';
import { Menu, X } from 'lucide-react';
import { useState } from 'react';
import logo from '@assets/logo_1764459900824.png';

export function Navbar() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <nav className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center justify-between mx-auto px-4">
        <Link
          href="/"
          className="flex items-center gap-2 font-heading font-bold text-2xl text-primary tracking-wide uppercase"
        >
          <img src={logo} alt="BrAve Forms" className="h-8 w-auto" />
          <span className="text-secondary">BrAve</span> Forms
        </Link>

        {/* Desktop Nav */}
        <div className="hidden md:flex items-center gap-8">
          <a
            href="#features"
            className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors"
          >
            Features
          </a>
          <a
            href="#how-it-works"
            className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors"
          >
            How it Works
          </a>
          <a
            href="#pricing"
            className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors"
          >
            Pricing
          </a>
          <a
            href="#faq"
            className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors"
          >
            FAQ
          </a>
        </div>

        <div className="hidden md:flex items-center gap-4">
          <Button className="font-bold uppercase tracking-wide bg-primary hover:bg-primary/90 text-white cursor-default">
            Coming Soon!
          </Button>
        </div>

        {/* Mobile Toggle */}
        <button className="md:hidden" onClick={() => setIsOpen(!isOpen)}>
          {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </div>

      {/* Mobile Menu */}
      {isOpen && (
        <div className="md:hidden border-t bg-background p-4 space-y-4">
          <a
            href="#features"
            className="block text-sm font-medium p-2 hover:bg-muted rounded"
            onClick={() => setIsOpen(false)}
          >
            Features
          </a>
          <a
            href="#how-it-works"
            className="block text-sm font-medium p-2 hover:bg-muted rounded"
            onClick={() => setIsOpen(false)}
          >
            How it Works
          </a>
          <a
            href="#pricing"
            className="block text-sm font-medium p-2 hover:bg-muted rounded"
            onClick={() => setIsOpen(false)}
          >
            Pricing
          </a>
          <div className="pt-4 border-t space-y-2">
            <Button className="w-full bg-primary hover:bg-primary/90 text-white font-bold uppercase cursor-default">
              Coming Soon!
            </Button>
          </div>
        </div>
      )}
    </nav>
  );
}
