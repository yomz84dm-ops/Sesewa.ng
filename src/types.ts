/// --- Types ---
export interface Review {
  id: string;
  proId: string;
  userName: string;
  rating: number;
  comment: string;
  date: string;
}

export interface Message {
  id: string;
  chatId: string;
  senderId: string;
  text: string;
  createdAt: any;
}

export interface Chat {
  id: string;
  participants: string[];
  lastMessage?: string;
  lastMessageAt?: any;
  updatedAt: any;
  otherParticipantName?: string;
}

export interface AppUser {
  uid: string;
  name: string;
  email: string;
  role: 'user' | 'handyman' | 'admin';
  photoURL?: string;
  phone?: string;
  identityNumber?: string;
  plan?: 'basic' | 'pro' | 'member';
  credits?: number;
  isVerifiedPending?: boolean;
  verified?: boolean;
  idDocumentUrl?: string;
  createdAt?: any;
  lat?: number;
  lng?: number;
}

export interface JobRequest {
  id: string;
  proId: string;
  proUserId?: string;
  proName: string;
  userUid: string;
  userName: string;
  userPhone?: string;
  jobDescription: string;
  status: 'pending' | 'responded' | 'on-the-way' | 'completed' | 'cancelled';
  paymentStatus?: 'none' | 'pending' | 'escrowed' | 'released' | 'refunded' | 'disputed';
  amount?: number;
  quoteDetails?: {
    materials: number;
    labor: number;
    taxes: number;
    notes: string;
  };
  scheduledDate?: string;
  scheduledTime?: string;
  paystackReference?: string;
  date: string;
  unlockedBy?: string[]; // List of handyman UIDs who have unlocked this lead
}

export interface Dispute {
  id: string;
  jobRequestId: string;
  raisedBy: string;
  reason: string;
  status: 'open' | 'resolved' | 'refunded';
  createdAt: any;
  resolvedAt?: any;
}

export interface ManagedDomain {
  id: string;
  name: string;
  mode: 'serve' | 'redirect';
  target?: string;
  isDefault?: boolean;
  createdAt: any;
}

export interface Notification {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: 'message' | 'job_status' | 'quote' | 'system';
  relatedId?: string;
  read: boolean;
  createdAt: any;
}

export interface Handyman {
  id: string;
  name: string;
  category: 'Plumbing' | 'Electrical' | 'Carpentry' | 'Painting' | 'General Repairs' | 'Mechanic' | 'AC Technician' | 'Tailor' | 'Bricklayer' | 'Cleaning' | 'House Help' | 'Auto Services' | 'Manicure' | 'Pedicure' | 'Hairstylist' | 'Barber' | 'Horticulturist' | 'Tattoo artist' | 'Generator Repair' | 'Satellite Installer' | 'Lawyer' | 'Accountant' | 'House Removal' | 'Home Tutor' | 'Inverter Specialist' | 'Borehole Driller' | 'Shoe Maker';
  location: string;
  lat: number;
  lng: number;
  rating: number;
  reviews: number;
  phone: string;
  whatsapp?: string;
  experience: string;
  experienceYears: number;
  verified: boolean;
  isFeatured?: boolean;
  isOnline?: boolean;
  description: string;
  portfolio: string[];
  profileImage?: string;
  userId?: string;
  availability?: 'Available' | 'Busy' | 'Away';
  plan?: 'basic' | 'pro';
  ninVerified?: boolean;
  bio?: string;
  businessName?: string;
}


export interface PricingPlan {
  id: string;
  name: string;
  price: string;
  period: string;
  features: string[];
  recommended?: boolean;
  buttonText: string;
}
