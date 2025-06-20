import Link from 'next/link';
import { useRouter } from 'next/router';

export default function Navbar() {
  const router = useRouter();

  return (
    <nav className="bg-white shadow-sm border-b border-gray-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <Link href="/" className="flex items-center space-x-2">
              <span className="text-2xl font-bold bg-gradient-to-r from-teal-500 to-blue-500 bg-clip-text text-transparent">
                DisasterAI
              </span>
            </Link>
          </div>
          
          <div className="flex items-center space-x-4">
            <Link 
              href="/"
              className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                router.pathname === '/' 
                  ? 'text-teal-600 bg-teal-50' 
                  : 'text-gray-600 hover:text-teal-600 hover:bg-teal-50'
              }`}
            >
              Chat
            </Link>
            <Link 
              href="/report"
              className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                router.pathname === '/report'
                  ? 'text-teal-600 bg-teal-50'
                  : 'text-gray-600 hover:text-teal-600 hover:bg-teal-50'
              }`}
            >
              แจ้งภัยพิบัติ
            </Link>
            <Link 
              href="/scraping"
              className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                router.pathname === '/scraping'
                  ? 'text-teal-600 bg-teal-50'
                  : 'text-gray-600 hover:text-teal-600 hover:bg-teal-50'
              }`}
            >
              AI Agents
            </Link>
          </div>
        </div>
      </div>
    </nav>
  );
} 