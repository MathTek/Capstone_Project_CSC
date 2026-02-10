import { useParams, useNavigate } from "react-router-dom";
import { getPIIDetailsByScanId, getScoreByScanId, getFeedbacks } from "../services/api";
import { useState, useEffect } from 'react';
import { ArrowLeft, Lightbulb, AlertCircle } from 'lucide-react';
import { Mail, Phone, MapPin, AlertTriangle, Shield, CreditCard, Banknote, Paperclip, LucideIcon } from 'lucide-react';

const PII_ASSETS_BY_TYPE: Record<string, [string, LucideIcon, string]> = {
  "credit_card": ["bg-red-50 dark:bg-red-900/20", CreditCard, "border-l-4 border-l-red-500"],
  "social_security": ["bg-red-50 dark:bg-red-900/20", Shield, "border-l-4 border-l-red-500"],
  "passport": ["bg-red-50 dark:bg-red-900/20", Paperclip, "border-l-4 border-l-red-500"],

  "iban": ["bg-orange-50 dark:bg-orange-900/20", Banknote, "border-l-4 border-l-orange-500"],
  "bank_account": ["bg-orange-50 dark:bg-orange-900/20", Banknote, "border-l-4 border-l-orange-500"],
  "driving_license": ["bg-orange-50 dark:bg-orange-900/20", Paperclip, "border-l-4 border-l-orange-500"],

  "medical_info": ["bg-yellow-50 dark:bg-yellow-900/20", AlertTriangle, "border-l-4 border-l-yellow-500"],

  "address": ["bg-green-50 dark:bg-green-900/20", MapPin, "border-l-4 border-l-green-500"],
  "coordinates": ["bg-green-50 dark:bg-green-900/20", MapPin, "border-l-4 border-l-green-500"],
  "financial_info": ["bg-green-50 dark:bg-green-900/20", Banknote, "border-l-4 border-l-green-500"],
  "phone": ["bg-green-50 dark:bg-green-900/20", Phone, "border-l-4 border-l-green-500"],
  "sensitive_location": ["bg-green-50 dark:bg-green-900/20", MapPin, "border-l-4 border-l-green-500"],
  "email": ["bg-green-50 dark:bg-green-900/20", Mail, "border-l-4 border-l-green-500"],
  "birth_date": ["bg-green-50 dark:bg-green-900/20", MapPin, "border-l-4 border-l-green-500"],
  "personal_info": ["bg-green-50 dark:bg-green-900/20", MapPin, "border-l-4 border-l-green-500"],
  "full_name": ["bg-green-50 dark:bg-green-900/20", MapPin, "border-l-4 border-l-green-500"],
  "sensitive_keyword": ["bg-green-50 dark:bg-green-900/20", MapPin, "border-l-4 border-l-green-500"],
  "ip_address": ["bg-green-50 dark:bg-green-900/20", MapPin, "border-l-4 border-l-green-500"],
  "mac_address": ["bg-green-50 dark:bg-green-900/20", MapPin, "border-l-4 border-l-green-500"]
}

