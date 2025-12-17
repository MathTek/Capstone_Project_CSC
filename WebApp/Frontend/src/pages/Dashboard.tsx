import { Doughnut } from 'react-chartjs-2';
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';
import { Mail, Phone, MapPin, AlertTriangle, User, Users, Image, ArrowRight } from 'lucide-react';
import { mockProfile, mockRiskScore, mockDetectedData } from '../data/mockData';
import { useTheme } from '../contexts/ThemeContext';

ChartJS.register(ArcElement, Tooltip, Legend);

interface DashboardProps {
  onNavigate: (page: string) => void;
}

export default function Dashboard({ onNavigate }: DashboardProps) {
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  const getRiskColor = (score: number) => {
    if (score >= 70) return { bg: 'bg-red-100 dark:bg-red-900/20', text: 'text-red-700 dark:text-red-400', border: 'border-red-200 dark:border-red-800' };
    if (score >= 40) return { bg: 'bg-orange-100 dark:bg-orange-900/20', text: 'text-orange-700 dark:text-orange-400', border: 'border-orange-200 dark:border-orange-800' };
    return { bg: 'bg-green-100 dark:bg-green-900/20', text: 'text-green-700 dark:text-green-400', border: 'border-green-200 dark:border-green-800' };
  };

  const getRiskLabel = (score: number) => {
    if (score >= 70) return 'High Risk';
    if (score >= 40) return 'Medium Risk';
    return 'Low Risk';
  };

  const riskColor = getRiskColor(mockRiskScore.overall);
  const riskLabel = getRiskLabel(mockRiskScore.overall);

  const getChartColor = (score: number) => {
    if (score >= 70) return ['#dc2626', '#fee2e2'];
    if (score >= 40) return ['#ea580c', '#fed7aa'];
    return ['#16a34a', '#dcfce7'];
  };

  const [mainColor, backgroundColor] = getChartColor(mockRiskScore.overall);

  const chartData = {
    datasets: [
      {
        data: [mockRiskScore.overall, 100 - mockRiskScore.overall],
        backgroundColor: [mainColor, isDark ? '#374151' : backgroundColor],
        borderWidth: 0,
        cutout: '75%',
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: true,
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        enabled: false,
      },
    },
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-2">
            Privacy Risk Dashboard
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Analyzing demo profile for potential privacy vulnerabilities
          </p>
        </div>

        <div className="grid lg:grid-cols-3 gap-8 mb-8">
          <div className="lg:col-span-1">
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
              <div className="flex items-center space-x-4 mb-6">
                <img
                  src={mockProfile.profileImage}
                  alt="Profile"
                  className="w-16 h-16 rounded-full object-cover"
                />
                <div>
                  <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                    {mockProfile.username}
                  </h2>
                  <div className="flex items-center space-x-4 text-sm text-gray-600 dark:text-gray-400 mt-1">
                    <span className="flex items-center space-x-1">
                      <Image className="w-4 h-4" />
                      <span>{mockProfile.posts}</span>
                    </span>
                    <span className="flex items-center space-x-1">
                      <Users className="w-4 h-4" />
                      <span>{mockProfile.followers}</span>
                    </span>
                    <span className="flex items-center space-x-1">
                      <User className="w-4 h-4" />
                      <span>{mockProfile.following}</span>
                    </span>
                  </div>
                </div>
              </div>
              <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4 mb-4">
                <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
                  {mockProfile.bio}
                </p>
              </div>
              <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
                <p className="text-xs text-yellow-800 dark:text-yellow-200 font-medium">
                  This profile is fictional and used for demonstration purposes only.
                </p>
              </div>
            </div>
          </div>

          <div className="lg:col-span-2">
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-8">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6 text-center">
                Privacy Risk Score
              </h2>

              <div className="flex justify-center items-center mb-6">
                <div className="relative w-64 h-64">
                  <Doughnut data={chartData} options={chartOptions} />
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <div className="text-5xl font-bold text-gray-900 dark:text-white">
                      {mockRiskScore.overall}
                    </div>
                    <div className="text-gray-500 dark:text-gray-400 text-sm">out of 100</div>
                  </div>
                </div>
              </div>

              <div className={`${riskColor.bg} ${riskColor.border} border-2 rounded-lg p-4 mb-6`}>
                <div className="flex items-center justify-center space-x-2">
                  <AlertTriangle className={`w-5 h-5 ${riskColor.text}`} />
                  <span className={`text-lg font-semibold ${riskColor.text}`}>
                    {riskLabel}
                  </span>
                </div>
              </div>

              <div className="grid sm:grid-cols-2 gap-4">
                <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4">
                  <div className="flex items-center space-x-3 mb-2">
                    <Mail className="w-5 h-5 text-red-500" />
                    <span className="font-semibold text-gray-900 dark:text-white">Email Detected</span>
                  </div>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">
                    {mockDetectedData.emails.length > 0 ? 'Yes' : 'No'}
                  </p>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                    Risk Score: {mockRiskScore.email}
                  </p>
                </div>

                <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4">
                  <div className="flex items-center space-x-3 mb-2">
                    <Phone className="w-5 h-5 text-red-500" />
                    <span className="font-semibold text-gray-900 dark:text-white">Phone Number</span>
                  </div>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">
                    {mockDetectedData.phones.length > 0 ? 'Yes' : 'No'}
                  </p>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                    Risk Score: {mockRiskScore.phone}
                  </p>
                </div>

                <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4">
                  <div className="flex items-center space-x-3 mb-2">
                    <MapPin className="w-5 h-5 text-orange-500" />
                    <span className="font-semibold text-gray-900 dark:text-white">Location Exposed</span>
                  </div>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">
                    {mockDetectedData.locations.length > 0 ? 'Yes' : 'No'}
                  </p>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                    Risk Score: {mockRiskScore.location}
                  </p>
                </div>

                <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4">
                  <div className="flex items-center space-x-3 mb-2">
                    <AlertTriangle className="w-5 h-5 text-orange-500" />
                    <span className="font-semibold text-gray-900 dark:text-white">Sensitive Keywords</span>
                  </div>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">
                    {mockDetectedData.keywords.length > 0 ? 'Yes' : 'No'}
                  </p>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                    Risk Score: {mockRiskScore.keywords}
                  </p>
                </div>
              </div>

              <button
                onClick={() => onNavigate('risks')}
                className="w-full mt-6 inline-flex items-center justify-center px-6 py-3 bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 text-white font-semibold rounded-lg transition-colors space-x-2"
              >
                <span>View Detailed Risk Analysis</span>
                <ArrowRight className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
