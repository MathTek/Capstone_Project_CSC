import { Shield, ShieldCheck, ShieldAlert, Baby, MapPin, Settings, Lock, Brain, CheckCircle } from 'lucide-react';
import { privacyTips } from '../data/mockData';

const iconMap: { [key: string]: any } = {
  shield: ShieldCheck,
  baby: Baby,
  'map-pin': MapPin,
  settings: Settings,
  brain: Brain,
  lock: Lock,
};

export default function Education() {
  const commonMistakes = [
    {
      title: 'Sharing Too Much Personal Information',
      description: 'Posting full names, birth dates, addresses, phone numbers, or email addresses publicly.',
      impact: 'Identity theft, stalking, harassment',
    },
    {
      title: 'Oversharing Children\'s Information',
      description: 'Posting photos, names, ages, schools, or routines of children without privacy considerations.',
      impact: 'Child safety risks, digital footprint concerns',
    },
    {
      title: 'Revealing Location in Real-Time',
      description: 'Check-ins, geotagged photos, or posts that indicate current or frequent locations.',
      impact: 'Physical security risks, burglary when away from home',
    },
    {
      title: 'Using Weak Privacy Settings',
      description: 'Keeping profiles public or not reviewing who can see posts and personal information.',
      impact: 'Unauthorized access to personal data by strangers',
    },
    {
      title: 'Clicking Suspicious Links',
      description: 'Engaging with phishing attempts, scams, or malicious links shared via social media.',
      impact: 'Account compromise, malware infection',
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <div className="flex items-center space-x-4 mb-4">
            <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
              <Shield className="w-8 h-8 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <h1 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white">
                Digital Privacy Education
              </h1>
              <p className="text-gray-600 dark:text-gray-400 mt-1">
                Learn how to protect yourself and your family online
              </p>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 rounded-xl shadow-lg p-8 mb-8 border-2 border-blue-200 dark:border-blue-800">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
            Why Digital Privacy Matters
          </h2>
          <div className="prose prose-lg dark:prose-invert max-w-none">
            <p className="text-gray-700 dark:text-gray-300 leading-relaxed mb-4">
              In today's digital age, social media has become an integral part of our lives. We share moments, connect with friends and family, and express ourselves online. However, every piece of information we share contributes to our digital footprint and can potentially be used against us.
            </p>
            <p className="text-gray-700 dark:text-gray-300 leading-relaxed mb-4">
              Protecting personal data isn't just about preventing identity theft—it's about maintaining control over your information, protecting your family's safety, and ensuring your privacy in an increasingly connected world.
            </p>
            <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
              <strong>Remember:</strong> Once information is shared online, it can be difficult or impossible to completely remove it. Being mindful of what you post is the best defense.
            </p>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-8 mb-8">
          <div className="flex items-center space-x-3 mb-6">
            <ShieldAlert className="w-7 h-7 text-red-600 dark:text-red-400" />
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
              Common Privacy Mistakes on Social Media
            </h2>
          </div>

          <div className="space-y-4">
            {commonMistakes.map((mistake, index) => (
              <div
                key={index}
                className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-5 border-l-4 border-red-500"
              >
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                  {index + 1}. {mistake.title}
                </h3>
                <p className="text-gray-600 dark:text-gray-400 mb-3">
                  {mistake.description}
                </p>
                <div className="flex items-center space-x-2 text-sm">
                  <span className="font-medium text-red-600 dark:text-red-400">Potential Impact:</span>
                  <span className="text-gray-700 dark:text-gray-300">{mistake.impact}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-8 mb-8">
          <div className="flex items-center space-x-3 mb-6">
            <ShieldCheck className="w-7 h-7 text-green-600 dark:text-green-400" />
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
              Privacy Protection Tips
            </h2>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            {privacyTips.map((tip, index) => {
              const IconComponent = iconMap[tip.icon] || Shield;
              return (
                <div
                  key={index}
                  className="bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-700/50 dark:to-gray-800/50 rounded-lg p-6 border-2 border-gray-200 dark:border-gray-700 hover:border-blue-400 dark:hover:border-blue-500 transition-colors"
                >
                  <div className="flex items-start space-x-4">
                    <div className="flex-shrink-0 p-3 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                      <IconComponent className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                        {tip.title}
                      </h3>
                      <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
                        {tip.description}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-8 mb-8">
          <div className="flex items-center space-x-3 mb-6">
            <CheckCircle className="w-7 h-7 text-blue-600 dark:text-blue-400" />
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
              Best Practices for Parents
            </h2>
          </div>

          <div className="space-y-4">
            <div className="flex items-start space-x-3">
              <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400 flex-shrink-0 mt-1" />
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white mb-1">
                  Ask for Permission Before Posting
                </h3>
                <p className="text-gray-600 dark:text-gray-400">
                  Get your children's consent before sharing their photos or information online, especially as they get older.
                </p>
              </div>
            </div>

            <div className="flex items-start space-x-3">
              <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400 flex-shrink-0 mt-1" />
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white mb-1">
                  Use Nicknames or Initials
                </h3>
                <p className="text-gray-600 dark:text-gray-400">
                  Consider using nicknames, initials, or avoiding full names when posting about your children.
                </p>
              </div>
            </div>

            <div className="flex items-start space-x-3">
              <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400 flex-shrink-0 mt-1" />
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white mb-1">
                  Avoid School and Activity Details
                </h3>
                <p className="text-gray-600 dark:text-gray-400">
                  Don't post about specific schools, teams, or activity schedules that could reveal routines or locations.
                </p>
              </div>
            </div>

            <div className="flex items-start space-x-3">
              <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400 flex-shrink-0 mt-1" />
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white mb-1">
                  Review Privacy Settings Regularly
                </h3>
                <p className="text-gray-600 dark:text-gray-400">
                  Social media platforms frequently update their privacy settings. Review them regularly to ensure your content is only visible to intended audiences.
                </p>
              </div>
            </div>

            <div className="flex items-start space-x-3">
              <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400 flex-shrink-0 mt-1" />
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white mb-1">
                  Educate Your Children About Online Safety
                </h3>
                <p className="text-gray-600 dark:text-gray-400">
                  Teach children about the importance of privacy and safe online behavior from an early age.
                </p>
              </div>
            </div>

            <div className="flex items-start space-x-3">
              <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400 flex-shrink-0 mt-1" />
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white mb-1">
                  Think Long-Term
                </h3>
                <p className="text-gray-600 dark:text-gray-400">
                  Consider how the information you share today might affect your children in the future, including their digital reputation and privacy.
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-blue-50 dark:bg-blue-900/20 border-2 border-blue-200 dark:border-blue-800 rounded-xl p-8">
          <div className="flex items-start space-x-4">
            <Shield className="w-8 h-8 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-1" />
            <div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
                Ethical Disclaimer
              </h2>
              <div className="space-y-3 text-gray-700 dark:text-gray-300">
                <p className="leading-relaxed">
                  <strong>CyberSafeCheck</strong> is designed exclusively for educational and awareness purposes. Our mission is to help individuals and families understand the privacy risks associated with sharing personal information on social media.
                </p>
                <p className="leading-relaxed">
                  <strong>We do not collect, store, or misuse personal data.</strong> All scans and analyses are based on publicly available information and are intended to demonstrate potential privacy vulnerabilities.
                </p>
                <p className="leading-relaxed">
                  This tool should be used responsibly and ethically. We encourage users to:
                </p>
                <ul className="list-disc list-inside space-y-2 ml-4">
                  <li>Only scan their own profiles or those they have explicit permission to review</li>
                  <li>Use insights gained to improve their own privacy practices</li>
                  <li>Respect the privacy of others and not use this tool for malicious purposes</li>
                  <li>Share knowledge about digital privacy with friends and family</li>
                </ul>
                <p className="leading-relaxed font-semibold">
                  Together, we can create a safer and more privacy-conscious online community.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