export default function ScanDetails() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const [piiDetails, setPiiDetails] = useState<any[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [score, setScore] = useState<number>(0);
    const [feedback, setFeedback] = useState<any[]>([]);

    
    
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

    
    useEffect(() => {
        const fetchPIIDetails = async () => {
    
            if (!id) return;
            
            try {
                const data = await getPIIDetailsByScanId(localStorage.getItem("csc_token"), Number(id));
                const score_data = await getScoreByScanId(localStorage.getItem("csc_token"), Number(id));
                const feedback_data = await getFeedbacks(localStorage.getItem("csc_token"), Number(id));
                setLoading(false);
                setScore(score_data.score.score);
                setFeedback(feedback_data.feedback);
                setPiiDetails(data.pii_details);

                console.log(piiDetails);
                console.log(score_data.score.score);
                console.log(feedback);
            } catch (error) {
                console.error("Error fetching PII details:", error);
            }
        };

        fetchPIIDetails();
    }, [id]);


    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50/30 to-purple-50/30 dark:from-gray-900 dark:via-gray-900 dark:to-gray-800 py-8">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="mb-8">
                    <div className="flex items-center justify-between mb-2">
                        <h1 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white">
                            Scan Details 
                        </h1>
                        <button
                            onClick={() => navigate(-1)}
                            className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 font-medium rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm transition-all hover:shadow-md"
                        >
                            <ArrowLeft className="w-4 h-4" />
                            Back
                        </button>
                    </div>
                    {!loading && piiDetails.length > 0 && (
                        <>
                        <p className="text-gray-600 dark:text-gray-400 ">
                            Details of personally identifiable information (PII) found in the scan made the {formatDate(piiDetails[0].created_at)}.
                        </p>
                        <p className="text-gray-600 dark:text-gray-400 ">
                            Note that CSC can only detect PII that matches predefined patterns and may not identify all sensitive information present in the scanned data and can also produce false positives.
                        </p>
                        <p className="text-gray-600 dark:text-gray-400 ">
                            Be sure to beware of potential undetected sensitive information.
                        </p>
                    </>
                    )}
                </div>

                <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-8 mb-8">
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
                        Detected Sensitive Information
                    </h2>

                    <div className="mb-6 p-5 bg-gray-50 dark:bg-gray-900/50 rounded-xl border border-gray-200 dark:border-gray-700">
                        <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-4 flex items-center gap-2">
                            <Shield className="w-4 h-4" />
                            Risk Level Legend
                        </h3>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
                            <div className="flex items-center gap-2 p-2 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800">
                                <div className="w-3 h-3 rounded-full bg-red-500 shadow-sm"></div>
                                <div>
                                    <span className="text-xs font-medium text-red-700 dark:text-red-300 block">Critical</span>
                                    <span className="text-xs text-red-600 dark:text-red-400">Identity theft risk</span>
                                </div>
                            </div>
                            <div className="flex items-center gap-2 p-2 bg-orange-50 dark:bg-orange-900/20 rounded-lg border border-orange-200 dark:border-orange-800">
                                <div className="w-3 h-3 rounded-full bg-orange-500 shadow-sm"></div>
                                <div>
                                    <span className="text-xs font-medium text-orange-700 dark:text-orange-300 block">High</span>
                                    <span className="text-xs text-orange-600 dark:text-orange-400">Financial risk</span>
                                </div>
                            </div>
                            <div className="flex items-center gap-2 p-2 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg border border-yellow-200 dark:border-yellow-800">
                                <div className="w-3 h-3 rounded-full bg-yellow-500 shadow-sm"></div>
                                <div>
                                    <span className="text-xs font-medium text-yellow-700 dark:text-yellow-300 block">Medium</span>
                                    <span className="text-xs text-yellow-600 dark:text-yellow-400">Sensitive data</span>
                                </div>
                            </div>
                            <div className="flex items-center gap-2 p-2 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
                                <div className="w-3 h-3 rounded-full bg-green-500 shadow-sm"></div>
                                <div>
                                    <span className="text-xs font-medium text-green-700 dark:text-green-300 block">Low</span>
                                    <span className="text-xs text-green-600 dark:text-green-400">Personal info</span>
                                </div>
                            </div>
                        </div>

                        <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
                            <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3 flex items-center gap-2">
                                <AlertTriangle className="w-4 h-4" />
                                How is the risk score calculated?
                            </h3>
                            <div className="space-y-3">
                                <div className="flex items-start gap-3">
                                    <span className="flex-shrink-0 w-6 h-6 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-full flex items-center justify-center text-xs font-bold">1</span>
                                    <p className="text-gray-600 dark:text-gray-400 text-sm">
                                        We use a <strong>weight factor system</strong> based on the type and sensitivity of the data involved.
                                    </p>
                                </div>
                                <div className="flex items-start gap-3">
                                    <span className="flex-shrink-0 w-6 h-6 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-full flex items-center justify-center text-xs font-bold">2</span>
                                    <p className="text-gray-600 dark:text-gray-400 text-sm">
                                        The score is calculated by multiplying: <code className="px-1.5 py-0.5 bg-gray-200 dark:bg-gray-700 rounded text-xs">PII weight × occurrences × source weight</code>
                                    </p>
                                </div>
                                <div className="flex items-start gap-3">
                                    <span className="flex-shrink-0 w-6 h-6 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-full flex items-center justify-center text-xs font-bold">3</span>
                                    <div className="text-gray-600 dark:text-gray-400 text-sm">
                                        <strong>Occurrence multiplier:</strong>
                                        <span className="ml-2 inline-flex gap-1 flex-wrap mt-1">
                                            <span className="px-2 py-0.5 bg-gray-200 dark:bg-gray-700 rounded text-xs">2× → 1.2</span>
                                            <span className="px-2 py-0.5 bg-gray-200 dark:bg-gray-700 rounded text-xs">3× → 1.3</span>
                                            <span className="px-2 py-0.5 bg-gray-200 dark:bg-gray-700 rounded text-xs">4× → 1.4</span>
                                            <span className="px-2 py-0.5 bg-gray-200 dark:bg-gray-700 rounded text-xs">5+× → 1.5</span>
                                        </span>
                                    </div>
                                </div>
                                <div className="flex items-start gap-3">
                                    <span className="flex-shrink-0 w-6 h-6 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-full flex items-center justify-center text-xs font-bold">4</span>
                                    <div className="text-gray-600 dark:text-gray-400 text-sm">
                                        <strong>Source weights:</strong>
                                        <span className="ml-2 inline-flex gap-1 flex-wrap mt-1">
                                            <span className="px-2 py-0.5 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 rounded text-xs">Highlight: 1.5×</span>
                                            <span className="px-2 py-0.5 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded text-xs">Bio: 1.2×</span>
                                            <span className="px-2 py-0.5 bg-gray-200 dark:bg-gray-700 rounded text-xs">Posts: 1.0×</span>
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
                        {Object.entries(
                            piiDetails.reduce<Record<string, any[]>>((acc, item) => {
                                if (!acc[item.pii_type]) {
                                    acc[item.pii_type] = [];
                                }
                                acc[item.pii_type].push(item);
                                return acc;
                            }, {})
                        ).map(([piiType, items]: [string, any[]], index: number) => {
                            const IconComponent = PII_ASSETS_BY_TYPE[piiType]?.[1];
                            const bgColor = PII_ASSETS_BY_TYPE[piiType]?.[0] || "bg-gray-50 dark:bg-gray-900/20";
                            const borderColor = PII_ASSETS_BY_TYPE[piiType]?.[2] || "border-l-4 border-l-gray-500";
                            const totalOccurrences = items.reduce((sum: number, item: any) => sum + (item.occurrences || 1), 0);

                            return (
                                <div key={index} className={`${bgColor} ${borderColor} rounded-lg p-5 border border-gray-200 dark:border-gray-700 shadow-sm hover:shadow-md transition-shadow`}>
                                    <div className="flex items-center justify-between mb-3">
                                        <div className="flex items-center space-x-3">
                                            {IconComponent && <IconComponent className="w-5 h-5 text-gray-700 dark:text-gray-300" />}
                                            <h3 className="font-semibold text-gray-900 dark:text-white text-sm">
                                                {piiType.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                                            </h3>
                                        </div>
                                        
                                    </div>
                                    
                                    <div className="space-y-2 max-h-32 overflow-y-auto">
                                        {items.map((item, idx) => (
                                            <div key={idx} className="bg-white/50 dark:bg-gray-900/30 rounded-md p-2 text-sm">
                                                
                                                {item.source && (
                                                    <p className="text-xs text-gray-500 dark:text-gray-400">
                                                       Found in your: {item.source}
                                                    </p>
                                                )}
                                            </div>
                                        ))}
                                    </div>

                                    <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-600">
                                        <p className="text-xs text-gray-500 dark:text-gray-400">
                                            Total occurrences: {totalOccurrences}
                                        </p>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>

                <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-8 mb-8">
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
                        Feedback and Recommendations
                    </h2>

                    <div className="mb-6 p-4 bg-gray-50 dark:bg-gray-900/50 rounded-xl border border-gray-200 dark:border-gray-700">
                        <div className="flex items-center justify-between">
                            <div>
                                <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">Your Risk Score</h3>
                                <p className="text-gray-600 dark:text-gray-400 text-sm">
                                    {score >= 60 ? "Your profile is well protected" : 
                                     score >= 40 ? "Some improvements are recommended" : 
                                     "Immediate action is recommended"}
                                </p>
                            </div>
                            <div className="text-right">
                                <span className={`text-3xl font-bold ${
                                    score <= 30 ? "text-red-600 dark:text-red-400" : 
                                    score <= 60 ? "text-yellow-600 dark:text-yellow-400" : 
                                    "text-green-600 dark:text-green-400"
                                }`}>{score}</span>
                                <span className="text-gray-500 dark:text-gray-400 text-lg">/100</span>
                            </div>
                        </div>
                    </div>

                    <div className="space-y-4">
                        {Array.from(new Set(piiDetails.map(item => item.pii_type))).map((piiType, idx) => {
                            const feedbackItem = feedback.find((f: any) => f.pii_type === piiType);
                            const recommendation = feedbackItem?.advice || "Review and consider removing this information.";
                            const message = feedbackItem?.message || "";
                            const impact = feedbackItem?.impact || 0;
                            
                            const impactColor = impact >= 40 ? "border-l-red-500 bg-red-50 dark:bg-red-900/20" : 
                                               impact >= 30 ? "border-l-orange-500 bg-orange-50 dark:bg-orange-900/20" : 
                                               impact >= 20 ? "border-l-yellow-500 bg-yellow-50 dark:bg-yellow-900/20" : 
                                               "border-l-green-500 bg-green-50 dark:bg-green-900/20";

                            const IconComponent = PII_ASSETS_BY_TYPE[piiType]?.[1] || AlertCircle;

                            return (
                                <div 
                                    key={idx} 
                                    className={`${impactColor} border-l-4 border border-gray-200 dark:border-gray-700 rounded-lg p-4 hover:shadow-md transition-shadow`}
                                >
                                    <div className="flex items-start gap-3">
                                        <IconComponent className="w-5 h-5 text-gray-700 dark:text-gray-300 mt-0.5 flex-shrink-0" />
                                        <div className="flex-1">
                                            <div className="flex items-center justify-between mb-2">
                                                <h3 className="font-semibold text-gray-900 dark:text-white">
                                                    {piiType.replace(/_/g, ' ').replace(/\b\w/g, (l: string) => l.toUpperCase())}
                                                </h3>
                                                <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                                                    impact >= 40 ? "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300" : 
                                                    impact >= 30 ? "bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-300" : 
                                                    impact >= 20 ? "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/40 dark:text-yellow-300" : 
                                                    "bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300"
                                                }`}>
                                                    Impact: -{impact} pts
                                                </span>
                                            </div>
                                            
                                            {message && (
                                                <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                                                    {message}
                                                </p>
                                            )}
                                            
                                            <div className="flex items-start gap-2 text-sm">
                                                <Lightbulb className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" />
                                                <p className="text-gray-700 dark:text-gray-300">
                                                    {recommendation}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>

                    {piiDetails.length === 0 && (
                        <div className="text-center py-8">
                            <p className="text-gray-500 dark:text-gray-400">
                                No sensitive information detected. Your profile appears to be clean.
                            </p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}