import { useState, useEffect } from 'react';
import { getScansByUserId, deleteScanById } from '../services/api';
import { Shield, Calendar, AlertTriangle, CheckCircle, Clock, Eye, TrendingUp, TrendingDown, Minus, Trash, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';


export default function ScanHistory() {

    const [scanHistory, setScanHistory] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const navigate = useNavigate();

    const [deleteModal, setDeleteModal] = useState<{ isOpen: boolean; scanId: number | null; isDeleting: boolean }>({
        isOpen: false,
        scanId: null,
        isDeleting: false
    });

    const handleNavigate = (page: string) => {
        navigate(page);
    }

    useEffect(() => {
        const fetchScanHistory = async () => {
            try {
                setLoading(true);
                const data = await getScansByUserId(localStorage.getItem('csc_token') || '', Number(localStorage.getItem('csc_user_id')));

                console.log('Données reçues:', data.scans);
                setScanHistory(data.scans);
            } catch (err) {
                console.error('Erreur lors du fetch:', err);
                setError(err instanceof Error ? err.message : 'Une erreur est survenue');
            } finally {
                setLoading(false);
            }
        };

        fetchScanHistory();
    }, []);

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


    const openDeleteModal = (scanId: number) => {
        setDeleteModal({ isOpen: true, scanId, isDeleting: false });
    };

    const closeDeleteModal = () => {
        setDeleteModal({ isOpen: false, scanId: null, isDeleting: false });
    };

    const confirmDelete = async () => {
        if (!deleteModal.scanId) return;
        
        setDeleteModal(prev => ({ ...prev, isDeleting: true }));
        
        try {
            await deleteScanById(localStorage.getItem('csc_token'), deleteModal.scanId);
            setScanHistory(prev => prev.filter(s => s.id !== deleteModal.scanId));
            closeDeleteModal();
        } catch (error) {
            console.error('Error deleting scan:', error);
            setDeleteModal(prev => ({ ...prev, isDeleting: false }));
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50/30 to-purple-50/30 dark:from-gray-900 dark:via-gray-900 dark:to-gray-800 py-8">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="mb-8">
                    <div className="flex items-center gap-3 mb-2">
                        <h1 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white">
                            Scan History
                        </h1>
                    </div>
                    <p className="text-gray-600 dark:text-gray-400 ">
                        Track your privacy scans and monitor your digital exposure over time.
                    </p>
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
                                        {stats.lastScan ? formatDate(stats.lastScan.date).split(',')[0] : 'N/A'}
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
                            <p className="mt-4 text-gray-600 dark:text-gray-400 font-medium">Loading your scan history...</p>
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
                                Start by scanning your social media profiles with our Chrome extension to see your privacy score here.
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
                                        key={index} 
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
                                                            {scan.score || 0} %
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
                                            <button className="w-full mt-5 py-2.5 px-4 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-xl transition-colors flex items-center justify-center gap-2 group-hover:shadow-lg"
                                                onClick={() => handleNavigate(`/scan/${scan.id}`)}
                                            >
                                                <Eye className="w-4 h-4" />
                                                View Details
                                            </button>
                                            <button className="w-full mt-2 py-2.5 px-4 bg-red-500 hover:bg-red-600 text-white font-medium rounded-xl transition-colors flex items-center justify-center gap-2 group-hover:shadow-lg"
                                                onClick={() => openDeleteModal(scan.id)}
                                            >
                                                <Trash className="w-4 h-4" />
                                                Delete this scan
                                            </button>
                                            <div></div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            </div>

            {deleteModal.isOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center">
                    <div 
                        className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
                        onClick={closeDeleteModal}
                    />
                    
                    <div className="relative bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-md w-full mx-4 overflow-hidden transform transition-all animate-in fade-in zoom-in duration-200">
                        <div className="bg-red-50 dark:bg-red-900/20 px-6 py-8 text-center">
                            <div className="mx-auto w-16 h-16 bg-red-100 dark:bg-red-900/40 rounded-full flex items-center justify-center mb-4">
                                <Trash className="w-8 h-8 text-red-600 dark:text-red-400" />
                            </div>
                            <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                                Delete Scan
                            </h3>
                            <p className="mt-2 text-gray-600 dark:text-gray-400">
                                Are you sure you want to delete this scan? This action cannot be undone.
                            </p>
                        </div>

                        <div className="px-6 py-4 bg-gray-50 dark:bg-gray-900/50 flex gap-3">
                            <button
                                onClick={closeDeleteModal}
                                disabled={deleteModal.isDeleting}
                                className="flex-1 py-3 px-4 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-800 dark:text-gray-200 font-medium rounded-xl transition-colors disabled:opacity-50"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={confirmDelete}
                                disabled={deleteModal.isDeleting}
                                className="flex-1 py-3 px-4 bg-red-600 hover:bg-red-700 text-white font-medium rounded-xl transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                            >
                                {deleteModal.isDeleting ? (
                                    <>
                                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                        Deleting...
                                    </>
                                ) : (
                                    <>
                                        <Trash className="w-4 h-4" />
                                        Delete
                                    </>
                                )}
                            </button>
                        </div>

                        <button
                            onClick={closeDeleteModal}
                            className="absolute top-4 right-4 p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
