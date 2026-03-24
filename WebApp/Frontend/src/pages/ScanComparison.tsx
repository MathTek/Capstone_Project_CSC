import { useSearchParams } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { getPIIDetailsByScanId, getScoreByScanId, getFeedbacks } from "../services/api";
import { CheckCircle, Info, UserCheck, Shield, ArrowUpRight, ArrowDownRight, Minus, Target, AlertCircle } from "lucide-react";

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
                  setError('Unable to retrieve score information for one or both scans.');
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

    const getSourceCount = (piiArr: any[]) => {
      const counts: Record<string, number> = {};
      if (!Array.isArray(piiArr)) return counts;
      for (const pii of piiArr) {
        counts[pii.source] = (counts[pii.source] || 0) + 1;
      }
      return counts;
    };

    const getScoreBgColor = (score: number | null | undefined) => {
      if (typeof score !== 'number') return 'bg-gray-100 dark:bg-gray-700';
      if (score >= 80) return 'bg-green-100 dark:bg-green-900/30';
      if (score >= 50) return 'bg-yellow-100 dark:bg-yellow-900/30';
      return 'bg-red-100 dark:bg-red-900/30';
    };

    const getPIIDiff = (piiA: any[], piiB: any[]) => {
      const setB = new Set(piiB.map(p => p.pii_type + ':' + (p.pii_value ?? p.occurrences)));
      return piiA.filter(p => !setB.has(p.pii_type + ':' + (p.pii_value ?? p.occurrences)));
    };

    const getRiskLevel = (score: number | null | undefined) => {
      if (typeof score !== 'number') return 'Unknown';
      if (score >= 80) return 'Low';
      if (score >= 60) return 'Medium';
      if (score >= 40) return 'High';
      if (score <= 40) return 'Critical';
      return 'Minimal';
    };

    const getRiskColor = (score: number | null | undefined) => {
      if (typeof score !== 'number') return 'text-gray-500';
      if (score >= 80) return 'text-green-500';
      if (score >= 60) return 'text-yellow-500';
      if (score >= 40) return 'text-red-500';
      return 'text-gray-500 dark:text-red-500';
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
                <div className="space-y-8">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {[{scan: scan1, id: scan1Id, feedback: feedback1, otherScan: scan2}, {scan: scan2, id: scan2Id, feedback: feedback2, otherScan: scan1}].map((data, idx) => {
                      const diffPII = getPIIDiff(data.scan?.pii || [], data.otherScan?.pii || []);
                      const piiTypes = countPIITypes(data.scan?.pii || []);
                      const sourceCount = getSourceCount(data.scan?.pii || []);
                      const totalPII = Array.isArray(data.scan?.pii) ? data.scan.pii.length : 0;
                      const score = typeof data.scan?.score?.score === 'number' ? data.scan.score.score : null;

                      return (
                      <div key={idx} className="space-y-4">
                        <div className={`bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6 border-2 border-blue-100 dark:border-blue-900 ${score !== null && getScoreBgColor(score)}`}>
                          <div className="flex items-center justify-between mb-4">
                            <h2 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                              <UserCheck className="w-6 h-6 text-blue-500" />
                              Scan {idx+1}: {data.id}
                            </h2>
                            <span className={`px-3 py-1 rounded-full font-bold text-sm ${score !== null ? `${getRiskColor(score)} ${getScoreBgColor(score)}` : 'text-gray-400'}`}>
                              {getRiskLevel(score)}
                            </span>
                          </div>

                          <div className="grid grid-cols-3 gap-3 mb-6">
                            <div className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/40 dark:to-blue-900/20 rounded-lg p-3 text-center">
                              <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">{score ?? 'N/A'}{score !== null ? '%' : ''}</div>
                              <div className="text-xs text-gray-600 dark:text-gray-400">Risk Score</div>
                            </div>
                            <div className="bg-gradient-to-br from-red-50 to-red-100 dark:from-red-900/40 dark:to-red-900/20 rounded-lg p-3 text-center">
                              <div className="text-2xl font-bold text-red-600 dark:text-red-400">{totalPII}</div>
                              <div className="text-xs text-gray-600 dark:text-gray-400">Total PII</div>
                            </div>
                            <div className="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/40 dark:to-purple-900/20 rounded-lg p-3 text-center">
                              <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">{Object.keys(piiTypes).length}</div>
                              <div className="text-xs text-gray-600 dark:text-gray-400">Types</div>
                            </div>
                          </div>

                          <div className="text-sm text-gray-600 dark:text-gray-400 space-y-1 mb-4">
                            <div className="flex items-center gap-2">
                              <Info className="w-4 h-4" />
                              <span>Scanned on {data.scan?.score?.created_at ? new Date(data.scan.score.created_at).toLocaleString() : 'N/A'}</span>
                            </div>
                            {data.scan?.score?.media && (
                              <div className="flex items-center gap-2">
                                <Shield className="w-4 h-4" />
                                <span>Source: {data.scan.score.media}</span>
                              </div>
                            )}
                            {data.scan?.score?.pii_count !== undefined && (
                              <div className="flex items-center gap-2">
                                <CheckCircle className="w-4 h-4" />
                                <span>Total instances: {data.scan.score.pii_count}</span>
                              </div>
                            )}
                          </div>
                        </div>

                        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6 border-l-4 border-red-400">
                          <h3 className="font-semibold mb-4 text-lg flex items-center gap-2">
                            <AlertCircle className="w-5 h-5 text-red-500" />
                            PII Breakdown
                          </h3>
                          
                          <div className="mb-4">
                            <div className="font-semibold text-yellow-700 dark:text-yellow-300 flex items-center gap-2 mb-2">
                              <Info className="w-4 h-4" /> Only in this scan
                            </div>
                            <div className="space-y-2">
                              {diffPII.length > 0 ? diffPII.map((item: any, idx2: number) => (
                                <div key={idx2} className="bg-yellow-100 dark:bg-yellow-900/40 rounded-lg p-2 flex items-center gap-2">
                                  <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                                  <span className="text-sm font-medium">{item.pii_type}</span>
                                  <span className="text-xs text-gray-600 dark:text-gray-400">({item.occurrences || 1} occ.)</span>
                                  {item.source && <span className="text-xs bg-yellow-200 dark:bg-yellow-900 px-2 rounded">{item.source}</span>}
                                </div>
                              )) : <div className="text-sm text-gray-500">None - all PII are shared with the other scan</div>}
                            </div>
                          </div>

                          <div>
                            <div className="font-semibold text-green-700 dark:text-green-300 flex items-center gap-2 mb-2">
                              <CheckCircle className="w-4 h-4" /> Shared with other scan
                            </div>
                            <div className="space-y-2">
                              {Array.isArray(data.scan?.pii) && data.scan.pii.filter((item: any) => !diffPII.some(p => p.pii_type === item.pii_type && (p.pii_value ?? p.occurrences) === (item.pii_value ?? item.occurrences))).length > 0 ? 
                                data.scan.pii.filter((item: any) => !diffPII.some(p => p.pii_type === item.pii_type && (p.pii_value ?? p.occurrences) === (item.pii_value ?? item.occurrences))).map((item: any, idx2: number) => (
                                  <div key={idx2} className="bg-green-100 dark:bg-green-900/40 rounded-lg p-2 flex items-center gap-2">
                                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                                    <span className="text-sm font-medium">{item.pii_type}</span>
                                    <span className="text-xs text-gray-600 dark:text-gray-400">({item.occurrences || 1} occ.)</span>
                                    {item.source && <span className="text-xs bg-green-200 dark:bg-green-900 px-2 rounded">{item.source}</span>}
                                  </div>
                                )) 
                              : <div className="text-sm text-gray-500">None</div>}
                            </div>
                          </div>
                        </div>

                        {Object.keys(piiTypes).length > 0 && (
                          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6 border-l-4 border-purple-400">
                            <h4 className="font-semibold mb-4 flex items-center gap-2">
                              <Shield className="w-5 h-5 text-purple-500" />
                              PII Types Distribution
                            </h4>
                            <div className="grid grid-cols-2 gap-3">
                              {Object.entries(piiTypes).map(([type, count]) => (
                                <div key={type} className="bg-purple-50 dark:bg-purple-900/30 rounded-lg p-3">
                                  <div className="font-semibold text-purple-700 dark:text-purple-300">{count}</div>
                                  <div className="text-xs text-gray-600 dark:text-gray-400">{type}</div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {Object.keys(sourceCount).length > 0 && (
                          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6 border-l-4 border-blue-400">
                            <h4 className="font-semibold mb-4 flex items-center gap-2">
                              <Shield className="w-5 h-5 text-blue-500" />
                              Source Distribution
                            </h4>
                            <div className="grid grid-cols-3 gap-3">
                              {Object.entries(sourceCount).map(([source, count]) => (
                                <div key={source} className="bg-blue-50 dark:bg-blue-900/30 rounded-lg p-3 text-center">
                                  <div className="font-semibold text-blue-700 dark:text-blue-300">{count}</div>
                                  <div className="text-xs text-gray-600 dark:text-gray-400 capitalize">{source}</div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {feedback1.length > 0 && idx === 0 && (
                          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6 border-l-4 border-cyan-400">
                            <h4 className="font-semibold mb-3 flex items-center gap-2">
                              <Info className="w-5 h-5 text-cyan-500" />
                              Insights & Recommendations
                            </h4>
                            <div className="space-y-2">
                              {feedback1.slice(0, 3).map((fb: any, idx2: number) => (
                                <div key={idx2} className="text-sm text-gray-700 dark:text-gray-300 bg-cyan-50 dark:bg-cyan-900/20 p-2 rounded">
                                  {fb.message || fb.feedback || JSON.stringify(fb)}
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {feedback2.length > 0 && idx === 1 && (
                          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6 border-l-4 border-cyan-400">
                            <h4 className="font-semibold mb-3 flex items-center gap-2">
                              <Info className="w-5 h-5 text-cyan-500" />
                              Insights & Recommendations
                            </h4>
                            <div className="space-y-2">
                              {feedback2.slice(0, 3).map((fb: any, idx2: number) => (
                                <div key={idx2} className="text-sm text-gray-700 dark:text-gray-300 bg-cyan-50 dark:bg-cyan-900/20 p-2 rounded">
                                  {fb.message || fb.feedback || JSON.stringify(fb)}
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    )})}
                  </div>

                  {scan1?.pii && scan2?.pii && (
                    <div className="bg-gradient-to-r from-indigo-50 to-blue-50 dark:from-indigo-900/30 dark:to-blue-900/30 rounded-2xl shadow-lg p-8 border-2 border-indigo-200 dark:border-indigo-800">
                      <h3 className="text-2xl font-bold mb-6 text-gray-900 dark:text-white flex items-center gap-2">
                        <Target className="w-6 h-6 text-indigo-500" />
                        Detailed Comparison Summary
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="bg-white dark:bg-gray-800 rounded-xl p-4">
                          <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">Total Unique PII in Scan 1</div>
                          <div className="text-3xl font-bold text-orange-600 dark:text-orange-400">{getPIIDiff(scan1?.pii || [], scan2?.pii || []).length}</div>
                        </div>
                        <div className="bg-white dark:bg-gray-800 rounded-xl p-4">
                          <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">Shared PII between scans</div>
                          <div className="text-3xl font-bold text-green-600 dark:text-green-400">
                            {(scan1?.pii || []).filter((item: any) => !getPIIDiff(scan1?.pii || [], scan2?.pii || []).some(p => p.pii_type === item.pii_type && (p.pii_value ?? p.occurrences) === (item.pii_value ?? item.occurrences))).length}
                          </div>
                        </div>
                        <div className="bg-white dark:bg-gray-800 rounded-xl p-4">
                          <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">Total Unique PII in Scan 2</div>
                          <div className="text-3xl font-bold text-orange-600 dark:text-orange-400">{getPIIDiff(scan2?.pii || [], scan1?.pii || []).length}</div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
                )}
            </div>
      </div>
    );
}
