import { Shield, Database, Lock, Eye, UserCheck, FileText, AlertTriangle, Mail, Phone, MapPin, Clock, Trash2, Download, Scale } from 'lucide-react';

export default function TermsCondition() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50/30 to-purple-50/30 dark:from-gray-900 dark:via-gray-900 dark:to-gray-800 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <Shield className="w-10 h-10 text-blue-500" />
            <h1 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white">
              Terms and Conditions
            </h1>
          </div>
          <p className="text-gray-600 dark:text-gray-400">
            Please read these terms and conditions carefully before using our Privacy Scanner service.
          </p>
          <p className="text-sm text-gray-500 dark:text-gray-500 mt-2">
            Last updated: February 9, 2026
          </p>
        </div>

        <div className="space-y-6">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 border border-gray-100 dark:border-gray-700">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                <FileText className="w-6 h-6 text-blue-500" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                1. Acceptance of Terms
              </h2>
            </div>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              By accessing or using our Privacy Scanner service ("Service"), you agree to be bound by these Terms and Conditions, our Privacy Policy, and the European General Data Protection Regulation (GDPR - Regulation EU 2016/679). If you do not agree to these terms, please do not use our Service.
            </p>
            <p className="text-gray-600 dark:text-gray-400">
              These terms apply to all users of the Service, including family pool chiefs who manage accounts for family members under their supervision.
            </p>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 border border-gray-100 dark:border-gray-700">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
                <Eye className="w-6 h-6 text-purple-500" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                2. Service Description
              </h2>
            </div>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              Our Privacy Scanner is a cybersecurity tool designed to help you understand your digital footprint by:
            </p>
            <ul className="list-disc list-inside text-gray-600 dark:text-gray-400 space-y-2 ml-4">
              <li>Scanning publicly available information about you on the internet</li>
              <li>Identifying Personally Identifiable Information (PII) that may be exposed</li>
              <li>Providing a privacy score to assess your digital exposure level</li>
              <li>Offering recommendations to improve your online privacy</li>
              <li>Allowing family chiefs to monitor the digital exposure of their family members</li>
            </ul>
          </div>

          <div className="bg-gradient-to-r from-blue-500 to-purple-500 rounded-xl shadow-lg p-1">
            <div className="bg-white dark:bg-gray-800 rounded-lg p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-gradient-to-r from-blue-500 to-purple-500 rounded-lg">
                  <Scale className="w-6 h-6 text-white" />
                </div>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                  3. GDPR Compliance & Data Protection
                </h2>
              </div>
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                We are committed to protecting your personal data in accordance with the General Data Protection Regulation (GDPR). This section explains how we collect, process, and protect your data.
              </p>

              <div className="space-y-6">
                <div className="border-l-4 border-blue-500 pl-4">
                  <h3 className="font-semibold text-gray-900 dark:text-white mb-2">3.1 Data Controller</h3>
                  <p className="text-gray-600 dark:text-gray-400">
                    Privacy Scanner ("we", "us", "our") acts as the Data Controller for the personal data processed through our Service. We determine the purposes and means of processing your personal data.
                  </p>
                </div>

                <div className="border-l-4 border-green-500 pl-4">
                  <h3 className="font-semibold text-gray-900 dark:text-white mb-2">3.2 Legal Basis for Processing (Article 6 GDPR)</h3>
                  <p className="text-gray-600 dark:text-gray-400 mb-2">We process your data based on:</p>
                  <ul className="list-disc list-inside text-gray-600 dark:text-gray-400 space-y-1 ml-4">
                    <li><strong>Consent (Art. 6(1)(a)):</strong> You explicitly consent to the processing when creating an account and initiating scans</li>
                    <li><strong>Contract Performance (Art. 6(1)(b)):</strong> Processing is necessary to provide you with the Service</li>
                    <li><strong>Legitimate Interest (Art. 6(1)(f)):</strong> For security, fraud prevention, and service improvement</li>
                  </ul>
                </div>

                <div className="border-l-4 border-purple-500 pl-4">
                  <h3 className="font-semibold text-gray-900 dark:text-white mb-2">3.3 Special Category Data (Article 9 GDPR)</h3>
                  <p className="text-gray-600 dark:text-gray-400">
                    Our scans may detect sensitive personal data (health information, religious beliefs, political opinions, etc.). This data is processed only with your explicit consent and solely to inform you of potential privacy risks. We do not use this data for any other purpose.
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 border border-gray-100 dark:border-gray-700">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
                <Database className="w-6 h-6 text-green-500" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                4. Data We Collect and Store
              </h2>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="bg-gray-50 dark:bg-gray-700/50">
                    <th className="text-left p-3 text-sm font-semibold text-gray-900 dark:text-white border-b dark:border-gray-600">Data Category</th>
                    <th className="text-left p-3 text-sm font-semibold text-gray-900 dark:text-white border-b dark:border-gray-600">What We Store</th>
                    <th className="text-left p-3 text-sm font-semibold text-gray-900 dark:text-white border-b dark:border-gray-600">Purpose</th>
                    <th className="text-left p-3 text-sm font-semibold text-gray-900 dark:text-white border-b dark:border-gray-600">Retention</th>
                  </tr>
                </thead>
                <tbody className="text-gray-600 dark:text-gray-400">
                  <tr className="border-b dark:border-gray-700">
                    <td className="p-3 font-medium">Account Information</td>
                    <td className="p-3">Username, email address, hashed password</td>
                    <td className="p-3">Account creation, authentication, communication</td>
                    <td className="p-3">Until account deletion</td>
                  </tr>
                  <tr className="border-b dark:border-gray-700 bg-gray-50/50 dark:bg-gray-700/20">
                    <td className="p-3 font-medium">Scan Results</td>
                    <td className="p-3">Privacy scores, scan dates, detected PII types and counts</td>
                    <td className="p-3">Display scan history, track privacy evolution</td>
                    <td className="p-3">Until user deletes or account closure</td>
                  </tr>
                  <tr className="border-b dark:border-gray-700">
                    <td className="p-3 font-medium">PII Details</td>
                    <td className="p-3">Type of PII found (email, phone, address, etc.), source, occurrence count</td>
                    <td className="p-3">Detailed analysis, risk assessment, recommendations</td>
                    <td className="p-3">Until scan deletion</td>
                  </tr>
                  <tr className="border-b dark:border-gray-700 bg-gray-50/50 dark:bg-gray-700/20">
                    <td className="p-3 font-medium">Family Pool Data</td>
                    <td className="p-3">Family name, member relationships, chief designation</td>
                    <td className="p-3">Enable family monitoring feature</td>
                    <td className="p-3">Until family pool is dissolved</td>
                  </tr>
                  <tr className="border-b dark:border-gray-700">
                    <td className="p-3 font-medium">Consent Records</td>
                    <td className="p-3">Consent status, timestamp, version accepted</td>
                    <td className="p-3">Legal compliance, proof of consent</td>
                    <td className="p-3">3 years after consent withdrawal</td>
                  </tr>
                  <tr className="bg-gray-50/50 dark:bg-gray-700/20">
                    <td className="p-3 font-medium">Technical Logs</td>
                    <td className="p-3">IP address (anonymized), browser type, access timestamps</td>
                    <td className="p-3">Security, debugging, service improvement</td>
                    <td className="p-3">90 days</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div className="mt-4 p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg border border-yellow-200 dark:border-yellow-800">
              <div className="flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-yellow-600 dark:text-yellow-400 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="font-semibold text-yellow-800 dark:text-yellow-300">Important Note on PII Storage</p>
                  <p className="text-sm text-yellow-700 dark:text-yellow-400 mt-1">
                    We store the <strong>type</strong> and <strong>occurrence count</strong> of detected PII, but NOT the actual sensitive values themselves (e.g., we record "credit card detected: 2 occurrences" but never store the actual card numbers). This minimizes data risk while still providing you with meaningful insights.
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 border border-gray-100 dark:border-gray-700">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-indigo-100 dark:bg-indigo-900/30 rounded-lg">
                <UserCheck className="w-6 h-6 text-indigo-500" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                5. Your Rights Under GDPR
              </h2>
            </div>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              Under the GDPR, you have the following rights regarding your personal data:
            </p>

            <div className="grid md:grid-cols-2 gap-4">
              <div className="p-4 bg-gray-50 dark:bg-gray-700/30 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <Eye className="w-5 h-5 text-blue-500" />
                  <h4 className="font-semibold text-gray-900 dark:text-white">Right of Access (Art. 15)</h4>
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Request a copy of all personal data we hold about you.
                </p>
              </div>

              <div className="p-4 bg-gray-50 dark:bg-gray-700/30 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <FileText className="w-5 h-5 text-green-500" />
                  <h4 className="font-semibold text-gray-900 dark:text-white">Right to Rectification (Art. 16)</h4>
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Request correction of inaccurate personal data.
                </p>
              </div>

              <div className="p-4 bg-gray-50 dark:bg-gray-700/30 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <Trash2 className="w-5 h-5 text-red-500" />
                  <h4 className="font-semibold text-gray-900 dark:text-white">Right to Erasure (Art. 17)</h4>
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Request deletion of your personal data ("right to be forgotten").
                </p>
              </div>

              <div className="p-4 bg-gray-50 dark:bg-gray-700/30 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <Lock className="w-5 h-5 text-orange-500" />
                  <h4 className="font-semibold text-gray-900 dark:text-white">Right to Restriction (Art. 18)</h4>
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Request limitation of processing of your data.
                </p>
              </div>

              <div className="p-4 bg-gray-50 dark:bg-gray-700/30 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <Download className="w-5 h-5 text-purple-500" />
                  <h4 className="font-semibold text-gray-900 dark:text-white">Right to Portability (Art. 20)</h4>
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Receive your data in a structured, machine-readable format.
                </p>
              </div>

              <div className="p-4 bg-gray-50 dark:bg-gray-700/30 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <AlertTriangle className="w-5 h-5 text-yellow-500" />
                  <h4 className="font-semibold text-gray-900 dark:text-white">Right to Object (Art. 21)</h4>
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Object to processing based on legitimate interests.
                </p>
              </div>
            </div>

            <div className="mt-4 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
              <p className="text-sm text-blue-700 dark:text-blue-400">
                <strong>How to exercise your rights:</strong> Send a request to our Data Protection Officer at <span className="font-mono">dpo@privacyscanner.com</span>. We will respond within 30 days as required by GDPR. You may also lodge a complaint with your local Data Protection Authority.
              </p>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 border border-gray-100 dark:border-gray-700">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-red-100 dark:bg-red-900/30 rounded-lg">
                <Lock className="w-6 h-6 text-red-500" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                6. Data Security Measures
              </h2>
            </div>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              We implement appropriate technical and organizational measures to protect your data:
            </p>
            <ul className="space-y-3">
              <li className="flex items-start gap-3 text-gray-600 dark:text-gray-400">
                <Shield className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                <span><strong>Encryption:</strong> All data is encrypted in transit (TLS 1.3) and at rest (AES-256)</span>
              </li>
              <li className="flex items-start gap-3 text-gray-600 dark:text-gray-400">
                <Shield className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                <span><strong>Password Security:</strong> Passwords are hashed using bcrypt with salt</span>
              </li>
              <li className="flex items-start gap-3 text-gray-600 dark:text-gray-400">
                <Shield className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                <span><strong>Access Control:</strong> Strict role-based access with JWT authentication</span>
              </li>
              <li className="flex items-start gap-3 text-gray-600 dark:text-gray-400">
                <Shield className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                <span><strong>Regular Audits:</strong> Security audits and penetration testing performed quarterly</span>
              </li>
              <li className="flex items-start gap-3 text-gray-600 dark:text-gray-400">
                <Shield className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                <span><strong>Data Minimization:</strong> We only collect data necessary for the Service</span>
              </li>
            </ul>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 border border-gray-100 dark:border-gray-700">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-cyan-100 dark:bg-cyan-900/30 rounded-lg">
                <Clock className="w-6 h-6 text-cyan-500" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                7. Data Retention Policy
              </h2>
            </div>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              We retain your personal data only for as long as necessary to fulfill the purposes for which it was collected:
            </p>
            <ul className="list-disc list-inside text-gray-600 dark:text-gray-400 space-y-2 ml-4">
              <li><strong>Active accounts:</strong> Data retained while account is active</li>
              <li><strong>Deleted accounts:</strong> Personal data deleted within 30 days; anonymized analytics may be retained</li>
              <li><strong>Scan data:</strong> Retained until you delete it or close your account</li>
              <li><strong>Legal requirements:</strong> Some data may be retained longer if required by law</li>
              <li><strong>Backup data:</strong> Removed from backups within 90 days of deletion request</li>
            </ul>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 border border-gray-100 dark:border-gray-700">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-orange-100 dark:bg-orange-900/30 rounded-lg">
                <MapPin className="w-6 h-6 text-orange-500" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                8. International Data Transfers
              </h2>
            </div>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              Your data is primarily stored and processed within the European Economic Area (EEA). If any data transfer outside the EEA is necessary, we ensure adequate protection through:
            </p>
            <ul className="list-disc list-inside text-gray-600 dark:text-gray-400 space-y-2 ml-4">
              <li>EU Standard Contractual Clauses (SCCs)</li>
              <li>Adequacy decisions by the European Commission</li>
              <li>Binding Corporate Rules where applicable</li>
            </ul>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 border border-gray-100 dark:border-gray-700">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-pink-100 dark:bg-pink-900/30 rounded-lg">
                <FileText className="w-6 h-6 text-pink-500" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                9. Use of Service
              </h2>
            </div>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              You agree to use our Service only for lawful purposes. You must not:
            </p>
            <ul className="list-disc list-inside text-gray-600 dark:text-gray-400 space-y-2 ml-4">
              <li>Use the Service to scan data of third parties without their consent</li>
              <li>Attempt to circumvent security measures</li>
              <li>Use automated tools to access the Service (except our official API)</li>
              <li>Resell or redistribute scan results commercially</li>
              <li>Use the Service for any illegal purpose</li>
            </ul>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 border border-gray-100 dark:border-gray-700">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-gray-100 dark:bg-gray-700 rounded-lg">
                <AlertTriangle className="w-6 h-6 text-gray-500" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                10. Limitation of Liability
              </h2>
            </div>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              Our Service provides informational analysis of publicly available data. We do not guarantee:
            </p>
            <ul className="list-disc list-inside text-gray-600 dark:text-gray-400 space-y-2 ml-4">
              <li>Complete detection of all exposed personal information</li>
              <li>Removal of detected information from third-party sources</li>
              <li>Prevention of future data exposure</li>
            </ul>
            <p className="text-gray-600 dark:text-gray-400 mt-4">
              To the maximum extent permitted by law, we shall not be liable for any indirect, incidental, special, consequential, or punitive damages arising from your use of the Service.
            </p>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 border border-gray-100 dark:border-gray-700">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-teal-100 dark:bg-teal-900/30 rounded-lg">
                <FileText className="w-6 h-6 text-teal-500" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                11. Changes to Terms
              </h2>
            </div>
            <p className="text-gray-600 dark:text-gray-400">
              We reserve the right to modify these Terms at any time. Material changes will be notified at least 30 days in advance via email or in-app notification. Continued use of the Service after changes constitutes acceptance of the new Terms.
            </p>
          </div>

          <div className="bg-gradient-to-r from-blue-500 to-purple-500 rounded-xl shadow-lg p-6 text-white">
            <div className="flex items-center gap-3 mb-4">
              <Mail className="w-6 h-6" />
              <h2 className="text-2xl font-bold">
                12. Contact Us
              </h2>
            </div>
            <p className="mb-4 opacity-90">
              If you have any questions about these Terms, our privacy practices, or wish to exercise your GDPR rights, please contact us:
            </p>
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <Mail className="w-5 h-5 opacity-80" />
                <span>General inquiries: <span className="font-mono">support@csc.com</span></span>
              </div>
              <div className="flex items-center gap-3">
                <Shield className="w-5 h-5 opacity-80" />
                <span>Data Protection Officer: <span className="font-mono">dpo@csc.com</span></span>
              </div>
              <div className="flex items-center gap-3">
                <Phone className="w-5 h-5 opacity-80" />
                <span>Phone: +33 1 23 45 67 89</span>
              </div>
              <div className="flex items-center gap-3">
                <MapPin className="w-5 h-5 opacity-80" />
                <span>Address: 123 Privacy Street</span>
              </div>
            </div>
          </div>

          <div className="text-center text-sm text-gray-500 dark:text-gray-400 py-4">
            <p>© 2026 CyberSafeCheck. All rights reserved.</p>
            <p className="mt-1">These Terms are governed by the laws of France and the European Union.</p>
          </div>
        </div>
      </div>
    </div>
  );
}