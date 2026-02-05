import { useState, useMemo } from 'react';
import { Doughnut, Bar } from 'react-chartjs-2';
import { Chart as ChartJS, ArcElement, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend } from 'chart.js';
import { Mail, Phone, MapPin, AlertTriangle, User, Users, Image, RotateCcw, Search, X } from 'lucide-react';
import { mockProfile, mockRiskScore, mockDetectedData, getRiskLevel } from '../data/mockData';
import { useTheme } from '../contexts/ThemeContext';

ChartJS.register(ArcElement, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

export default function DashboardInteractive() {
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  const [filters, setFilters] = useState({
    showEmail: true,
    showPhone: true,
    showLocation: true,
    showKeywords: true,
    showCharts: true,
    riskLevel: 'all',
  });

  const [keywordSearch, setKeywordSearch] = useState('');

  const calculateFilteredScore = () => {
    let total = 0;
    if (filters.showEmail) total += mockRiskScore.email;
    if (filters.showPhone) total += mockRiskScore.phone;
    if (filters.showLocation) total += mockRiskScore.location;
    if (filters.showKeywords) total += mockRiskScore.keywords;
    return total;
  };

  const filteredScore = useMemo(() => calculateFilteredScore(), [filters]);
  const maxPossibleScore = mockRiskScore.email + mockRiskScore.phone + mockRiskScore.location + mockRiskScore.keywords;
  const displayScore = maxPossibleScore > 0 ? Math.round((filteredScore / maxPossibleScore) * 100) : 0;

  const filteredKeywords = useMemo(() => {
    return mockDetectedData.keywords.filter(k => k.toLowerCase().includes(keywordSearch.toLowerCase()));
  }, [keywordSearch]);

  const getRiskColor = (score: number) => {
    const level = getRiskLevel(score);
    if (level === 'high') return { bg: 'bg-red-100 dark:bg-red-900/20', text: 'text-red-700 dark:text-red-400', border: 'border-red-200 dark:border-red-800' };
    if (level === 'medium') return { bg: 'bg-orange-100 dark:bg-orange-900/20', text: 'text-orange-700 dark:text-orange-400', border: 'border-orange-200 dark:border-orange-800' };
    return { bg: 'bg-green-100 dark:bg-green-900/20', text: 'text-green-700 dark:text-green-400', border: 'border-green-200 dark:border-green-800' };
  };

  const getRiskLabel = (score: number) => {
    const level = getRiskLevel(score);
    if (level === 'high') return 'High Risk';
    if (level === 'medium') return 'Medium Risk';
    return 'Low Risk';
  };

  const shouldShowByRiskLevel = (score: number) => {
    if (filters.riskLevel === 'all') return true;
    return getRiskLevel(score) === filters.riskLevel;
  };

  const riskColor = getRiskColor(displayScore);

  const getChartColor = (score: number) => {
    if (score >= 70) return ['#dc2626', '#fee2e2'];
    if (score >= 40) return ['#ea580c', '#fed7aa'];
    return ['#16a34a', '#dcfce7'];
  };

  const [mainColor, backgroundColor] = getChartColor(displayScore);

  const chartData = {
    datasets: [
      {
        data: [displayScore, 100 - displayScore],
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

  const barChartData = {
    labels: ['Email', 'Phone', 'Location', 'Keywords'],
    datasets: [
      {
        label: 'Risk Score',
        data: [
          filters.showEmail ? mockRiskScore.email : 0,
          filters.showPhone ? mockRiskScore.phone : 0,
          filters.showLocation ? mockRiskScore.location : 0,
          filters.showKeywords ? mockRiskScore.keywords : 0,
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

  const barChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false,
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

  const hasActiveFilters = filters.showEmail || filters.showPhone || filters.showLocation || filters.showKeywords;

  const handleResetFilters = () => {
    setFilters({
      showEmail: true,
      showPhone: true,
      showLocation: true,
      showKeywords: true,
      showCharts: true,
      riskLevel: 'all',
    });
    setKeywordSearch('');
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

        <div className="grid lg:grid-cols-4 gap-6 mb-8">
          <div className="lg:col-span-1">
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 sticky top-24">
              <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Filters</h2>

              <div className="space-y-4 mb-6">
                <div>
                  <label className="flex items-center space-x-3 cursor-pointer mb-3">
                    <input
                      type="checkbox"
                      checked={filters.showEmail}
                      onChange={(e) => setFilters({ ...filters, showEmail: e.target.checked })}
                      className="w-4 h-4 text-blue-600 rounded"
                    />
                    <span className="text-sm text-gray-700 dark:text-gray-300">Email</span>
                  </label>

                  <label className="flex items-center space-x-3 cursor-pointer mb-3">
                    <input
                      type="checkbox"
                      checked={filters.showPhone}
                      onChange={(e) => setFilters({ ...filters, showPhone: e.target.checked })}
                      className="w-4 h-4 text-blue-600 rounded"
                    />
                    <span className="text-sm text-gray-700 dark:text-gray-300">Phone</span>
                  </label>

                  <label className="flex items-center space-x-3 cursor-pointer mb-3">
                    <input
                      type="checkbox"
                      checked={filters.showLocation}
                      onChange={(e) => setFilters({ ...filters, showLocation: e.target.checked })}
                      className="w-4 h-4 text-blue-600 rounded"
                    />
                    <span className="text-sm text-gray-700 dark:text-gray-300">Location</span>
                  </label>

                  <label className="flex items-center space-x-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={filters.showKeywords}
                      onChange={(e) => setFilters({ ...filters, showKeywords: e.target.checked })}
                      className="w-4 h-4 text-blue-600 rounded"
                    />
                    <span className="text-sm text-gray-700 dark:text-gray-300">Keywords</span>
                  </label>
                </div>

                <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
                  <label className="flex items-center space-x-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={filters.showCharts}
                      onChange={(e) => setFilters({ ...filters, showCharts: e.target.checked })}
                      className="w-4 h-4 text-blue-600 rounded"
                    />
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Show Charts</span>
                  </label>
                </div>

                <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Risk Level
                  </label>
                  <select
                    value={filters.riskLevel}
                    onChange={(e) => setFilters({ ...filters, riskLevel: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="all">All</option>
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                  </select>
                </div>
              </div>

              <button
                onClick={handleResetFilters}
                className="w-full flex items-center justify-center space-x-2 px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600 rounded-lg font-medium text-sm transition-colors"
              >
                <RotateCcw className="w-4 h-4" />
                <span>Reset</span>
              </button>
            </div>
          </div>

          <div className="lg:col-span-3 space-y-6">
            {!hasActiveFilters && (
              <div className="bg-blue-50 dark:bg-blue-900/20 border-2 border-blue-200 dark:border-blue-800 rounded-xl p-6 text-center">
                <AlertTriangle className="w-8 h-8 text-blue-600 dark:text-blue-400 mx-auto mb-3" />
                <p className="text-blue-800 dark:text-blue-200 font-medium">
                  No data selected. Use filters to display results.
                </p>
              </div>
            )}

            {hasActiveFilters && (
              <>
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
                      <div className="p-0 mb-0 ">
                        <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
                          {mockProfile.bio}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {filters.showCharts && (
                  <div className="grid md:grid-cols-2 gap-6">
                    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
                      <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4 text-center">
                        Risk Score
                      </h3>
                      <div className="flex justify-center items-center mb-4">
                        <div className="relative w-48 h-48">
                          <Doughnut data={chartData} options={chartOptions} />
                          <div className="absolute inset-0 flex flex-col items-center justify-center">
                            <div className="text-4xl font-bold text-gray-900 dark:text-white">
                              {displayScore}
                            </div>
                            <div className="text-gray-500 dark:text-gray-400 text-xs">out of 100</div>
                          </div>
                        </div>
                      </div>
                      <div className={`${riskColor.bg} ${riskColor.border} border-2 rounded-lg p-3 text-center`}>
                        <span className={`text-sm font-semibold ${riskColor.text}`}>
                          {getRiskLabel(displayScore)}
                        </span>
                      </div>
                    </div>

                    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
                      <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">
                        Risk by Category
                      </h3>
                      <div className="h-64">
                        <Bar data={barChartData} options={barChartOptions} />
                      </div>
                    </div>
                  </div>
                )}

                <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
                  <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">
                    Detected Information
                  </h3>

                  <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                    {filters.showEmail && (
                      <div className="bg-red-50 dark:bg-red-900/20 rounded-lg p-4 border-2 border-red-200 dark:border-red-800">
                        <div className="flex items-center space-x-2 mb-2">
                          <Mail className="w-5 h-5 text-red-500" />
                          <span className="font-semibold text-gray-900 dark:text-white text-sm">Email</span>
                        </div>
                        <p className="text-lg font-bold text-gray-900 dark:text-white">
                          {mockDetectedData.emails.length}
                        </p>
                      </div>
                    )}

                    {filters.showPhone && (
                      <div className="bg-red-50 dark:bg-red-900/20 rounded-lg p-4 border-2 border-red-200 dark:border-red-800">
                        <div className="flex items-center space-x-2 mb-2">
                          <Phone className="w-5 h-5 text-red-500" />
                          <span className="font-semibold text-gray-900 dark:text-white text-sm">Phone</span>
                        </div>
                        <p className="text-lg font-bold text-gray-900 dark:text-white">
                          {mockDetectedData.phones.length}
                        </p>
                      </div>
                    )}

                    {filters.showLocation && (
                      <div className="bg-orange-50 dark:bg-orange-900/20 rounded-lg p-4 border-2 border-orange-200 dark:border-orange-800">
                        <div className="flex items-center space-x-2 mb-2">
                          <MapPin className="w-5 h-5 text-orange-500" />
                          <span className="font-semibold text-gray-900 dark:text-white text-sm">Location</span>
                        </div>
                        <p className="text-lg font-bold text-gray-900 dark:text-white">
                          {mockDetectedData.locations.length}
                        </p>
                      </div>
                    )}

                    {filters.showKeywords && (
                      <div className="bg-orange-50 dark:bg-orange-900/20 rounded-lg p-4 border-2 border-orange-200 dark:border-orange-800">
                        <div className="flex items-center space-x-2 mb-2">
                          <AlertTriangle className="w-5 h-5 text-orange-500" />
                          <span className="font-semibold text-gray-900 dark:text-white text-sm">Keywords</span>
                        </div>
                        <p className="text-lg font-bold text-gray-900 dark:text-white">
                          {filteredKeywords.length}
                        </p>
                      </div>
                    )}
                  </div>

                  {filters.showKeywords && mockDetectedData.keywords.length > 0 && (
                    <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                        Search Keywords
                      </label>
                      <div className="relative mb-3">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <input
                          type="text"
                          value={keywordSearch}
                          onChange={(e) => setKeywordSearch(e.target.value)}
                          placeholder="Search keywords..."
                          className="w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                        {keywordSearch && (
                          <button
                            onClick={() => setKeywordSearch('')}
                            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {filteredKeywords.length > 0 ? (
                          filteredKeywords.map((keyword, idx) => (
                            <span
                              key={idx}
                              className="px-3 py-1 bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300 text-sm rounded-full border border-orange-200 dark:border-orange-800"
                            >
                              {keyword}
                            </span>
                          ))
                        ) : (
                          <p className="text-sm text-gray-500 dark:text-gray-400">No keywords match your search</p>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
                  <p className="text-xs text-yellow-800 dark:text-yellow-200 font-medium">
                    This profile is fictional and used for demonstration purposes only.
                  </p>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
