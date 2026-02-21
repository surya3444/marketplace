import { Link } from "react-router-dom";

const Footer = () => {
  const ecosystemItems = [
    { 
      icon: "fa-map-marked-alt", 
      title: "Layouts & Farmlands", 
      desc: "Premium plotted develop + verified agricultural holdings.",
      color: "text-emerald-400",
      bg: "bg-emerald-400/10"
    },
    { 
      icon: "fa-city", 
      title: "Real Estate", 
      desc: "Buy, sell, lease & investment-grade properties with compliance.",
      color: "text-blue-400",
      bg: "bg-blue-400/10"
    },
    { 
      icon: "fa-cloud", 
      title: "Raas™", 
      desc: "20/3 Estate-as-a-Service platform for developers & builders.",
      color: "text-sky-400",
      bg: "bg-sky-400/10"
    },
    { 
      icon: "fa-drafting-compass", 
      title: "Design & Construction", 
      desc: "2D/3D design, turnkey execution, renovations & interiors.",
      color: "text-purple-400",
      bg: "bg-purple-400/10"
    },
    { 
      icon: "fa-file-contract", 
      title: "Legals & Loans", 
      desc: "Title verification, registration, home loans, LAP & approvals.",
      color: "text-yellow-400",
      bg: "bg-yellow-400/10"
    },
  ];

  return (
    <footer className="relative bg-gray-50 dark:bg-[#0f172a] pt-16 pb-10 px-4 transition-colors duration-300 font-sans z-10 border-t border-gray-200 dark:border-white/5">
      
      <div className="max-w-7xl mx-auto">
        
        {/* --- SECTION 1: OUR ECOSYSTEM CARDS --- */}
        <div className="mb-16">
          <h4 className="text-2xl font-serif font-bold text-slate-900 dark:text-white mb-8 text-center">Our Ecosystem</h4>
          
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-6">
            {ecosystemItems.map((item, idx) => (
              <div 
                key={idx} 
                className="bg-white dark:bg-[#1e293b] p-6 rounded-2xl shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 border border-gray-100 dark:border-white/5 group flex flex-col items-center text-center h-full"
              >
                {/* Icon Circle */}
                <div className={`w-14 h-14 rounded-full ${item.bg} ${item.color} flex items-center justify-center text-2xl mb-4 group-hover:scale-110 transition-transform`}>
                  <i className={`fas ${item.icon}`}></i>
                </div>
                
                {/* Text */}
                <h5 className="font-bold text-slate-900 dark:text-white mb-2 text-sm">{item.title}</h5>
                <p className="text-gray-500 dark:text-gray-400 text-xs leading-relaxed">
                  {item.desc}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Divider */}
        <div className="h-px w-full bg-gray-200 dark:bg-white/10 mb-12"></div>

        {/* --- SECTION 2: BRAND & CONTACT --- */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 mb-12">
          
          {/* Brand Info */}
          <div className="space-y-6">
            <div className="flex items-center gap-3">
               <div className="bg-slate-900 p-2 rounded-lg">
                 <img src="/logo.png" alt="Logo" className="h-10 w-auto" />
               </div>
               
            </div>
            <p className="text-gray-600 dark:text-gray-400 text-sm leading-relaxed max-w-md">
              Rajchavin Marketplace powers a complete real estate ecosystem — connecting land, legal services, design, construction, and verified vendors through one system, ensuring transparency, coordination, and seamless delivery from planning to handover.
            </p>
            
            {/* Social Icons */}
            <div className="flex gap-4">
              {['instagram', 'facebook-f', 'linkedin-in', 'twitter'].map((icon) => (
                <a key={icon} href="#" className="w-10 h-10 rounded-full bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 flex items-center justify-center text-gray-500 dark:text-gray-400 hover:bg-primary hover:text-white hover:border-primary transition-all">
                  <i className={`fab fa-${icon}`}></i>
                </a>
              ))}
            </div>
          </div>

          {/* Contact Details (Aligned Right on Desktop) */}
          <div className="lg:text-right flex flex-col lg:items-end">
            <h4 className="text-slate-900 dark:text-white font-serif font-bold text-lg mb-6">Contact Us</h4>
            <ul className="space-y-4 text-sm text-gray-600 dark:text-gray-400">
              <li className="flex items-start gap-3 lg:flex-row-reverse lg:text-right">
                <div className="min-w-[20px] pt-1 text-primary"><i className="fas fa-map-marker-alt"></i></div>
                <span>
                  RAJCHAVIN REALTY RETREAT LLP<br/>
                  Shop No. 1, Survey No. 391, Basaveshwar Nagar,<br/>
                  Gadag – 582101, Karnataka, India
                </span>
              </li>
              <li className="flex items-center gap-3 lg:flex-row-reverse">
                <div className="min-w-[20px] text-primary"><i className="fas fa-phone"></i></div>
                <span className="font-mono font-bold">+91 907 1188 118</span>
              </li>
              <li className="flex items-center gap-3 lg:flex-row-reverse">
                <div className="min-w-[20px] text-primary"><i className="fas fa-envelope"></i></div>
                <span>contact@rajchavin.com</span>
              </li>
            </ul>
          </div>
        </div>

        {/* --- BOTTOM BAR --- */}
        <div className="border-t border-gray-200 dark:border-white/10 pt-8 flex flex-col md:flex-row justify-between items-center text-xs text-gray-500 dark:text-gray-500">
          <p>© {new Date().getFullYear()} Raj Chavin Realty Group. All rights reserved.</p>
          <div className="flex gap-6 mt-4 md:mt-0 font-medium">
            <Link to="#" className="hover:text-primary transition">Terms of Service</Link>
            <Link to="#" className="hover:text-primary transition">Privacy Policy</Link>
            <Link to="#" className="hover:text-primary transition">Sitemap</Link>
          </div>
        </div>

      </div>
    </footer>
  );
};

export default Footer;