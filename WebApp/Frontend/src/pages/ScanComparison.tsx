import { useSearchParams } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { getPIIDetailsByScanId, getScoreByScanId, getFeedbacks } from "../services/api";
import { CheckCircle, XCircle, Info, UserCheck, Shield, ArrowUpRight, ArrowDownRight, Minus } from "lucide-react";

export default function ScanComparison() {
    const [searchParams] = useSearchParams();
    const scan1Id = searchParams.get('scan1');
    const scan2Id = searchParams.get('scan2');
    const navigate = useNavigate();

    const [scan1, setScan1] = useState<any>(null);
    const [scan2, setScan2] = useState<any>(null);
    const [feedback1, setFeedback1] = useState<any[]>([]);
    const [feedback2, setFeedback2] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            setError(null);
            try {
                const token = localStorage.getItem("csc_token");
                const [pii1Res, score1Res, feedbacks1Res] = await Promise.all([
                    getPIIDetailsByScanId(token, Number(scan1Id)),
                    getScoreByScanId(token, Number(scan1Id)),
                    getFeedbacks(token, Number(scan1Id)),
                ]);
                const [pii2Res, score2Res, feedbacks2Res] = await Promise.all([
                    getPIIDetailsByScanId(token, Number(scan2Id)),
                    getScoreByScanId(token, Number(scan2Id)),
                    getFeedbacks(token, Number(scan2Id)),
                ]);
                setScan1({ pii: pii1Res?.pii_details ?? [], score: score1Res?.score ?? null });
                setScan2({ pii: pii2Res?.pii_details ?? [], score: score2Res?.score ?? null });
                setFeedback1(Array.isArray(feedbacks1Res?.feedback) ? feedbacks1Res.feedback : []);
                setFeedback2(Array.isArray(feedbacks2Res?.feedback) ? feedbacks2Res.feedback : []);
                if (!score1Res?.score || !score2Res?.score) {
                  setError('Impossible de récupérer les informations de score pour un ou les deux scans.');
                }
            } catch (err: any) {
                setError(err.message || 'Failed to fetch scan data');
            } finally {
                setLoading(false);
            }
        };
        if (scan1Id && scan2Id) fetchData();
    }, [scan1Id, scan2Id]);

    const countPIITypes = (piiArr: any[]) => {
      const counts: Record<string, number> = {};
      if (!Array.isArray(piiArr)) return counts;
      for (const pii of piiArr) {
        counts[pii.pii_type] = (counts[pii.pii_type] || 0) + 1;
      }
      return counts;
    };

    const getScoreColor = (score: number | null | undefined) => {
      if (typeof score !== 'number') return 'text-gray-400';
      if (score >= 80) return 'text-green-600 dark:text-green-400';
      if (score >= 50) return 'text-yellow-600 dark:text-yellow-400';
      return 'text-red-600 dark:text-red-400';
    };

    const getPIIDiff = (piiA: any[], piiB: any[]) => {
      const setB = new Set(piiB.map(p => p.pii_type + ':' + (p.pii_value ?? p.occurrences)));
      return piiA.filter(p => !setB.has(p.pii_type + ':' + (p.pii_value ?? p.occurrences)));
    };

    const getChronoScans = () => {
      if (!scan1?.score?.created_at || !scan2?.score?.created_at) return [null, null];
      const date1 = new Date(scan1.score.created_at);
      const date2 = new Date(scan2.score.created_at);
      if (date1 <= date2) return [scan1, scan2]; 
      return [scan2, scan1];
    };
    const getEvolution = () => {
      const [oldScan, newScan] = getChronoScans();
      if (!oldScan || !newScan) return null;
      const oldScore = typeof oldScan.score?.score === 'number' ? oldScan.score.score : null;
      const newScore = typeof newScan.score?.score === 'number' ? newScan.score.score : null;
      const oldPII = Array.isArray(oldScan.pii) ? oldScan.pii.length : null;
      const newPII = Array.isArray(newScan.pii) ? newScan.pii.length : null;
      let scoreDiff = null, piiDiff = null;
      if (oldScore !== null && newScore !== null) scoreDiff = newScore - oldScore;
      if (oldPII !== null && newPII !== null) piiDiff = newPII - oldPII;
      return { oldScan, newScan, oldScore, newScore, scoreDiff, oldPII, newPII, piiDiff };
    };
    const evolution = getEvolution();

    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50/30 to-purple-50/30 dark:from-gray-900 dark:via-gray-900 dark:to-gray-800 py-8">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="mb-8">
                    <div className="flex items-center justify-between mb-2">
                        <h1 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white">
                            Scan Comparison
                        </h1>
                        <button
                            onClick={() => navigate(-1)}
                            className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 font-medium rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm transition-all hover:shadow-md"
                        >
                            <ArrowLeft className="w-4 h-4" />
                            Back
                        </button>
                    </div>
                    {evolution && (
                      <div className="mb-6 flex flex-col md:flex-row items-center gap-4 p-4 rounded-xl border-2 border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-900/30 shadow">
                        <div className="flex-1 flex flex-col md:flex-row items-center gap-4">
                          <span className="font-semibold text-lg text-gray-700 dark:text-gray-200">Evolution between {evolution.oldScan.score?.created_at ? new Date(evolution.oldScan.score.created_at).toLocaleString() : ''} and {evolution.newScan.score?.created_at ? new Date(evolution.newScan.score.created_at).toLocaleString() : ''}</span>
                          <span className={`flex items-center gap-2 px-3 py-1 rounded-full font-bold text-white text-base ${evolution.scoreDiff == null ? 'bg-gray-400' : evolution.scoreDiff > 0 ? 'bg-green-500' : evolution.scoreDiff < 0 ? 'bg-red-500' : 'bg-gray-500'}`}>
                            Score&nbsp;
                            {evolution.scoreDiff == null ? 'N/A' : (
                              <>
                                {evolution.scoreDiff > 0 && <ArrowUpRight className="w-5 h-5 text-white" />}
                                {evolution.scoreDiff < 0 && <ArrowDownRight className="w-5 h-5 text-white" />}
                                {evolution.scoreDiff === 0 && <Minus className="w-5 h-5 text-white" />}
                                {evolution.scoreDiff > 0 ? `+${evolution.scoreDiff}` : evolution.scoreDiff}%
                              </>
                            )}
                          </span>
                          <span className={`flex items-center gap-2 px-3 py-1 rounded-full font-bold text-white text-base ${evolution.piiDiff == null ? 'bg-gray-400' : evolution.piiDiff < 0 ? 'bg-green-500' : evolution.piiDiff > 0 ? 'bg-red-500' : 'bg-gray-500'}`}>
                            PII&nbsp;
                            {evolution.piiDiff == null ? 'N/A' : (
                              <>
                                {evolution.piiDiff < 0 && <ArrowDownRight className="w-5 h-5 text-white rotate-90" />}
                                {evolution.piiDiff > 0 && <ArrowUpRight className="w-5 h-5 text-white rotate-90" />}
                                {evolution.piiDiff === 0 && <Minus className="w-5 h-5 text-white" />}
                                {evolution.piiDiff > 0 ? `+${evolution.piiDiff}` : evolution.piiDiff}
                              </>
                            )}
                          </span>
                        </div>
                        <div className="flex flex-col items-center">
                          <span className="text-xs text-gray-500 dark:text-gray-400">
                            {evolution.scoreDiff == null ? 'Incomplete data' : evolution.scoreDiff > 0 ? 'Improvement' : evolution.scoreDiff < 0 ? 'Degradation' : 'No change'}
                          </span>
                        </div>
                      </div>
                    )}
                </div>
                {loading ? (
                  <div className="text-center py-12 text-lg text-gray-600 dark:text-gray-300">Loading scans...</div>
                ) : error ? (
                  <div className="text-center py-12 text-red-600 dark:text-red-400">{error}</div>
                ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {[{scan: scan1, id: scan1Id, feedback: feedback1, otherScan: scan2}, {scan: scan2, id: scan2Id, feedback: feedback2, otherScan: scan1}].map((data, idx) => {
                      const diffPII = getPIIDiff(data.scan?.pii || [], data.otherScan?.pii || []);
                      return (
                      <div key={idx} className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-8 border-2 border-blue-100 dark:border-blue-900 relative">
                        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                          <UserCheck className="w-6 h-6 text-blue-500" />
                          Scan {idx+1}: {data.id}
                        </h2>
                        <div className="mb-4 flex items-center gap-2">
                          <Shield className="w-5 h-5" />
                          <span className="font-medium">Score:</span>
                          <span className={`ml-2 text-xl font-bold ${getScoreColor(data.scan?.score?.score)}`}>{typeof data.scan?.score?.score === 'number' ? data.scan.score.score + '%' : 'N/A'}</span>
                        </div>
                        <div className="mb-2 text-sm text-gray-500 dark:text-gray-400 flex items-center gap-2">
                          <Info className="w-4 h-4" />
                          Date: {data.scan?.score?.created_at ? new Date(data.scan.score.created_at).toLocaleString() : 'N/A'}
                        </div>
                        <h3 className="font-semibold mb-2 mt-6 flex items-center gap-2"><CheckCircle className="w-5 h-5 text-green-500" />PII Detected:</h3>
                        <ul className="list-disc ml-6 mb-2">
                          {Array.isArray(data.scan?.pii) && data.scan.pii.length > 0 ? data.scan.pii.map((item: any, idx2: number) => {
                            const isDiff = diffPII.some(p => p.pii_type === item.pii_type && (p.pii_value ?? p.occurrences) === (item.pii_value ?? item.occurrences));
                            return (
                              <li key={idx2} className={isDiff ? "bg-yellow-100 dark:bg-yellow-900/40 rounded px-1 font-semibold" : ""}>
                                {String(item.pii_type)} - {String(item.pii_value ?? item.occurrences + ' occurrence(s)')}
                              </li>
                            );
                          }) : <li className="text-gray-400">No PII found</li>}
                        </ul>
                        
                     
                        {diffPII.length > 0 && (
                          <div className="mt-4 p-2 rounded bg-yellow-50 dark:bg-yellow-900/30 border-l-4 border-yellow-400 text-yellow-800 dark:text-yellow-200 text-sm">
                            <b>Difference :</b> {diffPII.length}  PII in this scan.
                          </div>
                        )}
                      </div>
                    )})}
                </div>
                )}
            </div>
      </div>
    );
}