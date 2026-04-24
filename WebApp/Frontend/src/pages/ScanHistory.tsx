import { useState, useEffect } from 'react';
import { getScansByUserId, deleteScanById } from '../services/api';
import { Shield, Calendar, AlertTriangle, CheckCircle, Clock, Eye, TrendingUp, TrendingDown, Minus, Trash, X, GitCompare, Globe } from 'lucide-react';
import { useNavigate } from 'react-router-dom';


export default function ScanHistory() {

    const [scanHistory, setScanHistory] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [selectedScans, setSelectedScans] = useState<number[]>([]);
    const [selectedPlatform, setSelectedPlatform] = useState<string | null>(null);
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
            const userId = Number(localStorage.getItem('csc_user_id'));
            try {
                setLoading(true);
                const data = await getScansByUserId(localStorage.getItem('csc_token') || '', userId);
                setScanHistory(data.scans.reverse());
            } catch (err) {
                console.error('Erreur lors du fetch:', err);
                setError(err instanceof Error ? err.message : 'Une erreur est survenue');
            } finally {
                setLoading(false);
            }

            const ws = new WebSocket(`ws://localhost:8000/ws/${userId}`);
            ws.onmessage = (event) => {
                const message = event.data;
                if (message === `new_scan_available:${userId}`) {
                    fetchScanHistory();
                }
            };

            return () => {
                ws.close();
            };
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
        lastScan: scanHistory.length > 0 ? scanHistory[scanHistory.length - 1].created_at : null,
    };

    const normalizePlatform = (platform: string | null | undefined) => platform?.trim().toLowerCase() || '';

    const getScanPlatform = (scan: any) => scan.media || scan.platform || null;

    const filteredScans = selectedPlatform 
        ? scanHistory.filter(scan => normalizePlatform(getScanPlatform(scan)) === normalizePlatform(selectedPlatform))
        : scanHistory;

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
                                        {stats.lastScan ? formatDate(stats.lastScan).split(',')[0] : 'N/A'}
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
                        <div className="flex items-center gap-4 flex-wrap">
                            <div className="flex items-center gap-2">
                                <button
                                  onClick={() => setSelectedPlatform(null)}
                                  className={`p-2 rounded-xl transition-colors flex items-center justify-center ${
                                    selectedPlatform === null
                                      ? 'bg-blue-600 hover:bg-blue-700 text-white'
                                      : 'bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300'
                                  }`}
                                  aria-label="All Platforms"
                                  title="All Platforms"
                                >
                                  <Globe className="w-5 h-5" />
                                </button>
                                <button
                                  onClick={() => setSelectedPlatform('Instagram')}
                                  className={`p-2 rounded-xl transition-colors flex items-center justify-center ${
                                    selectedPlatform === 'Instagram'
                                      ? 'ring-2 ring-pink-500 bg-white dark:bg-gray-800'
                                      : 'bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600'
                                  }`}
                                  aria-label="Instagram"
                                  title="Instagram"
                                >
                                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" className="w-5 h-5">
                                    <radialGradient id="ig-grad" cx="19.38" cy="42.035" r="44.899" gradientUnits="userSpaceOnUse">
                                      <stop offset="0" stopColor="#fd5"/>
                                      <stop offset=".328" stopColor="#ff543f"/>
                                      <stop offset=".348" stopColor="#fc5245"/>
                                      <stop offset=".504" stopColor="#e64771"/>
                                      <stop offset=".643" stopColor="#d53e91"/>
                                      <stop offset=".761" stopColor="#cc39a4"/>
                                      <stop offset=".841" stopColor="#c837ab"/>
                                    </radialGradient>
                                    <path fill="url(#ig-grad)" d="M34.017 41.99l-20-.002c-4.4 0-8.003-3.602-8.008-8.008l-.007-19.997c-.001-4.4 3.601-8.002 8-8.007l20-.003c4.402 0 8.006 3.602 8.01 8.008l.003 19.994c.002 4.404-3.598 8.008-7.998 8.015z"/>
                                    <radialGradient id="ig-grad2" cx="11.786" cy="5.54" r="29.813" gradientUnits="userSpaceOnUse">
                                      <stop offset="0" stopColor="#4168c9"/>
                                      <stop offset=".999" stopColor="#4168c9" stopOpacity="0"/>
                                    </radialGradient>
                                    <path fill="url(#ig-grad2)" d="M34.017 41.99l-20-.002c-4.4 0-8.003-3.602-8.008-8.008l-.007-19.997c-.001-4.4 3.601-8.002 8-8.007l20-.003c4.402 0 8.006 3.602 8.01 8.008l.003 19.994c.002 4.404-3.598 8.008-7.998 8.015z"/>
                                    <path fill="#fff" d="M24 31c-3.859 0-7-3.14-7-7s3.141-7 7-7 7 3.14 7 7-3.141 7-7 7zm0-12c-2.757 0-5 2.243-5 5s2.243 5 5 5 5-2.243 5-5-2.243-5-5-5z"/>
                                    <circle cx="31.5" cy="16.5" r="1.5" fill="#fff"/>
                                    <path fill="#fff" d="M30 37H18c-3.859 0-7-3.14-7-7V18c0-3.86 3.141-7 7-7h12c3.859 0 7 3.14 7 7v12c0 3.86-3.141 7-7 7zm-12-24c-2.757 0-5 2.243-5 5v12c0 2.757 2.243 5 5 5h12c2.757 0 5-2.243 5-5V18c0-2.757-2.243-5-5-5H18z"/>
                                  </svg>
                                </button>
                                <button
                                  onClick={() => setSelectedPlatform('X')}
                                  className={`p-2 rounded-xl transition-colors flex items-center justify-center ${
                                    selectedPlatform === 'X'
                                      ? 'ring-2 ring-gray-800 dark:ring-white bg-white dark:bg-gray-800'
                                      : 'bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600'
                                  }`}
                                  aria-label="X"
                                  title="X"
                                >
                                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" className="w-5 h-5" fill="currentColor">
                                    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.744l7.73-8.835L2.25 2.25h6.908l4.265 5.638L18.244 2.25zm-1.161 17.52h1.833L7.084 4.126H5.117z" className="fill-gray-900 dark:fill-white"/>
                                  </svg>
                                </button>
                                                                <button
                                                                    onClick={() => setSelectedPlatform('Facebook')}
                                                                    className={`p-2 rounded-xl transition-colors flex items-center justify-center ${
                                                                        selectedPlatform === 'Facebook'
                                                                            ? 'ring-2 ring-blue-600 bg-white dark:bg-gray-800'
                                                                            : 'bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600'
                                                                    }`}
                                                                    aria-label="Facebook"
                                                                    title="Facebook"
                                                                >
                                                                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" className="w-5 h-5" fill="currentColor">
                                                                        <path d="M24 12.073C24 5.405 18.627 0 12 0S0 5.405 0 12.073c0 6.019 4.388 11.009 10.125 11.927v-8.437H7.078v-3.49h3.047V9.414c0-3.017 1.792-4.683 4.533-4.683 1.313 0 2.686.235 2.686.235v2.963H15.83c-1.491 0-1.956.928-1.956 1.88v2.264h3.328l-.532 3.49h-2.796V24C19.612 23.082 24 18.092 24 12.073z" className="fill-blue-600" />
                                                                    </svg>
                                                                </button>
                            </div>
                            <span className="text-sm text-gray-500 dark:text-gray-400">
                                {filteredScans.length} scan{filteredScans.length !== 1 ? 's' : ''} found
                            </span>
                            <button
                              className={`px-4 py-2 font-medium rounded-xl flex items-center justify-center gap-2 transition-colors
                                ${selectedScans.length === 2 ? 'bg-blue-600 hover:bg-blue-700 text-white' : 'bg-gray-300 text-gray-500 cursor-not-allowed'}`}
                              disabled={selectedScans.length !== 2}
                              onClick={() => {
                                if (selectedScans.length === 2) {
                                  navigate(`/scan-comparison?scan1=${selectedScans[0]}&scan2=${selectedScans[1]}`);
                                }
                              }}
                            >
                              <GitCompare className="w-4 h-4" />
                              Compare Scans
                            </button>
                        </div>
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

                    {!loading && !error && scanHistory.length > 0 && filteredScans.length === 0 && (
                        <div className="flex flex-col items-center justify-center py-16 text-center">
                            <div className="p-4 bg-gray-100 dark:bg-gray-700 rounded-full mb-4">
                                <Shield className="w-12 h-12 text-gray-400 dark:text-gray-500" />
                            </div>
                            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">No scans found</h3>
                            <p className="text-gray-600 dark:text-gray-400 max-w-md">
                                No scans available for the selected platform. Try selecting a different filter.
                            </p>
                        </div>
                    )}

                    {!loading && !error && filteredScans.length > 0 && (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {filteredScans.map((scan: any, index: number) => {
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
                                                
                                                {getScanPlatform(scan) && (
                                                    <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                                                        <Shield className="w-4 h-4" />
                                                        <span>{getScanPlatform(scan)}</span>
                                                    </div>
                                                )}
                                            </div>
                                            <button className="w-full mt-5 py-2.5 px-4 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-xl transition-colors flex items-center justify-center gap-2" onClick={() => handleNavigate(`/scan/${scan.id}`)}>
                                                <Eye className="w-4 h-4" />
                                                View Details
                                            </button>
                                            <button className="w-full mt-2 py-2.5 px-4 bg-red-500 hover:bg-red-600 text-white font-medium rounded-xl transition-colors flex items-center justify-center gap-2" onClick={() => openDeleteModal(scan.id)}>
                                                <Trash className="w-4 h-4" />
                                                Delete this scan
                                            </button>
                                            <div className="absolute top-4 left-4 z-30 bg-white dark:bg-gray-800 rounded shadow p-1">
                                                <input
                                                  type="checkbox"
                                                  checked={selectedScans.includes(scan.id)}
                                                  onChange={e => {
                                                    setSelectedScans(prev =>
                                                      e.target.checked
                                                        ? [...prev, scan.id]
                                                        : prev.filter(id => id !== scan.id)
                                                    );
                                                  }}
                                                  className="w-5 h-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500 block"
                                                  style={{display: 'block'}}
                                                  disabled={
                                                    !selectedScans.includes(scan.id) && selectedScans.length === 2
                                                  }
                                                />
                                              </div>
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
