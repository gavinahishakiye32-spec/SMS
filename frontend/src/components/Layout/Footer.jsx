import { BookOpen, Mail, MessageCircle } from 'lucide-react';

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="relative bg-gradient-to-r from-blue-600 via-indigo-700 to-purple-800 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 text-white mt-auto">
      
      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          
          {/* Brand & Links */}
          <div className="flex flex-col sm:flex-row gap-6">
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <BookOpen className="w-6 h-6" />
                <h3 className="font-semibold text-base">School Management</h3>
              </div>
              <p className="text-sm text-blue-100 dark:text-gray-300">
                Streamlining education management
              </p>
            </div>
          </div>

          {/* Contact */}
          <div className="space-y-3">
            <h4 className="font-semibold text-base">Contact</h4>
            <div className="flex flex-col sm:flex-row flex-wrap gap-3">
              <a href="mailto:gavinahishakiye32@gmail.com" 
                 className="inline-flex items-center gap-2 text-sm text-blue-100 dark:text-gray-300 hover:text-white transition-colors break-all">
                <Mail className="w-5 h-5 shrink-0" />
                gavinahishakiye32@gmail.com
              </a>
              
              <a href="https://wa.me/256779603281" target="_blank" rel="noopener noreferrer"
                 className="inline-flex items-center gap-2 text-sm text-blue-100 dark:text-gray-300 hover:text-white transition-colors">
                <MessageCircle className="w-5 h-5 shrink-0" />
                +256779603281
              </a>
              
              <a href="https://wa.me/250795868642" target="_blank" rel="noopener noreferrer"
                 className="inline-flex items-center gap-2 text-sm text-blue-100 dark:text-gray-300 hover:text-white transition-colors">
                <MessageCircle className="w-5 h-5 shrink-0" />
                +250795868642
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom */}
      <div className="border-t border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <p className="text-sm text-center text-blue-100 dark:text-gray-400">
            &copy; {currentYear} School Management System. All rights reserved.
          </p>
        </div>
      </div>

      {/* Accent Line */}
      <div className="h-0.5 bg-gradient-to-r from-blue-400 via-purple-500 to-pink-500"></div>
    </footer>
  );
}
