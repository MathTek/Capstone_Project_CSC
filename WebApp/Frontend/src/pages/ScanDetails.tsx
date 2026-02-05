import { useParams, useNavigate } from "react-router-dom";
import { getPIIDetailsByScanId } from "../services/api";
import { useState, useEffect } from 'react';
import { ArrowLeft } from 'lucide-react';
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
                setLoading(false);
                setPiiDetails(data.pii_details);
                console.log(piiDetails);
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

                    <div className="mb-6 p-4 bg-gray-50 dark:bg-gray-900/50 rounded-xl border border-gray-200 dark:border-gray-700">
                        <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">Risk Level Legend</h3>
                        <div className="flex flex-wrap gap-4">
                            <div className="flex items-center gap-2">
                                <div className="w-4 h-4 rounded-full bg-red-500"></div>
                                <span className="text-sm text-gray-600 dark:text-gray-400">Critical - Identity theft risk</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <div className="w-4 h-4 rounded-full bg-orange-500"></div>
                                <span className="text-sm text-gray-600 dark:text-gray-400">High - Financial risk</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <div className="w-4 h-4 rounded-full bg-yellow-500"></div>
                                <span className="text-sm text-gray-600 dark:text-gray-400">Medium - Sensitive data</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <div className="w-4 h-4 rounded-full bg-green-500"></div>
                                <span className="text-sm text-gray-600 dark:text-gray-400">Low - Personal info</span>
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
                                        <span className="bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 text-xs font-medium px-2 py-1 rounded-full">
                                            {items.length} found
                                        </span>
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
            </div>
        </div>
    );
}