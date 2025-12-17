import { Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { Mail, Phone, MapPin, AlertTriangle, Shield } from 'lucide-react';
import { mockRiskScore, mockDetectedData, riskExplanations } from '../data/mockData';
import { useTheme } from '../contexts/ThemeContext';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

export default function RiskVisualization() {
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  const chartData = {
    labels: ['Email Exposure', 'Phone Exposure', 'Location Exposure', 'Keywords Exposure'],
    datasets: [
      {
        label: 'Risk Score',
        data: [
          mockRiskScore.email,
          mockRiskScore.phone,
          mockRiskScore.location,
          mockRiskScore.keywords,
        ],
        backgroundColor: [
          'rgba(220, 38, 38, 0.8)',
          'rgba(234, 88, 12, 0.8)',
          'rgba(251, 146, 60, 0.8)',
          'rgba(251, 191, 36, 0.8)',
        ],
        borderRadius: 8,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false,
      },
      title: {
        display: true,
        text: 'Risk Score Breakdown',
        color: isDark ? '#e5e7eb' : '#111827',
        font: {
          size: 18,
          weight: 'bold' as const,
        },
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        max: 30,
        grid: {
          color: isDark ? '#374151' : '#e5e7eb',
        },
        ticks: {
          color: isDark ? '#9ca3af' : '#6b7280',
        },
      },
      x: {
        grid: {
          display: false,
        },
        ticks: {
          color: isDark ? '#9ca3af' : '#6b7280',
        },
      },
    },
  };

  const detectedItems = [
    {
      icon: Mail,
      title: 'Email Address',
      items: mockDetectedData.emails,
      color: 'text-red-500',
      bgColor: 'bg-red-50 dark:bg-red-900/20',
    },
    {
      icon: Phone,
      title: 'Phone Number',
      items: mockDetectedData.phones,
      color: 'text-red-500',
      bgColor: 'bg-red-50 dark:bg-red-900/20',
    },
    {
      icon: MapPin,
      title: 'Location',
      items: mockDetectedData.locations,
      color: 'text-orange-500',
      bgColor: 'bg-orange-50 dark:bg-orange-900/20',
    },
    {
      icon: AlertTriangle,
      title: 'Sensitive Keywords',
      items: mockDetectedData.keywords,
      color: 'text-orange-500',
      bgColor: 'bg-orange-50 dark:bg-orange-900/20',
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-2">
            Risk Analysis
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Understanding what information is exposed and why it matters
          </p>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-8 mb-8">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
            Detected Sensitive Information
          </h2>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {detectedItems.map((item, index) => (
              <div key={index} className={`${item.bgColor} rounded-lg p-5 border-2 border-gray-200 dark:border-gray-700`}>
                <div className="flex items-center space-x-3 mb-3">
                  <item.icon className={`w-6 h-6 ${item.color}`} />
                  <h3 className="font-semibold text-gray-900 dark:text-white text-sm">
                    {item.title}
                  </h3>
                </div>
                <div className="space-y-1">
                  {item.items.length > 0 ? (
                    item.items.map((value, idx) => (
                      <p key={idx} className="text-sm text-gray-700 dark:text-gray-300 font-mono bg-white dark:bg-gray-900 px-2 py-1 rounded">
                        {value}
                      </p>
                    ))
                  ) : (
                    <p className="text-sm text-gray-500 dark:text-gray-400">None detected</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-8 mb-8">
          <div className="h-80">
            <Bar data={chartData} options={chartOptions} />
          </div>
        </div>

        <div className="space-y-6">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
            Why This Information Is Sensitive
          </h2>

          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
            <div className="flex items-start space-x-4">
              <div className="flex-shrink-0 p-3 bg-red-100 dark:bg-red-900/30 rounded-lg">
                <Mail className="w-6 h-6 text-red-600 dark:text-red-400" />
              </div>
              <div className="flex-1">
                <div className="flex items-center space-x-2 mb-2">
                  <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                    {riskExplanations.email.title}
                  </h3>
                  <span className="px-2 py-1 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 text-xs font-semibold rounded">
                    {riskExplanations.email.risk}
                  </span>
                </div>
                <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
                  {riskExplanations.email.description}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
            <div className="flex items-start space-x-4">
              <div className="flex-shrink-0 p-3 bg-red-100 dark:bg-red-900/30 rounded-lg">
                <Phone className="w-6 h-6 text-red-600 dark:text-red-400" />
              </div>
              <div className="flex-1">
                <div className="flex items-center space-x-2 mb-2">
                  <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                    {riskExplanations.phone.title}
                  </h3>
                  <span className="px-2 py-1 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 text-xs font-semibold rounded">
                    {riskExplanations.phone.risk}
                  </span>
                </div>
                <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
                  {riskExplanations.phone.description}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
            <div className="flex items-start space-x-4">
              <div className="flex-shrink-0 p-3 bg-orange-100 dark:bg-orange-900/30 rounded-lg">
                <MapPin className="w-6 h-6 text-orange-600 dark:text-orange-400" />
              </div>
              <div className="flex-1">
                <div className="flex items-center space-x-2 mb-2">
                  <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                    {riskExplanations.location.title}
                  </h3>
                  <span className="px-2 py-1 bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400 text-xs font-semibold rounded">
                    {riskExplanations.location.risk}
                  </span>
                </div>
                <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
                  {riskExplanations.location.description}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
            <div className="flex items-start space-x-4">
              <div className="flex-shrink-0 p-3 bg-orange-100 dark:bg-orange-900/30 rounded-lg">
                <AlertTriangle className="w-6 h-6 text-orange-600 dark:text-orange-400" />
              </div>
              <div className="flex-1">
                <div className="flex items-center space-x-2 mb-2">
                  <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                    {riskExplanations.keywords.title}
                  </h3>
                  <span className="px-2 py-1 bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400 text-xs font-semibold rounded">
                    {riskExplanations.keywords.risk}
                  </span>
                </div>
                <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
                  {riskExplanations.keywords.description}
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-8 bg-blue-50 dark:bg-blue-900/20 border-2 border-blue-200 dark:border-blue-800 rounded-xl p-6">
          <div className="flex items-start space-x-4">
            <Shield className="w-6 h-6 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-1" />
            <div>
              <h3 className="text-lg font-semibold text-blue-900 dark:text-blue-200 mb-2">
                Educational Purpose
              </h3>
              <p className="text-blue-800 dark:text-blue-300 leading-relaxed">
                This analysis is designed to raise awareness about digital privacy risks. Understanding these vulnerabilities is the first step toward protecting yourself and your family online. The information shown here is for demonstration purposes only and represents common privacy mistakes found on social media.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
