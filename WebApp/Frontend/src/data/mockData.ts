export interface ProfileData {
  username: string;
  bio: string;
  posts: number;
  followers: number;
  following: number;
  profileImage: string;
}

export interface RiskScore {
  overall: number;
  email: number;
  phone: number;
  location: number;
  keywords: number;
}

export interface DetectedData {
  emails: string[];
  phones: string[];
  locations: string[];
  keywords: string[];
}

export const mockProfile: ProfileData = {
  username: '@demo_account',
  bio: 'Family of 4 | Living in Ixelles, BX | Dad to Emma & Jake | Contact: demo.account@gmail.com | 📱 +33 7 82 17 93 92',
  posts: 342,
  followers: 856,
  following: 432,
  profileImage: 'https://i0.wp.com/www.frenchweb.fr/wp-content/uploads/2019/10/Gotaga.jpg?fit=650%2C405&ssl=1',
};

export const mockRiskScore: RiskScore = {
  overall: 72,
  email: 25,
  phone: 20,
  location: 15,
  keywords: 12,
};

export const mockDetectedData: DetectedData = {
  emails: ['demo.account@gmail.com'],
  phones: ['+33 7 82 17 93 92'],
  locations: ['Ixelles, BX'],
  keywords: ['Emma', 'Jake', 'epitech', 'basic fit ixelles', 'home'],
};

export const riskExplanations = {
  email: {
    title: 'Email Address Exposure',
    risk: 'High',
    description: 'Publicly sharing your email address can lead to spam, phishing attempts, and potential identity theft. Malicious actors can use your email to send targeted scams or gain unauthorized access to your accounts.',
  },
  phone: {
    title: 'Phone Number Exposure',
    risk: 'High',
    description: 'Sharing your phone number publicly exposes you to unwanted calls, SMS phishing (smishing), and potential harassment. It can also be used to link your identity across multiple platforms.',
  },
  location: {
    title: 'Location Data Exposure',
    risk: 'Medium',
    description: 'Revealing your location can compromise your physical safety and privacy. It allows strangers to know where you live, work, or frequently visit, potentially leading to stalking or burglary.',
  },
  keywords: {
    title: 'Sensitive Keywords',
    risk: 'Medium',
    description: 'Repeatedly mentioning children\'s names, schools, or routines can help predators build a profile of your family. This information can be used for social engineering attacks or to target vulnerable family members.',
  },
};

export const privacyTips = [
  {
    title: 'Avoid Sharing Contact Information',
    description: 'Never post phone numbers, email addresses, or physical addresses publicly on social media profiles or posts.',
    icon: 'shield',
  },
  {
    title: 'Be Careful with Children\'s Information',
    description: 'Avoid sharing full names, ages, schools, or routines of children. This information can be exploited by malicious actors.',
    icon: 'baby',
  },
  {
    title: 'Limit Location Exposure',
    description: 'Turn off location services for social media apps and avoid posting real-time location updates or check-ins.',
    icon: 'map-pin',
  },
  {
    title: 'Review Privacy Settings',
    description: 'Regularly check and update your privacy settings on all social media platforms to control who can see your information.',
    icon: 'settings',
  },
  {
    title: 'Think Before You Post',
    description: 'Consider whether the information you\'re about to share could be used against you or your family before posting.',
    icon: 'brain',
  },
  {
    title: 'Use Strong Passwords',
    description: 'Protect your accounts with strong, unique passwords and enable two-factor authentication whenever possible.',
    icon: 'lock',
  },
];
