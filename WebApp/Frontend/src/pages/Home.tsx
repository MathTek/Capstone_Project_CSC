import { Shield, Search, BarChart3, Smartphone, ArrowRight } from 'lucide-react';

interface HomeProps {
  onNavigate: (page: string) => void;
}

export default function Home({ onNavigate }: HomeProps) {
  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white dark:from-gray-900 dark:to-gray-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-20">
        <div className="text-center mb-16">
          <div className="flex justify-center mb-6">
            <div className="p-4 bg-blue-100 dark:bg-blue-900/30 rounded-full">
              <Shield className="w-16 h-16 text-blue-600 dark:text-blue-400" />
            </div>
          </div>
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-gray-900 dark:text-white mb-6 leading-tight">
            CyberSafeCheck
          </h1>
          <p className="text-xl md:text-2xl text-gray-600 dark:text-gray-300 mb-4">
            Understand Your Digital Exposure
          </p>
          <p className="text-lg text-gray-500 dark:text-gray-400 max-w-3xl mx-auto mb-8">
            An educational tool to help families understand the risks of sharing personal data online
          </p>
          <button
            onClick={() => onNavigate('dashboard')}
            className="inline-flex items-center px-8 py-4 bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 text-white font-semibold rounded-lg transition-colors shadow-lg hover:shadow-xl space-x-2"
          >
            <span>Button to dashboard</span>
            <ArrowRight className="w-5 h-5" />
          </button>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 md:p-12 mb-16">
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-6 text-center">
            What is CyberSafeCheck?
          </h2>
          <p className="text-lg text-gray-600 dark:text-gray-300 mb-8 text-center max-w-3xl mx-auto leading-relaxed">
            CyberSafeCheck is a multi-platform educational tool designed to raise awareness about digital privacy risks on social networks, especially for parents and the general public.
          </p>

          <div className="grid md:grid-cols-3 gap-8 mt-12">
            <div className="text-center">
              <div className="flex justify-center mb-4">
                <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                  <Search className="w-8 h-8 text-blue-600 dark:text-blue-400" />
                </div>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                Chrome Extension
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                Scans social media profiles to identify potential privacy risks
              </p>
            </div>

            <div className="text-center">
              <div className="flex justify-center mb-4">
                <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                  <BarChart3 className="w-8 h-8 text-blue-600 dark:text-blue-400" />
                </div>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                Web Dashboard
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                Centralizes scores and provides detailed explanations of risks
              </p>
            </div>

            <div className="text-center">
              <div className="flex justify-center mb-4">
                <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                  <Smartphone className="w-8 h-8 text-blue-600 dark:text-blue-400" />
                </div>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                Mobile App
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                Monitor your score and receive privacy protection tips on the go
              </p>
            </div>
          </div>
        </div>

        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-12 text-center">
            How It Works
          </h2>

          <div className="space-y-8">
            <div className="flex items-start space-x-4">
              <div className="flex-shrink-0 w-12 h-12 bg-blue-600 dark:bg-blue-500 text-white rounded-full flex items-center justify-center text-xl font-bold">
                1
              </div>
              <div className="flex-1">
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                  Scan a Profile
                </h3>
                <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
                  Use our Chrome extension to analyze a social media profile for potential privacy risks. The scan looks for publicly visible personal information that could be exploited.
                </p>
              </div>
            </div>

            <div className="flex items-start space-x-4">
              <div className="flex-shrink-0 w-12 h-12 bg-blue-600 dark:bg-blue-500 text-white rounded-full flex items-center justify-center text-xl font-bold">
                2
              </div>
              <div className="flex-1">
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                  Get a Privacy Risk Score
                </h3>
                <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
                  Receive a comprehensive risk score based on detected sensitive information like email addresses, phone numbers, location data, and personal keywords.
                </p>
              </div>
            </div>

            <div className="flex items-start space-x-4">
              <div className="flex-shrink-0 w-12 h-12 bg-blue-600 dark:bg-blue-500 text-white rounded-full flex items-center justify-center text-xl font-bold">
                3
              </div>
              <div className="flex-1">
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                  Learn How to Protect Yourself
                </h3>
                <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
                  Access detailed explanations and practical tips to improve your digital privacy and protect your family from potential online threats.
                </p>
              </div>
            </div>
          </div>

          <div className="mt-16 text-center">
            <button
              onClick={() => onNavigate('')}
              className="inline-flex items-center px-8 py-4 bg-gray-900 hover:bg-gray-800 dark:bg-gray-700 dark:hover:bg-gray-600 text-white font-semibold rounded-lg transition-colors space-x-2"
            >
              <span>Try the Demo (Extension)</span>
              <ArrowRight className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
