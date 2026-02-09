import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Doughnut, Bar, Line } from 'react-chartjs-2';
import { 
  Chart as ChartJS, 
  ArcElement, 
  CategoryScale, 
  LinearScale, 
  BarElement, 
  PointElement,
  LineElement,
  Title, 
  Tooltip, 
  Legend,
  Filler
} from 'chart.js';
import { 
  Shield, 
  TrendingUp, 
  TrendingDown, 
  Eye, 
  AlertTriangle, 
  CheckCircle, 
  Clock,
  BarChart3,
  PieChart,
  Activity,
  RefreshCw,
  Mail,
  Phone,
  MapPin,
  CreditCard,
  User,
  FileText,
  Loader2,
  Banknote,
  Paperclip,
  Calendar,
  Filter,
  ChevronRight,
  X,
  Zap,
  Target,
  Users,
  UserCheck,
  Crown
} from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';
import { useAuth } from '../contexts/AuthContext';
import { getScansByUserId, getPIIDetailsByScanId, getFamilyPoolByUserId, getUserById } from '../services/api';

ChartJS.register(
  ArcElement, 
  CategoryScale, 
  LinearScale, 
  BarElement, 
  PointElement,
  LineElement,
  Title, 
  Tooltip, 
  Legend,
  Filler
);

interface Scan {
  id: number;
  score: number;
  date?: string;
  created_at?: string;
  platform?: string;
}

interface PIIDetail {
  pii_type: string;
  value?: string;
  source?: string;
  occurrences?: number;
  created_at: string;
  scan_id?: number;
}

interface PIICategory {
  name: string;
  displayName: string;
  count: number;
  icon: React.ElementType;
  color: string;
  bgColor: string;
}

interface FamilyMember {
  id: number;
  member_id: number;
  chief_id: number;
  family_name: string;
  username?: string;
  scans?: Scan[];
  avgScore?: number;
  totalPII?: number;
}

interface FamilyStats {
  totalMembers: number;
  familyName: string;
  familyAvgScore: number;
  totalFamilyScans: number;
  totalFamilyPII: number;
  members: FamilyMember[];
  lowestScoreMember?: FamilyMember;
  highestScoreMember?: FamilyMember;
}

type TimePeriod = '7d' | '30d' | '90d' | 'all';

const PII_CONFIG: Record<string, { icon: React.ElementType; color: string; bgColor: string; displayName: string; riskLevel: 'critical' | 'high' | 'medium' | 'low' }> = {
  'credit_card': { icon: CreditCard, color: 'text-red-500', bgColor: 'bg-red-100 dark:bg-red-900/30', displayName: 'Credit Card', riskLevel: 'critical' },
  'social_security': { icon: Shield, color: 'text-red-600', bgColor: 'bg-red-100 dark:bg-red-900/30', displayName: 'Social Security', riskLevel: 'critical' },
  'passport': { icon: Paperclip, color: 'text-red-500', bgColor: 'bg-red-100 dark:bg-red-900/30', displayName: 'Passport', riskLevel: 'critical' },
  'iban': { icon: Banknote, color: 'text-orange-500', bgColor: 'bg-orange-100 dark:bg-orange-900/30', displayName: 'IBAN', riskLevel: 'high' },
  'bank_account': { icon: Banknote, color: 'text-orange-500', bgColor: 'bg-orange-100 dark:bg-orange-900/30', displayName: 'Bank Account', riskLevel: 'high' },
  'driving_license': { icon: Paperclip, color: 'text-orange-500', bgColor: 'bg-orange-100 dark:bg-orange-900/30', displayName: 'Driving License', riskLevel: 'high' },
  'medical_info': { icon: AlertTriangle, color: 'text-yellow-500', bgColor: 'bg-yellow-100 dark:bg-yellow-900/30', displayName: 'Medical Info', riskLevel: 'medium' },
  'address': { icon: MapPin, color: 'text-green-500', bgColor: 'bg-green-100 dark:bg-green-900/30', displayName: 'Address', riskLevel: 'low' },
  'coordinates': { icon: MapPin, color: 'text-green-500', bgColor: 'bg-green-100 dark:bg-green-900/30', displayName: 'Coordinates', riskLevel: 'medium' },
  'financial_info': { icon: Banknote, color: 'text-indigo-500', bgColor: 'bg-indigo-100 dark:bg-indigo-900/30', displayName: 'Financial Info', riskLevel: 'high' },
  'phone': { icon: Phone, color: 'text-blue-500', bgColor: 'bg-blue-100 dark:bg-blue-900/30', displayName: 'Phone Number', riskLevel: 'low' },
  'sensitive_location': { icon: MapPin, color: 'text-amber-500', bgColor: 'bg-amber-100 dark:bg-amber-900/30', displayName: 'Sensitive Location', riskLevel: 'medium' },
  'email': { icon: Mail, color: 'text-blue-500', bgColor: 'bg-blue-100 dark:bg-blue-900/30', displayName: 'Email', riskLevel: 'low' },
  'birth_date': { icon: User, color: 'text-pink-500', bgColor: 'bg-pink-100 dark:bg-pink-900/30', displayName: 'Birth Date', riskLevel: 'medium' },
  'personal_info': { icon: User, color: 'text-purple-500', bgColor: 'bg-purple-100 dark:bg-purple-900/30', displayName: 'Personal Info', riskLevel: 'low' },
  'full_name': { icon: User, color: 'text-purple-500', bgColor: 'bg-purple-100 dark:bg-purple-900/30', displayName: 'Full Name', riskLevel: 'low' },
  'sensitive_keyword': { icon: AlertTriangle, color: 'text-yellow-500', bgColor: 'bg-yellow-100 dark:bg-yellow-900/30', displayName: 'Sensitive Keyword', riskLevel: 'medium' },
  'ip_address': { icon: Activity, color: 'text-cyan-500', bgColor: 'bg-cyan-100 dark:bg-cyan-900/30', displayName: 'IP Address', riskLevel: 'low' },
  'mac_address': { icon: Activity, color: 'text-cyan-500', bgColor: 'bg-cyan-100 dark:bg-cyan-900/30', displayName: 'MAC Address', riskLevel: 'low' },
};

