import { Link } from "react-router-dom";

const Footer = () => {
  return (
    <footer className="relative bg-gray-100 dark:bg-surface pt-20 pb-10 px-4 transition-colors duration-300 font-sans z-10">
      {/* Top Gradient Border */}
      <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-primary/50 to-transparent"></div>

      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-16">
        
        {/* Column 1: Brand */}
        <div className="space-y-6">
          <div className="flex items-center gap-2">
            <h2 className="text-2xl font-serif font-bold text-primary">Raj Chavin</h2>
          </div>
          <p className="text-gray-600 dark:text-gray-400 text-sm leading-relaxed">
            Building legacies through a complete real estate ecosystem. From groundbreaking to handover.
          </p>
          <div className="flex gap-4">
            {['instagram', 'facebook-f', 'linkedin-in'].map((icon) => (
              <a key={icon} href="#" className="w-10 h-10 rounded-full bg-white dark:bg-white/5 flex items-center justify-center text-gray-600 dark:text-gray-400 hover:text-primary dark:hover:text-primary hover:shadow-md transition-all">
                <i className={`fab fa-${icon}`}></i>
              </a>
            ))}
          </div>
        </div>

        {/* Column 2: Quick Links */}
        <div>
          <h4 className="text-gray-900 dark:text-white font-serif font-bold text-lg mb-6">Quick Links</h4>
          <ul className="space-y-3">
            {['About Us', 'Leadership', 'Careers', 'Contact', 'Ecosystem'].map((item) => (
              <li key={item}>
                <Link to="#" className="text-gray-600 dark:text-gray-400 hover:text-primary dark:hover:text-primary transition text-sm">
                  {item}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        {/* Column 3: Services */}
        <div>
          <h4 className="text-gray-900 dark:text-white font-serif font-bold text-lg mb-6">Our Services</h4>
          <ul className="space-y-3">
            <li><Link to="#" className="text-gray-600 dark:text-gray-400 hover:text-primary dark:hover:text-primary transition text-sm">Plots & Farmlands</Link></li>
            <li><Link to="#" className="text-gray-600 dark:text-gray-400 hover:text-primary dark:hover:text-primary transition text-sm">Buy Property</Link></li>
            <li><Link to="#" className="text-gray-600 dark:text-gray-400 hover:text-primary dark:hover:text-primary transition text-sm">Sell Property</Link></li>
            <li><Link to="#" className="text-gray-600 dark:text-gray-400 hover:text-primary dark:hover:text-primary transition text-sm">Construction Materials</Link></li>
            <li><Link to="#" className="text-gray-600 dark:text-gray-400 hover:text-primary dark:hover:text-primary transition text-sm">Legal Services</Link></li>
          </ul>
        </div>

        {/* Column 4: Contact */}
        <div>
          <h4 className="text-gray-900 dark:text-white font-serif font-bold text-lg mb-6">Contact</h4>
          <ul className="space-y-4 text-sm text-gray-600 dark:text-gray-400">
            <li className="flex items-start gap-3">
              <i className="fas fa-map-marker-alt text-primary mt-1"></i>
              <span>#391, Basaveshwara Nagar,<br />Gadag, Karnataka</span>
            </li>
            <li className="flex items-center gap-3">
              <i className="fas fa-phone text-primary"></i>
              <span>+91 907 1188 118</span>
            </li>
            <li className="flex items-center gap-3">
              <i className="fas fa-envelope text-primary"></i>
              <span>contact@rajchavin.com</span>
            </li>
          </ul>
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="max-w-7xl mx-auto border-t border-gray-200 dark:border-white/10 pt-8 flex flex-col md:flex-row justify-between items-center text-sm text-gray-500 dark:text-gray-400">
        <p>© 2026 Raj Chavin Realty Group. All rights reserved.</p>
        <div className="flex gap-6 mt-4 md:mt-0">
          <Link to="#" className="hover:text-primary transition">Terms of Service</Link>
          <Link to="#" className="hover:text-primary transition">Privacy Policy</Link>
        </div>
      </div>
    </footer>
  );
};

export default Footer;