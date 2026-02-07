import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { getFamilyPoolByUserId, createFamilyMember, getUserById, removeFamilyMember } from "../services/api";

interface FamilyMember {
    id: number;
    member_id: number;
    family_name: string;
}

export default function FamilyPool() {
    const navigate = useNavigate();
    const [familyMembers, setFamilyMembers] = useState<FamilyMember[]>([]);
    const [memberUsernames, setMemberUsernames] = useState<Record<number, string>>({});
    const [familyExists, setFamilyExists] = useState(false);
    const [isChief, setIsChief] = useState(false);
    const familyNameRef = useRef<HTMLInputElement>(null);
    const memberUsernameRef = useRef<HTMLInputElement>(null);
    const [chiefUsername, setChiefUsername] = useState<string>("");
    const [familyNameForAdd, setFamilyNameForAdd] = useState<string>("");

    const [alert, setAlert] = useState<{ show: boolean; type: 'success' | 'error'; message: string }>({
        show: false,
        type: 'success',
        message: ''
    });

    const showAlert = (type: 'success' | 'error', message: string) => {
        setAlert({ show: true, type, message });
        setTimeout(() => setAlert({ show: false, type: 'success', message: '' }), 4000);
    };

    const [creationModal, setCreationModal] =  useState<{ isOpen: boolean; userId: number | null; isCreating: boolean }>({
        isOpen: false,
        userId: null,
        isCreating: false
    });

    const handleCreateFamilyMember = () => {
        setCreationModal({ isOpen: true, userId: null, isCreating: true });
    };

    const handleCloseModal = () => {
        setCreationModal({ isOpen: false, userId: null, isCreating: false });
    };

    const getUserByID = async (userId: number) => {
        try {
            const response = await getUserById(localStorage.getItem("csc_token"), userId);
            return response.username || "Unknown User";
        } catch (error) {
            console.error("Error fetching user by ID:", error);
            return "Unknown User";
        }
    }


    const handleCreate = async (userId: number, familyName: string, member_username: string) => {
        setCreationModal({ isOpen: false, userId: null, isCreating: false });

        if (familyName.trim() === "" ) {
            familyName = familyNameForAdd;
        }

        console.log("Creating family member with:", { userId, familyName, member_username });
        try {
            const response = await createFamilyMember(localStorage.getItem("csc_token"), userId, familyName, member_username);
            console.log("Family member created successfully:", response);
            showAlert('success', 'Family member added successfully!');
            await fetchFamilyMembers();
        } catch (error) {
            console.error("Error creating family member:", error);
            showAlert('error', 'Failed to create family member. Please try again.');
        }
    };

    const handleRemoveFamilyMember = async (memberId: number) => {
        for (const member of familyMembers) {
            if (member.member_id === memberId) {
                try {
                    await removeFamilyMember(localStorage.getItem("csc_token"), member.id);
                    showAlert('success', 'Family member removed successfully!');
                    await fetchFamilyMembers();
                } catch (error) {
                    console.error("Error removing family member:", error);
                    showAlert('error', 'Failed to remove family member. Please try again.');
                }
                break;
            }
        }
    };

    const fetchFamilyMembers = async () => {
        const response = await getFamilyPoolByUserId(localStorage.getItem("csc_token"), parseInt(localStorage.getItem("csc_user_id") || "0"));
        const members = response.family_pool || [];
        console.log("API response for family pool:", members);

        
        if (members.length > 0) {
            setFamilyExists(true);
            members.forEach(async (member: any) => {
                if (member.chief_id === parseInt(localStorage.getItem("csc_user_id") || "0")) {
                    setFamilyNameForAdd(member.family_name || "");
                    setChiefUsername(await getUserByID(member.chief_id) || "Chief");
                    setIsChief(true);
                } else {
                    setChiefUsername(await getUserByID(member.chief_id) || "Chief");
                    setIsChief(false);
                }
            });
        } else {
            setFamilyExists(false);
            setIsChief(false);
        }


        setFamilyMembers(members);

        const usernames: Record<number, string> = {};
        await Promise.all(
            members.map(async (member: any) => {
                const username = await getUserByID(member.member_id);
                usernames[member.member_id] = username;
            })
        );
        setMemberUsernames(usernames);
    };

    useEffect(() => {
        fetchFamilyMembers();
    }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50/30 to-purple-50/30 dark:from-gray-900 dark:via-gray-900 dark:to-gray-800 py-8">
            {alert.show && (
                <div className="fixed top-20 left-1/2 transform -translate-x-1/2 z-50">
                    <div className={`flex items-center gap-3 px-5 py-3 rounded-lg shadow-lg ${
                        alert.type === 'success' 
                            ? 'bg-green-50 dark:bg-green-900/30 border border-green-200 dark:border-green-800' 
                            : 'bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800'
                    }`}>
                        {alert.type === 'success' ? (
                            <svg className="w-5 h-5 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                        ) : (
                            <svg className="w-5 h-5 text-red-600 dark:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        )}
                        <p className={`text-sm font-medium ${
                            alert.type === 'success' 
                                ? 'text-green-800 dark:text-green-200' 
                                : 'text-red-800 dark:text-red-200'
                        }`}>
                            {alert.message}
                        </p>
                        <button 
                            onClick={() => setAlert({ show: false, type: 'success', message: '' })}
                            className={`ml-2 ${
                                alert.type === 'success' 
                                    ? 'text-green-600 dark:text-green-400 hover:text-green-800' 
                                    : 'text-red-600 dark:text-red-400 hover:text-red-800'
                            }`}
                        >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>
                </div>
            )}

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="mb-8">
                    <div className="flex items-center gap-3 mb-2">
                        <h1 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white">
                            Family Pool
                        </h1>
                    </div>
                    <p className="text-gray-600 dark:text-gray-400 ">
                        Manage your family members and view their privacy risk scores.
                    </p>
                </div>
                 <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-8 mb-8">
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
                        Your Family{familyMembers.length > 0 && familyMembers[0].family_name ? `: ${familyMembers[0].family_name}` : ""}
                    </h2>
                    {!familyExists ? (
                        <div>
                            <p className="text-gray-600 dark:text-gray-400">
                                You don't have a family pool yet. Create one to monitor and protect your family members' privacy.
                            </p>
                            <button className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                                onClick={handleCreateFamilyMember}
                            >
                                + Create Family Pool
                            </button>
                        </div>
                    ) : (
                        <div>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                <div className="relative bg-gradient-to-br from-yellow-50 to-orange-50 dark:from-yellow-900/20 dark:to-orange-900/20 rounded-xl p-6 border-2 border-yellow-300 dark:border-yellow-600 shadow-md flex flex-col items-center justify-center text-center">
                                    <div className="absolute -top-2 -right-2">
                                        <span className="inline-flex items-center gap-1 px-3 py-1 text-xs font-semibold bg-yellow-400 text-yellow-900 rounded-full shadow-sm">
                                            <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                                                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                                            </svg>
                                            Chief
                                        </span>
                                    </div>
                                    {isChief && (
                                        <div className="absolute -top-2 -left-2">
                                            <span className="inline-flex items-center px-2.5 py-1 text-xs font-semibold bg-green-500 text-white rounded-full shadow-sm">
                                                You
                                            </span>
                                        </div>
                                    )}
                                    <div className="w-16 h-16 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full flex items-center justify-center text-white font-bold text-2xl shadow-lg mb-3">
                                        {chiefUsername.charAt(0).toUpperCase() || "?"}
                                    </div>
                                    <p className="text-lg font-semibold text-gray-900 dark:text-white">
                                        {chiefUsername || "Loading..."}
                                    </p>
                                    <p className="text-sm text-yellow-700 dark:text-yellow-400">Family Administrator</p>
                                </div>

                                {familyMembers.map((member: any) => (
                                    <div key={member.id} className="relative bg-white dark:bg-gray-700 rounded-xl p-5 border border-gray-200 dark:border-gray-600 shadow-sm hover:shadow-md transition-shadow">
                                        <div className="absolute -top-2 -right-2">
                                            <span className="inline-flex items-center gap-1 px-3 py-1 text-xs font-semibold bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300 rounded-full">
                                                <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                                                    <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                                                </svg>
                                                Member
                                            </span>
                                        </div>
                                        {member.member_id === parseInt(localStorage.getItem("csc_user_id") || "0") && (
                                            <div className="absolute -top-2 -left-2">
                                                <span className="inline-flex items-center px-2.5 py-1 text-xs font-semibold bg-green-500 text-white rounded-full shadow-sm">
                                                    You
                                                </span>
                                            </div>
                                        )}
                                        <div className="flex items-center gap-4 mb-4">
                                            <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center text-white font-bold text-xl shadow-lg">
                                                {(memberUsernames[member.member_id] || "?").charAt(0).toUpperCase()}
                                            </div>
                                            <div>
                                                <p className="text-lg font-semibold text-gray-900 dark:text-white">
                                                    {memberUsernames[member.member_id] || "Loading..."}
                                                </p>
                                                <p className="text-sm text-gray-500 dark:text-gray-400">Family Member</p>
                                            </div>
                                        </div>
                                        <div className="flex gap-2">
                                            <button
                                                onClick={() => navigate(`/family-scan-history/${member.member_id}`)}
                                                className="flex-1 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors text-sm font-medium flex items-center justify-center gap-2"
                                            >
                                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                                                </svg>
                                                History
                                            </button>
                                            {isChief && (
                                                <button
                                                    onClick={() => handleRemoveFamilyMember(member.member_id)}
                                                    className="px-4 py-2.5 bg-red-100 hover:bg-red-200 dark:bg-red-900/30 dark:hover:bg-red-900/50 text-red-600 dark:text-red-400 rounded-lg transition-colors text-sm font-medium"
                                                    title="Remove member"
                                                >
                                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                                    </svg>
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                            {isChief && (
                                <button className="mt-8 px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-xl transition-all font-medium shadow-lg hover:shadow-xl flex items-center gap-2 mx-auto"
                                    onClick={handleCreateFamilyMember}
                                >
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                                    </svg>
                                    Add Family Member
                                </button>
                            )}
                        </div>
                    )}
                </div>
            </div>

            {creationModal.isOpen && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-full max-w-md overflow-hidden">
                        <div className="bg-blue-600 px-6 py-4">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
                                        <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                                        </svg>
                                    </div>
                                    <h3 className="text-xl font-semibold text-white">
                                        {!familyExists ? "Create Family Pool" : "Add Family Member"}
                                    </h3>
                                </div>
                                <button 
                                    type="button" 
                                    onClick={handleCloseModal}
                                    className="text-white/80 hover:text-white transition-colors"
                                >
                                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                </button>
                            </div>
                        </div>
                        
                        <form onSubmit={(e) => {
                            e.preventDefault();
                            if (creationModal.isCreating) {
                                handleCreate(
                                    Number(localStorage.getItem("csc_user_id")), 
                                    familyNameRef.current?.value || "", 
                                    memberUsernameRef.current?.value || ""
                                );
                            }
                        }} className="p-6">
                            <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
                                {!familyExists 
                                    ? "Create a family pool to monitor and protect your family members' privacy."
                                    : "Add a member to your family pool by entering their username."
                                }
                            </p>
                            
                            {!familyExists && (
                                <div className="mb-5">
                                    <label htmlFor="familyName" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                        Family Name
                                    </label>
                                    <input
                                        type="text"
                                        id="familyName"
                                        ref={familyNameRef}
                                        placeholder="e.g., The Smiths"
                                        className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all"
                                        required
                                    />
                                </div>
                            )}
                            
                            <div className="mb-6">
                                <label htmlFor="member_username" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                    Member Username
                                </label>
                                <input
                                    type="text"
                                    id="member_username"
                                    ref={memberUsernameRef}
                                    placeholder="Enter username to add"
                                    className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all"
                                    required
                                />
                            </div>
                            
                            <div className="flex gap-3">
                                <button 
                                    type="button" 
                                    onClick={handleCloseModal} 
                                    className="flex-1 px-4 py-3 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors font-medium"
                                >
                                    Cancel
                                </button>
                                <button 
                                    type="submit" 
                                    className="flex-1 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
                                >
                                    {!familyExists ? "Create Family" : "Add Member"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}