const getScanDate = (scan: Scan): Date => {
  const dateStr = scan.date || scan.created_at;
  if (!dateStr) return new Date(0);
  const parsed = new Date(dateStr);
  return isNaN(parsed.getTime()) ? new Date(0) : parsed;
};

const formatScanDate = (scan: Scan): string => {
  const date = getScanDate(scan);
  if (date.getTime() === 0) return 'N/A';
  return date.toLocaleDateString('en-US', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};

const TIME_PERIODS: { value: TimePeriod; label: string; days: number | null }[] = [
  { value: '7d', label: 'Last 7 days', days: 7 },
  { value: '30d', label: 'Last 30 days', days: 30 },
  { value: '90d', label: 'Last 90 days', days: 90 },
  { value: 'all', label: 'All time', days: null },
];

export default function DashboardInteractive() {
  const { theme } = useTheme();
  const { userId, getToken } = useAuth();
  const navigate = useNavigate();
  const isDark = theme === 'dark';

  const [scans, setScans] = useState<Scan[]>([]);
  const [allPIIDetails, setAllPIIDetails] = useState<PIIDetail[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  
  const [timePeriod, setTimePeriod] = useState<TimePeriod>('all');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedRiskFilter, setSelectedRiskFilter] = useState<string | null>(null);
  const [hoveredCard, setHoveredCard] = useState<string | null>(null);
  const [showFilters, setShowFilters] = useState(false);

  const [familyStats, setFamilyStats] = useState<FamilyStats | null>(null);
  const [loadingFamily, setLoadingFamily] = useState(false);

  const fetchData = async () => {
    try {
      setRefreshing(true);
      const token = getToken();
      if (!token || !userId) {
        setError('Not authenticated');
        return;
      }

      const scansData = await getScansByUserId(token, userId);
      const scansList = scansData.scans || [];
      setScans(scansList);

      const piiPromises = scansList.map((scan: Scan) => 
        getPIIDetailsByScanId(token, scan.id).catch(() => ({ pii_details: [] }))
      );
      const piiResults = await Promise.all(piiPromises);
      const allPII = piiResults.flatMap((result, index) => 
        (result.pii_details || []).map((pii: PIIDetail) => ({ ...pii, scan_id: scansList[index].id }))
      );
      setAllPIIDetails(allPII);

      setLoadingFamily(true);
      try {
        const familyPoolData = await getFamilyPoolByUserId(token, userId);
        const familyPool = familyPoolData.family_pool || [];
        
        if (familyPool.length > 0 && familyPool[0].chief_id === userId) {
          const familyName = familyPool[0].family_name || 'My Family';
          
          const membersWithData: FamilyMember[] = await Promise.all(
            familyPool.map(async (member: { id: number; member_id: number; chief_id: number; family_name: string }) => {
              try {
                const memberUser = await getUserById(token, member.member_id);
                const memberScansData = await getScansByUserId(token, member.member_id).catch(() => ({ scans: [] }));
                const memberScans = memberScansData.scans || [];
                
                let memberPIICount = 0;
                for (const scan of memberScans) {
                  try {
                    const piiData = await getPIIDetailsByScanId(token, scan.id);
                    memberPIICount += (piiData.pii_details || []).reduce(
                      (acc: number, pii: PIIDetail) => acc + (pii.occurrences || 1), 0
                    );
                  } catch {
                    /* ignore PII fetch errors */
                  }
                }
                
                const avgScore = memberScans.length > 0
                  ? Math.round(memberScans.reduce((acc: number, s: Scan) => acc + (s.score || 0), 0) / memberScans.length)
                  : 0;

                return {
                  ...member,
                  username: memberUser.username || `User ${member.member_id}`,
                  scans: memberScans,
                  avgScore,
                  totalPII: memberPIICount
                };
              } catch {
                return {
                  ...member,
                  username: `User ${member.member_id}`,
                  scans: [],
                  avgScore: 0,
                  totalPII: 0
                };
              }
            })
          );

          const totalFamilyScans = membersWithData.reduce((acc, m) => acc + (m.scans?.length || 0), 0);
          const totalFamilyPII = membersWithData.reduce((acc, m) => acc + (m.totalPII || 0), 0);
          const membersWithScans = membersWithData.filter(m => m.scans && m.scans.length > 0);
          const familyAvgScore = membersWithScans.length > 0
            ? Math.round(membersWithScans.reduce((acc, m) => acc + (m.avgScore || 0), 0) / membersWithScans.length)
            : 0;

          const sortedByScore = [...membersWithData].sort((a, b) => (a.avgScore || 0) - (b.avgScore || 0));
          const lowestScoreMember = sortedByScore.find(m => m.scans && m.scans.length > 0);
          const highestScoreMember = [...sortedByScore].reverse().find(m => m.scans && m.scans.length > 0);

          setFamilyStats({
            totalMembers: membersWithData.length,
            familyName,
            familyAvgScore,
            totalFamilyScans,
            totalFamilyPII,
            members: membersWithData,
            lowestScoreMember,
            highestScoreMember
          });
          console.log('Family stats calculated:', familyStats);
        } else {
          setFamilyStats(null);
        }
      } catch {
        setFamilyStats(null);
      } finally {
        setLoadingFamily(false);
      }

      setError(null);
    } catch (err) {
      console.error('Error fetching data:', err);
      setError(err instanceof Error ? err.message : 'Error loading data');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [userId]);

  const filteredScans = useMemo(() => {
    const period = TIME_PERIODS.find(p => p.value === timePeriod);
    if (!period?.days) return scans;
    
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - period.days);
    
    return scans.filter(scan => getScanDate(scan).getTime() >= cutoffDate.getTime());
  }, [scans, timePeriod]);

  const filteredPIIDetails = useMemo(() => {
    let filtered = allPIIDetails;
    
    if (selectedCategory) {
      filtered = filtered.filter(pii => pii.pii_type?.toLowerCase() === selectedCategory);
    }
    
    if (selectedRiskFilter) {
      filtered = filtered.filter(pii => {
        const config = PII_CONFIG[pii.pii_type?.toLowerCase() || ''];
        return config?.riskLevel === selectedRiskFilter;
      });
    }
    
    return filtered;
  }, [allPIIDetails, selectedCategory, selectedRiskFilter]);

  const stats = useMemo(() => {
    if (filteredScans.length === 0) {
      return {
        totalScans: 0,
        avgScore: 0,
        lastScore: 0,
        scoreChange: 0,
        totalPII: 0,
        riskLevel: 'N/A',
        criticalPII: 0,
        highPII: 0,
        mediumPII: 0,
        lowPII: 0
      };
    }

    const sortedScans = [...filteredScans].sort((a, b) => 
      getScanDate(b).getTime() - getScanDate(a).getTime()
    );

    const avgScore = Math.round(
      filteredScans.reduce((acc, scan) => acc + (scan.score || 0), 0) / filteredScans.length
    );

    const lastScore = sortedScans[0]?.score || 0;
    const previousScore = sortedScans[1]?.score || lastScore;
    const scoreChange = lastScore - previousScore;

    const riskLevel = avgScore >= 80 ? 'Low' : avgScore >= 60 ? 'Moderate' : avgScore >= 40 ? 'High' : 'Critical';

    let criticalPII = 0, highPII = 0, mediumPII = 0, lowPII = 0;
    filteredPIIDetails.forEach(pii => {
      const config = PII_CONFIG[pii.pii_type?.toLowerCase() || ''];
      const occurrences = pii.occurrences || 1;
      if (config?.riskLevel === 'critical') criticalPII += occurrences;
      else if (config?.riskLevel === 'high') highPII += occurrences;
      else if (config?.riskLevel === 'medium') mediumPII += occurrences;
      else lowPII += occurrences;
    });

    return {
      totalScans: filteredScans.length,
      avgScore,
      lastScore,
      scoreChange,
      totalPII: filteredPIIDetails.reduce((acc, pii) => acc + (pii.occurrences || 1), 0),
      riskLevel,
      criticalPII,
      highPII,
      mediumPII,
      lowPII
    };
  }, [filteredScans, filteredPIIDetails]);

  const piiCategories = useMemo((): PIICategory[] => {
    const categoryCount: Record<string, number> = {};

    filteredPIIDetails.forEach(pii => {
      const piiType = pii.pii_type?.toLowerCase() || 'unknown';
      categoryCount[piiType] = (categoryCount[piiType] || 0) + (pii.occurrences || 1);
    });

    return Object.entries(categoryCount)
      .map(([type, count]) => {
        const config = PII_CONFIG[type] || {
          icon: FileText,
          color: 'text-gray-500',
          bgColor: 'bg-gray-100 dark:bg-gray-900/30',
          displayName: type.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())
        };

        return {
          name: type,
          displayName: config.displayName,
          count,
          icon: config.icon,
          color: config.color,
          bgColor: config.bgColor
        };
      })
      .sort((a, b) => b.count - a.count);
  }, [filteredPIIDetails]);

  const scoreEvolution = useMemo(() => {
    const sortedScans = [...filteredScans]
      .sort((a, b) => getScanDate(a).getTime() - getScanDate(b).getTime())
      .slice(-10);

    return {
      labels: sortedScans.map(scan => {
        const date = getScanDate(scan);
        if (date.getTime() === 0) return 'N/A';
        return date.toLocaleDateString('en-US', { day: '2-digit', month: 'short' });
      }),
      scores: sortedScans.map(scan => scan.score || 0),
      scanIds: sortedScans.map(scan => scan.id)
    };
  }, [filteredScans]);

  const handleCategoryClick = (categoryName: string) => {
    setSelectedCategory(selectedCategory === categoryName ? null : categoryName);
  };

  const handleRiskFilterClick = (riskLevel: string) => {
    setSelectedRiskFilter(selectedRiskFilter === riskLevel ? null : riskLevel);
    setSelectedCategory(null);
  };

  const handleScanClick = (scanId: number) => {
    navigate(`/scan/${scanId}`);
  };

  const clearFilters = () => {
    setSelectedCategory(null);
    setSelectedRiskFilter(null);
    setTimePeriod('all');
  };

  const hasActiveFilters = selectedCategory || selectedRiskFilter || timePeriod !== 'all';

  const scoreGaugeData = {
    datasets: [{
      data: [stats.avgScore, 100 - stats.avgScore],
      backgroundColor: [
        stats.avgScore >= 80 ? '#22c55e' : stats.avgScore >= 60 ? '#eab308' : stats.avgScore >= 40 ? '#f97316' : '#ef4444',
        isDark ? '#374151' : '#e5e7eb'
      ],
      borderWidth: 0,
      cutout: '75%',
    }],
  };

  const scoreGaugeOptions = {
    responsive: true,
    maintainAspectRatio: true,
    plugins: {
      legend: { display: false },
      tooltip: { enabled: false },
    },
    onClick: () => {
      if (filteredScans.length > 0) {
        const latestScan = [...filteredScans].sort((a, b) => 
          getScanDate(b).getTime() - getScanDate(a).getTime()
        )[0];
        handleScanClick(latestScan.id);
      }
    }
  };

  const piiBarData = {
    labels: piiCategories.slice(0, 6).map(cat => cat.displayName),
    datasets: [{
      label: 'Occurrences',
      data: piiCategories.slice(0, 6).map(cat => cat.count),
      backgroundColor: piiCategories.slice(0, 6).map(cat => {
        const isSelected = selectedCategory === cat.name;
        if (isSelected) return 'rgba(59, 130, 246, 1)';
        return 'rgba(59, 130, 246, 0.6)';
      }),
      borderRadius: 8,
      borderWidth: piiCategories.slice(0, 6).map(cat => selectedCategory === cat.name ? 3 : 0),
      borderColor: 'rgba(59, 130, 246, 1)',
    }],
  };

  const piiBarOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        callbacks: {
          afterLabel: (context: any) => {
            const category = piiCategories[context.dataIndex];
            const config = PII_CONFIG[category?.name || ''];
            return `Risk: ${config?.riskLevel?.toUpperCase() || 'Unknown'}`;
          }
        }
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        grid: { color: isDark ? '#374151' : '#e5e7eb' },
        ticks: { color: isDark ? '#9ca3af' : '#6b7280' },
      },
      x: {
        grid: { display: false },
        ticks: { color: isDark ? '#9ca3af' : '#6b7280' },
      },
    },
    onClick: (_: any, elements: any[]) => {
      if (elements.length > 0) {
        const index = elements[0].index;
        const category = piiCategories[index];
        handleCategoryClick(category.name);
      }
    }
  };

  const scoreLineData = {
    labels: scoreEvolution.labels,
    datasets: [{
      label: 'Privacy Score',
      data: scoreEvolution.scores,
      fill: true,
      borderColor: '#3b82f6',
      backgroundColor: isDark ? 'rgba(59, 130, 246, 0.2)' : 'rgba(59, 130, 246, 0.1)',
      tension: 0.4,
      pointBackgroundColor: '#3b82f6',
      pointBorderColor: '#fff',
      pointBorderWidth: 2,
      pointRadius: 6,
      pointHoverRadius: 10,
    }],
  };

  const scoreLineOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        callbacks: {
          afterLabel: () => 'Click to view details'
        }
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        max: 100,
        grid: { color: isDark ? '#374151' : '#e5e7eb' },
        ticks: { color: isDark ? '#9ca3af' : '#6b7280' },
      },
      x: {
        grid: { display: false },
        ticks: { color: isDark ? '#9ca3af' : '#6b7280' },
      },
    },
    onClick: (_: any, elements: any[]) => {
      if (elements.length > 0) {
        const index = elements[0].index;
        const scanId = scoreEvolution.scanIds[index];
        if (scanId) handleScanClick(scanId);
      }
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-500';
    if (score >= 60) return 'text-yellow-500';
    if (score >= 40) return 'text-orange-500';
    return 'text-red-500';
  };

  const getRiskBadge = (level: string) => {
    const badges: Record<string, { bg: string; text: string; icon: React.ElementType }> = {
      'Low': { bg: 'bg-green-100 dark:bg-green-900/30', text: 'text-green-700 dark:text-green-400', icon: CheckCircle },
      'Moderate': { bg: 'bg-yellow-100 dark:bg-yellow-900/30', text: 'text-yellow-700 dark:text-yellow-400', icon: AlertTriangle },
      'High': { bg: 'bg-orange-100 dark:bg-orange-900/30', text: 'text-orange-700 dark:text-orange-400', icon: AlertTriangle },
      'Critical': { bg: 'bg-red-100 dark:bg-red-900/30', text: 'text-red-700 dark:text-red-400', icon: AlertTriangle },
      'N/A': { bg: 'bg-gray-100 dark:bg-gray-900/30', text: 'text-gray-700 dark:text-gray-400', icon: Clock },
    };
    return badges[level] || badges['N/A'];
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-blue-500 animate-spin mx-auto mb-4" />
          <p className="text-gray-600 dark:text-gray-400">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <AlertTriangle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <p className="text-gray-600 dark:text-gray-400">{error}</p>
          <button 
            onClick={fetchData}
            className="mt-4 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50/30 to-purple-50/30 dark:from-gray-900 dark:via-gray-900 dark:to-gray-800 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8">
          <div>
            <h1 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-2">
              Privacy Dashboard
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              Interactive overview of your digital exposure
            </p>
          </div>
          <div className="mt-4 md:mt-0 flex items-center gap-3">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl border shadow-sm transition-all hover:shadow-md ${
                hasActiveFilters 
                  ? 'bg-blue-500 text-white border-blue-500' 
                  : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border-gray-200 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-700'
              }`}
            >
              <Filter className="w-4 h-4" />
              Filters
              {hasActiveFilters && (
                <span className="bg-white text-blue-500 text-xs font-bold px-1.5 py-0.5 rounded-full">
                  {(selectedCategory ? 1 : 0) + (selectedRiskFilter ? 1 : 0) + (timePeriod !== 'all' ? 1 : 0)}
                </span>
              )}
            </button>
            <button
              onClick={fetchData}
              disabled={refreshing}
              className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 font-medium rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm transition-all hover:shadow-md disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
              Refresh
            </button>
          </div>
        </div>

        {showFilters && (
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6 border border-gray-100 dark:border-gray-700 mb-8 animate-in slide-in-from-top duration-300">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                <Filter className="w-5 h-5" />
                Filters & Options
              </h3>
              {hasActiveFilters && (
                <button
                  onClick={clearFilters}
                  className="text-sm text-blue-500 hover:text-blue-600 flex items-center gap-1"
                >
                  <X className="w-4 h-4" />
                  Clear all
                </button>
              )}
            </div>
            
            <div className="grid md:grid-cols-3 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 flex items-center gap-2">
                  <Calendar className="w-4 h-4" />
                  Time Period
                </label>
                <div className="flex flex-wrap gap-2">
                  {TIME_PERIODS.map(period => (
                    <button
                      key={period.value}
                      onClick={() => setTimePeriod(period.value)}
                      className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                        timePeriod === period.value
                          ? 'bg-blue-500 text-white'
                          : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                      }`}
                    >
                      {period.label}
                    </button>
                  ))}
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 flex items-center gap-2">
                  <Target className="w-4 h-4" />
                  Risk Level
                </label>
                <div className="flex flex-wrap gap-2">
                  {['critical', 'high', 'medium', 'low'].map(risk => (
                    <button
                      key={risk}
                      onClick={() => handleRiskFilterClick(risk)}
                      className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all flex items-center gap-1.5 ${
                        selectedRiskFilter === risk
                          ? risk === 'critical' ? 'bg-red-500 text-white' 
                            : risk === 'high' ? 'bg-orange-500 text-white'
                            : risk === 'medium' ? 'bg-yellow-500 text-white'
                            : 'bg-green-500 text-white'
                          : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                      }`}
                    >
                      <Zap className="w-3 h-3" />
                      {risk.charAt(0).toUpperCase() + risk.slice(1)}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Active Filters
                </label>
                <div className="flex flex-wrap gap-2">
                  {selectedCategory && (
                    <span className="inline-flex items-center gap-1 px-3 py-1.5 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 rounded-lg text-sm">
                      {PII_CONFIG[selectedCategory]?.displayName || selectedCategory}
                      <button onClick={() => setSelectedCategory(null)}>
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  )}
                  {selectedRiskFilter && (
                    <span className="inline-flex items-center gap-1 px-3 py-1.5 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400 rounded-lg text-sm">
                      {selectedRiskFilter.charAt(0).toUpperCase() + selectedRiskFilter.slice(1)} Risk
                      <button onClick={() => setSelectedRiskFilter(null)}>
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  )}
                  {!hasActiveFilters && (
                    <span className="text-sm text-gray-500 dark:text-gray-400">No active filters</span>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4 mb-8">
          <div 
            className={`bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-4 border border-gray-100 dark:border-gray-700 transition-all duration-300 cursor-pointer ${
              hoveredCard === 'scans' ? 'scale-105 shadow-xl' : 'hover:shadow-xl'
            }`}
            onMouseEnter={() => setHoveredCard('scans')}
            onMouseLeave={() => setHoveredCard(null)}
            onClick={() => navigate('/scan-history')}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400">Total Scans</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.totalScans}</p>
              </div>
              <Eye className="w-8 h-8 text-blue-500 opacity-80" />
            </div>
          </div>

          <div 
            className={`bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-4 border border-gray-100 dark:border-gray-700 transition-all duration-300 cursor-pointer ${
              hoveredCard === 'score' ? 'scale-105 shadow-xl' : 'hover:shadow-xl'
            }`}
            onMouseEnter={() => setHoveredCard('score')}
            onMouseLeave={() => setHoveredCard(null)}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400">Avg Score</p>
                <p className={`text-2xl font-bold ${getScoreColor(stats.avgScore)}`}>{stats.avgScore}%</p>
              </div>
              {stats.avgScore >= 50 ? (
                <TrendingUp className={`w-8 h-8 ${getScoreColor(stats.avgScore)} opacity-80`} />
              ) : (
                <TrendingDown className={`w-8 h-8 ${getScoreColor(stats.avgScore)} opacity-80`} />
              )}
            </div>
          </div>

          <div 
            className={`bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-4 border border-gray-100 dark:border-gray-700 transition-all duration-300 cursor-pointer ${
              hoveredCard === 'critical' ? 'scale-105 shadow-xl border-red-300 dark:border-red-700' : 'hover:shadow-xl'
            }`}
            onMouseEnter={() => setHoveredCard('critical')}
            onMouseLeave={() => setHoveredCard(null)}
            onClick={() => handleRiskFilterClick('critical')}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400">Critical</p>
                <p className="text-2xl font-bold text-red-500">{stats.criticalPII}</p>
              </div>
              <AlertTriangle className="w-8 h-8 text-red-500 opacity-80" />
            </div>
          </div>

          <div 
            className={`bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-4 border border-gray-100 dark:border-gray-700 transition-all duration-300 cursor-pointer ${
              hoveredCard === 'high' ? 'scale-105 shadow-xl border-orange-300 dark:border-orange-700' : 'hover:shadow-xl'
            }`}
            onMouseEnter={() => setHoveredCard('high')}
            onMouseLeave={() => setHoveredCard(null)}
            onClick={() => handleRiskFilterClick('high')}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400">High Risk</p>
                <p className="text-2xl font-bold text-orange-500">{stats.highPII}</p>
              </div>
              <Shield className="w-8 h-8 text-orange-500 opacity-80" />
            </div>
          </div>

          <div 
            className={`bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-4 border border-gray-100 dark:border-gray-700 transition-all duration-300 cursor-pointer ${
              hoveredCard === 'medium' ? 'scale-105 shadow-xl border-yellow-300 dark:border-yellow-700' : 'hover:shadow-xl'
            }`}
            onMouseEnter={() => setHoveredCard('medium')}
            onMouseLeave={() => setHoveredCard(null)}
            onClick={() => handleRiskFilterClick('medium')}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400">Medium</p>
                <p className="text-2xl font-bold text-yellow-500">{stats.mediumPII}</p>
              </div>
              <Activity className="w-8 h-8 text-yellow-500 opacity-80" />
            </div>
          </div>

          <div 
            className={`bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-4 border border-gray-100 dark:border-gray-700 transition-all duration-300 cursor-pointer ${
              hoveredCard === 'low' ? 'scale-105 shadow-xl border-green-300 dark:border-green-700' : 'hover:shadow-xl'
            }`}
            onMouseEnter={() => setHoveredCard('low')}
            onMouseLeave={() => setHoveredCard(null)}
            onClick={() => handleRiskFilterClick('low')}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400">Low Risk</p>
                <p className="text-2xl font-bold text-green-500">{stats.lowPII}</p>
              </div>
              <CheckCircle className="w-8 h-8 text-green-500 opacity-80" />
            </div>
          </div>
        </div>

        {familyStats && (
          <div className="mb-8">
            <div className="bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 rounded-2xl shadow-lg p-1">
              <div className="bg-white dark:bg-gray-800 rounded-xl p-6">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-3">
                    <div className="p-3 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-xl">
                      <Crown className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                        {familyStats.familyName} - Family Pool
                      </h2>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        You are managing {familyStats.totalMembers} family member{familyStats.totalMembers !== 1 ? 's' : ''}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => navigate('/family-pool/')}
                    className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-indigo-500 to-purple-500 text-white font-medium rounded-xl hover:shadow-lg transition-all"
                  >
                    <Users className="w-4 h-4" />
                    Manage Family
                  </button>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                  <div className="bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-indigo-900/20 dark:to-purple-900/20 rounded-xl p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <Users className="w-5 h-5 text-indigo-500" />
                      <span className="text-sm text-gray-600 dark:text-gray-400">Members</span>
                    </div>
                    <p className="text-2xl font-bold text-indigo-600 dark:text-indigo-400">
                      {familyStats.totalMembers}
                    </p>
                  </div>

                  <div className="bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-blue-900/20 dark:to-cyan-900/20 rounded-xl p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <Shield className="w-5 h-5 text-blue-500" />
                      <span className="text-sm text-gray-600 dark:text-gray-400">Family Avg</span>
                    </div>
                    <p className={`text-2xl font-bold ${getScoreColor(familyStats.familyAvgScore)}`}>
                      {familyStats.familyAvgScore}%
                    </p>
                  </div>

                  <div className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-xl p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <Eye className="w-5 h-5 text-green-500" />
                      <span className="text-sm text-gray-600 dark:text-gray-400">Total Scans</span>
                    </div>
                    <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                      {familyStats.totalFamilyScans}
                    </p>
                  </div>

                  <div className="bg-gradient-to-br from-orange-50 to-amber-50 dark:from-orange-900/20 dark:to-amber-900/20 rounded-xl p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <AlertTriangle className="w-5 h-5 text-orange-500" />
                      <span className="text-sm text-gray-600 dark:text-gray-400">Total PII</span>
                    </div>
                    <p className="text-2xl font-bold text-orange-600 dark:text-orange-400">
                      {familyStats.totalFamilyPII}
                    </p>
                  </div>
                </div>

                {(familyStats.lowestScoreMember || familyStats.highestScoreMember) && (
                  <div className="grid md:grid-cols-2 gap-4 mb-6">
                    {familyStats.highestScoreMember && (
                      <div className="flex items-center gap-4 p-4 bg-green-50 dark:bg-green-900/20 rounded-xl border border-green-200 dark:border-green-800">
                        <div className="p-3 bg-green-500 rounded-full">
                          <UserCheck className="w-5 h-5 text-white" />
                        </div>
                        <div className="flex-1">
                          <p className="text-sm text-gray-600 dark:text-gray-400">Best Protected</p>
                          <p className="font-semibold text-gray-900 dark:text-white">
                            {familyStats.highestScoreMember.username}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className={`text-2xl font-bold ${getScoreColor(familyStats.highestScoreMember.avgScore || 0)}`}>
                            {familyStats.highestScoreMember.avgScore}%
                          </p>
                          <p className="text-xs text-gray-500">{familyStats.highestScoreMember.scans?.length || 0} scans</p>
                        </div>
                      </div>
                    )}

                    {familyStats.lowestScoreMember && familyStats.lowestScoreMember.id !== familyStats.highestScoreMember?.id && (
                      <div className="flex items-center gap-4 p-4 bg-red-50 dark:bg-red-900/20 rounded-xl border border-red-200 dark:border-red-800">
                        <div className="p-3 bg-red-500 rounded-full">
                          <AlertTriangle className="w-5 h-5 text-white" />
                        </div>
                        <div className="flex-1">
                          <p className="text-sm text-gray-600 dark:text-gray-400">Needs Attention</p>
                          <p className="font-semibold text-gray-900 dark:text-white">
                            {familyStats.lowestScoreMember.username}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className={`text-2xl font-bold ${getScoreColor(familyStats.lowestScoreMember.avgScore || 0)}`}>
                            {familyStats.lowestScoreMember.avgScore}%
                          </p>
                          <p className="text-xs text-gray-500">{familyStats.lowestScoreMember.scans?.length || 0} scans</p>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
                  <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3 flex items-center gap-2">
                    <Users className="w-4 h-4" />
                    All Members
                  </h3>
                  <div className="grid gap-2 max-h-48 overflow-y-auto">
                    {familyStats.members.map((member) => (
                      <div
                        key={member.id}
                        className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700/50 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-700 transition cursor-pointer"
                        onClick={() => navigate('/family-scan-history/' + member.member_id)}
                      >
                        <div className="flex items-center gap-3">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                            (member.avgScore || 0) >= 70 ? 'bg-green-100 dark:bg-green-900/30' :
                            (member.avgScore || 0) >= 40 ? 'bg-yellow-100 dark:bg-yellow-900/30' :
                            'bg-red-100 dark:bg-red-900/30'
                          }`}>
                            <User className={`w-4 h-4 ${
                              (member.avgScore || 0) >= 70 ? 'text-green-600' :
                              (member.avgScore || 0) >= 40 ? 'text-yellow-600' :
                              'text-red-600'
                            }`} />
                          </div>
                          <div>
                            <p className="font-medium text-gray-900 dark:text-white text-sm">
                              {member.username}
                            </p>
                            <p className="text-xs text-gray-500 dark:text-gray-400">
                              {member.scans?.length || 0} scan{(member.scans?.length || 0) !== 1 ? 's' : ''} • {member.totalPII || 0} PII
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className={`text-lg font-bold ${getScoreColor(member.avgScore || 0)}`}>
                            {member.scans && member.scans.length > 0 ? `${member.avgScore}%` : 'N/A'}
                          </span>
                          <ChevronRight className="w-4 h-4 text-gray-400" />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {loadingFamily && (
          <div className="mb-8 bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6 border border-gray-100 dark:border-gray-700">
            <div className="flex items-center gap-3">
              <Loader2 className="w-5 h-5 text-blue-500 animate-spin" />
              <span className="text-gray-600 dark:text-gray-400">Loading family pool data...</span>
            </div>
          </div>
        )}

        <div className="grid lg:grid-cols-3 gap-6 mb-8">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6 border border-gray-100 dark:border-gray-700 hover:shadow-xl transition-shadow cursor-pointer group">
            <div className="flex items-center gap-2 mb-4">
              <PieChart className="w-5 h-5 text-gray-500 dark:text-gray-400" />
              <h2 className="text-lg font-bold text-gray-900 dark:text-white">Overall Score</h2>
              <span className="ml-auto text-xs text-gray-400 group-hover:text-blue-500 transition-colors">Click chart for details</span>
            </div>
            <div className="relative w-48 h-48 mx-auto cursor-pointer">
              <Doughnut data={scoreGaugeData} options={scoreGaugeOptions} />
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className={`text-4xl font-bold ${getScoreColor(stats.avgScore)}`}>
                  {stats.avgScore}%
                </span>
                <span className="text-sm text-gray-500 dark:text-gray-400">Privacy</span>
              </div>
            </div>
            {stats.scoreChange !== 0 && (
              <div className="text-center mt-4">
                <div className={`inline-flex items-center gap-1 px-3 py-1 rounded-full ${
                  stats.scoreChange > 0 
                    ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400' 
                    : 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400'
                }`}>
                  {stats.scoreChange > 0 ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
                  <span className="text-sm font-medium">
                    {stats.scoreChange > 0 ? '+' : ''}{stats.scoreChange} pts vs last scan
                  </span>
                </div>
              </div>
            )}
          </div>

          <div className="lg:col-span-2 bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6 border border-gray-100 dark:border-gray-700 hover:shadow-xl transition-shadow">
            <div className="flex items-center gap-2 mb-4">
              <Activity className="w-5 h-5 text-gray-500 dark:text-gray-400" />
              <h2 className="text-lg font-bold text-gray-900 dark:text-white">Score Evolution</h2>
              <span className="ml-auto text-xs text-gray-400">Click points for scan details</span>
            </div>
            {scoreEvolution.labels.length > 0 ? (
              <div className="h-64 cursor-pointer">
                <Line data={scoreLineData} options={scoreLineOptions} />
              </div>
            ) : (
              <div className="h-64 flex items-center justify-center text-gray-500 dark:text-gray-400">
                <div className="text-center">
                  <Clock className="w-12 h-12 mx-auto mb-2 opacity-50" />
                  <p>No evolution data yet</p>
                  <p className="text-sm">Run scans to see your progress</p>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="grid lg:grid-cols-2 gap-6 mb-8">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6 border border-gray-100 dark:border-gray-700 hover:shadow-xl transition-shadow">
            <div className="flex items-center gap-2 mb-4">
              <BarChart3 className="w-5 h-5 text-gray-500 dark:text-gray-400" />
              <h2 className="text-lg font-bold text-gray-900 dark:text-white">Top PII Categories</h2>
              <span className="ml-auto text-xs text-gray-400">Click bars to filter</span>
            </div>
            {piiCategories.length > 0 ? (
              <div className="h-64 cursor-pointer">
                <Bar data={piiBarData} options={piiBarOptions} />
              </div>
            ) : (
              <div className="h-64 flex items-center justify-center text-gray-500 dark:text-gray-400">
                <div className="text-center">
                  <Shield className="w-12 h-12 mx-auto mb-2 opacity-50" />
                  <p>No PII detected</p>
                  <p className="text-sm">Your data appears to be well protected</p>
                </div>
              </div>
            )}
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6 border border-gray-100 dark:border-gray-700 hover:shadow-xl transition-shadow">
            <div className="flex items-center gap-2 mb-4">
              <Shield className="w-5 h-5 text-gray-500 dark:text-gray-400" />
              <h2 className="text-lg font-bold text-gray-900 dark:text-white">PII Breakdown</h2>
              {selectedCategory && (
                <span className="ml-auto text-xs bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 px-2 py-1 rounded-full">
                  Filtered: {PII_CONFIG[selectedCategory]?.displayName}
                </span>
              )}
            </div>
            {piiCategories.length > 0 ? (
              <div className="space-y-3 max-h-64 overflow-y-auto">
                {piiCategories.map((category, index) => {
                  const Icon = category.icon;
                  const isSelected = selectedCategory === category.name;
                  return (
                    <div
                      key={index}
                      onClick={() => handleCategoryClick(category.name)}
                      className={`flex items-center justify-between p-3 rounded-xl transition-all cursor-pointer ${
                        isSelected 
                          ? 'ring-2 ring-blue-500 scale-[1.02]' 
                          : 'hover:scale-[1.02]'
                      } ${category.bgColor}`}
                    >
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-white/50 dark:bg-gray-700/50">
                          <Icon className={`w-5 h-5 ${category.color}`} />
                        </div>
                        <div>
                          <span className="font-medium text-gray-900 dark:text-white block">
                            {category.displayName}
                          </span>
                          <span className="text-xs text-gray-500 dark:text-gray-400">
                            {PII_CONFIG[category.name]?.riskLevel?.toUpperCase() || 'UNKNOWN'} risk
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={`text-lg font-bold ${category.color}`}>
                          {category.count}
                        </span>
                        <ChevronRight className={`w-4 h-4 text-gray-400 transition-transform ${isSelected ? 'rotate-90' : ''}`} />
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="h-64 flex items-center justify-center text-gray-500 dark:text-gray-400">
                <div className="text-center">
                  <CheckCircle className="w-12 h-12 mx-auto mb-2 text-green-500 opacity-50" />
                  <p>Excellent!</p>
                  <p className="text-sm">No personal information exposed</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {filteredScans.length > 0 && (
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6 border border-gray-100 dark:border-gray-700 hover:shadow-xl transition-shadow">
            <div className="flex items-center gap-2 mb-4">
              <Clock className="w-5 h-5 text-gray-500 dark:text-gray-400" />
              <h2 className="text-lg font-bold text-gray-900 dark:text-white">Recent Scans</h2>
              <span className="ml-auto text-xs text-gray-400">Click rows for details</span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200 dark:border-gray-700">
                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-500 dark:text-gray-400">Date</th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-500 dark:text-gray-400">Score</th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-500 dark:text-gray-400">Risk Level</th>
                    <th className="text-right py-3 px-4 text-sm font-semibold text-gray-500 dark:text-gray-400">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {[...filteredScans]
                    .sort((a, b) => getScanDate(b).getTime() - getScanDate(a).getTime())
                    .slice(0, 5)
                    .map((scan, index) => {
                      const riskLevel = scan.score >= 80 ? 'Low' : scan.score >= 60 ? 'Moderate' : scan.score >= 40 ? 'High' : 'Critical';
                      const badge = getRiskBadge(riskLevel);
                      const BadgeIcon = badge.icon;
                      return (
                        <tr 
                          key={scan.id || index} 
                          onClick={() => handleScanClick(scan.id)}
                          className="border-b border-gray-100 dark:border-gray-700/50 last:border-0 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition cursor-pointer group"
                        >
                          <td className="py-3 px-4 text-gray-900 dark:text-white">
                            {formatScanDate(scan)}
                          </td>
                          <td className="py-3 px-4">
                            <span className={`font-bold ${getScoreColor(scan.score)}`}>
                              {scan.score}%
                            </span>
                          </td>
                          <td className="py-3 px-4">
                            <div className={`inline-flex items-center gap-1 px-2 py-1 rounded-full ${badge.bg} ${badge.text}`}>
                              <BadgeIcon className="w-3 h-3" />
                              <span className="text-xs font-medium">{riskLevel}</span>
                            </div>
                          </td>
                          <td className="py-3 px-4 text-right">
                            <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-blue-500 inline-block transition-colors" />
                          </td>
                        </tr>
                      );
                    })}
                </tbody>
              </table>
            </div>
            {filteredScans.length > 5 && (
              <div className="mt-4 text-center">
                <button
                  onClick={() => navigate('/scan-history')}
                  className="text-blue-500 hover:text-blue-600 text-sm font-medium inline-flex items-center gap-1"
                >
                  View all {filteredScans.length} scans
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>
        )}

        {scans.length === 0 && (
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-12 border border-gray-100 dark:border-gray-700 text-center">
            <Eye className="w-16 h-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
              No scans yet
            </h3>
            <p className="text-gray-500 dark:text-gray-400 mb-6">
              Start by scanning your profiles to get an analysis of your digital exposure
            </p>
            <a
              href="/scan"
              className="inline-flex items-center gap-2 px-6 py-3 bg-blue-500 hover:bg-blue-600 text-white font-medium rounded-xl transition-all hover:shadow-lg"
            >
              <Shield className="w-5 h-5" />
              Start a Scan
            </a>
          </div>
        )}
      </div>
    </div>
  );
}
