import logo from '@assets/logo_1764459900824.png';
import { Facebook, Twitter, Instagram, Linkedin } from 'lucide-react';

export function Footer() {
  return (
    <footer className="bg-secondary text-white pt-16 pb-8">
      <div className="container mx-auto px-4">
        <div className="grid md:grid-cols-4 gap-12 mb-12">
          <div className="col-span-1 md:col-span-2 space-y-4">
            <div className="flex items-center gap-2 font-heading font-bold text-2xl tracking-wide uppercase">
              <img src={logo} alt="BrAve Forms" className="h-8 w-auto brightness-0 invert" />
              <span>BrAve Forms</span>
            </div>
            <p className="text-blue-200 max-w-xs">
              The mobile-first construction forms platform that gets you out of the trailer and back
              to managing your crew.
            </p>
            <div className="flex gap-4 pt-4">
              <a href="#" className="text-blue-200 hover:text-white transition-colors">
                <Facebook className="h-5 w-5" />
              </a>
              <a href="#" className="text-blue-200 hover:text-white transition-colors">
                <Twitter className="h-5 w-5" />
              </a>
              <a href="#" className="text-blue-200 hover:text-white transition-colors">
                <Instagram className="h-5 w-5" />
              </a>
              <a href="#" className="text-blue-200 hover:text-white transition-colors">
                <Linkedin className="h-5 w-5" />
              </a>
            </div>
          </div>

          <div>
            <h4 className="font-bold uppercase mb-4 text-blue-100">Product</h4>
            <ul className="space-y-2 text-sm text-blue-200">
              <li>
                <a href="#" className="hover:text-white">
                  Features
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-white">
                  Pricing
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-white">
                  Templates
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-white">
                  Inspector Portal
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-white">
                  Compliance
                </a>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="font-bold uppercase mb-4 text-blue-100">Company</h4>
            <ul className="space-y-2 text-sm text-blue-200">
              <li>
                <a href="#" className="hover:text-white">
                  About Us
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-white">
                  Contact
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-white">
                  Privacy Policy
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-white">
                  Terms of Service
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-blue-800 pt-8 text-center text-sm text-blue-400">
          <p>&copy; {new Date().getFullYear()} BrAve Forms. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}
