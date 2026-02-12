import { Link } from "react-router-dom";

const Footer = () => {
  return (
    <footer className="border-t bg-card py-12">
      <div className="container mx-auto px-4 lg:px-8">
        <div className="grid gap-8 md:grid-cols-4">
          {/* Brand */}
          <div className="md:col-span-1">
            <Link to="/" className="mb-3 flex items-center gap-2" title="UnityVault">
              <img
                src="/Unity Vault.png"
                alt="UnityVault"
                className="h-8 w-8 rounded-lg"
              />
              <span className="text-lg font-bold">
                <span className="bg-gradient-to-r from-blue-500 to-green-500 bg-clip-text text-transparent">
                  UnityVault
                </span>
              </span>
            </Link>
            <p className="text-sm text-muted-foreground">
              Smart savings & loans management for community groups.
            </p>
          </div>

          {/* Product */}
          <div>
            <h4 className="mb-3 text-sm font-semibold text-foreground">Product</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><a href="#features" className="transition-colors hover:text-foreground">Features</a></li>
              <li><a href="#how-it-works" className="transition-colors hover:text-foreground">How It Works</a></li>
              <li><a href="#pricing" className="transition-colors hover:text-foreground">Pricing</a></li>
            </ul>
          </div>

          {/* Support */}
          <div>
            <h4 className="mb-3 text-sm font-semibold text-foreground">Support</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>
                <Link to="/help" className="transition-colors hover:text-foreground">
                  Help Center
                </Link>
              </li>
              <li>
                <Link to="/contact" className="transition-colors hover:text-foreground">
                  Contact Us
                </Link>
              </li>
              <li>
                <Link to="/faq" className="transition-colors hover:text-foreground">
                  FAQs
                </Link>
              </li>
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h4 className="mb-3 text-sm font-semibold text-foreground">Legal</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>
                <Link to="/privacy" className="transition-colors hover:text-foreground">
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link to="/terms" className="transition-colors hover:text-foreground">
                  Terms of Service
                </Link>
              </li>
              <li>
                <Link to="/cookies" className="transition-colors hover:text-foreground">
                  Cookie Policy
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-10 border-t pt-6 text-center text-sm text-muted-foreground">
          © {new Date().getFullYear()} UnityVault. All rights reserved.
        </div>
      </div>
    </footer>
  );
};

export default Footer;
