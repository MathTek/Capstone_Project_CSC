import { useParams, useNavigate } from "react-router-dom";
import { getUserById, getScansByUserId } from "../services/api";
import { useEffect, useState } from "react";
import { Shield, Calendar, AlertTriangle, CheckCircle, Clock, Eye, TrendingUp, TrendingDown, Minus, ArrowLeft } from 'lucide-react';

export default function FamilyScanHistory() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();

    const [user, setUser] = useState<{ id: number; username: string } | null>(null);
    const [scanHistory, setScanHistory] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchData = async () => {
            try {
                setLoading(true);
                const userData = await getUserById(localStorage.getItem("csc_token"), parseInt(id || "0"));
                setUser(userData);

                const scansData = await getScansByUserId(localStorage.getItem("csc_token") || '', parseInt(id || "0"));
                setScanHistory(scansData.scans || []);
            } catch (err) {
                console.error('Error fetching data:', err);
                setError(err instanceof Error ? err.message : 'An error occurred');
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [id]);

    const getScoreColor = (score: number) => {
        if (score >= 80) return { bg: 'bg-green-500', text: 'text-green-500', light: 'bg-green-100 dark:bg-green-900/30' };
        if (score >= 60) return { bg: 'bg-yellow-500', text: 'text-yellow-500', light: 'bg-yellow-100 dark:bg-yellow-900/30' };
        if (score >= 40) return { bg: 'bg-orange-500', text: 'text-orange-500', light: 'bg-orange-100 dark:bg-orange-900/30' };
        return { bg: 'bg-red-500', text: 'text-red-500', light: 'bg-red-100 dark:bg-red-900/30' };
    };

    const getRiskLevel = (score: number) => {
        if (score >= 80) return { label: 'Low Risk', icon: CheckCircle, color: 'text-green-500' };
        if (score >= 60) return { label: 'Moderate', icon: Minus, color: 'text-yellow-500' };
        if (score >= 30) return { label: 'High Risk', icon: AlertTriangle, color: 'text-orange-500' };
        return { label: 'Critical', icon: AlertTriangle, color: 'text-red-500' };
    };

    const formatDate = (dateString: string) => {
        if (!dateString) return 'N/A';
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', { 
            year: 'numeric', 
            month: 'short', 
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const stats = {
        total: scanHistory.length,
        avgScore: scanHistory.length > 0 
            ? Math.round(scanHistory.reduce((acc, scan) => acc + (scan.score || 0), 0) / scanHistory.length) 
            : 0,
        lastScan: scanHistory.length > 0 ? scanHistory[0] : null,
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50/30 to-purple-50/30 dark:from-gray-900 dark:via-gray-900 dark:to-gray-800 py-8">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <button
                    onClick={() => navigate('/family-pool')}
                    className="mb-6 flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                >
                    <ArrowLeft className="w-5 h-5" />
                    Back to Family Pool
                </button>

                <div className="mb-8">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center text-white font-bold text-xl shadow-lg">
                            {user?.username?.charAt(0).toUpperCase() || "?"}
                        </div>
                        <div>
                            <h1 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white">
                                {user?.username || "Loading..."}'s Scan History
                            </h1>
                            <p className="text-gray-600 dark:text-gray-400">
                                View privacy scans and risk analysis for this family member.
                            </p>
                        </div>
                    </div>
                </div>

                {!loading && !error && scanHistory.length > 0 && (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6 border border-gray-100 dark:border-gray-700 hover:shadow-xl transition-shadow">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm text-gray-500 dark:text-gray-400">Total Scans</p>
                                    <p className="text-3xl font-bold text-gray-900 dark:text-white">{stats.total}</p>
                                </div>
                                <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-xl">
                                    <Eye className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                                </div>
                            </div>
                        </div>

                        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6 border border-gray-100 dark:border-gray-700 hover:shadow-xl transition-shadow">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm text-gray-500 dark:text-gray-400">Average Score</p>
                                    <p className={`text-3xl font-bold ${getScoreColor(stats.avgScore).text}`}>{stats.avgScore}%</p>
                                </div>
                                <div className={`p-3 ${getScoreColor(stats.avgScore).light} rounded-xl`}>
                                    {stats.avgScore >= 50 ? (
                                        <TrendingUp className={`w-6 h-6 ${getScoreColor(stats.avgScore).text}`} />
                                    ) : (
                                        <TrendingDown className={`w-6 h-6 ${getScoreColor(stats.avgScore).text}`} />
                                    )}
                                </div>
                            </div>
                        </div>

                        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6 border border-gray-100 dark:border-gray-700 hover:shadow-xl transition-shadow">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm text-gray-500 dark:text-gray-400">Last Scan</p>
                                    <p className="text-lg font-semibold text-gray-900 dark:text-white">
                                        {stats.lastScan ? formatDate(stats.lastScan.created_at).split(',')[0] : 'N/A'}
                                    </p>
                                </div>
                                <div className="p-3 bg-purple-100 dark:bg-purple-900/30 rounded-xl">
                                    <Clock className="w-6 h-6 text-purple-600 dark:text-purple-400" />
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-6 md:p-8 border border-gray-100 dark:border-gray-700">
                    <div className="flex items-center justify-between mb-6">
                        <h2 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                            <Calendar className="w-6 h-6 text-blue-500" />
                            Scan Timeline
                        </h2>
                        <span className="text-sm text-gray-500 dark:text-gray-400">
                            {scanHistory.length} scan{scanHistory.length !== 1 ? 's' : ''} found
                        </span>
                    </div>
                    
                    {loading && (
                        <div className="flex flex-col items-center justify-center py-16">
                            <div className="relative">
                                <div className="w-16 h-16 border-4 border-blue-200 dark:border-blue-900 rounded-full"></div>
                                <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin absolute top-0 left-0"></div>
                            </div>
                            <p className="mt-4 text-gray-600 dark:text-gray-400 font-medium">Loading scan history...</p>
                        </div>
                    )}

                    {error && (
                        <div className="flex items-center gap-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-4">
                            <AlertTriangle className="w-6 h-6 text-red-500 flex-shrink-0" />
                            <div>
                                <p className="font-medium text-red-800 dark:text-red-400">Error loading scans</p>
                                <p className="text-sm text-red-600 dark:text-red-300">{error}</p>
                            </div>
                        </div>
                    )}

                    {!loading && !error && scanHistory.length === 0 && (
                        <div className="flex flex-col items-center justify-center py-16 text-center">
                            <div className="p-4 bg-gray-100 dark:bg-gray-700 rounded-full mb-4">
                                <Shield className="w-12 h-12 text-gray-400 dark:text-gray-500" />
                            </div>
                            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">No scans yet</h3>
                            <p className="text-gray-600 dark:text-gray-400 max-w-md">
                                {user?.username} hasn't performed any privacy scans yet. They can use the Chrome extension to scan their social media profiles.
                            </p>
                        </div>
                    )}

                    {!loading && !error && scanHistory.length > 0 && (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {scanHistory.map((scan: any, index: number) => {
                                const scoreColors = getScoreColor(scan.score || 0);
                                const risk = getRiskLevel(scan.score || 0);
                                const RiskIcon = risk.icon;
                                
                                return (
                                    <div 
                                        key={scan.id || index} 
                                        className="group bg-gradient-to-br from-white to-gray-50 dark:from-gray-800 dark:to-gray-750 rounded-2xl border border-gray-200 dark:border-gray-700 overflow-hidden hover:shadow-2xl hover:scale-[1.02] transition-all duration-300"
                                    >
                                        <div className={`${scoreColors.light} p-4 border-b border-gray-200 dark:border-gray-700`}>
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-2">
                                                    <RiskIcon className={`w-5 h-5 ${risk.color}`} />
                                                    <span className={`text-sm font-medium ${risk.color}`}>{risk.label}</span>
                                                </div>
                                                <span className="text-xs text-gray-500 dark:text-gray-400">#{scanHistory.length - index}</span>
                                            </div>
                                        </div>

                                        <div className="p-5">
                                            <div className="flex items-center justify-center mb-4">
                                                <div className="relative">
                                                    <svg className="w-24 h-24 transform -rotate-90">
                                                        <circle
                                                            cx="48"
                                                            cy="48"
                                                            r="40"
                                                            stroke="currentColor"
                                                            strokeWidth="8"
                                                            fill="none"
                                                            className="text-gray-200 dark:text-gray-700"
                                                        />
                                                        <circle
                                                            cx="48"
                                                            cy="48"
                                                            r="40"
                                                            stroke="currentColor"
                                                            strokeWidth="8"
                                                            fill="none"
                                                            strokeDasharray={`${(scan.score || 0) * 2.51} 251`}
                                                            strokeLinecap="round"
                                                            className={scoreColors.text}
                                                        />
                                                    </svg>
                                                    <div className="absolute inset-0 flex items-center justify-center">
                                                        <span className={`text-2xl font-bold ${scoreColors.text}`}>
                                                            {scan.score || 0}%
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="space-y-3">
                                                <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                                                    <Calendar className="w-4 h-4" />
                                                    <span>{formatDate(scan.created_at)}</span>
                                                </div>
                                                
                                                {scan.platform && (
                                                    <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                                                        <Shield className="w-4 h-4" />
                                                        <span>{scan.platform}</span>
                                                    </div>
                                                )}
                                            </div>

                                            <button 
                                                className="w-full mt-5 py-2.5 px-4 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-xl transition-colors flex items-center justify-center gap-2 group-hover:shadow-lg"
                                                onClick={() => navigate(`/scan/${scan.id}`)}
                                            >
                                                <Eye className="w-4 h-4" />
                                                View Details
                                            </button>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}