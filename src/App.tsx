/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import * as React from 'react';
import axios from 'axios';
import { useState, useMemo, useEffect, useRef } from 'react';
import { LineChart, Line, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer } from 'recharts';
import { 
  FileText,
  Search, 
  MapPin, 
  Wrench, 
  Droplets, 
  Zap, 
  Paintbrush, 
  Hammer, 
  Phone, 
  Star,
  Filter,
  ChevronRight,
  Car,
  Wind,
  Scissors,
  LayoutGrid,
  Home,
  Sparkles,
  MessageCircle,
  CheckCircle2,
  Check,
  Image as ImageIcon,
  Navigation,
  Clock,
  Briefcase,
  Plus,
  UserPlus,
  User,
  StarHalf,
  CreditCard,
  Smartphone,
  ShieldCheck,
  Heart,
  Send,
  LogIn,
  LogOut,
  AlertCircle,
  AlertTriangle,
  Upload,
  Camera,
  Mail,
  Lock,
  Bell,
  TrendingUp,
  RotateCcw,
  Globe,
  Hand,
  Footprints,
  Sprout,
  Leaf,
  PenTool,
  Battery,
  Waves,
  Radio,
  Scale,
  Calculator,
  Truck,
  BookOpen,
  MoreVertical,
  Trash2,
  Edit,
  X,
  Tag,
  Loader2,
  Volume2,
  VolumeX
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  signInWithPopup, 
  GoogleAuthProvider, 
  onAuthStateChanged, 
  signOut,
  User as FirebaseUser,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  sendPasswordResetEmail,
  signInWithRedirect
} from 'firebase/auth';
import { 
  collection, 
  query, 
  where, 
  onSnapshot, 
  addDoc, 
  serverTimestamp, 
  orderBy, 
  doc, 
  setDoc, 
  getDoc,
  updateDoc,
  getDocFromServer,
  deleteDoc,
  Timestamp
} from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { Toaster, toast } from 'sonner';
import { Logo } from './components/Logo';
import { LogoPreview } from './components/LogoPreview';
import { t } from './translations';
import { getPriceEstimation, PriceEstimation } from './services/aiService';
import { auth, db, storage, OperationType, handleFirestoreError } from './firebase';
import { geminiService } from './services/geminiService';

// --- Enums ---
// OperationType is imported from ./firebase

interface ErrorBoundaryProps {
  children: React.ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('ErrorBoundary caught an error', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      let errorMessage = "Something went wrong.";
      try {
        if (this.state.error?.message) {
          const parsed = JSON.parse(this.state.error.message);
          if (parsed.error) errorMessage = parsed.error;
        }
      } catch (e) {
        errorMessage = this.state.error?.message || errorMessage;
      }

      return (
        <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
          <div className="bg-white p-8 rounded-3xl shadow-xl max-w-md w-full text-center">
            <div className="w-16 h-16 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto mb-4">
              <AlertCircle size={32} />
            </div>
            <h2 className="text-2xl font-bold text-slate-900 mb-2">Oops!</h2>
            <p className="text-slate-600 mb-6">{errorMessage}</p>
            <button 
              onClick={() => window.location.reload()}
              className="w-full bg-blue-600 text-white py-3 rounded-xl font-bold hover:bg-blue-700 transition-all"
            >
              Reload Application
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

import {
  Review, Message, Chat, AppUser, JobRequest, Dispute, ManagedDomain, Notification, Handyman, PricingPlan
} from './types';
import { INITIAL_HANDYMEN, PRICING_PLANS, CATEGORIES, deg2rad, getDistance, calculateDistance } from './mockData';
import { StarRating, SimulatedCheckout, NotificationList, ChatWindow, SafetyTips, VoiceWelcome, AIEstimationSection } from './app-components';
export default function App() {
  const [currentUser, setCurrentUser] = useState<AppUser | null>(null);
  const [isAuthReady, setIsAuthReady] = useState(false);
  const [chats, setChats] = useState<Chat[]>([]);
  const [activeChat, setActiveChat] = useState<Chat | null>(null);
  const [showChatList, setShowChatList] = useState(false);
  
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [userLocation, setUserLocation] = useState<{lat: number, lng: number} | null>(null);
  const [selectedPro, setSelectedPro] = useState<Handyman | null>(null);
  const [showRegForm, setShowRegForm] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [showRequests, setShowRequests] = useState(false);
  const [showUserProfileModal, setShowUserProfileModal] = useState(false);
  const [verificationFile, setVerificationFile] = useState<File | null>(null);
  const [showPricing, setShowPricing] = useState(false);
  const [showAdminDashboard, setShowAdminDashboard] = useState(false);
  const [showCheckout, setShowCheckout] = useState(false);
  const [showOutOfCredits, setShowOutOfCredits] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<PricingPlan | null>(null);
  const [showOnlyOnline, setShowOnlyOnline] = useState(false);
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);
  const [useRadiusFilter, setUseRadiusFilter] = useState(false);
  const RADIUS_MILES = 10;
  const RADIUS_KM = RADIUS_MILES * 1.60934;
  const [requestingQuotePro, setRequestingQuotePro] = useState<Handyman | null>(null);
  const [minRating, setMinRating] = useState(0);
  const [minExperience, setMinExperience] = useState(0);
  const [showFilters, setShowFilters] = useState(false);
  const [isRegistering, setIsRegistering] = useState(false);
  const [profileImageFile, setProfileImageFile] = useState<File | null>(null);
  const [showEditProfile, setShowEditProfile] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [authMode, setAuthMode] = useState<'login' | 'signup' | 'reset'>('login');
  const [authEmail, setAuthEmail] = useState('');
  const [authPassword, setAuthPassword] = useState('');
  const [authNinBvn, setAuthNinBvn] = useState('');
  const [authError, setAuthError] = useState<string | null>(null);
  const [authLoading, setAuthLoading] = useState(false);
  const [resetSent, setResetSent] = useState(false);
  const [pendingVerifications, setPendingVerifications] = useState<AppUser[]>([]);
  const [managedDomains, setManagedDomains] = useState<ManagedDomain[]>([]);
  const [editingDomain, setEditingDomain] = useState<ManagedDomain | null>(null);
  const [showDomainEditModal, setShowDomainEditModal] = useState(false);
  const [domainMenuOpen, setDomainMenuOpen] = useState<string | null>(null);
  const isAdmin = currentUser?.email === 'yomz84.dm@gmail.com' || currentUser?.role === 'admin';
  const [showTerms, setShowTerms] = useState(false);
  const [showPrivacy, setShowPrivacy] = useState(false);
  const [showLogoPreview, setShowLogoPreview] = useState(false);
  const [initError, setInitError] = useState<string | null>(null);
  const isShowMode = window.location.search.includes('mode=presentation') || 
                    window.location.search.includes('show=true');
  const isDebug = window.location.search.includes('debug=true') || 
                  window.location.hostname.includes('localhost');

  const handleLoggedError = (error: any, type: string, path: string) => {
    console.error(`[${type}] ${path}:`, error);
    const msg = error.message || String(error);
    if (isDebug) {
      setInitError(prev => `${prev ? prev + '\n' : ''}[${type}] ${path}: ${msg}`);
    }
  };

  // --- AI States ---
  const [aiMatchedProIds, setAiMatchedProIds] = useState<string[]>([]);
  const [isAiMatching, setIsAiMatching] = useState(false);
  const [isAiRefining, setIsAiRefining] = useState(false);
  const [aiSummary, setAiSummary] = useState<string | null>(null);
  const [isAiSummarizing, setIsAiSummarizing] = useState(false);
  const [aiDiagnosis, setAiDiagnosis] = useState<any>(null);
  const [isAiDiagnosing, setIsAiDiagnosing] = useState(false);
  const [handyPadiOpen, setHandyPadiOpen] = useState(false);
  const [handyPadiMessages, setHandyPadiMessages] = useState<{ role: 'user' | 'bot', text: string }[]>([]);
  const [handyPadiInput, setHandyPadiInput] = useState('');
  const [isHandyPadiTyping, setIsHandyPadiTyping] = useState(false);
  const [showHandyPadiNudge, setShowHandyPadiNudge] = useState(false);

  useEffect(() => {
    let nudgeInterval: NodeJS.Timeout;
    let hideTimer: NodeJS.Timeout;

    const startNudgeCycle = () => {
      nudgeInterval = setInterval(() => {
        if (!handyPadiOpen) {
          setShowHandyPadiNudge(true);
          
          hideTimer = setTimeout(() => {
            setShowHandyPadiNudge(false);
          }, 8000); // Hide after 8 seconds
        }
      }, 45000); // Pop up every 45 seconds
    };

    const initialTimer = setTimeout(() => {
      if (!handyPadiOpen) {
        setShowHandyPadiNudge(true);
        hideTimer = setTimeout(() => {
          setShowHandyPadiNudge(false);
          startNudgeCycle();
        }, 8000);
      } else {
        startNudgeCycle();
      }
    }, 5000);

    return () => {
      clearTimeout(initialTimer);
      clearTimeout(hideTimer);
      clearInterval(nudgeInterval);
    };
  }, [handyPadiOpen]);
  const [jobDescriptionInput, setJobDescriptionInput] = useState('');
  const [currentLanguage, setCurrentLanguage] = useState('English');
  const [showLanguageMenu, setShowLanguageMenu] = useState(false);
  const [hasInteractedForAudio, setHasInteractedForAudio] = useState(false);
  const languageMenuRef = useRef<HTMLDivElement>(null);
  const mobileLanguageMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleFirstInteraction = () => {
      if (!hasInteractedForAudio) {
        console.log("First user interaction detected, enabling audio context...");
        setHasInteractedForAudio(true);
      }
    };
    window.addEventListener('click', handleFirstInteraction, { once: true });
    window.addEventListener('touchstart', handleFirstInteraction, { once: true });
    return () => {
      window.removeEventListener('click', handleFirstInteraction);
      window.removeEventListener('touchstart', handleFirstInteraction);
    };
  }, [hasInteractedForAudio]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      const target = event.target as Node;
      const isHeaderMenu = languageMenuRef.current && languageMenuRef.current.contains(target);
      const isMobileMenu = mobileLanguageMenuRef.current && mobileLanguageMenuRef.current.contains(target);
      
      if (!isHeaderMenu && !isMobileMenu) {
        setShowLanguageMenu(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);
  const languages = [
    'English', 'Pidgin', 'Yoruba', 'Hausa', 'Igbo', 'Edo', 
    'Tiv', 'Ibibio', 'Kanuri', 'Fulfulde', 'Efik', 
    'Itsekiri', 'Urhobo', 'Izon', 'Nupe', 'Igala', 'Idoma'
  ];

  useEffect(() => {
    // Check AI readiness
    const checkAI = async () => {
      // AI Service Ready via backend
    };
    checkAI();
  }, []);

  const [handymen, setHandymen] = useState<Handyman[]>([]);

  // Geolocation Tracking
  useEffect(() => {
    if (!navigator.geolocation) {
      console.error('Geolocation is not supported by your browser');
      return;
    }

    const watchId = navigator.geolocation.watchPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        setUserLocation({ lat: latitude, lng: longitude });

        if (currentUser) {
          // Update user's location in Firestore
          try {
            await updateDoc(doc(db, 'users', currentUser.uid), {
              lat: latitude,
              lng: longitude,
              lastLocationUpdate: serverTimestamp()
            });

            // If user is a handyman, update their professional record too
            const proRecord = handymen.find(h => h.userId === currentUser.uid);
            if (proRecord) {
              await updateDoc(doc(db, 'handymen', proRecord.id), {
                lat: latitude,
                lng: longitude
              });
            }
          } catch (error) {
            console.error('Error updating location in Firestore:', error);
          }
        }
      },
      (error) => {
        console.error('Error getting location:', error);
      },
      { enableHighAccuracy: true, maximumAge: 10000, timeout: 5000 }
    );

    return () => navigator.geolocation.clearWatch(watchId);
  }, [currentUser?.uid, handymen]);

  // Arrival Notifications
  useEffect(() => {
    if (!currentUser || !userLocation) return;

    // Listen for active job requests where the pro is "on-the-way"
    const q = query(
      collection(db, 'jobRequests'),
      where('userUid', '==', currentUser.uid),
      where('status', '==', 'on-the-way')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      snapshot.docs.forEach(async (docSnapshot) => {
        const request = docSnapshot.data() as JobRequest;
        const pro = handymen.find(h => h.id === request.proId);
        
        if (pro && pro.lat && pro.lng) {
          const distance = getDistance(userLocation.lat, userLocation.lng, pro.lat, pro.lng);
          
          // If less than 200 meters, notify
          if (distance < 0.2) {
            const notificationId = `arrival-${request.id}`;
            // Check if we already notified for this request
            if (!notifications.some(n => n.id === notificationId)) {
              const newNotification: Notification = {
                id: notificationId,
                userId: currentUser.uid,
                title: 'Professional Arriving!',
                message: `${pro.name} is arriving at your location.`,
                type: 'job_status',
                read: false,
                createdAt: new Date().toISOString()
              };
              
              setNotifications(prev => [newNotification, ...prev]);
              toast.info(`${pro.name} is arriving!`, {
                description: 'They are very close to your location.',
                icon: <MapPin className="text-blue-500" />
              });
            }
          }
        }
      });
    });

    return () => unsubscribe();
  }, [currentUser?.uid, userLocation, handymen, notifications]);

  // Local Storage Persistence
  const myProProfile = useMemo(() => {
    if (!currentUser) return null;
    return handymen.find(h => h.userId === currentUser.uid);
  }, [currentUser, handymen]);

  // Firebase Auth & User Data
  React.useEffect(() => {
    // Fail-safe initialization timeout: Show something even if Firebase hangs
    const initTimeout = setTimeout(() => {
      if (!isAuthReady) {
        console.warn("Initialization taking longer than expected. Proceeding with limited functionality...");
        setIsAuthReady(true);
      }
    }, 5000);

    async function testConnection() {
      try {
        await getDocFromServer(doc(db, 'test', 'connection'));
      } catch (error) {
        if (error instanceof Error && error.message.includes('the client is offline')) {
          console.error("Please check your Firebase configuration. The client is offline.");
        }
      }
    }
    testConnection();

    // Fetch all handymen from Firestore
    const handymenQuery = collection(db, 'handymen');
    
    const unsubscribeHandymen = onSnapshot(handymenQuery, (snapshot) => {
      const dbHandymen = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Handyman[];
      
      setHandymen(dbHandymen);
    }, (error) => {
      try {
        handleFirestoreError(error, OperationType.LIST, 'handymen');
      } catch (e) {
        // catch silently for feed
      }
    });

    let unsubscribeUserDoc: (() => void) | null = null;
    
    const unsubscribeAuth = onAuthStateChanged(auth, async (user) => {
      // Clear previous user subscription if any
      if (unsubscribeUserDoc) {
        unsubscribeUserDoc();
        unsubscribeUserDoc = null;
      }

      if (user) {
        console.log("Authenticated User:", user.uid, user.email);
        
        // Use onSnapshot for real-time user data updates (credits, plan, etc.)
        unsubscribeUserDoc = onSnapshot(doc(db, 'users', user.uid), async (userDoc) => {
          try {
            if (userDoc.exists()) {
              const userData = userDoc.data() as AppUser;
              // Ensure admin email always has admin role
              if (user.email === 'yomz84.dm@gmail.com' && userData.role !== 'admin') {
                userData.role = 'admin';
                await updateDoc(doc(db, 'users', user.uid), { role: 'admin' });
              }
              setCurrentUser(userData);
              setAuthLoading(false);
              setShowAuthModal(false);
            } else {
              console.log("No user document found. Creating one for:", user.uid);
              const newUser: AppUser = {
                uid: user.uid,
                name: user.displayName || 'Anonymous',
                email: user.email || '',
                role: user.email === 'yomz84.dm@gmail.com' ? 'admin' : 'user',
                photoURL: user.photoURL || '',
                credits: 2
              };
              
              const userPayload = {
                ...newUser,
                createdAt: serverTimestamp()
              };
              
              if (authNinBvn && authNinBvn.length === 11) {
                (userPayload as any).identityNumber = authNinBvn;
              }
              
              try {
                await setDoc(doc(db, 'users', user.uid), userPayload);
                setCurrentUser(newUser);
                setAuthLoading(false);
                setShowAuthModal(false);
              } catch (createErr: any) {
                console.error("Critical: Failed to create user document:", createErr);
                handleLoggedError(createErr, 'AUTH_CREATE', `users/${user.uid}`);
                setAuthError("Account created in Auth, but profile initialization failed. " + createErr.message);
                setAuthLoading(false);
                toast.error("Profile Creation Failed", {
                  description: "Your login was successful, but we couldn't create your profile. Please check your connection."
                });
              }
            }
          } catch (err: any) {
            console.error("User doc auth processing error:", err);
            handleLoggedError(err, 'AUTH_PROCESS', `users/${user.uid}`);
            setAuthLoading(false);
            toast.error("Account Profile Issue", {
              description: "We couldn't load or create your profile. " + (err.message || "Check your connection.")
            });
          }
        }, (error) => {
          console.error("User doc error:", error);
          handleLoggedError(error, 'AUTH_LISTEN', `users/${user.uid}`);
          setAuthLoading(false);
          toast.error("Account Access Problem", {
            description: "Error connecting to your profile data. Please try again later."
          });
        });

        // Reset view to home page and all filters upon login
        setShowPricing(false);
        setShowRequests(false);
        setShowChatList(false);
        setShowAdminDashboard(false);
        setSelectedCategory('All');
        setSearchQuery('');
        setMinRating(0);
        setMinExperience(0);
        setShowOnlyOnline(false);
        setShowFavoritesOnly(false);
        setUseRadiusFilter(false);
      } else {
        setCurrentUser(null);
      }
      setIsAuthReady(true);
      clearTimeout(initTimeout);
    });

    return () => {
      if (unsubscribeUserDoc) unsubscribeUserDoc();
      unsubscribeHandymen();
      unsubscribeAuth();
    };
  }, []);

  // Handyman Seeding logic moved out of onSnapshot for performance
  useEffect(() => {
    if (currentUser?.email === 'yomz84.dm@gmail.com') {
      const existingIds = new Set(handymen.map(h => h.id));
      const missingPros = INITIAL_HANDYMEN.filter(pro => !existingIds.has(pro.id));
      
      if (missingPros.length > 0) {
        console.log(`Seeding ${missingPros.length} missing handymen...`);
        missingPros.forEach(async (pro) => {
          try {
            const proWithUserId = Object.fromEntries(Object.entries({ ...pro, userId: currentUser.uid }).filter(([_, v]) => v !== undefined));
            await setDoc(doc(db, 'handymen', pro.id), proWithUserId);
          } catch (e) {
            console.error(`Failed to seed pro ${pro.id}:`, e);
          }
        });
      }
    }
  }, [handymen.length, currentUser?.email]);
  // Fetch disputes for admin
  useEffect(() => {
    if (!currentUser || currentUser.role !== 'admin') {
      setDisputes([]);
      return;
    }

    const disputesQuery = query(collection(db, 'disputes'), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(disputesQuery, (snapshot) => {
      const dbDisputes = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Dispute[];
      setDisputes(dbDisputes);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'disputes');
    });

    return () => unsubscribe();
  }, [currentUser]);

  // Fetch pending verifications for admin
  useEffect(() => {
    if (!currentUser || currentUser.role !== 'admin') {
      setPendingVerifications([]);
      return;
    }

    const pendingQuery = query(
      collection(db, 'users'),
      where('isVerifiedPending', '==', true)
    );
    const unsubscribe = onSnapshot(pendingQuery, (snapshot) => {
      const pending = snapshot.docs.map(doc => doc.data() as AppUser);
      setPendingVerifications(pending);
    }, (error) => {
      console.error("Users feed error:", error);
      try {
        handleFirestoreError(error, OperationType.LIST, 'users');
      } catch (e) {}
    });

    return () => unsubscribe();
  }, [currentUser]);

  // Firebase Managed Domains
  const [isRedirecting, setIsRedirecting] = useState(false);

  useEffect(() => {
    // Check for skip parameter
    if (window.location.search.includes('skip_redirect=true')) {
      console.log('Redirection skipped by user');
      return;
    }

    const domainsCollection = collection(db, 'managedDomains');
    const q = query(domainsCollection, orderBy('createdAt', 'desc'));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      try {
        const domainsList = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as ManagedDomain[];
        setManagedDomains(domainsList);

        // Handle dynamic redirection logic
        const host = window.location.hostname.toLowerCase();
        
        // Disable client-side redirection temporarily due to SSL cert issues on target domains
        /*
        // 1. Check for explicit redirection rule for current host
        const rule = domainsList.find(d => d.name.toLowerCase() === host);
        if (rule && rule.mode === 'redirect' && rule.target) {
          try {
            const targetUrlString = rule.target.startsWith('http') ? rule.target : `https://${rule.target}`;
            const targetUrl = new URL(targetUrlString);
            
            // Only redirect if it's a different domain or path to avoid infinite loops
            if (targetUrl.hostname.toLowerCase() !== host || targetUrl.pathname !== window.location.pathname) {
              console.log(`Redirecting to: ${targetUrl.href}`);
              setIsRedirecting(true);
              window.location.href = targetUrl.href;
              return;
            }
          } catch (e) {
            console.error("Invalid redirect target:", rule.target);
          }
        }

        // 2. Handle Default Domain redirection (if current host is not configured)
        const defaultDomain = domainsList.find(d => d.isDefault);
        const hostIsDevOrPreview = host.includes('localhost') || 
                                   host.includes('.run.app') || 
                                   host.includes('.googleusercontent.com') ||
                                   host.includes('.firebaseapp.com') ||
                                   host.includes('.web.app') ||
                                   host.includes('127.0.0.1');

        if (defaultDomain && defaultDomain.name.toLowerCase() !== host && !hostIsDevOrPreview) {
          const matchingDomain = domainsList.find(d => d.name.toLowerCase() === host);
          if (!matchingDomain || matchingDomain.mode !== 'serve') {
            console.log(`Default domain redirect to: ${defaultDomain.name}`);
            setIsRedirecting(true);
            window.location.href = `https://${defaultDomain.name}${window.location.pathname}${window.location.search}`;
            return;
          }
        }
        */
      } catch (err) {
        console.error("Domain logic processing error:", err);
      }
    }, (error) => {
      console.warn("managedDomains snapshot error (safe to ignore if collection is new or empty):", error);
    });

    return () => unsubscribe();
  }, [isAdmin]);

  const handleUpdateDomain = async (domainId: string, data: Partial<ManagedDomain>) => {
    try {
      if (data.isDefault) {
        // Unset other defaults
        const otherDefaults = managedDomains.filter(d => d.isDefault && d.id !== domainId);
        for (const d of otherDefaults) {
          await updateDoc(doc(db, 'managedDomains', d.id), { isDefault: false });
        }
      }
      await updateDoc(doc(db, 'managedDomains', domainId), {
        ...data,
        updatedAt: serverTimestamp()
      });
      setShowDomainEditModal(false);
      setEditingDomain(null);
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 3000);
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `managedDomains/${domainId}`);
    }
  };

  const handleAddDomain = async (name: string, mode: 'serve' | 'redirect', target?: string, isDefault?: boolean) => {
    try {
      if (isDefault) {
        // Unset other defaults
        const otherDefaults = managedDomains.filter(d => d.isDefault);
        for (const d of otherDefaults) {
          await updateDoc(doc(db, 'managedDomains', d.id), { isDefault: false });
        }
      }
      await addDoc(collection(db, 'managedDomains'), {
        name,
        mode,
        target: target || '',
        isDefault: !!isDefault,
        createdAt: serverTimestamp()
      });
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 3000);
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'managedDomains');
    }
  };

  const handleDeleteDomain = async (domainId: string) => {
    if (!window.confirm('Are you sure you want to delete this domain?')) return;
    try {
      await deleteDoc(doc(db, 'managedDomains', domainId));
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 3000);
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `managedDomains/${domainId}`);
    }
  };

  // Firebase Chats
  React.useEffect(() => {
    if (!currentUser) {
      setChats([]);
      return;
    }

    const q = query(
      collection(db, 'chats'),
      where('participants', 'array-contains', currentUser.uid),
      orderBy('updatedAt', 'desc')
    );

    const unsubscribe = onSnapshot(q, async (snapshot) => {
      const chatList = await Promise.all(snapshot.docs.map(async (chatDoc) => {
        const data = chatDoc.data();
        const otherId = data.participants.find((p: string) => p !== currentUser.uid);
        let otherName = 'Unknown';
        
        if (otherId) {
          const otherDoc = await getDoc(doc(db, 'users', otherId));
          if (otherDoc.exists()) {
            otherName = otherDoc.data().name;
          }
        }

        return {
          id: chatDoc.id,
          ...data,
          otherParticipantName: otherName
        } as Chat;
      }));
      setChats(chatList);
    }, (error) => {
      console.error("Chats feed error:", error);
      try {
        handleFirestoreError(error, OperationType.LIST, 'chats');
      } catch (e) {}
    });

    return () => unsubscribe();
  }, [currentUser]);

  // Firebase Notifications
  React.useEffect(() => {
    if (!currentUser) {
      setNotifications([]);
      return;
    }

    const q = query(
      collection(db, 'notifications'),
      where('userId', '==', currentUser.uid),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const notificationList = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Notification[];
      setNotifications(notificationList);
    }, (error) => {
      console.error("Notifications feed error:", error);
      try {
        handleFirestoreError(error, OperationType.LIST, 'notifications');
      } catch (e) {}
    });

    return () => unsubscribe();
  }, [currentUser]);

  const createNotification = async (userId: string, title: string, message: string, type: 'message' | 'job_status' | 'quote' | 'system', relatedId?: string) => {
    try {
      await addDoc(collection(db, 'notifications'), {
        userId,
        title,
        message,
        type,
        relatedId,
        read: false,
        createdAt: serverTimestamp()
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'notifications');
    }
  };

  const markNotificationAsRead = async (notificationId: string) => {
    try {
      await updateDoc(doc(db, 'notifications', notificationId), {
        read: true
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, 'notifications');
    }
  };

  const getAuthErrorMessage = (error: any) => {
    console.error('Unified Auth Error detail:', {
      code: error.code,
      message: error.message,
      customData: error.customData,
      name: error.name,
      stack: error.stack
    });

    switch (error.code) {
      case 'auth/network-request-failed':
        return t('Connection issue detected. Please check your internet or data connection and try again.', currentLanguage);
      case 'auth/timeout':
        return t('The login request timed out. This usually happens on slow data connections. Please try moving to a better signal area.', currentLanguage);
      case 'auth/operation-not-allowed':
        return "Google Sign-in is not enabled in your Firebase project. Please enable it in the Firebase Console under **Authentication -> Sign-in method**.";
      case 'auth/popup-blocked':
        return "Login popup was blocked by your browser. Please allow popups for this site, or try logging in from outside the AI Studio preview if the issue persists.";
      case 'auth/popup-closed-by-user':
        return null; // Don't show error for manual cancel
      case 'auth/account-exists-with-different-credential':
        return "An account already exists with the same email but different sign-in method. Please try signing in with that method instead.";
      case 'auth/email-already-in-use':
        return "An account already exists with this email address.";
      case 'auth/weak-password':
        return "Your password is too weak. Please use at least 6 characters.";
      case 'auth/user-not-found':
      case 'auth/wrong-password':
      case 'auth/invalid-login-credentials':
      case 'auth/invalid-credential':
        return "Invalid email or password. Please double-check your credentials.";
      case 'auth/too-many-requests':
        return "Too many failed login attempts. Your account has been temporarily disabled. Please try again later.";
      case 'auth/user-disabled':
        return "This account has been disabled. Please contact support.";
      case 'auth/invalid-email':
        return "Please enter a valid email address.";
      case 'auth/admin-restricted-operation':
        return "This action is restricted by system policy. Please contact your administrator.";
      case 'auth/api-key-expired':
        return "The Firebase API key appears to be expired or invalid. If you just set up Firebase, please wait a moment for it to activate, or contact support if the issue persists.";
      case "auth/unauthorized-domain":
        const currentHost = window.location.hostname;
        const isCustomDomain = currentHost.includes('handypadi.ng');
        return `Domain Authorization Required: The domain "${currentHost}" is not authorized for Firebase Authentication.

**Fix Steps:**
1. Open [Firebase Console](https://console.firebase.google.com/)
2. Project: **ai-studio-applet-webapp-5d01f**
3. **Authentication -> Settings -> Authorized Domains**
4. Add: **${currentHost}**
5. Wait ~60 seconds and try again.`;
      case 'auth/internal-error':
        if (error.message?.includes('storage-access')) {
          return "Login failed due to browser privacy settings. Please ensure third-party cookies are allowed, as Firebase requires them for cross-domain authentication in iframes.";
        }
        return t('There was a problem signing you in due to a temporary connection drop. Please wait a moment and try again.', currentLanguage);
      default:
        console.error("Unhandle Auth Error:", error.code, error.message);
        return error.message || "An unexpected error occurred during login. Please try again in a moment.";
    }
  };

  const handleGoogleLogin = async (useRedirect = false) => {
    if (authMode === 'signup') {
      if (!authNinBvn || !/^\d{11}$/.test(authNinBvn)) {
        setAuthError('Please enter a valid 11-digit NIN or BVN to register with Google.');
        return;
      }
    }

    try {
      console.log(`[DEBUG] Initiating Google Login. Host: ${window.location.hostname}, useRedirect: ${useRedirect}`);
      setAuthError(null);
      setAuthLoading(true);
      const provider = new GoogleAuthProvider();
      provider.setCustomParameters({ prompt: 'select_account' });
      
      if (useRedirect) {
        console.log("[DEBUG] Using signInWithRedirect");
        await signInWithRedirect(auth, provider);
      } else {
        console.log("[DEBUG] Using signInWithPopup");
        await signInWithPopup(auth, provider);
      }
      
      console.log("[DEBUG] Google Auth trigger successful");
      
      // Safety timeout: if profile never loads, allow user to try again
      setTimeout(() => {
        if (auth.currentUser) {
          setAuthLoading(false);
          // If profile still hasn't loaded, maybe manual refresh helps
        }
      }, 10000);

    } catch (error: any) {
      setAuthLoading(false);
      const errorMessage = getAuthErrorMessage(error);
      if (errorMessage) {
        setAuthError(errorMessage);
        toast.error(t("Login Problem", currentLanguage), { 
          description: errorMessage,
          duration: 6000
        });
      }
    }
  };

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError(null);

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(authEmail)) {
      setAuthError('Please enter a valid email address.');
      return;
    }

    setAuthLoading(true);

    try {
      if (authMode === 'login') {
        await signInWithEmailAndPassword(auth, authEmail, authPassword);
        setShowAuthModal(false);
        toast.success(t('welcomeBack', currentLanguage));
      } else if (authMode === 'signup') {
        if (!authNinBvn || !/^\d{11}$/.test(authNinBvn)) {
          setAuthLoading(false);
          setAuthError('Please enter a valid 11-digit NIN or BVN to register.');
          return;
        }
        await createUserWithEmailAndPassword(auth, authEmail, authPassword);
        setShowAuthModal(false);
        toast.success(t('accountCreated', currentLanguage));
      } else if (authMode === 'reset') {
        await sendPasswordResetEmail(auth, authEmail);
        setResetSent(true);
        toast.success(t('resetEmailSent', currentLanguage));
      }
    } catch (error: any) {
      const errorMessage = getAuthErrorMessage(error);
      if (errorMessage) {
        setAuthError(errorMessage);
        toast.error(t("Authentication Problem", currentLanguage), { 
          description: errorMessage,
          duration: 6000
        });
      }
    } finally {
      setAuthLoading(false);
    }
  };

  const handleLogin = () => {
    setAuthMode('login');
    setAuthEmail('');
    setAuthPassword('');
    setAuthError(null);
    setResetSent(false);
    
    // Close other potentially obstructive menus for a seamless experience
    setHandyPadiOpen(false);
    setShowLanguageMenu(false);
    setShowFilters(false);
    setShowChatList(false);
    setShowRequests(false);
    setShowPricing(false);
    
    setShowAuthModal(true);
  };

  const handleLogout = () => signOut(auth);

  const startChat = async (otherUserId: string, otherUserName: string) => {
    if (!currentUser) {
      handleLogin();
      return;
    }

    // Check if chat already exists
    const existingChat = chats.find(c => c.participants.includes(otherUserId));
    if (existingChat) {
      setActiveChat(existingChat);
      setShowChatList(true);
      setSelectedPro(null);
      return;
    }

    // Create new chat
    try {
      const chatData = {
        participants: [currentUser.uid, otherUserId],
        updatedAt: serverTimestamp(),
      };
      const docRef = await addDoc(collection(db, 'chats'), chatData);
      
      // Ensure the other user exists in our users collection for the chat to work
      const otherDoc = await getDoc(doc(db, 'users', otherUserId));
      if (!otherDoc.exists()) {
        await setDoc(doc(db, 'users', otherUserId), {
          uid: otherUserId,
          name: otherUserName,
          email: `${otherUserId}@local`,
          role: 'user',
          createdAt: serverTimestamp()
        });
      }

      const newChat: Chat = {
        id: docRef.id,
        ...chatData,
        otherParticipantName: otherUserName
      };
      setActiveChat(newChat);
      setShowChatList(true);
      setSelectedPro(null);
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'chats');
    }
  };
  
  // Local Storage Persistence
  const [reviews, setReviews] = useState<Review[]>(() => {
    const saved = localStorage.getItem('se_se_wa_reviews');
    return saved ? JSON.parse(saved) : [];
  });

  const [jobRequests, setJobRequests] = useState<JobRequest[]>([]);

  // Firebase Job Requests
  React.useEffect(() => {
    if (!currentUser) {
      setJobRequests([]);
      return;
    }

    const q = currentUser.role === 'admin' 
      ? query(collection(db, 'jobRequests'), orderBy('date', 'desc'))
      : query(
        collection(db, 'jobRequests'),
        where(currentUser.role === 'handyman' ? 'proUserId' : 'userUid', '==', currentUser.uid),
        orderBy('date', 'desc')
      );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const requestList = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        date: doc.data().date?.toDate ? doc.data().date.toDate().toLocaleDateString() : doc.data().date
      })) as JobRequest[];
      setJobRequests(requestList);
    }, (error) => {
      console.error("Job Requests feed error:", error);
      try {
        handleFirestoreError(error, OperationType.LIST, 'jobRequests');
      } catch (e) {}
    });

    return () => unsubscribe();
  }, [currentUser]);

  const [favorites, setFavorites] = useState<string[]>(() => {
    const saved = localStorage.getItem('se_se_wa_favorites');
    return saved ? JSON.parse(saved) : [];
  });

  const [newReviewRating, setNewReviewRating] = useState(5);
  const [newReviewComment, setNewReviewComment] = useState('');
  const [showBrandPreview, setShowBrandPreview] = useState(false);
  const [locationError, setLocationError] = useState<string | null>(null);

  React.useEffect(() => {
    localStorage.setItem('se_se_wa_pros_v3', JSON.stringify(handymen));
  }, [handymen]);

  React.useEffect(() => {
    localStorage.setItem('se_se_wa_reviews', JSON.stringify(reviews));
  }, [reviews]);

  React.useEffect(() => {
    localStorage.setItem('se_se_wa_jobs', JSON.stringify(jobRequests));
  }, [jobRequests]);

  React.useEffect(() => {
    localStorage.setItem('se_se_wa_favorites', JSON.stringify(favorites));
  }, [favorites]);

  const handleGetLocation = () => {
    setLocationError(null);
    if (navigator.geolocation) {
      toast.info("Requesting location access...", { description: "Please look for the browser prompt." });
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setUserLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude });
          toast.success("Location updated!");
        },
        (err) => {
          console.error(err);
          let msg = "Unable to get location.";
          if (err.code === 1) msg = "Location access denied. Please enable it in browser settings.";
          else if (err.code === 2) msg = "Location unavailable. Try moving to an open area.";
          else if (err.code === 3) msg = "Location request timed out. Retrying with lower accuracy...";
          
          if (err.code === 3) {
            // Retry once with lower accuracy
            navigator.geolocation.getCurrentPosition(
              (pos) => {
                setUserLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude });
                toast.success("Location updated (Low Accuracy)");
              },
              (err2) => {
                setLocationError(msg);
                toast.error("Location Error", { description: msg });
              },
              { enableHighAccuracy: false, timeout: 10000 }
            );
          } else {
            setLocationError(msg);
            toast.error("Location Error", { description: msg });
          }
        },
        { enableHighAccuracy: true, timeout: 8000, maximumAge: 0 }
      );
    } else {
      const msg = "Geolocation is not supported by your browser.";
      setLocationError(msg);
      toast.error(msg);
    }
  };

  const toggleFavorite = (id: string) => {
    setFavorites(prev => 
      prev.includes(id) ? prev.filter(f => f !== id) : [...prev, id]
    );
  };

  const filteredHandymen = useMemo(() => {
    let list = handymen.filter((h) => {
      const name = h.name || '';
      const location = h.location || '';
      const category = h.category || '';
      
      const searchableText = `${name} ${location} ${category} ${h.experience || ''} ${h.bio || ''} ${h.businessName || ''}`.toLowerCase();
      
      const stopWords = ['near', 'me', 'in', 'around', 'a', 'an', 'the', 'looking', 'for', 'i', 'need', 'some', 'someone', 'who', 'can', 'is', 'at', 'with', 'help', 'please', 'find', 'get', 'want', 'any', 'and', 'or', 'my', 'house', 'home', 'to', 'do', 'work', 'job', 'good', 'best', 'cheap', 'fast'];
      const searchTokens = searchQuery
        .toLowerCase()
        .replace(/[^\w\s]/g, '')
        .split(/\s+/)
        .filter(word => word.length > 0 && !stopWords.includes(word));

      // For a match, we'll be slightly forgiving: 
      // If there's 1 token, it must match.
      // If there are multiple tokens, we want ALL of them to match ideally (e.g. "plumber lagos"),
      // but if we do .every() and they type "plumber repairing pipe", they might get 0.
      // Let's use a scoring system or check if at least MOST tokens match, 
      // but the simplest robust way for "painter near me" is keeping .every() 
      // since we filter out stop words.
      const matchesSearch = searchTokens.length === 0 || searchTokens.every(token => {
        let baseToken = token;
        if (token === 'painter' || token === 'painters') baseToken = 'paint';
        else if (token === 'plumbers') baseToken = 'plumber';
        else if (token === 'cleaner' || token === 'cleaners') baseToken = 'clean';
        else if (token === 'mechanics') baseToken = 'mechanic';
        else if (token === 'tailors') baseToken = 'tailor';
        else if (token === 'tutors') baseToken = 'tutor';
        else if (token === 'makers') baseToken = 'maker';
        else if (token === 'techs' || token === 'technicians') baseToken = 'tech';
        else if (token === 'electricians' || token === 'electricals') baseToken = 'electric';
        else if (token === 'carpenters' || token === 'carpentry') baseToken = 'carpent';
        else if (token === 'repairs') baseToken = 'repair';
        
        return searchableText.includes(baseToken) || searchableText.includes(token);
      });
      const matchesCategory = selectedCategory === 'All' || category === selectedCategory;
      const matchesOnline = !showOnlyOnline || h.isOnline;
      const matchesFavorites = !showFavoritesOnly || favorites.includes(h.id);
      const matchesRating = (h.rating || 0) >= minRating;
      const matchesExperience = (h.experienceYears || 0) >= minExperience;
      
      let matchesRadius = true;
      if (userLocation && useRadiusFilter) {
        const dist = calculateDistance(userLocation.lat, userLocation.lng, h.lat || 0, h.lng || 0);
        matchesRadius = dist <= RADIUS_KM;
      }

      return matchesSearch && matchesCategory && matchesOnline && matchesRadius && matchesFavorites && matchesRating && matchesExperience;
    });

    if (userLocation) {
      list = [...list].sort((a, b) => {
        // 1. Prioritize Pro Plan
        if (a.plan === 'pro' && b.plan !== 'pro') return -1;
        if (a.plan !== 'pro' && b.plan === 'pro') return 1;

        // 2. Prioritize Featured
        if (a.isFeatured && !b.isFeatured) return -1;
        if (!a.isFeatured && b.isFeatured) return 1;

        const distA = calculateDistance(userLocation.lat, userLocation.lng, a.lat, a.lng);
        const distB = calculateDistance(userLocation.lat, userLocation.lng, b.lat, b.lng);
        return distA - distB;
      });
    } else {
      // Default sort: Pro first, then Featured
      list = [...list].sort((a, b) => {
        if (a.plan === 'pro' && b.plan !== 'pro') return -1;
        if (a.plan !== 'pro' && b.plan === 'pro') return 1;
        if (a.isFeatured && !b.isFeatured) return -1;
        if (!a.isFeatured && b.isFeatured) return 1;
        return 0;
      });
    }

    return list;
  }, [searchQuery, selectedCategory, handymen, userLocation, showOnlyOnline, showFavoritesOnly, useRadiusFilter, favorites, minRating, minExperience]);

  const handleAddPro = async (newPro: Omit<Handyman, 'id' | 'rating' | 'reviews' | 'verified' | 'portfolio' | 'experienceYears' | 'userId' | 'availability'> & { portfolio?: string[], experienceYears?: number }) => {
    setIsRegistering(true);
    try {
      let profileImageUrl = '';
      if (profileImageFile) {
        const storageRef = ref(storage, `profiles/${Date.now()}_${profileImageFile.name}`);
        const snapshot = await uploadBytes(storageRef, profileImageFile);
        profileImageUrl = await getDownloadURL(snapshot.ref);
      }

      const pro: Handyman = {
        ...newPro,
        id: Date.now().toString(),
        rating: 0,
        reviews: 0,
        verified: false,
        portfolio: newPro.portfolio || [],
        experienceYears: newPro.experienceYears || parseInt(newPro.experience.split(' ')[0]) || 0,
        ...(profileImageUrl ? { profileImage: profileImageUrl } : {}),
        userId: currentUser?.uid,
        availability: 'Available',
        plan: selectedPlan?.id as 'basic' | 'pro' || 'basic'
      };

      // Save to Firestore
      try {
        await setDoc(doc(db, "handymen", pro.id), Object.fromEntries(Object.entries(pro).filter(([_, v]) => v !== undefined)));
      } catch (err) {
        handleFirestoreError(err, OperationType.CREATE, `handymen/${pro.id}`);
      }

      // Update user document with plan, role, and initial credits
      if (currentUser) {
        try {
          await updateDoc(doc(db, 'users', currentUser.uid), {
            role: 'handyman',
            plan: selectedPlan?.id || 'basic',
            credits: Math.max(currentUser.credits || 0, 2) // Ensure at least 2 welcome credits
          });
        } catch (err) {
          handleFirestoreError(err, OperationType.UPDATE, `users/${currentUser.uid}`);
        }
      }
      // No need to setHandymen manually as onSnapshot will handle it
      setShowRegForm(false);
      setProfileImageFile(null);
      setShowSuccess(true);
      toast.success("Professional Profile Created!", { 
        description: "Your account has been updated. You can now receive job requests." 
      });
      setTimeout(() => setShowSuccess(false), 5000);
    } catch (error: any) {
      console.error("Error registering handyman:", error);
      toast.error("Registration Failed", { 
        description: error.message || "Please check your connection and try again." 
      });
    } finally {
      setIsRegistering(false);
    }
  };

  const handleUpdatePro = async (updatedData: Partial<Handyman>) => {
    if (!myProProfile) return;
    setIsUpdating(true);
    try {
      let profileImageUrl = updatedData.profileImage;
      if (profileImageFile) {
        const storageRef = ref(storage, `profiles/${Date.now()}_${profileImageFile.name}`);
        const snapshot = await uploadBytes(storageRef, profileImageFile);
        profileImageUrl = await getDownloadURL(snapshot.ref);
      }

      const finalPro = {
        ...myProProfile,
        ...updatedData,
        ...(profileImageUrl ? { profileImage: profileImageUrl } : {}),
        experienceYears: updatedData.experience ? parseInt(updatedData.experience.split(' ')[0]) || myProProfile.experienceYears : myProProfile.experienceYears
      };

      await setDoc(doc(db, "handymen", myProProfile.id), Object.fromEntries(Object.entries(finalPro).filter(([_, v]) => v !== undefined)), { merge: true });
      
      setShowEditProfile(false);
      setProfileImageFile(null);
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 5000);
    } catch (error) {
      console.error("Error updating profile:", error);
      alert("Failed to update profile. Please try again.");
    } finally {
      setIsUpdating(false);
    }
  };

  const toggleVerification = async (proId: string) => {
    const pro = handymen.find(h => h.id === proId);
    if (!pro) return;

    try {
      await setDoc(doc(db, 'handymen', proId), {
        verified: !pro.verified
      }, { merge: true });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `handymen/${proId}`);
    }
  };

  const handleAddReview = (proId: string, rating: number, comment: string) => {
    const randomUserNumber = crypto.getRandomValues(new Uint32Array(1))[0] % 1000;
    const newReview: Review = {
      id: Date.now().toString(),
      proId,
      userName: 'User ' + randomUserNumber,
      rating,
      comment,
      date: new Date().toLocaleDateString()
    };
    setReviews([newReview, ...reviews]);
    
    // Update pro rating (simulated)
    setHandymen(prev => prev.map(p => {
      if (p.id === proId) {
        const newTotalReviews = p.reviews + 1;
        const newRating = ((p.rating * p.reviews) + rating) / newTotalReviews;
        return { ...p, reviews: newTotalReviews, rating: Number(newRating.toFixed(1)) };
      }
      return p;
    }));
  };

  const handleUnlockLead = async (requestId: string) => {
    if (!currentUser || currentUser.role !== 'handyman') return;
    
    const currentCredits = currentUser.credits || 0;
    if (currentCredits < 1) {
      setShowOutOfCredits(true);
      return;
    }

    try {
      const requestRef = doc(db, 'jobRequests', requestId);
      const requestDoc = await getDoc(requestRef);
      
      if (requestDoc.exists()) {
        const data = requestDoc.data() as JobRequest;
        const unlockedBy = data.unlockedBy || [];
        
        if (!unlockedBy.includes(currentUser.uid)) {
          await updateDoc(requestRef, {
            unlockedBy: [...unlockedBy, currentUser.uid]
          });
          
          // Deduct credit
          await updateDoc(doc(db, 'users', currentUser.uid), {
            credits: currentCredits - 1
          });
          
          setShowSuccess(true);
          setTimeout(() => setShowSuccess(false), 3000);
        }
      }
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, 'jobRequests');
    }
  };

  const handleApproveVerification = async (userId: string) => {
    try {
      await updateDoc(doc(db, 'users', userId), {
        isVerifiedPending: false,
        verified: true
      });
      
      // Also update the handyman profile if it exists
      const pro = handymen.find(h => h.userId === userId);
      if (pro) {
        await setDoc(doc(db, 'handymen', pro.id), {
          verified: true
        }, { merge: true });
      }

      // Create notification for the user
      await createNotification(
        userId,
        'Verification Approved!',
        'Your professional profile has been verified. You now have the verified badge!',
        'system',
        ''
      );
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `users/${userId}`);
    }
  };

  const handleRejectVerification = async (userId: string) => {
    try {
      await updateDoc(doc(db, 'users', userId), {
        isVerifiedPending: false,
        verified: false
      });

      // Create notification for the user
      await createNotification(
        userId,
        'Verification Update',
        'Your verification request was not approved at this time. Please ensure your profile is complete.',
        'system',
        ''
      );
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `users/${userId}`);
    }
  };

  // Check for Paystack callback
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const reference = urlParams.get('reference');
    if (reference && jobRequests.length > 0) {
      const job = jobRequests.find(j => j.paystackReference === reference);
      if (job && job.paymentStatus === 'pending') {
        handleVerifyPayment(reference, job.id);
        // Clean up URL and redirect to home
        window.history.replaceState({}, document.title, '/');
      }
    }
  }, [jobRequests]);

  const handleApplyVerification = async (file: File) => {
    if (!currentUser) return;
    setIsRegistering(true);
    try {
      const storageRef = ref(storage, `verifications/${currentUser.uid}_${Date.now()}_${file.name}`);
      const snapshot = await uploadBytes(storageRef, file);
      const idDocumentUrl = await getDownloadURL(snapshot.ref);

      await updateDoc(doc(db, 'users', currentUser.uid), {
        isVerifiedPending: true,
        idDocumentUrl
      });
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 5000);
      alert("Verification application submitted! We will review your ID and documents within 48 hours.");
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, 'users');
    } finally {
      setIsRegistering(false);
    }
  };

  const handleRaiseDispute = async (jobRequestId: string, reason: string) => {
    if (!currentUser) return;
    try {
      const dispute: Dispute = {
        id: Date.now().toString(),
        jobRequestId,
        raisedBy: currentUser.uid,
        reason,
        status: 'open',
        createdAt: serverTimestamp()
      };
      await setDoc(doc(db, 'disputes', dispute.id), dispute);
      
      await updateDoc(doc(db, 'jobRequests', jobRequestId), {
        paymentStatus: 'disputed'
      });

      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 5000);
      setShowDisputeModal(null);
      alert("Dispute raised. Our admin team will review this shortly.");
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'disputes');
    }
  };

  const handleInitializePayment = async (jobRequest: JobRequest, amount: number) => {
    if (!currentUser) return;
    try {
      const response = await axios.post('/api/paystack/initialize', {
        email: currentUser.email,
        amount,
        metadata: {
          jobRequestId: jobRequest.id,
          userId: currentUser.uid
        }
      });
      
      if (response.data.status) {
        // Use window.location.href to avoid popup blockers
        window.location.href = response.data.data.authorization_url;
        
        await updateDoc(doc(db, 'jobRequests', jobRequest.id), {
          paystackReference: response.data.data.reference,
          paymentStatus: 'pending',
          amount
        });
        setShowPaymentModal(null);
      }
    } catch (error: any) {
      console.error("Payment initialization failed:", error);
      let errorMsg = "Failed to start payment process.";
      if (error.response?.status === 404) {
        errorMsg = "Payment service endpoint not found. Please ensure Firebase Functions are deployed.";
      } else if (error.message.includes('fetch failed') || error.message.includes('Network Error')) {
        errorMsg = "Could not connect to payment service. Check your internet or if the server is down.";
      }
      toast.error("Payment Error", { description: errorMsg });
    }
  };

  const handleVerifyPayment = async (reference: string, jobRequestId: string) => {
    try {
      const response = await axios.get(`/api/paystack/verify/${reference}`);
      if (response.data.status && response.data.data.status === 'success') {
        await updateDoc(doc(db, 'jobRequests', jobRequestId), {
          paymentStatus: 'escrowed'
        });
        alert("Payment successful! Funds are now held in escrow.");
      }
    } catch (error) {
      console.error("Payment verification failed:", error);
    }
  };

  const handleReleaseFunds = async (jobRequestId: string) => {
    try {
      await updateDoc(doc(db, 'jobRequests', jobRequestId), {
        paymentStatus: 'released',
        status: 'completed'
      });
      alert("Funds released to the professional!");
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, 'jobRequests');
    }
  };

  const handleResolveDispute = async (disputeId: string, resolution: 'resolved' | 'refunded') => {
    try {
      const dispute = disputes.find(d => d.id === disputeId);
      if (!dispute) return;

      await updateDoc(doc(db, 'disputes', disputeId), {
        status: resolution,
        resolvedAt: serverTimestamp()
      });

      await updateDoc(doc(db, 'jobRequests', dispute.jobRequestId), {
        paymentStatus: resolution === 'refunded' ? 'refunded' : 'released'
      });

      alert(`Dispute ${resolution === 'refunded' ? 'refunded' : 'resolved'}.`);
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, 'disputes');
    }
  };

  const handleBuyCredits = async (amount: number) => {
    if (!currentUser) return;
    
    // For credit packs, we also want to show the checkout modal
    const creditPackPlan: PricingPlan = {
      id: `credits-${amount}`,
      name: `${amount} Credits Pack`,
      price: amount === 5 ? '₦500' : amount === 15 ? '₦1,200' : '₦3,500',
      period: 'one-time',
      features: [`${amount} Lead Credits`, 'Instant Activation', 'No Expiry'],
      buttonText: 'Buy Now'
    };
    
    setSelectedPlan(creditPackPlan);
    setShowCheckout(true);
  };

  const [showDisputeModal, setShowDisputeModal] = useState<JobRequest | null>(null);
  const [disputes, setDisputes] = useState<Dispute[]>([]);
  const [showPaymentModal, setShowPaymentModal] = useState<JobRequest | null>(null);
  const [showQuoteModal, setShowQuoteModal] = useState<JobRequest | null>(null);

  const handleUpdateUserProfile = async (data: { name: string, phone: string }) => {
    if (!currentUser) return;
    try {
      await updateDoc(doc(db, "users", currentUser.uid), Object.fromEntries(Object.entries(data).filter(([_, v]) => v !== undefined)));
      setShowUserProfileModal(false);
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 3000);
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, 'users');
    }
  };

  const handleGoHome = () => {
    setShowPricing(false);
    setShowRequests(false);
    setShowChatList(false);
    setShowAdminDashboard(false);
    setSelectedPro(null);
    setSelectedCategory('All');
    setSearchQuery('');
    setMinRating(0);
    setMinExperience(0);
    setShowOnlyOnline(false);
    setShowFavoritesOnly(false);
    setUseRadiusFilter(false);
    setShowEditProfile(false);
    setShowRegForm(false);
    setShowAuthModal(false);
    setRequestingQuotePro(null);
    setShowUserProfileModal(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleRequestQuote = async (formData: { name: string, description: string, scheduledDate?: string, scheduledTime?: string }) => {
    if (!requestingQuotePro) return;

    try {
      const newRequestData = {
        proId: requestingQuotePro.id,
        proUserId: requestingQuotePro.userId || '',
        proName: requestingQuotePro.name,
        userUid: currentUser?.uid || '',
        userName: formData.name,
        userPhone: currentUser?.phone || '',
        jobDescription: formData.description,
        scheduledDate: formData.scheduledDate || '',
        scheduledTime: formData.scheduledTime || '',
        status: 'pending',
        date: serverTimestamp(),
        unlockedBy: []
      };

      const docRef = await addDoc(collection(db, 'jobRequests'), newRequestData);

      // Notify the handyman
      if (requestingQuotePro.userId) {
        await createNotification(
          requestingQuotePro.userId,
          'New Quote Request',
          `${formData.name} requested a quote for: ${formData.description.substring(0, 30)}...`,
          'quote',
          docRef.id
        );
      }

      setRequestingQuotePro(null);
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 5000);

      // Communication is now forced to the app, so we don't open WhatsApp anymore
      // alert("Quote request sent! You can now chat with the professional in the Messages tab.");
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'jobRequests');
    }
  };

  const handleSendQuote = async (jobRequestId: string, quoteDetails: { labor: number, materials: number, taxes: number, notes: string }) => {
    try {
      const totalAmount = quoteDetails.labor + quoteDetails.materials + quoteDetails.taxes;
      const invoiceId = 'INV-' + Date.now().toString().slice(-6) + Math.floor(Math.random() * 100).toString().padStart(2, '0');
      await updateDoc(doc(db, 'jobRequests', jobRequestId), {
        status: 'responded',
        amount: totalAmount,
        paymentStatus: 'pending',
        quoteDetails,
        invoiceId
      });
      alert('Invoice generated successfully!');
      setShowQuoteModal(null);
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, 'jobRequests');
    }
  };

  const handleUpdateJobStatus = async (req: JobRequest, newStatus: 'pending' | 'responded' | 'on-the-way' | 'completed') => {
    try {
      await updateDoc(doc(db, 'jobRequests', req.id), { status: newStatus });
      
      // Notify the user who made the request
      if (req.userUid) {
        await createNotification(
          req.userUid,
          'Job Status Updated',
          `Your request for ${req.proName} is now ${newStatus}.`,
          'job_status',
          req.id
        );
      }
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, 'jobRequests');
    }
  };

  const handleHandyPadiSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!handyPadiInput.trim()) return;

    const userMsg = { role: 'user' as const, text: handyPadiInput };
    setHandyPadiMessages(prev => [...prev, userMsg]);
    setHandyPadiInput('');
    setIsHandyPadiTyping(true);

    try {
      const response = await geminiService.handyPadiChat(userMsg.text, handyPadiMessages, currentLanguage);
      setHandyPadiMessages(prev => [...prev, { role: 'bot' as const, text: response || "I'm sorry, I couldn't process that." }]);
    } catch (error: any) {
      console.error("HandyPadi Error:", error);
      const errorMsg = error instanceof Error ? error.message : "HandyPadi is temporarily unavailable.";
      let friendlyMessage = `⚠️ Error: ${errorMsg}.`;
      
      if (errorMsg.includes('404') || errorMsg.includes('<!doctype html>')) {
        friendlyMessage = "⚠️ HandyPadi's backend is not responding correctly. \n\n**Action Required:** \n1. Ensure your Firebase Functions are deployed (`firebase deploy --only functions`).\n2. If using a custom domain like **handypadi.ng**, check your Hosting rewrites in firebase.json.";
      } else if (errorMsg.includes('500')) {
        friendlyMessage = "⚠️ HandyPadi is having trouble processing that request (Server Error). \n\n**Action Required:** \n1. Your GEMINI_API_KEY might be missing in production. Set it using: `firebase functions:secrets:set GEMINI_API_KEY`";
      } else if (errorMsg.includes('fetch failed')) {
        friendlyMessage = "⚠️ Could not connect to the AI backend. Please check your internet connection or if the API service is down.";
      }
      
      setHandyPadiMessages(prev => [...prev, { role: 'bot' as const, text: friendlyMessage }]);
      toast.error("AI Service Error", { description: errorMsg });
    } finally {
      setIsHandyPadiTyping(false);
    }
  };

  const [isTranslating, setIsTranslating] = useState<string | null>(null);
  const handleTranslate = async (text: string, id: string) => {
    setIsTranslating(id);
    try {
      const translated = await geminiService.translateText(text, currentLanguage);
      // We'll just show it as an alert for now, or we could update the local state
      alert(`Translated to ${currentLanguage}:\n\n${translated}`);
    } catch (error) {
      console.error("Translation Error:", error);
    } finally {
      setIsTranslating(null);
    }
  };

  // Auto-translate AI messages when language changes
  useEffect(() => {
    if (currentLanguage === 'English') return;

    const translateAiContent = async () => {
      // Translate AI Diagnosis if exists
      if (aiDiagnosis && !aiDiagnosis.includes('(')) { // Simple check to avoid re-translating
        try {
          const translated = await geminiService.translateText(aiDiagnosis, currentLanguage);
          setAiDiagnosis(translated);
        } catch (error) {
          console.error('Failed to auto-translate AI diagnosis:', error);
        }
      }

      // Translate HandyPadi messages if they are from AI
      const lastMessage = handyPadiMessages[handyPadiMessages.length - 1];
      if (lastMessage && lastMessage.role === 'bot' && !lastMessage.text.includes('(')) {
        try {
          const translated = await geminiService.translateText(lastMessage.text, currentLanguage);
          setHandyPadiMessages(prev => prev.map((msg, idx) => 
            idx === prev.length - 1 ? { ...msg, text: translated } : msg
          ));
        } catch (error) {
          console.error('Failed to auto-translate HandyPadi message:', error);
        }
      }
    };

    translateAiContent();
  }, [currentLanguage]);

  // Multi-Country Logic based on domain
  const getCountryFromDomain = () => {
    const host = window.location.hostname;
    // Explicitly check for Nigeria domains
    if (host.endsWith('.ng') || host.includes('handypadi.ng')) return { name: 'Nigeria', slogan: 'anywhere in Nigeria', currency: 'NGN', jurisdiction: 'The Federal Republic of Nigeria', law: 'Nigerian Law', compliance: 'Nigeria Data Protection Regulation (NDPR)' };
    if (host.endsWith('.gh')) return { name: 'Ghana', slogan: 'anywhere in Ghana', currency: 'GHS', jurisdiction: 'The Republic of Ghana', law: 'Ghanaian Law', compliance: 'Data Protection Act, 2012 (Act 843)' };
    if (host.endsWith('.ke')) return { name: 'Kenya', slogan: 'anywhere in Kenya', currency: 'KES', jurisdiction: 'The Republic of Kenya', law: 'Kenyan Law', compliance: 'Data Protection Act (DPA), 2019' };
    if (host.endsWith('.za')) return { name: 'South Africa', slogan: 'anywhere in South Africa', currency: 'ZAR', jurisdiction: 'The Republic of South Africa', law: 'South African Law', compliance: 'Protection of Personal Information Act (POPIA)' };
    // Default to Nigeria for localhost and others
    return { name: 'Nigeria', slogan: 'anywhere in Nigeria', currency: 'NGN', jurisdiction: 'The Federal Republic of Nigeria', law: 'Nigerian Law', compliance: 'Nigeria Data Protection Regulation (NDPR)' };
  };

  const currentMarket = useMemo(() => getCountryFromDomain(), []);

  const handleSmartMatch = async (query: string) => {
    if (query.length < 10) {
      setAiMatchedProIds([]);
      return;
    }
    setIsAiMatching(true);
    try {
      const matchedIds = await geminiService.matchHandymen(query, handymen);
      setAiMatchedProIds(matchedIds);
    } catch (error) {
      console.error("Smart Match Error:", error);
    } finally {
      setIsAiMatching(false);
    }
  };

  const handleRefineDescription = async (desc: string, setDesc: (v: string) => void) => {
    if (!desc.trim()) return;
    setIsAiRefining(true);
    try {
      const result = await geminiService.refineJobDescription(desc);
      if (result && result.isRefined) {
        setDesc(result.content);
        toast.success("Job description refined by AI");
      } else if (result) {
        toast.info("AI Insights", { description: result.content });
      }
    } catch (error) {
      console.error("Refine Description Error:", error);
      toast.error("AI Refinement Failed", { description: "Please check your AI configuration." });
    } finally {
      setIsAiRefining(false);
    }
  };

  const handleSummarizeReviews = async (proId: string) => {
    const proReviews = reviews.filter(r => r.proId === proId);
    if (proReviews.length === 0) return;
    setIsAiSummarizing(true);
    try {
      const summary = await geminiService.summarizeReviews(proReviews);
      setAiSummary(summary || null);
    } catch (error) {
      console.error("Summarize Reviews Error:", error);
    } finally {
      setIsAiSummarizing(false);
    }
  };

  const handleDiagnoseImage = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsAiDiagnosing(true);
    try {
      const reader = new FileReader();
      reader.onloadend = async () => {
        const base64 = (reader.result as string).split(',')[1];
        const result = await geminiService.analyzeIssueImage(base64, file.type);
        setAiDiagnosis(result);
        if (result?.suggestedCategory) {
          setSelectedCategory(result.suggestedCategory);
          setSearchQuery(result.issue);
        }
      };
      reader.readAsDataURL(file);
    } catch (error) {
      console.error("Diagnose Image Error:", error);
    } finally {
      setIsAiDiagnosing(false);
    }
  };

  return (
    <ErrorBoundary>
      {renderContent()}
    </ErrorBoundary>
  );

  function renderContent() {
    if (!isAuthReady) {
      return (
        <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center p-8 text-center">
          <Sparkles className="w-24 h-24 mb-8 animate-pulse text-blue-500" />
          <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mb-6"></div>
          <h1 className="text-2xl font-bold text-white mb-2">Ṣẹ Ṣẹ Wá</h1>
          <p className="text-slate-400 font-medium">Initializing secure marketplace...</p>
          <p className="text-slate-600 text-xs mt-4">Connecting to core services</p>
        </div>
      );
    }

    if (initError) {
      return (
        <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center p-8 text-center">
          <AlertTriangle className="w-16 h-16 text-amber-500 mb-6" />
          <h1 className="text-xl font-bold text-white mb-4">Initialization Issue</h1>
          <div className="bg-black/40 p-4 rounded-lg text-left max-w-2xl w-full overflow-auto max-h-[50vh] border border-white/10">
            <pre className="text-pink-400 text-xs font-mono whitespace-pre-wrap">{initError}</pre>
          </div>
          <button 
            onClick={() => window.location.reload()}
            className="mt-8 px-6 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-all"
          >
            Try Reloading
          </button>
          <p className="mt-4 text-slate-500 text-sm">
            If you see "Missing permissions", check your Firebase Security Rules.
          </p>
        </div>
      );
    }

    if (isRedirecting) {
      const host = window.location.hostname.toLowerCase();
      const defaultDomain = managedDomains.find(d => d && d.isDefault);
      const domainRule = managedDomains.find(d => d && d.name && d.name.toLowerCase() === host);
      
      let target = null;
      if (domainRule && domainRule.mode === 'redirect' && domainRule.target) {
        target = domainRule.target.startsWith('http') ? domainRule.target : `https://${domainRule.target}`;
      } else if (defaultDomain && defaultDomain.name && defaultDomain.name.toLowerCase() !== host) {
        target = `https://${defaultDomain.name}${window.location.pathname}${window.location.search}`;
      }

      return (
        <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center p-6 text-center">
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white/5 backdrop-blur-xl border border-white/10 p-12 rounded-[2.5rem] max-w-md w-full shadow-2xl"
          >
            <div className="w-20 h-20 border-4 border-blue-500/30 border-t-blue-500 rounded-full animate-spin mx-auto mb-8" />
            <h1 className="text-2xl font-black text-white mb-4 tracking-tighter">Redirecting...</h1>
            <p className="text-slate-400 font-medium leading-relaxed mb-6">
              We are taking you to the correct version of HandyPadi for your region.
            </p>
            {target && (
              <a 
                href={target}
                className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold transition-all shadow-lg shadow-blue-600/20"
              >
                Click here if not redirected <ChevronRight size={18} />
              </a>
            )}
          </motion.div>
        </div>
      );
    }

    return (
      <div className="min-h-screen bg-slate-50 text-slate-900 font-sans overflow-x-hidden relative">
        {showLogoPreview && <LogoPreview onClose={() => setShowLogoPreview(false)} onSelect={(option) => {
          console.log("Selected Logo Option:", option);
          setShowLogoPreview(false);
          toast.success(`Logo Concept ${option} selected! Just let me know to confirm and I'll deploy it to the app.`);
        }} />}
        {/* Ambient Animated Background */}
        <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden" aria-hidden="true">
          <motion.div 
            animate={{ 
              x: [0, 50, 0], 
              y: [0, -50, 0],
              scale: [1, 1.1, 1] 
            }}
            transition={{ duration: 15, repeat: Infinity, ease: "easeInOut" }}
            className="absolute -top-[20%] -left-[10%] w-[50%] h-[50%] rounded-full bg-blue-100/50 blur-3xl opacity-50"
          />
          <motion.div 
            animate={{ 
              x: [0, -50, 0], 
              y: [0, 50, 0],
              scale: [1, 1.2, 1] 
            }}
            transition={{ duration: 20, repeat: Infinity, ease: "easeInOut", delay: 2 }}
            className="absolute top-[20%] -right-[10%] w-[50%] h-[50%] rounded-full bg-emerald-100/40 blur-3xl opacity-50"
          />
          <motion.div 
            animate={{ 
              x: [0, 30, 0], 
              y: [0, -30, 0]
            }}
            transition={{ duration: 18, repeat: Infinity, ease: "easeInOut", delay: 4 }}
            className="absolute -bottom-[20%] left-[20%] w-[60%] h-[60%] rounded-full bg-purple-100/40 blur-3xl opacity-50"
          />
        </div>
        
        <div className="relative z-10 w-full">
      {/* Success Message */}
      <AnimatePresence>
        {showSuccess && (
          <motion.div 
            initial={{ opacity: 0, y: -50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -50 }}
            className="fixed top-24 left-1/2 -translate-x-1/2 z-[100] bg-green-600 text-white px-6 py-3 rounded-full shadow-xl font-bold flex items-center gap-2"
          >
            <CheckCircle2 size={20} />
            Registration Successful!
          </motion.div>
        )}
      </AnimatePresence>

      {/* Out of Credits Modal */}
      <AnimatePresence>
        {showOutOfCredits && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="bg-white w-full max-w-md rounded-[2.5rem] shadow-2xl flex flex-col max-h-[90vh]"
            >
              <div className="p-8 overflow-y-auto flex flex-col items-center text-center">
              <div className="w-20 h-20 bg-amber-50 rounded-3xl flex items-center justify-center text-amber-500 mb-6">
                <AlertTriangle size={40} />
              </div>
              <h3 className="text-2xl font-black text-slate-900 mb-2">Credits Exhausted</h3>
              <p className="text-slate-500 mb-8">
                You've used your welcome credits. To continue unlocking high-value leads and growing your business, please top up your account.
              </p>
              
              <div className="grid grid-cols-1 gap-3 w-full mb-6">
                <button 
                  onClick={() => {
                    setShowOutOfCredits(false);
                    handleBuyCredits(1);
                  }}
                  className="flex items-center justify-between p-4 bg-blue-50 border border-blue-100 rounded-2xl hover:bg-blue-100 transition-all group"
                >
                  <div className="text-left">
                    <div className="font-bold text-blue-900">Single Lead</div>
                    <div className="text-xs text-blue-600">₦500 per lead</div>
                  </div>
                  <ChevronRight size={20} className="text-blue-400 group-hover:translate-x-1 transition-transform" />
                </button>
                
                <button 
                  onClick={() => {
                    setShowOutOfCredits(false);
                    handleBuyCredits(5);
                  }}
                  className="flex items-center justify-between p-4 bg-slate-50 border border-slate-100 rounded-2xl hover:bg-slate-100 transition-all group"
                >
                  <div className="text-left">
                    <div className="font-bold text-slate-900">Starter Pack (5 Leads)</div>
                    <div className="text-xs text-slate-500">₦2,000 (Save ₦500)</div>
                  </div>
                  <ChevronRight size={20} className="text-slate-400 group-hover:translate-x-1 transition-transform" />
                </button>
              </div>
              
              <div className="flex flex-col gap-3 w-full">
                <button 
                  onClick={() => {
                    setShowOutOfCredits(false);
                    setShowPricing(true);
                  }}
                  className="w-full py-4 bg-slate-900 text-white rounded-2xl font-bold hover:bg-slate-800 transition-all shadow-lg shadow-slate-900/20"
                >
                  View All Plans
                </button>
                <button 
                  onClick={() => setShowOutOfCredits(false)}
                  className="w-full py-4 text-slate-400 font-bold hover:text-slate-600 transition-colors"
                >
                  Maybe Later
                </button>
              </div>
            </div>
          </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Brand Preview Modal */}
      <AnimatePresence>
        {showBrandPreview && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowBrandPreview(false)}
              className="absolute inset-0 bg-slate-900/80 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto bg-white rounded-[2rem] shadow-2xl p-6 md:p-12 flex flex-col items-center text-center"
            >
              <button 
                onClick={() => setShowBrandPreview(false)}
                className="absolute top-4 right-4 md:top-6 md:right-6 p-2 rounded-full hover:bg-slate-100 transition-colors bg-white/80 backdrop-blur-sm z-10"
              >
                <X size={24} />
              </button>
              
              <div className="mb-6 md:mb-8 p-6 md:p-8 bg-slate-50 rounded-[2rem] md:rounded-[3rem] w-full flex justify-center">
                <Logo className="w-[200px] h-[200px] md:w-[300px] md:h-[300px]" />
              </div>
              
              <h2 className="text-4xl md:text-5xl font-cartoon text-slate-900 mb-8">HandyPadi</h2>
              
              <div className="grid grid-cols-2 gap-4 w-full">
                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100">
                  <p className="text-xs font-bold text-slate-400 uppercase mb-2">Primary Color</p>
                  <div className="h-12 w-full rounded-lg bg-gradient-to-b from-blue-400 to-blue-600" />
                </div>
                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100">
                  <p className="text-xs font-bold text-slate-400 uppercase mb-2">Accent Color</p>
                  <div className="h-12 w-full rounded-lg bg-slate-900" />
                </div>
              </div>

              <button 
                onClick={() => setShowBrandPreview(false)}
                className="mt-12 px-8 py-4 bg-slate-900 text-white rounded-2xl font-bold hover:bg-slate-800 transition-all"
              >
                {t('Back to App', currentLanguage)}
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Header */}
      <motion.header 
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
        className="bg-white/70 backdrop-blur-2xl border-b border-white/50 sticky top-0 z-50 w-full shadow-[0_10px_40px_-10px_rgba(0,0,0,0.05)]"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-2 flex items-center justify-between gap-4">
          
          {/* Logo Section */}
          <div 
            className="flex items-center cursor-pointer shrink-0 group" 
            onClick={handleGoHome}
            title="Go to Home"
          >
            <div className="flex items-center gap-2">
              <Logo className="w-8 h-8 sm:w-10 sm:h-10 transition-transform group-hover:scale-110" />
              <div className="flex flex-col leading-none">
                <span className="font-cartoon text-xl sm:text-2xl text-blue-600">HandyPadi</span>
                <span className="hidden sm:inline text-[8px] font-black text-slate-400 tracking-[0.2em] uppercase">Marketplace</span>
              </div>
            </div>
          </div>
          
          {/* Main Navigation (Pill Style) */}
          <nav className="flex-1 max-w-md bg-slate-100/50 p-1 rounded-full hidden md:flex items-center justify-between border border-slate-200/50">
            <button 
              onClick={handleGoHome}
              className={`flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-full text-sm font-bold transition-all ${
                (!showPricing && !showRequests && !showChatList && !showUserProfileModal && !showEditProfile && !showAdminDashboard) 
                ? 'bg-white text-blue-600 shadow-sm' 
                : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              <Home size={16} />
              <span>{t('Home', currentLanguage)}</span>
            </button>
            <button 
              onClick={() => {
                setShowRequests(!showRequests);
                setShowPricing(false);
                setShowChatList(false);
                setShowAdminDashboard(false);
                setShowEditProfile(false);
                setShowUserProfileModal(false);
              }}
              className={`flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-full text-sm font-bold transition-all ${
                showRequests ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              <Clock size={16} />
              <span>{t('My Requests', currentLanguage)}</span>
            </button>
            <button 
              onClick={() => {
                setShowChatList(!showChatList);
                setShowRequests(false);
                setShowPricing(false);
                setShowAdminDashboard(false);
                setShowEditProfile(false);
                setShowUserProfileModal(false);
              }}
              className={`flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-full text-sm font-bold transition-all relative ${
                showChatList ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              <MessageCircle size={16} />
              <span>{t('Messages', currentLanguage)}</span>
              {chats.length > 0 && (
                <span className="absolute top-1 right-2 bg-red-500 text-white text-[10px] w-4 h-4 rounded-full flex items-center justify-center font-bold border-2 border-white">
                  {chats.length}
                </span>
              )}
            </button>
            <button 
              onClick={() => {
                setShowPricing(!showPricing);
                setShowAdminDashboard(false);
                setShowRequests(false);
                setShowChatList(false);
                setShowEditProfile(false);
                setShowUserProfileModal(false);
              }}
              className={`flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-full text-sm font-bold transition-all ${
                showPricing ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              <CreditCard size={16} />
              <span>{t('Pricing', currentLanguage)}</span>
            </button>
          </nav>

          {/* Right Section Utilities */}
          <div className="flex items-center gap-1 sm:gap-2 shrink-0">
            <VoiceWelcome lang={currentLanguage} />
            
            {isAdmin && (
              <button 
                onClick={() => {
                  setShowAdminDashboard(!showAdminDashboard);
                  setShowPricing(false);
                  setShowRequests(false);
                  setShowChatList(false);
                }}
                className={`p-2 rounded-full transition-all ${
                  showAdminDashboard ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20' : 'text-slate-400 hover:bg-slate-100 hover:text-slate-600'
                }`}
                title={t('Admin', currentLanguage)}
              >
                <ShieldCheck size={20} />
              </button>
            )}

            <div className="w-px h-6 bg-slate-200 mx-1 hidden sm:block" />

            <div className="relative" ref={languageMenuRef}>
              <button 
                onClick={() => setShowLanguageMenu(!showLanguageMenu)}
                className={`p-1.5 sm:p-2 rounded-full transition-colors flex items-center gap-1 ${
                  showLanguageMenu ? 'bg-blue-50 text-blue-600' : 'text-slate-500 hover:bg-slate-100'
                }`}
              >
                <Globe size={18} className="sm:w-5 sm:h-5" />
                <span className="text-[10px] sm:text-xs font-bold hidden lg:inline">{currentLanguage}</span>
              </button>
              {showLanguageMenu && (
                <div className="absolute top-full right-0 mt-2 bg-white border border-slate-200 rounded-2xl shadow-xl py-2 w-48 z-50 max-h-80 overflow-y-auto custom-scrollbar animate-in fade-in slide-in-from-top-2">
                  {languages.map(lang => (
                    <button
                      key={lang}
                      onClick={() => {
                        setCurrentLanguage(lang);
                        setShowLanguageMenu(false);
                      }}
                      className={`w-full text-left px-4 py-2.5 text-sm hover:bg-slate-50 transition-colors flex items-center justify-between ${
                        currentLanguage === lang ? 'text-blue-600 font-bold bg-blue-50/50' : 'text-slate-600'
                      }`}
                    >
                      <span>{lang}</span>
                      {currentLanguage === lang && <Check size={14} className="text-blue-600" />}
                    </button>
                  ))}
                </div>
              )}
            </div>
            
            {currentUser && (
              <button 
                onClick={() => setShowNotifications(!showNotifications)}
                className={`p-1.5 sm:p-2 rounded-full transition-colors relative ${
                  showNotifications ? 'bg-blue-50 text-blue-600' : 'text-slate-500 hover:bg-slate-100'
                }`}
              >
                <Bell size={18} className="sm:w-5 sm:h-5" />
                {notifications.filter(n => !n.read).length > 0 && (
                  <span className="absolute top-2 right-2 w-1.5 h-1.5 bg-red-500 rounded-full border border-white" />
                )}
              </button>
            )}

            <div className="w-px h-6 bg-slate-200 mx-0.5 sm:mx-1 hidden md:block" />

            {currentUser ? (
              <button 
                onClick={handleLogout}
                className="flex items-center gap-1 sm:gap-2 px-2.5 py-1.5 sm:px-4 sm:py-2 bg-slate-100 text-slate-600 rounded-full text-xs sm:text-sm font-bold hover:bg-slate-200 transition-colors"
                title={t('Logout', currentLanguage)}
              >
                <LogOut size={16} />
                <span className="hidden sm:inline">{t('Logout', currentLanguage)}</span>
              </button>
            ) : (
              <button 
                onClick={handleLogin}
                className="flex items-center gap-1 sm:gap-2 px-2.5 py-1.5 sm:px-4 sm:py-2 bg-blue-600 text-white rounded-full text-xs sm:text-sm font-bold hover:bg-blue-700 transition-all shadow-lg shadow-blue-600/20 active:scale-95"
              >
                <LogIn size={16} />
                <span className="hidden sm:inline">{t('Login', currentLanguage)}</span>
              </button>
            )}

            {currentUser && (
              <button 
                onClick={() => {
                  if (myProProfile) {
                    setShowEditProfile(!showEditProfile);
                    setShowUserProfileModal(false);
                  } else {
                    setShowUserProfileModal(!showUserProfileModal);
                    setShowEditProfile(false);
                  }
                  setShowRequests(false);
                  setShowPricing(false);
                  setShowChatList(false);
                  setShowAdminDashboard(false);
                }}
                className={`p-0.5 rounded-full transition-all border-2 hidden md:block ${
                  (showEditProfile || showUserProfileModal) ? 'border-blue-600 scale-110 shadow-lg shadow-blue-600/20' : 'border-transparent hover:border-slate-300'
                }`}
              >
                <div className="w-9 h-9 bg-slate-100 rounded-full flex items-center justify-center overflow-hidden">
                  {currentUser?.photoURL ? (
                    <img referrerPolicy="no-referrer" src={currentUser.photoURL} alt="Profile" className="w-full h-full object-cover" />
                  ) : (
                    <span className="font-bold text-slate-500 uppercase">{currentUser?.name.charAt(0)}</span>
                  )}
                </div>
              </button>
            )}
          </div>
        </div>
      </motion.header>

      <main className="max-w-6xl mx-auto px-4 py-8 pb-24 md:pb-8">
        {showPricing ? (
          <section className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold mb-4">{t('Grow Your Business', currentLanguage)}</h2>
              <p className="text-slate-500 max-w-xl mx-auto">
                {t('Choose the plan that fits your professional needs. Get more visibility, more leads, and grow your reputation.', currentLanguage)}
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 mb-16">
              {PRICING_PLANS.map((plan) => (
                <div 
                  key={plan.id}
                  className={`relative flex flex-col bg-white p-8 rounded-3xl border transition-all ${
                    plan.recommended 
                    ? 'border-blue-600 shadow-xl shadow-blue-600/10 scale-105 z-10' 
                    : 'border-slate-200 hover:border-blue-200'
                  }`}
                >
                  {plan.recommended && (
                    <span className="absolute -top-4 left-1/2 -translate-x-1/2 bg-blue-600 text-white text-[10px] font-bold uppercase px-4 py-1.5 rounded-full">
                      {t('Most Popular', currentLanguage)}
                    </span>
                  )}
                  
                  <div className="mb-8">
                    <h3 className="text-xl font-bold mb-2">{plan.name}</h3>
                    <div className="flex items-baseline gap-1">
                      <span className="text-4xl font-black">{plan.price}</span>
                      <span className="text-slate-400 text-sm">{plan.period}</span>
                    </div>
                  </div>

                  <ul className="space-y-4 mb-8 flex-1">
                    {plan.features.map((feature, i) => (
                      <li key={i} className="flex items-start gap-3 text-sm text-slate-600">
                        <CheckCircle2 size={18} className="text-blue-600 shrink-0" />
                        {feature}
                      </li>
                    ))}
                  </ul>

                  <button 
                    onClick={() => {
                      setSelectedPlan(plan);
                      setShowCheckout(true);
                    }}
                    className={`w-full py-4 rounded-2xl font-bold transition-all ${
                      plan.recommended
                      ? 'bg-blue-600 text-white hover:bg-blue-700 shadow-lg shadow-blue-600/20'
                      : 'bg-slate-100 text-slate-900 hover:bg-slate-200'
                    }`}
                  >
                    {plan.buttonText}
                  </button>
                </div>
              ))}
            </div>

            <div className="bg-blue-50 p-8 rounded-3xl text-center">
              <h4 className="font-bold text-blue-900 mb-2">Why upgrade to Featured Pro?</h4>
              <p className="text-blue-700 text-sm mb-6">
                Featured professionals receive up to 10x more job requests than standard listings.
              </p>
              <div className="flex flex-wrap justify-center gap-8">
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-900">10x</div>
                  <div className="text-xs text-blue-600 uppercase font-bold">More Leads</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-900">Top 1</div>
                  <div className="text-xs text-blue-600 uppercase font-bold">Search Rank</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-900">24/7</div>
                  <div className="text-xs text-blue-600 uppercase font-bold">Support</div>
                </div>
              </div>
            </div>

            <div className="mt-12">
              <h3 className="text-xl font-bold text-center mb-6">Need more leads? Buy Credit Packs</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {[
                  { amount: 1, price: '₦1,000', label: 'Pay-per-Lead' },
                  { amount: 10, price: '₦7,500', label: 'Starter Pack', popular: true },
                  { amount: 50, price: '₦30,000', label: 'Growth Pack' }
                ].map((pack) => (
                  <button
                    key={pack.amount}
                    onClick={() => handleBuyCredits(pack.amount)}
                    className={`p-6 rounded-2xl border transition-all text-left relative overflow-hidden group ${
                      pack.popular ? 'border-blue-200 bg-white shadow-md' : 'border-slate-100 bg-slate-50/50'
                    }`}
                  >
                    {pack.popular && (
                      <div className="absolute top-0 right-0 bg-blue-600 text-white text-[10px] font-bold px-3 py-1 rounded-bl-xl">
                        BEST VALUE
                      </div>
                    )}
                    <div className="text-slate-500 text-xs font-bold uppercase tracking-wider mb-1">{pack.label}</div>
                    <div className="text-2xl font-black text-slate-900 mb-1">{pack.amount} Credits</div>
                    <div className="text-blue-600 font-bold">{pack.price}</div>
                    <div className="mt-4 flex items-center gap-2 text-xs font-bold text-slate-400 group-hover:text-blue-600 transition-colors">
                      Buy Now <ChevronRight size={14} />
                    </div>
                  </button>
                ))}
              </div>
            </div>
            
            <div className="mt-12 text-center">
              <button 
                onClick={() => setShowPricing(false)}
                className="text-slate-500 font-medium hover:text-blue-600"
              >
                ← Back to Search
              </button>
            </div>
          </section>
        ) : showRequests ? (
          <section className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            {currentUser?.role === 'handyman' && (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
                <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-10 h-10 rounded-2xl bg-blue-50 flex items-center justify-center text-blue-600">
                      <CreditCard size={20} />
                    </div>
                    <h3 className="font-bold text-slate-900">Lead Credits</h3>
                  </div>
                  <div className="flex items-baseline gap-2">
                    <span className="text-3xl font-black text-slate-900">{currentUser.credits || 0}</span>
                    <span className="text-slate-400 text-sm">Available</span>
                  </div>
                  <button 
                    onClick={() => setShowPricing(true)}
                    className="mt-4 text-sm font-bold text-blue-600 hover:text-blue-700 flex items-center gap-1"
                  >
                    Buy More Credits <ChevronRight size={14} />
                  </button>
                </div>

                <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-10 h-10 rounded-2xl bg-purple-50 flex items-center justify-center text-purple-600">
                      <ShieldCheck size={20} />
                    </div>
                    <h3 className="font-bold text-slate-900">Verification</h3>
                  </div>
                  {myProProfile?.verified ? (
                    <div className="flex items-center gap-2 text-green-600 font-bold">
                      <CheckCircle2 size={18} />
                      <span>Verified Pro</span>
                    </div>
                  ) : currentUser.isVerifiedPending ? (
                    <div className="flex items-center gap-2 text-amber-600 font-bold">
                      <Clock size={18} />
                      <span>Pending Review</span>
                    </div>
                  ) : (
                    <div>
                      <p className="text-slate-500 text-xs mb-4">Get verified to build trust with clients.</p>
                      <button 
                        onClick={() => {
                          const input = document.createElement('input');
                          input.type = 'file';
                          input.accept = 'image/*,application/pdf';
                          input.onchange = (e) => {
                            const file = (e.target as HTMLInputElement).files?.[0];
                            if (file) handleApplyVerification(file);
                          };
                          input.click();
                        }}
                        className="w-full py-3 bg-slate-900 text-white text-xs font-bold rounded-2xl hover:bg-slate-800 transition-all active:scale-95 shadow-lg shadow-slate-900/10"
                      >
                        Apply for Verification
                      </button>
                    </div>
                  )}
                </div>

                <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-10 h-10 rounded-2xl bg-green-50 flex items-center justify-center text-green-600">
                      <TrendingUp size={20} />
                    </div>
                    <h3 className="font-bold text-slate-900">Performance</h3>
                  </div>
                  <div className="flex items-baseline gap-2">
                    <span className="text-3xl font-black text-slate-900">{jobRequests.length}</span>
                    <span className="text-slate-400 text-sm">Total Leads</span>
                  </div>
                  <p className="text-slate-500 text-[10px] mt-2 font-medium uppercase tracking-wider">
                    {currentUser.plan === 'pro' ? 'Featured Pro Plan Active' : 'Starter Plan'}
                  </p>
                </div>
              </div>
            )}

            <div className="flex items-center justify-between mb-8">
              <h2 className="text-2xl font-bold">My Job Requests</h2>
              <button 
                onClick={() => setShowRequests(false)}
                className="text-blue-600 font-medium hover:underline"
              >
                Back to Search
              </button>
            </div>
            
            <div className="grid gap-4">
              {jobRequests.length === 0 ? (
                <div className="text-center py-20 bg-white border border-dashed border-slate-200 rounded-3xl">
                  <Clock size={48} className="mx-auto text-slate-200 mb-4" />
                  <p className="text-slate-400">You haven't made any requests yet.</p>
                </div>
              ) : (
                jobRequests.map((req) => (
                  <div key={req.id} className="bg-white border border-slate-200 p-6 rounded-2xl shadow-sm">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h4 className="font-bold text-lg text-slate-900">
                          {currentUser?.role === 'handyman' ? `Request from ${req.userName}` : `Request for ${req.proName}`}
                        </h4>
                        <p className="text-slate-400 text-xs uppercase font-bold tracking-wider">ID: #{req.id} • {req.date}</p>
                      </div>
                      <span className={`text-[10px] font-bold uppercase px-2 py-1 rounded-full ${
                        req.status === 'completed' ? 'bg-green-50 text-green-600' : 
                        req.status === 'on-the-way' ? 'bg-indigo-50 text-indigo-600' :
                        req.status === 'responded' ? 'bg-blue-50 text-blue-600' : 'bg-amber-50 text-amber-600'
                      }`}>
                        {req.status}
                      </span>
                    </div>
                    <div className="bg-slate-50 p-4 rounded-xl mb-4">
                      <div className="flex flex-col gap-1">
                        <p className="text-slate-600 text-sm italic">"{req.jobDescription}"</p>
                        {req.scheduledDate && (
                          <div className="flex items-center gap-2 mt-2 text-xs font-bold text-slate-500">
                            <Clock size={14} className="text-blue-500" />
                            Target: {new Date(req.scheduledDate).toLocaleDateString()} at {req.scheduledTime}
                          </div>
                        )}
                        <button 
                          onClick={() => handleTranslate(req.jobDescription, req.id)}
                          className="text-[10px] text-blue-600 font-bold flex items-center gap-1 hover:underline w-fit mt-1"
                        >
                          <Globe size={10} />
                          {isTranslating === req.id ? t('Translating...', currentLanguage) : `${t('Translate to', currentLanguage)} ${currentLanguage}`}
                        </button>
                      </div>
                    </div>
                    
                    {currentUser?.role === 'handyman' ? (
                      <div className="flex flex-col gap-4">
                        <div className="flex flex-wrap gap-2">
                          <button 
                            onClick={() => setShowQuoteModal(req)}
                            disabled={req.status === 'responded' || req.status === 'on-the-way' || req.status === 'completed'}
                            className="px-4 py-2 bg-blue-600 text-white text-xs font-bold rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center gap-1"
                          >
                            <FileText size={14} />
                            Generate Invoice
                          </button>
                          <button 
                            onClick={() => handleUpdateJobStatus(req, 'on-the-way')}
                            disabled={req.status === 'on-the-way' || req.status === 'completed'}
                            className="px-4 py-2 bg-indigo-600 text-white text-xs font-bold rounded-lg hover:bg-indigo-700 disabled:opacity-50 flex items-center gap-1"
                          >
                            <MapPin size={14} />
                            Start Journey
                          </button>
                          <button 
                            onClick={() => handleUpdateJobStatus(req, 'completed')}
                            disabled={req.status === 'completed'}
                            className="px-4 py-2 bg-green-600 text-white text-xs font-bold rounded-lg hover:bg-green-700 disabled:opacity-50"
                          >
                            Mark as Completed
                          </button>
                          {currentUser?.plan === 'pro' || req.unlockedBy?.includes(currentUser?.uid || '') ? (
                            <div className="flex gap-2">
                              <button 
                                onClick={() => startChat(req.userUid, req.userName)}
                                className="px-4 py-2 bg-blue-50 text-blue-700 text-xs font-bold rounded-lg hover:bg-blue-100 flex items-center gap-1"
                              >
                                <MessageCircle size={14} />
                                Chat with Client
                              </button>
                              {req.userPhone && (
                                <a 
                                  href={`tel:${req.userPhone}`}
                                  className="px-4 py-2 bg-slate-100 text-slate-700 text-xs font-bold rounded-lg hover:bg-slate-200 flex items-center gap-1"
                                >
                                  <Phone size={14} />
                                  Call ({req.userPhone})
                                </a>
                              )}
                            </div>
                          ) : (
                            <button 
                              onClick={() => handleUnlockLead(req.id)}
                              className="px-6 py-3 bg-amber-600 text-white text-xs font-bold rounded-2xl hover:bg-amber-700 flex items-center gap-2 shadow-lg shadow-amber-600/20 active:scale-95 transition-all"
                            >
                              <Lock size={14} />
                              Unlock Lead (1 Credit)
                            </button>
                          )}
                        </div>
                        
                        {req.paymentStatus && (
                          <div className="pt-2 border-t border-slate-100">
                            <span className={`text-[10px] font-bold uppercase px-2 py-1 rounded-full ${
                              req.paymentStatus === 'escrowed' ? 'bg-amber-50 text-amber-600' : 
                              req.paymentStatus === 'released' ? 'bg-emerald-50 text-emerald-600' : 
                              req.paymentStatus === 'disputed' ? 'bg-red-50 text-red-600' : 'bg-slate-50 text-slate-600'
                            }`}>
                              Payment: {req.paymentStatus}
                            </span>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2 text-slate-500 text-xs">
                            <CheckCircle2 size={14} className="text-green-500" />
                            <span>Sent to professional via WhatsApp</span>
                          </div>
                          <button 
                            onClick={() => startChat(req.proId, req.proName)}
                            className="px-4 py-2 bg-blue-50 text-blue-700 text-xs font-bold rounded-lg hover:bg-blue-100 flex items-center gap-1"
                          >
                            <MessageCircle size={14} />
                            Chat with Pro
                          </button>
                        </div>
                        
                        <div className="flex flex-wrap gap-2 pt-2 border-t border-slate-100">
                          {req.amount && req.quoteDetails && (
                            <div className="w-full bg-blue-50 border border-blue-100 rounded-2xl p-4 mb-2">
                              <div className="flex justify-between items-center mb-2">
                                <h4 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                                  <FileText size={16} className="text-blue-600" />
                                  Official Invoice
                                </h4>
                                {req.invoiceId && (
                                  <span className="text-[10px] font-mono bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full">
                                    {req.invoiceId}
                                  </span>
                                )}
                              </div>
                              <div className="space-y-1 text-xs text-slate-600 mb-3 border-b border-slate-200 pb-3">
                                <div className="flex justify-between"><span>Labor</span><span>₦{req.quoteDetails.labor.toLocaleString()}</span></div>
                                <div className="flex justify-between"><span>Materials</span><span>₦{req.quoteDetails.materials.toLocaleString()}</span></div>
                                <div className="flex justify-between"><span>Taxes/Fees</span><span>₦{req.quoteDetails.taxes.toLocaleString()}</span></div>
                                {req.quoteDetails.notes && <p className="mt-2 text-[10px] italic">"{req.quoteDetails.notes}"</p>}
                              </div>
                              <div className="flex justify-between font-black text-slate-900 text-sm">
                                <span>Total Amount</span>
                                <span>₦{req.amount.toLocaleString()}</span>
                              </div>
                            </div>
                          )}
                          
                          {req.paymentStatus === 'pending' && req.amount && (
                            <button 
                              onClick={() => handleInitializePayment(req, req.amount!)}
                              className="px-6 py-3 bg-blue-600 text-white text-xs font-bold rounded-2xl hover:bg-blue-700 flex items-center gap-2 shadow-lg shadow-blue-600/20 active:scale-95 transition-all w-full justify-center sm:justify-start sm:w-auto"
                            >
                              <CreditCard size={14} />
                              Pay ₦{req.amount.toLocaleString()} (Escrow)
                            </button>
                          )}
                          
                          {req.paymentStatus === 'escrowed' && (
                            <>
                              <button 
                                onClick={() => handleReleaseFunds(req.id)}
                                className="px-6 py-3 bg-emerald-600 text-white text-xs font-bold rounded-2xl hover:bg-emerald-700 flex items-center gap-2 shadow-lg shadow-emerald-600/20 active:scale-95 transition-all"
                              >
                                <CheckCircle2 size={14} />
                                Release Funds
                              </button>
                              <button 
                                onClick={() => {
                                  const reason = prompt("Reason for dispute:");
                                  if (reason) handleRaiseDispute(req.id, reason);
                                }}
                                className="px-6 py-3 bg-red-50 text-red-600 text-xs font-bold rounded-2xl hover:bg-red-100 flex items-center gap-2 active:scale-95 transition-all"
                              >
                                <AlertTriangle size={14} />
                                Raise Dispute
                              </button>
                            </>
                          )}
                          
                          {req.paymentStatus === 'released' && (
                            <span className="text-xs font-bold text-emerald-600 flex items-center gap-1 bg-emerald-50 px-3 py-1.5 rounded-full">
                              <ShieldCheck size={14} /> Funds Released to Pro
                            </span>
                          )}

                          {req.paymentStatus === 'disputed' && (
                            <span className="text-xs font-bold text-amber-600 flex items-center gap-1 bg-amber-50 px-3 py-1.5 rounded-full">
                              <AlertTriangle size={14} /> Dispute Under Review
                            </span>
                          )}

                          {req.paymentStatus === 'refunded' && (
                            <span className="text-xs font-bold text-blue-600 flex items-center gap-1 bg-blue-50 px-3 py-1.5 rounded-full">
                              <RotateCcw size={14} /> Payment Refunded
                            </span>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </section>
        ) : showChatList ? (
          <section className="animate-in fade-in slide-in-from-bottom-4 duration-500 min-h-[500px] md:h-[calc(100vh-200px)] flex flex-col md:flex-row gap-6">
            <div className={`flex-1 md:w-80 bg-white border border-slate-200 rounded-3xl overflow-hidden flex flex-col ${activeChat ? 'hidden md:flex' : 'flex'}`}>
              <div className="p-6 border-b border-slate-100">
                <h2 className="text-xl font-bold">Messages</h2>
              </div>
              <div className="flex-1 overflow-y-auto">
                {chats.length === 0 ? (
                  <div className="p-12 text-center">
                    <MessageCircle size={40} className="mx-auto text-slate-200 mb-4" />
                    <p className="text-slate-400 text-sm mb-6">No conversations yet.</p>
                    <button 
                      onClick={() => setShowChatList(false)}
                      className="px-6 py-3 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 transition-all shadow-lg shadow-blue-600/20"
                    >
                      Find a Professional
                    </button>
                  </div>
                ) : (
                  chats.map((chat) => (
                    <button
                      key={chat.id}
                      onClick={() => setActiveChat(chat)}
                      className={`w-full p-4 text-left hover:bg-slate-50 transition-colors border-b border-slate-50 flex items-center gap-3 ${
                        activeChat?.id === chat.id ? 'bg-blue-50' : ''
                      }`}
                    >
                      <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center text-slate-400 font-bold">
                        {chat.otherParticipantName?.charAt(0)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex justify-between items-baseline">
                          <h4 className="font-bold text-slate-900 truncate">{chat.otherParticipantName}</h4>
                        </div>
                        <p className="text-xs text-slate-500 truncate">{chat.lastMessage || 'Start a conversation'}</p>
                      </div>
                    </button>
                  ))
                )}
              </div>
            </div>

            <div className={`flex-[2] bg-white border border-slate-200 rounded-3xl overflow-hidden ${!activeChat ? 'hidden md:flex items-center justify-center' : 'flex flex-col'}`}>
              {activeChat && currentUser ? (
                <ChatWindow 
                  chat={activeChat} 
                  currentUser={currentUser} 
                  onClose={() => setActiveChat(null)} 
                  createNotification={createNotification}
                />
              ) : (
                <div className="text-center p-12">
                  <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4 text-slate-300">
                    <MessageCircle size={32} />
                  </div>
                  <h3 className="text-lg font-bold text-slate-900">Select a conversation</h3>
                  <p className="text-slate-500 text-sm">Choose a chat from the list to start messaging</p>
                </div>
              )}
            </div>
          </section>
        ) : (
          <>
            {/* Hero / Search Section */}
        <motion.section 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1 }}
          className="mb-16 text-center px-2"
        >
          <motion.h2 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="text-4xl sm:text-7xl font-black text-slate-900 leading-[0.85] tracking-tighter mb-8 max-w-3xl mx-auto"
          >
            <motion.span
              animate={{ y: [0, -2, 0] }}
              transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
              className="block mb-2 text-slate-800"
            >
              {t('Find the right handyman', currentLanguage)}
            </motion.span>
            <motion.span 
              animate={{ 
                color: ["#2563eb", "#7c3aed", "#2563eb"],
              }}
              transition={{ 
                duration: 8, 
                repeat: Infinity, 
                ease: "linear" 
              }}
              className="italic block text-2xl sm:text-5xl opacity-90"
            >
              {t(currentMarket.slogan, currentLanguage)}
            </motion.span>
          </motion.h2>
          
          <div className="max-w-4xl mx-auto space-y-4">
            {/* Search and Quick Filters Row */}
            <motion.div 
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4, duration: 0.8 }}
              className="bg-white p-1 rounded-full shadow-2xl shadow-blue-900/10 border border-slate-100 flex flex-col sm:flex-row items-stretch gap-1 sm:gap-2"
            >
              <div className="flex-1 relative">
                <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
                <input 
                  type="text"
                  placeholder={t('Search by name or Location', currentLanguage)}
                  className="w-full pl-14 pr-24 sm:pr-32 py-5 bg-transparent rounded-full focus:outline-none text-slate-900 font-bold placeholder:text-slate-300 text-sm sm:text-lg"
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    handleSmartMatch(e.target.value);
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.currentTarget.blur();
                      document.getElementById('handyman-list')?.scrollIntoView({ behavior: 'smooth' });
                    }
                  }}
                />
                <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
                  {searchQuery && (
                    <button 
                      onClick={() => setSearchQuery('')}
                      className="p-2 text-slate-200 hover:text-slate-400 focus:outline-none"
                    >
                      <X size={18} />
                    </button>
                  )}
                  <button
                    onClick={() => {
                      (document.activeElement as HTMLElement)?.blur();
                      document.getElementById('handyman-list')?.scrollIntoView({ behavior: 'smooth' });
                    }}
                    className="hidden sm:flex items-center justify-center bg-blue-600 text-white rounded-full px-5 py-2.5 font-bold text-sm tracking-wide shadow-lg shadow-blue-600/20 hover:bg-blue-700 active:scale-95 transition-all"
                  >
                    Go
                  </button>
                  <button
                    onClick={() => {
                      (document.activeElement as HTMLElement)?.blur();
                      document.getElementById('handyman-list')?.scrollIntoView({ behavior: 'smooth' });
                    }}
                    className="sm:hidden flex items-center justify-center p-3 bg-blue-600 text-white rounded-full shadow-lg shadow-blue-600/20 hover:bg-blue-700 active:scale-95 transition-all"
                  >
                    <Search size={16} />
                  </button>
                </div>
              </div>

              <div className="flex gap-1 sm:gap-2 p-1">
                <button 
                  onClick={handleGetLocation}
                  className={`flex-1 sm:flex-none px-6 py-4 rounded-full font-black transition-all flex items-center justify-center gap-2 text-[10px] sm:text-xs uppercase tracking-widest border ${
                    userLocation 
                    ? 'bg-blue-600 text-white border-blue-600 shadow-xl shadow-blue-600/30' 
                    : 'bg-slate-50 border-transparent text-slate-400 hover:bg-slate-100'
                  }`}
                >
                  <Navigation size={14} className={userLocation ? 'animate-pulse' : ''} />
                  <span>{userLocation ? t('Active', currentLanguage) : t('Nearby', currentLanguage)}</span>
                </button>
                <button 
                  onClick={() => {
                    const willShow = !showFilters;
                    setShowFilters(willShow);
                    if (willShow) {
                      toast.success(t('Filters menu opened', currentLanguage), { 
                        description: t('Scroll down to see advanced filter options.', currentLanguage) 
                      });
                    }
                  }}
                  className={`flex-1 sm:flex-none px-6 py-4 rounded-full font-black transition-all flex items-center justify-center gap-2 text-[10px] sm:text-xs uppercase tracking-widest border ${
                    showFilters || minRating > 0 || minExperience > 0 
                    ? 'bg-blue-600 text-white border-blue-600 shadow-xl shadow-blue-600/30' 
                    : 'bg-slate-50 border-transparent text-slate-400 hover:bg-slate-100'
                  }`}
                >
                  <Filter size={14} />
                  <span>{t('Filters', currentLanguage)}</span>
                </button>
              </div>
            </motion.div>

            {/* Quick Categories Bar */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6, duration: 0.6 }}
              className="flex items-center gap-2 overflow-x-auto py-4 no-scrollbar -mx-4 px-4 sm:mx-0 sm:px-0"
            >
              {CATEGORIES.map((cat, idx) => (
                <button
                  key={idx}
                  onClick={() => setSelectedCategory(selectedCategory === cat.name ? 'All' : cat.name)}
                  className={`px-6 py-3 rounded-2xl whitespace-nowrap text-[11px] font-black transition-all flex items-center gap-2 border uppercase tracking-wider ${
                    selectedCategory === cat.name 
                    ? 'bg-slate-900 text-white border-slate-900 shadow-xl shadow-slate-900/20' 
                    : 'bg-white text-slate-400 border-slate-100 hover:border-slate-300 hover:text-slate-600'
                  }`}
                >
                  <cat.icon size={12} />
                  <span>{t(cat.name, currentLanguage)}</span>
                </button>
              ))}
            </motion.div>

            {/* AI Diagnosis CTA */}
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.8, duration: 0.6 }}
              className="bg-gradient-to-r from-purple-600 to-indigo-600 rounded-[2rem] p-6 text-white flex flex-col md:flex-row items-center justify-between gap-6 overflow-hidden relative group"
            >
              <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16 blur-2xl group-hover:scale-150 transition-transform duration-700" />
              <div className="relative z-10 text-center md:text-left">
                <h4 className="text-xl font-black tracking-tight mb-1">Not sure what's broken?</h4>
                <p className="text-purple-100 text-sm">Upload a photo and our AI will tell you who to call.</p>
              </div>
              <div className="relative z-10 shrink-0">
                <div className="relative inline-block">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleDiagnoseImage}
                    className="absolute inset-0 opacity-0 cursor-pointer z-10"
                  />
                  <button className={`px-8 py-4 rounded-2xl font-black text-sm transition-all flex items-center gap-2 shadow-xl ${
                    isAiDiagnosing 
                    ? 'bg-white/20 text-white animate-pulse' 
                    : 'bg-white text-purple-600 hover:bg-purple-50 hover:scale-105 active:scale-95'
                  }`}>
                    {isAiDiagnosing ? (
                      <>
                        <RotateCcw className="animate-spin" size={18} />
                        <span>Analyzing...</span>
                      </>
                    ) : (
                      <>
                        <Camera size={18} />
                        <span>Try AI Diagnostics</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </motion.div>
          </div>

            {isAiMatching && (
              <div className="flex items-center justify-center gap-2 text-blue-600 text-sm font-bold mb-4 animate-pulse">
                <Sparkles size={16} />
                <span>AI is finding the best matches for you...</span>
              </div>
            )}

            {aiDiagnosis && (
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="max-w-xl mx-auto mb-8 bg-purple-50 border border-purple-100 p-4 rounded-2xl flex items-start gap-3"
              >
                <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-purple-600 shadow-sm shrink-0">
                  <Sparkles size={20} />
                </div>
                <div>
                  <h4 className="font-bold text-purple-900 text-sm">AI Diagnosis Result</h4>
                  <div className="flex flex-col gap-1">
                    <p className="text-purple-800 text-xs mt-1"><strong>Issue:</strong> {aiDiagnosis.issue}</p>
                    <p className="text-purple-700 text-[10px] mt-1">{aiDiagnosis.explanation}</p>
                    <button 
                      onClick={() => handleTranslate(`${aiDiagnosis.issue}. ${aiDiagnosis.explanation}`, 'ai-diag')}
                      className="text-[10px] text-purple-600 font-bold flex items-center gap-1 hover:underline w-fit"
                    >
                      <Globe size={10} />
                      {isTranslating === 'ai-diag' ? t('Translating...', currentLanguage) : `${t('Translate to', currentLanguage)} ${currentLanguage}`}
                    </button>
                  </div>
                  <button 
                    onClick={() => setAiDiagnosis(null)}
                    className="mt-2 text-[10px] font-bold text-purple-600 hover:underline"
                  >
                    Clear Diagnosis
                  </button>
                </div>
              </motion.div>
            )}

            <AnimatePresence>
              {showFilters && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="overflow-hidden"
                >
                  <div className="max-w-xl mx-auto bg-white border border-slate-200 rounded-2xl p-6 mb-4 shadow-sm text-left">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-sm font-bold text-slate-700 mb-3 uppercase tracking-wider">Minimum Rating</label>
                        <div className="flex items-center gap-2">
                          {[0, 1, 2, 3, 4].map((r) => (
                            <button
                              key={r}
                              onClick={() => setMinRating(r + 1 === minRating ? 0 : r + 1)}
                              className={`flex-1 py-2 rounded-xl border-2 transition-all flex items-center justify-center gap-1 ${
                                minRating > r ? 'border-blue-600 bg-blue-50 text-blue-600' : 'border-slate-100 text-slate-400 hover:border-slate-200'
                              }`}
                            >
                              <span className="font-bold">{r + 1}</span>
                              <Star size={14} className={minRating > r ? 'fill-blue-600' : ''} />
                            </button>
                          ))}
                        </div>
                      </div>
                      <div>
                        <label className="block text-sm font-bold text-slate-700 mb-3 uppercase tracking-wider">Min Experience (Years)</label>
                        <div className="flex items-center gap-3">
                          <input 
                            type="range" 
                            min="0" 
                            max="20" 
                            step="1"
                            value={minExperience}
                            onChange={(e) => setMinExperience(parseInt(e.target.value))}
                            className="flex-1 accent-blue-600"
                          />
                          <span className="font-bold text-blue-600 w-12 text-center">{minExperience}+</span>
                        </div>
                      </div>
                    </div>
                    <div className="mt-6 flex justify-end">
                      <button 
                        onClick={() => {setMinRating(0); setMinExperience(0);}}
                        className="text-sm font-bold text-slate-400 hover:text-blue-600 transition-colors uppercase tracking-widest"
                      >
                        Reset Filters
                      </button>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {locationError && (
              <p className="text-red-500 text-sm font-medium">{locationError}</p>
            )}
        </motion.section>

        {/* Safety Tips */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7, duration: 0.6 }}
        >
          <SafetyTips lang={currentLanguage} />
        </motion.section>

        {/* AI Estimation Section */}
        <AIEstimationSection 
          market={currentMarket}
          onSearch={(query) => {
            setSearchQuery(query);
            handleSmartMatch(query);
          }} 
        />

        {/* Handyman List */}
        <section id="handyman-list" className="mt-12">
          {!userLocation && !locationError && (
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-8 p-6 bg-blue-50 border border-blue-100 rounded-[2rem] flex flex-col md:flex-row items-center justify-between gap-4"
            >
              <div className="flex items-center gap-4 text-left">
                <div className="w-12 h-12 bg-blue-100 rounded-2xl flex items-center justify-center text-blue-600 shrink-0">
                  <MapPin size={24} />
                </div>
                <div>
                  <h4 className="font-bold text-blue-900 leading-tight">Find Pros Near You</h4>
                  <p className="text-sm text-blue-600/70">Enable location access to see the closest professionals in your area.</p>
                </div>
              </div>
              <button 
                onClick={handleGetLocation}
                className="px-6 py-3 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 transition-all shadow-lg shadow-blue-600/20 whitespace-nowrap"
              >
                Allow Location Access
              </button>
            </motion.div>
          )}

          {locationError && (
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-8 p-6 bg-amber-50 border border-amber-100 rounded-[2rem] flex flex-col gap-4"
            >
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-amber-100 rounded-2xl flex items-center justify-center text-amber-600 shrink-0">
                  <AlertTriangle size={24} />
                </div>
                <div>
                  <h4 className="font-bold text-amber-900 leading-tight">Location Access Restricted</h4>
                  <p className="text-sm text-amber-600/70">{locationError}. You can still find pros by searching for a specific city below.</p>
                </div>
              </div>
              
              <div className="flex gap-2 max-w-md">
                <input 
                  type="text"
                  placeholder="Enter your city (e.g. Lagos, Abuja)..."
                  className="flex-1 px-4 py-2 bg-white rounded-xl border border-amber-200 focus:outline-none focus:ring-2 focus:ring-amber-400"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      setSearchQuery((e.target as HTMLInputElement).value);
                      toast.success(`Searching for pros in ${(e.target as HTMLInputElement).value}`);
                    }
                  }}
                />
                <button 
                  className="px-4 py-2 bg-amber-600 text-white rounded-xl font-bold"
                  onClick={(e) => {
                    const input = (e.currentTarget.previousElementSibling as HTMLInputElement);
                    setSearchQuery(input.value);
                    toast.success(`Searching for pros in ${input.value}`);
                  }}
                >
                  Search
                </button>
              </div>
            </motion.div>
          )}

          <div className="flex flex-col md:flex-row md:items-center justify-between gap-y-6 gap-x-8 mb-10 mt-6 overflow-hidden">
            <div className="flex items-center gap-4 shrink-0 px-1">
              <div className="flex items-baseline gap-2 group">
                <span className="text-4xl md:text-5xl font-black text-slate-900 leading-none tracking-tighter transition-transform group-hover:scale-105 duration-300">
                  {filteredHandymen.length}
                </span>
                <div className="flex flex-col">
                  <span className="text-slate-400 text-[10px] font-black uppercase tracking-[0.2em] leading-none mb-1">
                    Professionals
                  </span>
                  <span className="text-blue-600/40 text-[10px] font-black uppercase tracking-[0.2em] leading-none">
                    Available Now
                  </span>
                </div>
              </div>
              
              {(searchQuery || selectedCategory !== 'All' || minRating > 0 || minExperience > 0 || showOnlyOnline || showFavoritesOnly || useRadiusFilter) && (
                <button 
                  onClick={() => {
                    setSearchQuery('');
                    setSelectedCategory('All');
                    setMinRating(0);
                    setMinExperience(0);
                    setShowOnlyOnline(false);
                    setShowFavoritesOnly(false);
                    setUseRadiusFilter(false);
                  }}
                  className="flex items-center gap-1.5 px-3 py-2 bg-slate-100 hover:bg-red-50 text-slate-400 hover:text-red-500 rounded-2xl transition-all duration-300 active:scale-90 border border-slate-200/50 hover:border-red-100 shadow-sm group"
                >
                  <X size={12} strokeWidth={3} className="transition-transform group-hover:rotate-90" />
                  <span className="text-[10px] font-black uppercase tracking-wider">Reset</span>
                </button>
              )}
            </div>
            
            <div className="flex items-center gap-2 overflow-x-auto pb-4 md:pb-0 -mx-4 px-4 md:mx-0 md:px-0 md:flex-wrap md:justify-end scrollbar-hide">
              {!userLocation && (
                <button 
                  onClick={handleGetLocation}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-2xl text-xs font-bold transition-all border bg-amber-50 text-amber-600 border-amber-200 hover:bg-amber-100 whitespace-nowrap shadow-sm hover:shadow-md active:scale-95"
                  title="Enable location to find pros near you"
                >
                  <MapPin size={14} strokeWidth={2.5} />
                  Enable Location
                </button>
              )}
              {userLocation && (
                <button 
                  onClick={() => setUseRadiusFilter(!useRadiusFilter)}
                  className={`flex items-center gap-2 px-5 py-2.5 rounded-2xl text-xs font-bold transition-all border whitespace-nowrap shadow-sm hover:shadow-md active:scale-95 ${
                    useRadiusFilter 
                    ? 'bg-blue-600 text-white border-blue-600 shadow-lg shadow-blue-600/20' 
                    : 'bg-white text-slate-500 border-slate-200 hover:border-blue-200 hover:text-blue-600'
                  }`}
                >
                  <MapPin size={14} strokeWidth={2.5} />
                  Within 10 Miles
                </button>
              )}
              <button 
                onClick={() => setShowOnlyOnline(!showOnlyOnline)}
                className={`flex items-center gap-2 px-5 py-2.5 rounded-2xl text-xs font-bold transition-all border whitespace-nowrap shadow-sm hover:shadow-md active:scale-95 ${
                  showOnlyOnline 
                  ? 'bg-green-600 text-white border-green-600 shadow-lg shadow-green-600/20' 
                  : 'bg-white text-slate-500 border-slate-200 hover:border-green-200 hover:text-green-600'
                }`}
              >
                <div className={`w-2 h-2 rounded-full ${showOnlyOnline ? 'bg-white animate-pulse' : 'bg-gray-300'}`} />
                Online Only
              </button>
              <button 
                onClick={() => setShowFavoritesOnly(!showFavoritesOnly)}
                className={`flex items-center gap-2 px-5 py-2.5 rounded-2xl text-xs font-bold transition-all border whitespace-nowrap shadow-sm hover:shadow-md active:scale-95 ${
                  showFavoritesOnly 
                  ? 'bg-red-600 text-white border-red-600 shadow-lg shadow-red-600/20' 
                  : 'bg-white text-slate-500 border-slate-200 hover:border-red-200 hover:text-red-600'
                }`}
              >
                <Heart size={14} strokeWidth={2.5} fill={showFavoritesOnly ? "currentColor" : "none"} />
                Favorites
              </button>
            </div>
          </div>

          <motion.div 
            initial="hidden"
            animate="show"
            variants={{
              hidden: { opacity: 0 },
              show: {
                opacity: 1,
                transition: {
                  staggerChildren: 0.1
                }
              }
            }}
            className="grid grid-cols-1 md:grid-cols-2 gap-6 pb-24"
          >
            <AnimatePresence mode="popLayout">
              {filteredHandymen.map((handy) => (
                <motion.div
                  layout
                  key={handy.id}
                  variants={{
                    hidden: { opacity: 0, scale: 0.9, y: 30 },
                    show: { opacity: 1, scale: 1, y: 0 }
                  }}
                  whileHover={{ y: -5, scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  transition={{ type: "spring", stiffness: 300, damping: 20 }}
                  onClick={() => setSelectedPro(handy)}
                  className="bg-white/80 backdrop-blur-sm border border-slate-100 p-5 rounded-[2rem] shadow-sm hover:shadow-xl hover:shadow-blue-500/5 hover:border-blue-100 transition-all group cursor-pointer"
                >
                  <div className={`flex flex-col gap-4 ${
                    handy.verified && currentUser?.plan !== 'member' && currentUser?.role !== 'handyman' ? 'opacity-50 grayscale' : ''
                  }`}>
                    <div className="flex gap-4">
                      <div className="w-16 h-16 bg-slate-100 rounded-xl flex items-center justify-center text-slate-400 group-hover:bg-blue-50 group-hover:text-blue-500 transition-colors shrink-0 relative overflow-hidden">
                        {handy.profileImage ? (
                          <img src={handy.profileImage} alt={handy.name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                        ) : (
                          <Hammer size={32} />
                        )}
                        {handy.verified && currentUser?.plan !== 'member' && currentUser?.role !== 'handyman' && (
                          <div className="absolute inset-0 bg-slate-900/40 flex items-center justify-center">
                            <Lock size={20} className="text-white" />
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex flex-wrap items-center gap-2 mb-1 min-w-0">
                            <h4 className="font-bold text-lg text-slate-900 truncate">{handy.name}</h4>
                            {handy.availability && (
                              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase border shrink-0 ${
                                handy.availability === 'Available' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' :
                                handy.availability === 'Busy' ? 'bg-amber-50 text-amber-600 border-amber-100' :
                                'bg-slate-50 text-slate-400 border-slate-100'
                              }`}>
                                {handy.availability}
                              </span>
                            )}
                            <div className={`flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase border shrink-0 ${
                              handy.isOnline 
                              ? 'bg-green-50 text-green-600 border-green-100' 
                              : 'bg-gray-50 text-gray-400 border-gray-100'
                            }`}>
                              <span className={`w-1.5 h-1.5 rounded-full ${handy.isOnline ? 'bg-green-500 animate-pulse' : 'bg-gray-300'}`} />
                              {handy.isOnline ? 'Online' : 'Offline'}
                            </div>
                          </div>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleFavorite(handy.id);
                            }}
                            className={`p-2 rounded-full transition-all shrink-0 ${
                              favorites.includes(handy.id)
                              ? 'text-red-500 bg-red-50'
                              : 'text-slate-300 hover:text-red-400 hover:bg-slate-50'
                            }`}
                          >
                            <Heart size={20} fill={favorites.includes(handy.id) ? "currentColor" : "none"} />
                          </button>
                        </div>
                        <div className="flex flex-wrap items-center gap-2 mb-1">
                          {handy.isFeatured && (
                            <span className="flex items-center gap-1 bg-amber-50 text-amber-600 text-[10px] font-bold uppercase px-2 py-0.5 rounded-full border border-amber-100">
                              <Star size={10} fill="currentColor" />
                              Featured
                            </span>
                          )}
                          {handy.verified && (
                            <span className="flex items-center gap-1 bg-blue-50 text-blue-600 text-[10px] font-bold uppercase px-2 py-0.5 rounded-full border border-blue-100">
                              <CheckCircle2 size={10} />
                              Verified
                            </span>
                          )}
                          {handy.ninVerified && (
                            <span className="flex items-center gap-1 bg-emerald-50 text-emerald-600 text-[10px] font-bold uppercase px-2 py-0.5 rounded-full border border-emerald-100">
                              <ShieldCheck size={10} />
                              NIN Verified
                            </span>
                          )}
                        </div>
                        <p className="text-blue-600 text-sm font-medium mb-2">{handy.category}</p>
                        <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 text-slate-500 text-xs">
                          <span className="flex items-center gap-1">
                            <MapPin size={14} /> {handy.location}
                            {userLocation && (
                              <span className="text-blue-500 font-bold ml-1">
                                ({calculateDistance(userLocation.lat, userLocation.lng, handy.lat, handy.lng).toFixed(1)}km)
                              </span>
                            )}
                          </span>
                          <span className="flex items-center gap-1">
                            <StarRating rating={handy.rating} />
                            <span className="ml-1">({handy.reviews})</span>
                          </span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between gap-2 pt-4 border-t border-slate-50">
                      {handy.verified && currentUser?.plan !== 'member' && currentUser?.role !== 'handyman' ? (
                        <div className="px-4 py-2 bg-blue-50 text-blue-600 text-[10px] font-bold uppercase rounded-lg border border-blue-100 whitespace-nowrap">
                          Members Only
                        </div>
                      ) : (
                        <div className="flex items-center gap-2 w-full">
                          <button 
                            onClick={(e) => {
                              e.stopPropagation();
                              startChat(handy.id, handy.name);
                            }}
                            className="p-3 bg-white border border-blue-600 text-blue-600 rounded-2xl hover:bg-blue-50 transition-all shadow-sm flex items-center justify-center"
                            title="Chat Now"
                          >
                            <MessageCircle size={18} />
                          </button>
                          <button 
                            onClick={(e) => {
                              e.stopPropagation();
                              setRequestingQuotePro(handy);
                            }}
                            className="flex-1 flex items-center justify-center gap-2 bg-gradient-to-r from-green-500 to-emerald-600 text-white px-4 py-3 rounded-2xl font-black hover:from-green-400 hover:to-emerald-500 transition-all shadow-xl shadow-green-500/30 active:scale-95 text-sm animate-pulse-slow ring-2 ring-transparent hover:ring-green-300"
                          >
                            <Zap size={16} className="text-yellow-300" fill="currentColor" />
                            <span>Book Now</span>
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>

            {filteredHandymen.length === 0 && (
              <div className="md:col-span-2 text-center py-20 bg-white/50 backdrop-blur-sm border border-dashed border-slate-200 rounded-3xl">
                <Search size={48} className="mx-auto text-slate-200 mb-4" />
                <p className="text-slate-400">No handymen found matching your search.</p>
                <button 
                  onClick={() => {setSearchQuery(''); setSelectedCategory('All'); setMinRating(0); setMinExperience(0); setShowOnlyOnline(false); setShowFavoritesOnly(false); setUseRadiusFilter(false);}}
                  className="mt-4 text-blue-600 font-medium"
                >
                  Clear all filters
                </button>
              </div>
            )}
          </motion.div>
        </section>
        </>
      )}
    </main>

      {/* Detail Modal */}
      <AnimatePresence>
        {selectedPro && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedPro(null)}
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, y: 100, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 100, scale: 0.95 }}
              className="relative w-full max-w-2xl bg-white rounded-3xl shadow-2xl overflow-hidden max-h-[90vh] overflow-y-auto"
            >
              <button 
                onClick={() => setSelectedPro(null)}
                className="absolute right-6 top-6 p-2 bg-slate-100 rounded-full text-slate-500 hover:bg-slate-200 transition-colors"
              >
                <X size={20} />
              </button>

              <div className="p-8">
                <div className="flex gap-6 mb-8">
                  <div className="w-24 h-24 bg-blue-50 rounded-2xl flex items-center justify-center text-blue-600 relative overflow-hidden shrink-0">
                    {selectedPro.profileImage ? (
                      <img src={selectedPro.profileImage} alt={selectedPro.name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                    ) : (
                      <Hammer size={48} />
                    )}
                  </div>
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <h2 className="text-2xl font-bold text-slate-900">{selectedPro.name}</h2>
                      {selectedPro.availability && (
                        <span className={`text-xs font-bold px-3 py-1 rounded-full uppercase border ${
                          selectedPro.availability === 'Available' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' :
                          selectedPro.availability === 'Busy' ? 'bg-amber-50 text-amber-600 border-amber-100' :
                          'bg-slate-50 text-slate-400 border-slate-100'
                        }`}>
                          {selectedPro.availability}
                        </span>
                      )}
                      {selectedPro.verified && <CheckCircle2 size={20} className="text-blue-600" />}
                      <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase border ml-2 ${
                        selectedPro.isOnline 
                        ? 'bg-green-50 text-green-600 border-green-100' 
                        : 'bg-gray-50 text-gray-400 border-gray-100'
                      }`}>
                        <span className={`w-2 h-2 rounded-full ${selectedPro.isOnline ? 'bg-green-500 animate-pulse' : 'bg-gray-300'}`} />
                        {selectedPro.isOnline ? 'Online' : 'Offline'}
                      </div>
                    </div>
                    <p className="text-blue-600 font-semibold mb-2">{selectedPro.category}</p>
                    <div className="flex flex-wrap gap-4 text-slate-500 text-sm">
                      <span className="flex items-center gap-1"><MapPin size={16} /> {selectedPro.location}</span>
                      <div className="flex items-center gap-2">
                        <StarRating rating={selectedPro.rating} />
                        <span>({selectedPro.reviews} reviews)</span>
                      </div>
                      <span className="flex items-center gap-1"><Clock size={16} /> {selectedPro.experience} exp.</span>
                    </div>
                  </div>
                </div>

                {isAdmin && (
                  <div className="mb-8 p-4 bg-blue-50 border border-blue-100 rounded-2xl flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-blue-100 rounded-xl text-blue-600">
                        <ShieldCheck size={24} />
                      </div>
                      <div>
                        <p className="font-bold text-blue-900">Admin Controls</p>
                        <p className="text-xs text-blue-700">Verify this professional to increase trust.</p>
                      </div>
                    </div>
                    <button
                      onClick={() => toggleVerification(selectedPro.id)}
                      className={`px-6 py-2 rounded-xl font-bold transition-all ${
                        selectedPro.verified
                        ? 'bg-red-100 text-red-600 hover:bg-red-200'
                        : 'bg-blue-600 text-white hover:bg-blue-700 shadow-lg shadow-blue-600/20'
                      }`}
                    >
                      {selectedPro.verified ? 'Revoke Verification' : 'Verify Professional'}
                    </button>
                  </div>
                )}

                <div className="space-y-8">
                  <section>
                    <h3 className="font-bold text-slate-900 mb-3 flex items-center gap-2">
                      <Briefcase size={18} className="text-blue-600" />
                      {t('About the Professional', currentLanguage)}
                    </h3>
                    <div className="flex flex-col gap-2">
                      <p className="text-slate-600 leading-relaxed">
                        {selectedPro.description}
                      </p>
                      <button 
                        onClick={() => handleTranslate(selectedPro.description, `pro-desc-${selectedPro.id}`)}
                        className="text-[10px] text-blue-600 font-bold flex items-center gap-1 hover:underline w-fit"
                      >
                        <Globe size={10} />
                        {isTranslating === `pro-desc-${selectedPro.id}` ? t('Translating...', currentLanguage) : `${t('Translate to', currentLanguage)} ${currentLanguage}`}
                      </button>
                    </div>
                  </section>

                  {selectedPro.portfolio.length > 0 && (
                    <section>
                      <h3 className="font-bold text-slate-900 mb-3 flex items-center gap-2">
                        <ImageIcon size={18} className="text-blue-600" />
                        Portfolio
                      </h3>
                      <div className="grid grid-cols-2 gap-4">
                        {selectedPro.portfolio.map((img, i) => (
                          <img key={i} src={img} alt="Work" className="rounded-xl w-full h-32 object-cover border border-slate-100" referrerPolicy="no-referrer" />
                        ))}
                      </div>
                    </section>
                  )}

                  <section className="bg-slate-50 p-6 rounded-2xl">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="font-bold text-slate-900">{t('Reviews', currentLanguage)}</h3>
                      {reviews.filter(r => r.proId === selectedPro.id).length > 0 && (
                        <button 
                          onClick={() => handleSummarizeReviews(selectedPro.id)}
                          disabled={isAiSummarizing}
                          className="text-xs font-bold text-blue-600 flex items-center gap-1 hover:underline disabled:opacity-50"
                        >
                          <Sparkles size={14} />
                          {isAiSummarizing ? 'Summarizing...' : 'AI Summary'}
                        </button>
                      )}
                    </div>

                    {aiSummary && (
                      <motion.div 
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="mb-6 bg-blue-600 text-white p-4 rounded-2xl shadow-lg shadow-blue-600/20 relative overflow-hidden"
                      >
                        <div className="absolute top-0 right-0 p-2 opacity-10">
                          <Sparkles size={48} />
                        </div>
                        <div className="relative z-10">
                          <div className="flex items-center gap-2 mb-2">
                            <div className="w-6 h-6 bg-white/20 rounded-lg flex items-center justify-center">
                              <Sparkles size={12} />
                            </div>
                            <span className="text-xs font-black uppercase tracking-wider">AI Review Summary</span>
                          </div>
                          <div className="flex flex-col gap-2">
                          <p className="text-sm leading-relaxed italic">"{aiSummary}"</p>
                          <button 
                            onClick={() => handleTranslate(aiSummary, 'ai-summary')}
                            className="text-[10px] text-blue-600 font-bold flex items-center gap-1 hover:underline w-fit"
                          >
                            <Globe size={10} />
                            {isTranslating === 'ai-summary' ? t('Translating...', currentLanguage) : `${t('Translate to', currentLanguage)} ${currentLanguage}`}
                          </button>
                        </div>
                          <button 
                            onClick={() => setAiSummary(null)}
                            className="mt-3 text-[10px] font-bold text-blue-100 hover:text-white underline"
                          >
                            Close Summary
                          </button>
                        </div>
                      </motion.div>
                    )}

                    <div className="space-y-4 mb-6">
                      {reviews.filter(r => r.proId === selectedPro.id).map(review => (
                        <div key={review.id} className="bg-white p-4 rounded-xl border border-slate-100">
                          <div className="flex justify-between items-center mb-2">
                            <span className="font-bold text-sm">{review.userName}</span>
                            <div className="flex items-center gap-1 text-amber-400">
                              <Star size={12} fill="currentColor" />
                              <span className="text-xs font-bold">{review.rating}</span>
                            </div>
                          </div>
                          <div className="flex flex-col gap-1">
                            <p className="text-slate-600 text-sm">{review.comment}</p>
                            <button 
                              onClick={() => handleTranslate(review.comment, review.id)}
                              className="text-[10px] text-blue-600 font-bold flex items-center gap-1 hover:underline w-fit"
                            >
                              <Globe size={10} />
                              {isTranslating === review.id ? t('Translating...', currentLanguage) : `${t('Translate to', currentLanguage)} ${currentLanguage}`}
                            </button>
                          </div>
                          <span className="text-[10px] text-slate-400 mt-2 block">{review.date}</span>
                        </div>
                      ))}
                      {reviews.filter(r => r.proId === selectedPro.id).length === 0 && (
                        <p className="text-slate-400 text-sm italic">No reviews yet. Be the first!</p>
                      )}
                    </div>

                    <div className="border-t border-slate-200 pt-4">
                      <h4 className="text-sm font-bold mb-3">Leave a Review</h4>
                      <div className="mb-4">
                        <StarRating 
                          rating={newReviewRating} 
                          onRate={setNewReviewRating} 
                          interactive 
                        />
                      </div>
                      <textarea 
                        placeholder="Share your experience..."
                        className="w-full p-3 rounded-xl border border-slate-200 text-sm focus:ring-2 focus:ring-blue-500/20 outline-none min-h-[100px]"
                        value={newReviewComment}
                        onChange={(e) => setNewReviewComment(e.target.value)}
                      />
                      <button
                        onClick={() => {
                          if (newReviewComment.trim()) {
                            handleAddReview(selectedPro.id, newReviewRating, newReviewComment);
                            setNewReviewComment('');
                            setNewReviewRating(5);
                          }
                        }}
                        className="mt-3 w-full bg-blue-600 text-white py-4 rounded-2xl font-bold hover:bg-blue-700 transition-all shadow-lg shadow-blue-600/20 active:scale-95 flex items-center justify-center gap-2"
                      >
                        <CheckCircle2 size={18} />
                        Submit Review
                      </button>
                    </div>
                  </section>

                  {selectedPro.verified && currentUser?.plan !== 'member' && currentUser?.role !== 'handyman' ? (
                    <div className="bg-blue-50 p-8 rounded-3xl text-center border border-blue-100">
                      <div className="w-16 h-16 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Lock size={32} />
                      </div>
                      <h3 className="text-xl font-bold text-blue-900 mb-2">Verified Professional</h3>
                      <p className="text-blue-700 text-sm mb-6">
                        Access to verified professionals is exclusive to our Community Members. 
                        Join today to ensure quality and safety for your home projects.
                      </p>
                      <button 
                        onClick={() => {
                          setSelectedPro(null);
                          const memberPlan = PRICING_PLANS.find(p => p.id === 'member');
                          if (memberPlan) {
                            setSelectedPlan(memberPlan);
                            setShowCheckout(true);
                          }
                        }}
                        className="w-full py-4 bg-blue-600 text-white rounded-2xl font-bold hover:bg-blue-700 transition-all shadow-lg shadow-blue-600/20"
                      >
                        Join Community (₦1,000/mo)
                      </button>
                    </div>
                  ) : (
                    <div className="flex flex-col sm:flex-row gap-3 pt-4 shrink-0">
                      <button 
                        onClick={() => startChat(selectedPro.id, selectedPro.name)}
                        className="flex-1 flex items-center justify-center gap-2 bg-white border border-blue-600 text-blue-600 py-4 px-6 rounded-2xl font-bold hover:bg-blue-50 transition-all active:scale-95 text-sm"
                      >
                        <MessageCircle size={20} />
                        Chat Now
                      </button>
                      <button 
                        onClick={() => setRequestingQuotePro(selectedPro)}
                        className="flex-1 flex items-center justify-center gap-2 bg-gradient-to-r from-green-500 to-emerald-600 text-white py-4 px-6 rounded-2xl font-black hover:from-green-400 hover:to-emerald-500 transition-all shadow-2xl shadow-green-500/40 active:scale-95 text-base sm:text-lg animate-pulse-slow ring-4 ring-green-500/20"
                      >
                        <Zap size={24} className="text-yellow-300" fill="currentColor" />
                        Book Now
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Checkout Modal */}
      {showCheckout && selectedPlan && (
        <SimulatedCheckout 
          plan={selectedPlan} 
          onClose={() => setShowCheckout(false)}
          lang={currentLanguage}
          onComplete={() => {
            setShowCheckout(false);
            setShowPricing(false);
            if (selectedPlan.id === 'pro' || selectedPlan.id === 'enterprise') {
              setShowRegForm(true);
            }
            setShowSuccess(true);
            setTimeout(() => setShowSuccess(false), 5000);
          }}
        />
      )}

      {/* Auth Modal */}
      <AnimatePresence>
        {showAuthModal && (
          <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
              onClick={() => setShowAuthModal(false)}
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl flex flex-col max-h-[90vh]"
            >
              <div className="p-8 overflow-y-auto">
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-2xl font-bold">
                    {authMode === 'login' ? 'Welcome Back' : authMode === 'signup' ? 'Create Account' : 'Reset Password'}
                  </h2>
                  <button 
                    onClick={() => setShowAuthModal(false)}
                    className="p-2 hover:bg-slate-100 rounded-full transition-colors"
                  >
                    <X size={20} />
                  </button>
                </div>

                {authError && (
                  <div className="mb-6 p-4 bg-red-50 border border-red-100 rounded-2xl flex flex-col gap-3 text-red-600 text-sm">
                    <div className="flex items-start gap-3">
                      <AlertCircle size={18} className="shrink-0 mt-0.5" />
                      <p className="font-medium">{authError}</p>
                    </div>
                    {window.location.hostname !== 'localhost' &&
                      !(window.location.hostname === 'firebaseapp.com' || window.location.hostname.endsWith('.firebaseapp.com')) && (
                      <div className="mt-2 p-3 bg-white/50 rounded-xl border border-red-200 text-xs">
                        <p className="font-bold mb-1 uppercase tracking-wider">Potential Solution:</p>
                        <p>Firebase requires <strong>{window.location.hostname}</strong> to be in the "Authorized Domains" list in the Firebase Console under Authentication Settings.</p>
                      </div>
                    )}
                  </div>
                )}

                {resetSent ? (
                  <div className="text-center py-8">
                    <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-4">
                      <CheckCircle2 size={32} />
                    </div>
                    <h3 className="text-xl font-bold mb-2">Check your email</h3>
                    <p className="text-slate-500 mb-6">
                      We've sent a password reset link to <span className="font-semibold text-slate-900">{authEmail}</span>.
                    </p>
                    <button 
                      onClick={() => {
                        setResetSent(false);
                        setAuthMode('login');
                      }}
                      className="w-full py-4 bg-blue-600 text-white rounded-2xl font-bold hover:bg-blue-700 transition-all"
                    >
                      Back to Login
                    </button>
                  </div>
                ) : (
                  <form onSubmit={handleEmailAuth} className="space-y-4">
                    <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-1.5">Email Address</label>
                      <div className="relative">
                        <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                        <input 
                          type="email"
                          required
                          className="w-full pl-11 pr-4 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                          placeholder="you@example.com"
                          value={authEmail}
                          onChange={(e) => setAuthEmail(e.target.value)}
                        />
                      </div>
                    </div>

                    {authMode !== 'reset' && (
                      <div>
                        <div className="flex justify-between items-center mb-1.5">
                          <label className="block text-sm font-semibold text-slate-700">Password</label>
                          {authMode === 'login' && (
                            <button 
                              type="button"
                              onClick={() => setAuthMode('reset')}
                              className="text-xs font-bold text-blue-600 hover:text-blue-700"
                            >
                              Forgot Password?
                            </button>
                          )}
                        </div>
                        <div className="relative">
                          <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                          <input 
                            type="password"
                            required
                            minLength={6}
                            className="w-full pl-11 pr-4 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                            placeholder="••••••••"
                            value={authPassword}
                            onChange={(e) => setAuthPassword(e.target.value)}
                          />
                        </div>
                      </div>
                    )}

                    {authMode === 'signup' && (
                      <div>
                        <div className="flex justify-between items-center mb-1.5">
                          <label className="block text-sm font-semibold text-slate-700">National ID (NIN) or BVN</label>
                        </div>
                        <div className="relative">
                          <ShieldCheck className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                          <input 
                            type="text"
                            required
                            maxLength={11}
                            className="w-full pl-11 pr-4 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                            placeholder="11-digit NIN or BVN required"
                            value={authNinBvn}
                            onChange={(e) => setAuthNinBvn(e.target.value.replace(/\D/g, ''))}
                          />
                        </div>
                        <p className="text-[10px] text-slate-500 mt-1.5 ml-1">We require this to verify your identity. Your data is secure.</p>
                      </div>
                    )}

                    <button 
                      type="submit"
                      disabled={authLoading}
                      className="w-full py-4 bg-blue-600 text-white rounded-2xl font-bold hover:bg-blue-700 shadow-lg shadow-blue-600/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                      {authLoading ? (
                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      ) : (
                        authMode === 'login' ? 'Sign In' : authMode === 'signup' ? 'Create Account' : 'Send Reset Link'
                      )}
                    </button>

                    {authMode !== 'reset' && (
                      <div className="relative py-4">
                        <div className="absolute inset-0 flex items-center">
                          <div className="w-full border-t border-slate-100"></div>
                        </div>
                        <div className="relative flex justify-center text-xs uppercase">
                          <span className="bg-white px-2 text-slate-400 font-medium">Or continue with</span>
                        </div>
                      </div>
                    )}

                    {authMode !== 'reset' && (
                      <div className="flex flex-col gap-3">
                        <button 
                          type="button"
                          onClick={() => handleGoogleLogin(false)}
                          disabled={authLoading}
                          className="w-full py-4 bg-white border border-slate-200 text-slate-700 rounded-2xl font-bold hover:bg-slate-50 transition-all flex items-center justify-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {authLoading ? (
                             <div className="w-5 h-5 border-2 border-slate-200 border-t-blue-600 rounded-full animate-spin" />
                          ) : (
                            <>
                              <svg className="w-5 h-5" viewBox="0 0 24 24">
                                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/>
                                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                              </svg>
                              Google Login
                            </>
                          )}
                        </button>
                        
                        {authError && authError.includes('popup-blocked') && (
                          <button 
                            type="button"
                            onClick={() => handleGoogleLogin(true)}
                            className="text-xs text-blue-600 font-bold hover:underline"
                          >
                            Popup blocked? Try Redirect Login
                          </button>
                        )}
                      </div>
                    )}

                    <div className="text-center pt-4">
                      {isShowMode && (
                        <div className="mb-4 p-3 bg-blue-50 rounded-xl border border-blue-100">
                          <p className="text-[10px] uppercase font-bold text-blue-600 mb-2">Show Presentation Mode Active</p>
                          <button 
                            type="button"
                            onClick={async () => {
                              try {
                                setAuthLoading(true);
                                // Create a dummy login for presentation if real ones fail
                                toast.info("Entering presentation mode...");
                                // This won't actually log into Firebase without credentials, 
                                // but we can simulate the state for UI if needed.
                                // For now, we just suggest the real login.
                                setAuthError("Please use the Google Login below. If it fails, ensure handypadi.ng is authorized in Firebase Console.");
                                setAuthLoading(false);
                              } catch (e) {}
                            }}
                            className="text-xs font-bold text-blue-700 hover:underline"
                          >
                            Troubleshoot Login Issues
                          </button>
                        </div>
                      )}
                      
                      <p className="text-sm text-slate-500">
                        {authMode === 'login' ? "Don't have an account?" : authMode === 'signup' ? "Already have an account?" : "Remember your password?"}
                        {' '}
                        <button 
                          type="button"
                          onClick={() => {
                            setAuthMode(authMode === 'login' ? 'signup' : 'login');
                            setAuthError(null);
                          }}
                          className="font-bold text-blue-600 hover:text-blue-700"
                        >
                          {authMode === 'login' ? 'Sign Up' : 'Log In'}
                        </button>
                      </p>
                    </div>
                  </form>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Registration Modal */}
      <AnimatePresence>
        {showRegForm && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowRegForm(false)}
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl p-8 max-h-[90vh] overflow-y-auto"
            >
              <h2 className="text-2xl font-bold mb-6">Join Ṣẹ Ṣẹ Wá</h2>
              <form className="space-y-4" onSubmit={(e) => {
                e.preventDefault();
                const fd = new FormData(e.currentTarget);
                handleAddPro({
                  name: fd.get('name') as string,
                  category: fd.get('category') as any,
                  location: fd.get('location') as string,
                  phone: fd.get('phone') as string,
                  whatsapp: fd.get('whatsapp') as string,
                  experience: `${fd.get('experienceYears')} years`,
                  experienceYears: parseInt(fd.get('experienceYears') as string) || 0,
                  description: fd.get('description') as string,
                  portfolio: fd.get('portfolio') ? [fd.get('portfolio') as string] : [],
                  lat: 6.5244, // Default Lagos
                  lng: 3.3792
                });
              }}>
                <div className="grid grid-cols-2 gap-4">
                  <input name="name" placeholder="Full Name" required className="p-3 rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-blue-500/20" />
                  <select name="category" required className="p-3 rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-blue-500/20">
                    {CATEGORIES.filter(c => c.name !== 'All').map(c => <option key={c.name} value={c.name}>{c.name}</option>)}
                  </select>
                </div>
                <input name="location" placeholder="Location (City, State)" required className="w-full p-3 rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-blue-500/20" />
                <div className="grid grid-cols-2 gap-4">
                  <input name="phone" placeholder="Phone Number" required className="p-3 rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-blue-500/20" />
                  <input name="whatsapp" placeholder="WhatsApp (e.g. 234...)" className="p-3 rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-blue-500/20" />
                </div>
                <input 
                  name="experienceYears" 
                  type="number"
                  min="0"
                  placeholder="Years of Experience (e.g. 5)" 
                  required 
                  className="w-full p-3 rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-blue-500/20" 
                />
                
                <div className="space-y-2">
                  <label className="block text-xs font-bold text-slate-400 uppercase">Profile Image</label>
                  <div className="flex items-center gap-4">
                    <label className="flex-1 flex items-center justify-center gap-2 border-2 border-dashed border-slate-200 rounded-xl p-4 cursor-pointer hover:border-blue-500 hover:bg-blue-50 transition-all">
                      <Upload size={20} className="text-slate-400" />
                      <span className="text-sm text-slate-500">{profileImageFile ? profileImageFile.name : 'Upload Profile Photo'}</span>
                      <input 
                        type="file" 
                        accept="image/*" 
                        className="hidden" 
                        onChange={(e) => setProfileImageFile(e.target.files?.[0] || null)}
                      />
                    </label>
                    {profileImageFile && (
                      <button 
                        type="button" 
                        onClick={() => setProfileImageFile(null)}
                        className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                      >
                        <X size={20} />
                      </button>
                    )}
                  </div>
                </div>

                <input name="portfolio" placeholder="Portfolio Image URL (Optional)" className="w-full p-3 rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-blue-500/20" />
                
                <div className="space-y-2">
                  <label className="block text-xs font-bold text-slate-400 uppercase">Identity Verification (NIN/BVN)</label>
                  <div className="grid grid-cols-2 gap-4">
                    <select name="idType" className="p-3 rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-blue-500/20">
                      <option value="NIN">NIN</option>
                      <option value="BVN">BVN</option>
                      <option value="DriversLicense">Driver's License</option>
                      <option value="VotersCard">Voter's Card</option>
                    </select>
                    <input name="idNumber" placeholder="ID Number" className="p-3 rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-blue-500/20" />
                  </div>
                  <p className="text-[10px] text-slate-400 italic">Your ID will be verified securely. We do not store sensitive data.</p>
                </div>

                <textarea name="description" placeholder="Tell us about your services..." required className="w-full p-3 rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-blue-500/20 h-24" />
                
                <div className="flex gap-4 pt-4">
                  <button type="button" disabled={isRegistering} onClick={() => setShowRegForm(false)} className="flex-1 py-3 rounded-xl font-bold text-slate-500 hover:bg-slate-100 transition-colors">Cancel</button>
                  <button type="submit" disabled={isRegistering} className="flex-1 py-3 rounded-xl font-bold bg-blue-600 text-white hover:bg-blue-700 transition-colors shadow-lg shadow-blue-600/20 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2">
                    {isRegistering ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        Registering...
                      </>
                    ) : 'Register Now'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Admin Dashboard */}
      <AnimatePresence>
        {showAdminDashboard && (
          <div className="fixed inset-0 z-[70] bg-white overflow-y-auto">
            <motion.div 
              initial={{ opacity: 0, x: '100%' }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: '100%' }}
              className="min-h-screen"
            >
              <div className="max-w-4xl mx-auto px-6 py-12">
                <div className="flex items-center justify-between mb-12">
                  <div className="flex items-center gap-4">
                    <button 
                      onClick={() => setShowAdminDashboard(false)}
                      className="p-3 bg-slate-100 rounded-2xl text-slate-600 hover:bg-slate-200 transition-colors"
                    >
                      <ChevronRight className="rotate-180" size={24} />
                    </button>
                    <div>
                      <h2 className="text-3xl font-bold text-slate-900">Admin Dashboard</h2>
                      <p className="text-slate-500">Manage and verify professional listings</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 px-4 py-2 bg-blue-50 text-blue-600 rounded-xl font-bold border border-blue-100">
                    <ShieldCheck size={20} />
                    Administrator
                  </div>
                </div>

                {/* Admin Analytics Dashboard */}
                <div className="mb-12">
                  <div className="flex items-center gap-2 mb-6">
                    <h3 className="text-xl font-bold text-slate-900">Platform Analytics</h3>
                  </div>
                  
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                    <div className="bg-white border text-center border-slate-200 rounded-3xl p-6 shadow-sm">
                      <p className="text-slate-500 text-sm font-medium mb-1">Total Pros</p>
                      <h4 className="text-3xl font-black text-slate-900">{handymen.length}</h4>
                    </div>
                    <div className="bg-white border text-center border-slate-200 rounded-3xl p-6 shadow-sm">
                      <p className="text-slate-500 text-sm font-medium mb-1">Total Jobs</p>
                      <h4 className="text-3xl font-black text-blue-600">{jobRequests.length}</h4>
                    </div>
                    <div className="bg-white border text-center border-slate-200 rounded-3xl p-6 shadow-sm">
                      <p className="text-slate-500 text-sm font-medium mb-1">Escrow Volume</p>
                      <h4 className="text-3xl font-black text-emerald-600">
                        ₦{jobRequests.reduce((acc, job) => acc + (job.amount || 0), 0).toLocaleString()}
                      </h4>
                    </div>
                    <div className="bg-white border text-center border-slate-200 rounded-3xl p-6 shadow-sm">
                      <p className="text-slate-500 text-sm font-medium mb-1">Active Disputes</p>
                      <h4 className="text-3xl font-black text-amber-500">{disputes.filter(d => d.status === 'open').length}</h4>
                    </div>
                  </div>

                  <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm mb-6">
                    <h4 className="font-bold text-slate-900 mb-6">Job Requests Overview</h4>
                    <div className="h-[300px] w-full">
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={[
                          { name: 'Mon', jobs: 12, escrow: 45000 },
                          { name: 'Tue', jobs: 19, escrow: 84000 },
                          { name: 'Wed', jobs: 15, escrow: 62000 },
                          { name: 'Thu', jobs: 22, escrow: 115000 },
                          { name: 'Fri', jobs: 28, escrow: 140000 },
                          { name: 'Sat', jobs: 35, escrow: 210000 },
                          { name: 'Sun', jobs: 25, escrow: 95000 },
                        ]}>
                          <defs>
                            <linearGradient id="colorJobs" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                              <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                            </linearGradient>
                          </defs>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                          <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12}} dy={10} />
                          <YAxis axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12}} dx={-10} />
                          <RechartsTooltip 
                            contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                          />
                          <Area type="monotone" dataKey="jobs" stroke="#3b82f6" strokeWidth={3} fillOpacity={1} fill="url(#colorJobs)" />
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                </div>

                {/* Disputes Section */}
                {disputes.length > 0 && (
                  <div className="mb-12">
                    <div className="flex items-center gap-2 mb-6">
                      <div className="w-2 h-2 bg-amber-500 rounded-full animate-pulse" />
                      <h3 className="text-xl font-bold text-slate-900">Active Disputes</h3>
                      <span className="bg-amber-50 text-amber-600 text-xs font-bold px-2 py-0.5 rounded-full border border-amber-100">
                        {disputes.filter(d => d.status === 'open').length}
                      </span>
                    </div>
                    <div className="grid gap-4">
                      {disputes.filter(d => d.status === 'open').map(dispute => (
                        <div key={dispute.id} className="bg-white border-2 border-amber-100 rounded-3xl p-6 shadow-lg shadow-amber-600/5">
                          <div className="flex items-center justify-between mb-4">
                            <span className="text-xs font-bold text-amber-600 uppercase tracking-wider">Dispute #{dispute.id}</span>
                            <span className="text-xs text-slate-400">
                              {dispute.createdAt?.seconds ? new Date(dispute.createdAt.seconds * 1000).toLocaleDateString() : 'Just now'}
                            </span>
                          </div>
                          <p className="text-slate-700 mb-4 font-medium">"{dispute.reason}"</p>
                          <div className="flex items-center gap-3">
                            <button 
                              onClick={() => handleResolveDispute(dispute.id, 'refunded')}
                              className="flex-1 py-2 bg-red-50 text-red-600 rounded-xl font-bold hover:bg-red-100 transition-all"
                            >
                              Refund User
                            </button>
                            <button 
                              onClick={() => handleResolveDispute(dispute.id, 'resolved')}
                              className="flex-1 py-2 bg-emerald-50 text-emerald-600 rounded-xl font-bold hover:bg-emerald-100 transition-all"
                            >
                              Release to Pro
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {pendingVerifications.length > 0 && (
                  <div className="mb-12">
                    <div className="flex items-center gap-2 mb-6">
                      <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
                      <h3 className="text-xl font-bold text-slate-900">Pending Verifications</h3>
                      <span className="bg-red-50 text-red-600 text-xs font-bold px-2 py-0.5 rounded-full border border-red-100">
                        {pendingVerifications.length}
                      </span>
                    </div>
                    <div className="grid gap-4">
                      {pendingVerifications.map(user => (
                        <div key={user.uid} className="bg-white border-2 border-blue-100 rounded-3xl p-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6 shadow-lg shadow-blue-600/5">
                          <div className="flex items-center gap-4">
                            <div className="w-16 h-16 bg-blue-50 rounded-2xl flex items-center justify-center text-blue-400 overflow-hidden shrink-0 border border-blue-100">
                              {user.photoURL ? (
                                <img src={user.photoURL} alt={user.name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                              ) : (
                                <User size={24} />
                              )}
                            </div>
                            <div>
                              <h4 className="font-bold text-slate-900">{user.name}</h4>
                              <p className="text-sm text-slate-500 mb-1">{user.email}</p>
                              {user.idDocumentUrl && (
                                <a 
                                  href={user.idDocumentUrl} 
                                  target="_blank" 
                                  rel="noopener noreferrer"
                                  className="text-xs text-blue-600 font-bold hover:underline flex items-center gap-1 mb-1"
                                >
                                  <ImageIcon size={12} /> View ID Document
                                </a>
                              )}
                              <div className="flex items-center gap-2">
                                <span className="bg-slate-100 text-slate-600 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">
                                  {user.role}
                                </span>
                                {user.phone && (
                                  <span className="text-[10px] text-slate-400 font-medium">{user.phone}</span>
                                )}
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-3">
                            <button 
                              onClick={() => handleRejectVerification(user.uid)}
                              className="px-4 py-2 text-slate-400 font-bold hover:text-red-500 transition-colors"
                            >
                              Reject
                            </button>
                            <button 
                              onClick={() => handleApproveVerification(user.uid)}
                              className="px-6 py-2 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 transition-all shadow-lg shadow-blue-600/20"
                            >
                              Approve
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="flex items-center gap-2 mb-6">
                  <h3 className="text-xl font-bold text-slate-900">All Professionals</h3>
                  <span className="bg-slate-100 text-slate-600 text-xs font-bold px-2 py-0.5 rounded-full border border-slate-200">
                    {handymen.length}
                  </span>
                </div>

                <div className="grid gap-4">
                  {handymen.map(pro => (
                    <div key={pro.id} className="bg-white border border-slate-200 rounded-3xl p-6 flex items-center justify-between hover:border-blue-200 transition-all group">
                      <div className="flex items-center gap-4">
                        <div className="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-400 overflow-hidden shrink-0 border border-slate-100">
                          {pro.profileImage ? (
                            <img src={pro.profileImage} alt={pro.name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                          ) : (
                            <Hammer size={24} />
                          )}
                        </div>
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <h4 className="font-bold text-slate-900">{pro.name}</h4>
                            {pro.verified && (
                              <span className="bg-blue-50 text-blue-600 text-[10px] font-bold px-2 py-0.5 rounded-full border border-blue-100">
                                Verified
                              </span>
                            )}
                          </div>
                          <p className="text-sm text-blue-600 font-medium mb-1">{pro.category}</p>
                          <p className="text-xs text-slate-400 flex items-center gap-1">
                            <MapPin size={12} /> {pro.location}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <button
                          onClick={() => toggleVerification(pro.id)}
                          className={`px-4 py-2 rounded-xl text-sm font-bold transition-all ${
                            pro.verified
                            ? 'bg-red-50 text-red-600 hover:bg-red-100'
                            : 'bg-blue-600 text-white hover:bg-blue-700 shadow-lg shadow-blue-600/10'
                          }`}
                        >
                          {pro.verified ? 'Revoke' : 'Verify'}
                        </button>
                        <button 
                          onClick={() => {
                            setSelectedPro(pro);
                            setShowAdminDashboard(false);
                          }}
                          className="p-2 bg-slate-50 text-slate-400 rounded-xl hover:bg-slate-100 hover:text-slate-600 transition-all"
                        >
                          <ChevronRight size={20} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Domain Management Section */}
                <div className="mt-12 mb-12">
                  <div className="flex items-center justify-between mb-6 px-2">
                    <div className="flex items-center gap-2">
                      <div className="p-2 bg-blue-50 rounded-lg">
                        <Globe className="text-blue-600" size={20} />
                      </div>
                      <h3 className="text-xl font-bold text-slate-900">Domain Routing</h3>
                      <span className="bg-slate-100 text-slate-500 text-xs font-bold px-2 py-0.5 rounded-full border border-slate-200">
                        {managedDomains.length}
                      </span>
                    </div>
                    <button 
                      onClick={() => {
                        setEditingDomain(null);
                        setShowDomainEditModal(true);
                      }}
                      className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-xl text-sm font-bold hover:bg-blue-700 transition-all shadow-lg shadow-blue-600/10"
                    >
                      <Plus size={16} />
                      Add Domain
                    </button>
                  </div>

                  <div className="bg-white border border-slate-200 rounded-[2rem] overflow-hidden shadow-sm">
                    {managedDomains.length === 0 ? (
                      <div className="p-16 text-center">
                        <div className="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-200 mx-auto mb-4 border-2 border-dashed border-slate-100">
                          <Globe size={32} />
                        </div>
                        <p className="text-slate-400 font-medium text-sm">No domains configured for specific routing.</p>
                      </div>
                    ) : (
                      <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse min-w-[600px]">
                          <thead>
                            <tr className="bg-slate-50/50 border-b border-slate-100 font-bold text-[10px] text-slate-400 uppercase tracking-[0.2em]">
                              <th className="px-8 py-5">Source Domain</th>
                              <th className="px-8 py-5">Routing Mode</th>
                              <th className="px-8 py-5">Target</th>
                              <th className="px-8 py-5 text-right">Settings</th>
                            </tr>
                          </thead>
                          <tbody>
                            {managedDomains.map(domain => (
                              <tr key={domain.id} className="border-b border-slate-50 last:border-0 hover:bg-slate-50/30 transition-colors">
                                <td className="px-8 py-6">
                                  <div className="flex flex-col">
                                    <span className="font-bold text-slate-900">{domain.name}</span>
                                    {domain.isDefault && (
                                      <span className="inline-flex items-center gap-1 text-[9px] font-black text-blue-600 uppercase tracking-tighter mt-1">
                                        <Star size={8} fill="currentColor" /> Primary Domain
                                      </span>
                                    )}
                                  </div>
                                </td>
                                <td className="px-8 py-6">
                                  <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                                    domain.mode === 'serve' 
                                    ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' 
                                    : 'bg-indigo-50 text-indigo-600 border border-indigo-100'
                                  }`}>
                                    <div className={`w-1.5 h-1.5 rounded-full ${domain.mode === 'serve' ? 'bg-emerald-500' : 'bg-indigo-500'}`} />
                                    {domain.mode === 'serve' ? 'Serve Traffic' : 'Redirect'}
                                  </span>
                                </td>
                                <td className="px-8 py-6 text-sm text-slate-500">
                                  {domain.mode === 'redirect' ? (
                                    <span className="font-mono text-indigo-600/60 text-xs">{domain.target || 'None'}</span>
                                  ) : (
                                    <span className="text-slate-300">Local Instance</span>
                                  )}
                                </td>
                                <td className="px-8 py-6 text-right relative">
                                  <button 
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setDomainMenuOpen(domainMenuOpen === domain.id ? null : domain.id);
                                    }}
                                    className="p-2.5 text-slate-400 hover:text-slate-900 hover:bg-white rounded-xl transition-all border border-transparent hover:border-slate-100 shadow-sm hover:shadow-md"
                                  >
                                    <MoreVertical size={16} />
                                  </button>
                                  
                                  <AnimatePresence>
                                    {domainMenuOpen === domain.id && (
                                      <>
                                        <div 
                                          className="fixed inset-0 z-[100]" 
                                          onClick={() => setDomainMenuOpen(null)} 
                                        />
                                        <motion.div
                                          initial={{ opacity: 0, scale: 0.95, x: 10, y: -10 }}
                                          animate={{ opacity: 1, scale: 1, x: 0, y: 0 }}
                                          exit={{ opacity: 0, scale: 0.95, x: 10, y: -10 }}
                                          className="absolute right-8 top-16 w-40 bg-white rounded-2xl shadow-2xl border border-slate-100 z-[110] overflow-hidden py-1"
                                        >
                                          <button 
                                            onClick={() => {
                                              setEditingDomain(domain);
                                              setShowDomainEditModal(true);
                                              setDomainMenuOpen(null);
                                            }}
                                            className="w-full text-left px-4 py-3 text-sm font-bold text-slate-700 hover:bg-slate-50 transition-colors flex items-center gap-2"
                                          >
                                            <Edit size={14} className="text-slate-400" />
                                            Edit Policy
                                          </button>
                                          <button 
                                            onClick={() => {
                                              handleDeleteDomain(domain.id);
                                              setDomainMenuOpen(null);
                                            }}
                                            className="w-full text-left px-4 py-3 text-sm font-bold text-red-600 hover:bg-red-50 transition-colors flex items-center gap-2"
                                          >
                                            <Trash2 size={14} />
                                            Delete
                                          </button>
                                        </motion.div>
                                      </>
                                    )}
                                  </AnimatePresence>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Request Quote Modal */}
      <AnimatePresence>
        {requestingQuotePro && (
          <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setRequestingQuotePro(null)}
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl p-6 sm:p-8 max-h-[90vh] overflow-y-auto"
            >
              <h2 className="text-xl sm:text-2xl font-bold mb-2">Request a Quote</h2>
              <p className="text-slate-500 mb-6 text-sm">
                Fill this out to contact <span className="font-bold text-slate-900">{requestingQuotePro.name}</span>. 
              </p>
              
              <form className="space-y-4" onSubmit={(e) => {
                e.preventDefault();
                const fd = new FormData(e.currentTarget);
                handleRequestQuote({
                  name: fd.get('name') as string,
                  description: fd.get('description') as string,
                  scheduledDate: fd.get('scheduledDate') as string,
                  scheduledTime: fd.get('scheduledTime') as string
                });
              }}>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase ml-1">Your Name</label>
                  <input name="name" placeholder="Enter your name" required className="w-full p-3 rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-blue-500/20 text-sm" />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-400 uppercase ml-1">Preferred Date</label>
                    <input type="date" name="scheduledDate" required className="w-full p-3 rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-blue-500/20 text-sm" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-400 uppercase ml-1">Preferred Time</label>
                    <input type="time" name="scheduledTime" required className="w-full p-3 rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-blue-500/20 text-sm" />
                  </div>
                </div>

                <div className="space-y-1">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between ml-1 gap-2 sm:gap-0">
                    <label className="text-[10px] font-bold text-slate-400 uppercase">Job Description</label>
                    <div className="flex items-center gap-2">
                      <button 
                        type="button"
                        onClick={() => handleTranslate(jobDescriptionInput, 'job-refine')}
                        disabled={isTranslating === 'job-refine' || !jobDescriptionInput}
                        className="text-[9px] font-bold text-slate-500 flex items-center gap-1 hover:underline disabled:opacity-50"
                      >
                        <Globe size={10} />
                        {isTranslating === 'job-refine' ? t('Translating...', currentLanguage) : `${t('Translate to', currentLanguage)} ${currentLanguage}`}
                      </button>
                      <button 
                        type="button"
                        onClick={() => handleRefineDescription(jobDescriptionInput, setJobDescriptionInput)}
                        disabled={isAiRefining || !jobDescriptionInput}
                        className="text-[9px] font-bold text-blue-600 flex items-center gap-1 hover:underline disabled:opacity-50"
                      >
                        <Sparkles size={10} />
                        {isAiRefining ? 'Refining...' : 'Refine with AI'}
                      </button>
                    </div>
                  </div>
                  <textarea 
                    name="description" 
                    placeholder="What do you need help with?" 
                    required 
                    value={jobDescriptionInput}
                    onChange={(e) => setJobDescriptionInput(e.target.value)}
                    className="w-full p-3 rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-blue-500/20 h-24 sm:h-32 text-sm" 
                  />
                </div>
                
                <div className="flex flex-col sm:flex-row gap-2 pt-4">
                  <button type="button" onClick={() => setRequestingQuotePro(null)} className="flex-1 py-3 sm:py-4 rounded-xl sm:rounded-2xl font-bold text-slate-500 hover:bg-slate-100 transition-all text-sm">Cancel</button>
                  <button type="submit" className="flex-1 py-3 sm:py-4 rounded-xl sm:rounded-2xl font-black bg-gradient-to-r from-green-500 to-emerald-600 text-white hover:from-green-400 hover:to-emerald-500 transition-all shadow-xl shadow-green-500/30 flex items-center justify-center gap-2 text-base">
                    <Zap size={20} className="text-yellow-300" fill="currentColor" />
                    Book Now
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Domain Edit/Create Modal */}
      <AnimatePresence>
        {showDomainEditModal && (
          <div className="fixed inset-0 z-[150] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowDomainEditModal(false)}
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-md bg-white rounded-[2.5rem] shadow-2xl p-8 overflow-hidden"
            >
              <div className="absolute top-0 right-0 p-6">
                <button 
                  onClick={() => setShowDomainEditModal(false)}
                  className="p-2 text-slate-400 hover:text-slate-900 transition-colors"
                >
                  <X size={20} />
                </button>
              </div>

              <div className="mb-8">
                <div className="w-12 h-12 bg-blue-50 rounded-2xl flex items-center justify-center text-blue-600 mb-4">
                  <Globe size={24} />
                </div>
                <h2 className="text-2xl font-black text-slate-900">{editingDomain ? 'Update Routing' : 'Add New Domain'}</h2>
                <p className="text-slate-500 font-medium text-sm mt-1">Configure domain behavior and traffic rules.</p>
              </div>

              <form onSubmit={(e) => {
                e.preventDefault();
                const fd = new FormData(e.currentTarget);
                const name = fd.get('name') as string;
                const mode = fd.get('mode') as 'serve' | 'redirect';
                const target = fd.get('target') as string;
                const isDefault = fd.get('isDefault') === 'on';
                
                if (editingDomain) {
                   handleUpdateDomain(editingDomain.id, { name, mode, target, isDefault });
                } else {
                   handleAddDomain(name, mode, target, isDefault);
                }
                setShowDomainEditModal(false);
              }} className="space-y-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Domain Name</label>
                  <input 
                    name="name" 
                    defaultValue={editingDomain?.name}
                    placeholder="e.g., app.nigeriahandy.com" 
                    required 
                    className="w-full p-4 rounded-2xl border-2 border-slate-100 outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all font-bold text-slate-900 placeholder:text-slate-300" 
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Policy Mode</label>
                  <div className="grid grid-cols-2 gap-3">
                    <label className={`relative flex items-center justify-center p-4 rounded-2xl border-2 cursor-pointer transition-all ${
                      editingDomain?.mode === 'serve' || !editingDomain ? 'border-blue-500 bg-blue-50/50' : 'border-slate-100 hover:border-slate-200'
                    }`}>
                      <input type="radio" name="mode" value="serve" defaultChecked={editingDomain?.mode === 'serve' || !editingDomain} className="sr-only" />
                      <div className="flex flex-col items-center gap-1">
                        <Zap size={16} className={editingDomain?.mode === 'serve' || !editingDomain ? 'text-blue-600' : 'text-slate-400'} />
                        <span className={`text-xs font-bold ${editingDomain?.mode === 'serve' || !editingDomain ? 'text-blue-900' : 'text-slate-500'}`}>Serve</span>
                      </div>
                    </label>
                    <label className={`relative flex items-center justify-center p-4 rounded-2xl border-2 cursor-pointer transition-all ${
                      editingDomain?.mode === 'redirect' ? 'border-indigo-500 bg-indigo-50/50' : 'border-slate-100 hover:border-slate-200'
                    }`}>
                      <input type="radio" name="mode" value="redirect" defaultChecked={editingDomain?.mode === 'redirect'} className="sr-only" />
                      <div className="flex flex-col items-center gap-1">
                        <RotateCcw size={16} className={editingDomain?.mode === 'redirect' ? 'text-indigo-600' : 'text-slate-400'} />
                        <span className={`text-xs font-bold ${editingDomain?.mode === 'redirect' ? 'text-indigo-900' : 'text-slate-500'}`}>Redirect</span>
                      </div>
                    </label>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Target (Optional)</label>
                  <input 
                    name="target" 
                    defaultValue={editingDomain?.target}
                    placeholder="e.g., https://main-site.com" 
                    className="w-full p-4 rounded-2xl border-2 border-slate-100 outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all font-mono text-xs text-slate-600" 
                  />
                  <p className="text-[10px] text-slate-400 italic ml-1">Leave empty for Local Instance routing.</p>
                </div>

                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                  <label className="flex items-center gap-3 cursor-pointer group">
                    <div className="relative">
                      <input 
                        type="checkbox" 
                        name="isDefault" 
                        defaultChecked={editingDomain?.isDefault}
                        className="sr-only peer" 
                      />
                      <div className="w-10 h-6 bg-slate-200 rounded-full peer peer-checked:bg-blue-600 transition-all after:content-[''] after:absolute after:top-1 after:left-1 after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:after:translate-x-4" />
                    </div>
                    <div>
                      <span className="text-sm font-bold text-slate-700 group-hover:text-slate-900 transition-colors">Mark as Default Domain</span>
                      <p className="text-[10px] text-slate-400">Sets this as the primary entry point for routing logic.</p>
                    </div>
                  </label>
                </div>

                <div className="flex gap-4 pt-4">
                  <button 
                    type="button" 
                    onClick={() => setShowDomainEditModal(false)} 
                    className="flex-1 py-4 rounded-2xl font-bold text-slate-400 hover:bg-slate-50 transition-all active:scale-95"
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit" 
                    className="flex-1 py-4 rounded-2xl font-bold bg-slate-900 text-white hover:bg-slate-800 transition-all shadow-xl shadow-slate-900/10 active:scale-95 flex items-center justify-center gap-2"
                  >
                    <ShieldCheck size={18} />
                    {editingDomain ? 'Update Rule' : 'Save Routing'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showUserProfileModal && currentUser && (
          <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowUserProfileModal(false)}
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, y: 100, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 100, scale: 0.95 }}
              className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl flex flex-col max-h-[90vh]"
            >
              <div className="p-8 overflow-y-auto">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-bold text-slate-900">Profile Settings</h2>
                  <button onClick={() => setShowUserProfileModal(false)} className="p-2 bg-slate-100 rounded-full text-slate-500 hover:bg-slate-200 transition-colors">
                    <X size={20} />
                  </button>
                </div>

                <form className="space-y-6" onSubmit={(e) => {
                  e.preventDefault();
                  const fd = new FormData(e.currentTarget);
                  handleUpdateUserProfile({
                    name: fd.get('name') as string,
                    phone: fd.get('phone') as string
                  });
                }}>
                  <div className="space-y-4">
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-400 uppercase ml-1">Full Name</label>
                      <input name="name" defaultValue={currentUser.name} required className="w-full p-3 rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-blue-500/20" />
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-400 uppercase ml-1">Phone Number (Required for calls)</label>
                      <input name="phone" defaultValue={currentUser.phone} placeholder="e.g. +234 800 000 0000" className="w-full p-3 rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-blue-500/20" />
                    </div>
                  </div>

                  <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-2">
                        <ShieldCheck size={18} className="text-blue-600" />
                        <span className="font-bold text-slate-900">Membership Status</span>
                      </div>
                      <span className={`text-[10px] font-bold uppercase px-2 py-1 rounded-full ${
                        currentUser.plan === 'member' ? 'bg-blue-600 text-white' : 'bg-slate-200 text-slate-500'
                      }`}>
                        {currentUser.plan === 'member' ? 'Active Member' : 'Free Tier'}
                      </span>
                    </div>
                    
                    {currentUser.plan !== 'member' ? (
                      <div>
                        <p className="text-xs text-slate-500 mb-4">Upgrade to access verified pros only and get community protection.</p>
                        <button 
                          type="button"
                          onClick={() => {
                            setShowUserProfileModal(false);
                            const memberPlan = PRICING_PLANS.find(p => p.id === 'member');
                            if (memberPlan) {
                              setSelectedPlan(memberPlan);
                              setShowCheckout(true);
                            }
                          }}
                          className="w-full py-3 bg-blue-600 text-white rounded-xl text-sm font-bold hover:bg-blue-700 transition-all shadow-lg shadow-blue-600/10"
                        >
                          Upgrade to Member (₦1,000/mo)
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2 text-emerald-600 text-xs font-bold">
                        <CheckCircle2 size={14} />
                        <span>You are a verified community member!</span>
                      </div>
                    )}
                  </div>

                  {currentUser.role === 'handyman' && (
                    <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100">
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-2">
                          <ShieldCheck size={18} className="text-blue-600" />
                          <span className="font-bold text-slate-900">Verification Status</span>
                        </div>
                        <span className={`text-[10px] font-bold uppercase px-2 py-1 rounded-full ${
                          currentUser.verified ? 'bg-blue-600 text-white' : 
                          currentUser.isVerifiedPending ? 'bg-amber-100 text-amber-600' : 'bg-slate-200 text-slate-500'
                        }`}>
                          {currentUser.verified ? 'Verified' : 
                           currentUser.isVerifiedPending ? 'Pending' : 'Not Verified'}
                        </span>
                      </div>
                      
                      {!currentUser.verified && !currentUser.isVerifiedPending && (
                        <div>
                          <p className="text-xs text-slate-500 mb-4">Get verified to build trust and access premium customers. Please upload a valid Government ID.</p>
                          <div className="space-y-3">
                            <div className="relative">
                              <input 
                                type="file" 
                                id="id-upload"
                                className="hidden" 
                                accept="image/*,.pdf"
                                onChange={(e) => setVerificationFile(e.target.files?.[0] || null)}
                              />
                              <label 
                                htmlFor="id-upload"
                                className="flex items-center justify-center gap-2 w-full py-3 border-2 border-dashed border-slate-200 rounded-xl text-xs font-bold text-slate-500 cursor-pointer hover:border-blue-400 hover:text-blue-600 transition-all"
                              >
                                <Upload size={14} />
                                {verificationFile ? verificationFile.name : 'Choose ID Document'}
                              </label>
                            </div>
                            <button 
                              type="button"
                              disabled={!verificationFile || isRegistering}
                              onClick={() => verificationFile && handleApplyVerification(verificationFile)}
                              className="w-full py-3 bg-blue-600 text-white rounded-xl text-sm font-bold hover:bg-blue-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              {isRegistering ? 'Uploading...' : 'Submit for Verification'}
                            </button>
                          </div>
                        </div>
                      )}
                      {currentUser.isVerifiedPending && (
                        <p className="text-xs text-amber-600 font-medium italic">
                          Your verification request is currently being reviewed by our team.
                        </p>
                      )}
                      {currentUser.verified && (
                        <div className="flex items-center gap-2 text-emerald-600 text-xs font-bold">
                          <CheckCircle2 size={14} />
                          <span>Your professional profile is verified!</span>
                        </div>
                      )}
                    </div>
                  )}

                  <div className="flex gap-4 pt-4">
                    <button type="submit" className="flex-[2] bg-slate-900 text-white py-4 rounded-2xl font-bold hover:bg-slate-800 transition-all">
                      Save Profile Changes
                    </button>
                    <button 
                      type="button" 
                      onClick={handleLogout}
                      className="flex-1 bg-red-50 text-red-600 py-4 rounded-2xl font-bold hover:bg-red-100 transition-all flex items-center justify-center gap-2 border border-red-100"
                    >
                      <LogOut size={18} />
                      <span className="sm:inline hidden">Logout</span>
                    </button>
                  </div>
                </form>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showEditProfile && myProProfile && (
          <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowEditProfile(false)}
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl flex flex-col max-h-[90vh]"
            >
              <div className="p-8 overflow-y-auto">
                <h2 className="text-2xl font-bold mb-6">Edit Professional Profile</h2>
                <form className="space-y-4" onSubmit={(e) => {
                  e.preventDefault();
                  const fd = new FormData(e.currentTarget);
                  handleUpdatePro({
                    name: fd.get('name') as string,
                    location: fd.get('location') as string,
                    phone: fd.get('phone') as string,
                    whatsapp: fd.get('whatsapp') as string,
                    description: fd.get('description') as string,
                    availability: fd.get('availability') as any,
                    portfolio: fd.get('portfolio') ? [fd.get('portfolio') as string] : myProProfile.portfolio
                  });
                }}>
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-400 uppercase ml-1">Full Name</label>
                    <input name="name" defaultValue={myProProfile.name} required className="w-full p-3 rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-blue-500/20" />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-400 uppercase ml-1">Phone</label>
                      <input name="phone" defaultValue={myProProfile.phone} required className="w-full p-3 rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-blue-500/20" />
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-400 uppercase ml-1">WhatsApp</label>
                      <input name="whatsapp" defaultValue={myProProfile.whatsapp} className="w-full p-3 rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-blue-500/20" />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-400 uppercase ml-1">Location</label>
                    <input name="location" defaultValue={myProProfile.location} required className="w-full p-3 rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-blue-500/20" />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-400 uppercase ml-1">Availability Status</label>
                    <select name="availability" defaultValue={myProProfile.availability || 'Available'} className="w-full p-3 rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-blue-500/20">
                      <option value="Available">Available</option>
                      <option value="Busy">Busy</option>
                      <option value="Away">Away</option>
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-400 uppercase ml-1">Profile Image</label>
                    <div className="flex items-center gap-4">
                      <label className="flex-1 flex items-center justify-center gap-2 border-2 border-dashed border-slate-200 rounded-xl p-4 cursor-pointer hover:border-blue-500 hover:bg-blue-50 transition-all">
                        <Upload size={20} className="text-slate-400" />
                        <span className="text-sm text-slate-500">{profileImageFile ? profileImageFile.name : 'Change Profile Photo'}</span>
                        <input 
                          type="file" 
                          accept="image/*" 
                          className="hidden" 
                          onChange={(e) => setProfileImageFile(e.target.files?.[0] || null)}
                        />
                      </label>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-400 uppercase ml-1">Description</label>
                    <textarea name="description" defaultValue={myProProfile.description} required className="w-full p-3 rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-blue-500/20 h-24" />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-400 uppercase ml-1">Portfolio Image URL</label>
                    <input name="portfolio" defaultValue={myProProfile.portfolio[0] || ''} className="w-full p-3 rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-blue-500/20" />
                  </div>
                  
                  <div className="flex flex-col sm:flex-row gap-3 pt-4">
                    <button type="button" disabled={isUpdating} onClick={() => setShowEditProfile(false)} className="flex-1 py-3 rounded-xl font-bold text-slate-500 hover:bg-slate-100 transition-colors">Cancel</button>
                    <button type="submit" disabled={isUpdating} className="flex-[2] py-3 rounded-xl font-bold bg-blue-600 text-white hover:bg-blue-700 transition-colors shadow-lg shadow-blue-600/20 disabled:opacity-50 flex items-center justify-center gap-2">
                      {isUpdating ? (
                        <>
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                          Updating...
                        </>
                      ) : 'Save Changes'}
                    </button>
                    <button 
                      type="button" 
                      onClick={handleLogout}
                      className="flex-1 py-3 bg-red-50 text-red-600 rounded-xl font-bold hover:bg-red-100 transition-all flex items-center justify-center gap-2 border border-red-100"
                    >
                      <LogOut size={18} />
                      <span className="sm:inline hidden">Logout</span>
                    </button>
                  </div>
                </form>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Modern Fixed Bottom Navigation for Mobile */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 md:hidden bg-white/90 backdrop-blur-3xl border-t border-slate-100 px-2 py-2 pb-[calc(0.5rem+env(safe-area-inset-bottom,0px))] flex items-center justify-around shadow-[0_-20px_40px_-20px_rgba(0,0,0,0.1)]">
        <motion.button 
          whileTap={{ scale: 0.9 }}
          onClick={handleGoHome}
          className={`flex flex-col items-center gap-1 p-2 rounded-2xl transition-all ${
            (!showPricing && !showRequests && !showChatList && !showUserProfileModal && !showEditProfile && !showAdminDashboard) 
            ? 'text-blue-600 bg-blue-50/80 shadow-inner' 
            : 'text-slate-400 active:bg-slate-50'
          }`}
        >
          <Home size={20} className={(!showPricing && !showRequests && !showChatList && !showUserProfileModal && !showEditProfile && !showAdminDashboard) ? "fill-current" : ""} />
          <span className="text-[9px] font-black uppercase tracking-tight">{t('Home', currentLanguage)}</span>
        </motion.button>
        <motion.button 
          whileTap={{ scale: 0.9 }}
          onClick={() => {
            setShowRequests(true);
            setShowPricing(false);
            setShowChatList(false);
            setShowAdminDashboard(false);
            setShowEditProfile(false);
            setShowUserProfileModal(false);
          }}
          className={`flex flex-col items-center gap-1 p-2 rounded-2xl transition-all ${showRequests ? 'text-blue-600 bg-blue-50/80 shadow-inner' : 'text-slate-400 active:bg-slate-50'}`}
        >
          <Clock size={20} />
          <span className="text-[9px] font-black uppercase tracking-tight">{t('My Requests', currentLanguage)}</span>
        </motion.button>
        <motion.button 
          whileTap={{ scale: 0.9 }}
          onClick={() => {
            setShowChatList(true);
            setShowRequests(false);
            setShowPricing(false);
            setShowAdminDashboard(false);
            setShowEditProfile(false);
            setShowUserProfileModal(false);
          }}
          className={`flex flex-col items-center gap-1 p-2 rounded-2xl transition-all relative ${showChatList ? 'text-blue-600 bg-blue-50/80 shadow-inner' : 'text-slate-400 active:bg-slate-50'}`}
        >
          <MessageCircle size={20} />
          <span className="text-[9px] font-black uppercase tracking-tight">{t('Messages', currentLanguage)}</span>
          {chats.length > 0 && (
            <motion.span 
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="absolute top-1 right-2 bg-red-500 text-white text-[8px] w-3.5 h-3.5 rounded-full flex items-center justify-center font-black border-2 border-white shadow-sm"
            >
              {chats.length}
            </motion.span>
          )}
        </motion.button>
        <motion.button 
          whileTap={{ scale: 0.9 }}
          onClick={() => {
            setShowPricing(true);
            setShowRequests(false);
            setShowChatList(false);
            setShowAdminDashboard(false);
            setShowEditProfile(false);
            setShowUserProfileModal(false);
          }}
          className={`flex flex-col items-center gap-1 p-2 rounded-2xl transition-all ${showPricing ? 'text-blue-600 bg-blue-50/80 shadow-inner' : 'text-slate-400 active:bg-slate-50'}`}
        >
          <CreditCard size={20} />
          <span className="text-[9px] font-black uppercase tracking-tight">{t('Pricing', currentLanguage)}</span>
        </motion.button>
        {currentUser && (
          <motion.button 
            whileTap={{ scale: 0.9 }}
            onClick={() => {
              if (myProProfile) {
                setShowEditProfile(!showEditProfile);
                setShowUserProfileModal(false);
              } else {
                setShowUserProfileModal(!showUserProfileModal);
                setShowEditProfile(false);
              }
              setShowRequests(false);
              setShowPricing(false);
              setShowChatList(false);
              setShowAdminDashboard(false);
            }}
            className={`flex flex-col items-center gap-1 p-2 rounded-2xl transition-all ${(showEditProfile || showUserProfileModal) ? 'text-blue-600 bg-blue-50/80 shadow-inner' : 'text-slate-400 active:bg-slate-50'}`}
          >
            <div className={`w-5 h-5 rounded-full overflow-hidden border ${ (showEditProfile || showUserProfileModal) ? 'border-blue-600' : 'border-slate-300'}`}>
              <img referrerPolicy="no-referrer" src={currentUser.photoURL || `https://ui-avatars.com/api/?name=${encodeURIComponent(currentUser.name)}&background=random`} alt="Profile" className="w-full h-full object-cover" />
            </div>
            <span className="text-[9px] font-black uppercase tracking-tight text-center">{t('Profile', currentLanguage)}</span>
          </motion.button>
        )}
      </nav>

      {/* Footer */}
              <footer className="max-w-6xl mx-auto px-4 py-12 border-t border-slate-200 mt-12 mb-28 md:mb-12 flex flex-col items-center gap-6">
        <Logo size={64} className="opacity-40 grayscale hover:grayscale-0 transition-all cursor-pointer" />
        
        <div className="flex flex-wrap justify-center items-center gap-6 text-xs font-bold text-slate-400 uppercase tracking-widest">
          <button onClick={() => setShowTerms(true)} className="hover:text-blue-600 transition-colors">Terms of Service</button>
          <button onClick={() => setShowPrivacy(true)} className="hover:text-blue-600 transition-colors">Privacy Policy</button>
          <a href="mailto:support@handypadi.ng" className="hover:text-blue-600 transition-colors">Support</a>
          <button 
            onClick={async () => {
              toast.loading("Running System Diagnostic...");
              try {
                const results = [];
                // 1. Check Internet
                results.push({ name: 'Internet', status: 'OK' });
                
                // 2. Check Auth Status
                results.push({ name: 'Auth SDK', status: auth ? 'Initialized' : 'Error' });
                
                // 3. Check Firestore
                try {
                  await getDocFromServer(doc(db, 'test', 'connection'));
                  results.push({ name: 'Firestore', status: 'Connected' });
                } catch (e) {
                  results.push({ name: 'Firestore', status: 'Access Denied' });
                }

                // 4. Check AI API
                try {
                  const aiRes = await fetch('/api/ai/health');
                  results.push({ name: 'AI API', status: aiRes.ok ? 'Operational' : `Error ${aiRes.status}` });
                } catch (e) {
                   results.push({ name: 'AI API', status: 'Unreachable' });
                }

                const summary = results.map(r => `${r.name}: ${r.status}`).join('\n');
                toast.dismiss();
                toast.info("System Diagnostic Results", { 
                  description: summary, 
                  duration: 10000 
                });
              } catch (err) {
                toast.dismiss();
                toast.error("Diagnostic Failed");
              }
            }}
            className="px-3 py-1 bg-slate-50 rounded-lg hover:bg-slate-100 transition-colors flex items-center gap-2"
          >
            <ShieldCheck size={14} />
            Diagnostics
          </button>
        </div>

        <p className="text-slate-400 text-sm text-center">
          &copy; 2026 Sesewa Golding Limited. {currentMarket.name}'s leading platform for repairs.
        </p>
      </footer>

      {/* Quote Modal */}
      <AnimatePresence>
        {showQuoteModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowQuoteModal(null)}
              className="absolute inset-0 bg-slate-900/80 backdrop-blur-md"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl p-6 sm:p-8 max-h-[90vh] overflow-y-auto"
            >
              <h2 className="text-xl sm:text-2xl font-bold mb-2 flex items-center gap-2">
                <FileText className="text-blue-600" />
                Generate Official Invoice
              </h2>
              <p className="text-slate-500 mb-6 text-sm">
                Provide a cost breakdown to generate an invoice for <span className="font-bold text-slate-900">{showQuoteModal.userName}</span>.
              </p>
              
              <form className="space-y-4" onSubmit={(e) => {
                e.preventDefault();
                const fd = new FormData(e.currentTarget);
                handleSendQuote(showQuoteModal.id, {
                  labor: Number(fd.get('labor')),
                  materials: Number(fd.get('materials')),
                  taxes: Number(fd.get('taxes')),
                  notes: fd.get('notes') as string
                });
              }}>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-400 uppercase ml-1">Labor Cost (₦)</label>
                    <input type="number" min="0" name="labor" placeholder="e.g. 5000" required className="w-full p-3 rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-blue-500/20 text-sm font-mono" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-400 uppercase ml-1">Material Cost (₦)</label>
                    <input type="number" min="0" name="materials" defaultValue="0" required className="w-full p-3 rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-blue-500/20 text-sm font-mono" />
                  </div>
                </div>
                
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase ml-1">Taxes / Fees (₦)</label>
                  <input type="number" min="0" name="taxes" defaultValue="0" required className="w-full p-3 rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-blue-500/20 text-sm font-mono" />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase ml-1">Additional Notes</label>
                  <textarea 
                    name="notes" 
                    placeholder="Describe the scope of work and materials needed..." 
                    required 
                    className="w-full p-3 rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-blue-500/20 h-24 text-sm" 
                  />
                </div>
                
                <div className="flex gap-2 pt-4">
                  <button type="button" onClick={() => setShowQuoteModal(null)} className="flex-1 py-3 rounded-xl font-bold text-slate-500 hover:bg-slate-100 transition-all text-sm">Cancel</button>
                  <button type="submit" className="flex-1 py-3 rounded-xl font-bold bg-blue-600 text-white hover:bg-blue-700 transition-all shadow-lg shadow-blue-600/20 flex items-center justify-center gap-2 text-sm">
                    <FileText size={16} />
                    Generate Invoice
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Terms of Service Modal */}
      <AnimatePresence>
        {showTerms && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowTerms(false)}
              className="absolute inset-0 bg-slate-900/80 backdrop-blur-md"
            />
            <motion.div 
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 50 }}
              className="relative w-full max-w-3xl bg-white rounded-[2rem] shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
            >
              <div className="p-8 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                <div>
                  <h2 className="text-2xl font-bold text-slate-900">Terms of Service</h2>
                  <p className="text-xs text-slate-400 font-bold uppercase tracking-tighter mt-1">Last Updated: March 2026 • {currentMarket.name} Digital Law Compliant</p>
                </div>
                <button onClick={() => setShowTerms(false)} className="p-2 bg-white border border-slate-200 rounded-full text-slate-500 hover:bg-slate-50 transition-colors">
                  <X size={20} />
                </button>
              </div>
              
              <div className="p-8 overflow-y-auto prose prose-slate max-w-none">
                <section className="mb-8">
                  <h3 className="text-lg font-bold text-slate-900 mb-3 flex items-center gap-2">
                    <ShieldCheck size={20} className="text-blue-600" />
                    1. The Escrow Payment System
                  </h3>
                  <p className="text-slate-600 leading-relaxed text-sm">
                    Sesewa Golding Limited utilizes a secure Escrow system powered by Paystack. When you book a professional, your payment is held securely by our platform. 
                    <strong> Funds are only released to the professional once you confirm the job is completed</strong> to your satisfaction. 
                    This ensures that your money is safe and professionals are motivated to deliver high-quality work.
                  </p>
                </section>

                <section className="mb-8">
                  <h3 className="text-lg font-bold text-slate-900 mb-3 flex items-center gap-2">
                    <AlertTriangle size={20} className="text-amber-600" />
                    2. Dispute Resolution & Refunds
                  </h3>
                  <p className="text-slate-600 leading-relaxed text-sm mb-3">
                    In the event of a disagreement or incomplete service, users have <strong>48 hours</strong> from the scheduled completion time to raise a formal Dispute.
                  </p>
                  <ul className="list-disc pl-5 text-sm text-slate-600 space-y-2">
                    <li><strong>Mediation:</strong> Our Admin team will review chat logs, photos, and job descriptions to mediate the dispute.</li>
                    <li><strong>Refunds:</strong> If a dispute is resolved in favor of the customer, a full or partial refund will be processed back to the original payment method.</li>
                    <li><strong>Finality:</strong> Admin decisions on disputes are final and binding for both parties using the platform.</li>
                  </ul>
                </section>

                <section className="mb-8">
                  <h3 className="text-lg font-bold text-slate-900 mb-3 flex items-center gap-2">
                    <CheckCircle2 size={20} className="text-emerald-600" />
                    3. Professional Conduct
                  </h3>
                  <p className="text-slate-600 leading-relaxed text-sm">
                    All professionals on Sesewa Golding Limited agree to provide services with integrity. Misrepresentation of skills, harassment, or bypassing the platform's payment system to avoid fees will result in immediate and permanent account suspension.
                  </p>
                </section>

                <section>
                  <h3 className="text-lg font-bold text-slate-900 mb-3 flex items-center gap-2">
                    <Lock size={20} className="text-slate-600" />
                    4. {currentMarket.name} Law & Jurisdiction
                  </h3>
                  <p className="text-slate-600 leading-relaxed text-sm">
                    These terms are governed by the laws of {currentMarket.jurisdiction}, including the Cybercrimes Act and relevant consumer protection regulations. Any legal proceedings shall be conducted in {currentMarket.name} courts.
                  </p>
                </section>
              </div>

              <div className="p-6 bg-slate-50 border-t border-slate-100 flex justify-end">
                <button 
                  onClick={() => setShowTerms(false)}
                  className="px-8 py-3 bg-slate-900 text-white rounded-xl font-bold hover:bg-slate-800 transition-all"
                >
                  I Understand
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Privacy Policy Modal */}
      <AnimatePresence>
        {showPrivacy && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowPrivacy(false)}
              className="absolute inset-0 bg-slate-900/80 backdrop-blur-md"
            />
            <motion.div 
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 50 }}
              className="relative w-full max-w-3xl bg-white rounded-[2rem] shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
            >
              <div className="p-8 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                <div>
                  <h2 className="text-2xl font-bold text-slate-900">Privacy Policy</h2>
                  <p className="text-xs text-slate-400 font-bold uppercase tracking-tighter mt-1">NDPR Compliant • Data Protection Guaranteed</p>
                </div>
                <button onClick={() => setShowPrivacy(false)} className="p-2 bg-white border border-slate-200 rounded-full text-slate-500 hover:bg-slate-50 transition-colors">
                  <X size={20} />
                </button>
              </div>
              
              <div className="p-8 overflow-y-auto prose prose-slate max-w-none">
                <section className="mb-8">
                  <h3 className="text-lg font-bold text-slate-900 mb-3 flex items-center gap-2">
                    <User size={20} className="text-blue-600" />
                    1. Data We Collect
                  </h3>
                  <p className="text-slate-600 leading-relaxed text-sm">
                    In compliance with the <strong>{currentMarket.compliance}</strong>, we collect only the information necessary to provide our services:
                  </p>
                  <ul className="list-disc pl-5 text-sm text-slate-600 mt-2 space-y-1">
                    <li>Basic profile info (Name, Email, Phone)</li>
                    <li>Location data (to find nearby pros)</li>
                    <li>Government-issued ID documents (Professionals only)</li>
                    <li>Transaction history and chat logs</li>
                  </ul>
                </section>

                <section className="mb-8">
                  <h3 className="text-lg font-bold text-slate-900 mb-3 flex items-center gap-2">
                    <ShieldCheck size={20} className="text-emerald-600" />
                    2. ID Verification & Security
                  </h3>
                  <p className="text-slate-600 leading-relaxed text-sm">
                    For professionals, we require a Government-issued ID to verify your identity. 
                    <strong> These documents are stored in encrypted Firebase Storage and are used EXCLUSIVELY for the purpose of manual verification by our Admin team.</strong> 
                    Once a professional is verified, the document is archived and is never shared with third parties or other users.
                  </p>
                </section>

                <section className="mb-8">
                  <h3 className="text-lg font-bold text-slate-900 mb-3 flex items-center gap-2">
                    <Lock size={20} className="text-slate-600" />
                    3. Data Retention & Your Rights
                  </h3>
                  <p className="text-slate-600 leading-relaxed text-sm">
                    You have the right to request access to your data, correction of errors, or deletion of your account. We retain data only as long as necessary to fulfill the purposes outlined or as required by {currentMarket.law}.
                  </p>
                </section>

                <section>
                  <h3 className="text-lg font-bold text-slate-900 mb-3 flex items-center gap-2">
                    <Mail size={20} className="text-blue-600" />
                    4. Contact Our Data Protection Officer
                  </h3>
                  <p className="text-slate-600 leading-relaxed text-sm">
                    If you have questions about your data or wish to exercise your rights under the {currentMarket.compliance}, please contact us at <strong>privacy@handypadi.ng</strong>.
                  </p>
                </section>
              </div>

              <div className="p-6 bg-slate-50 border-t border-slate-100 flex justify-end">
                <button 
                  onClick={() => setShowPrivacy(false)}
                  className="px-8 py-3 bg-slate-900 text-white rounded-xl font-bold hover:bg-slate-800 transition-all"
                >
                  Close
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Notifications Modal/Drawer */}
      <AnimatePresence>
        {showNotifications && (
          <div className="fixed inset-0 z-[100] flex items-start justify-end p-4 pointer-events-none">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowNotifications(false)}
              className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm pointer-events-auto"
            />
            <motion.div 
              initial={{ opacity: 0, x: 50, scale: 0.95 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, x: 50, scale: 0.95 }}
              className="relative w-full max-w-sm mt-16 pointer-events-auto"
            >
              <NotificationList 
                notifications={notifications} 
                onClose={() => setShowNotifications(false)}
                onMarkRead={markNotificationAsRead}
                setShowChatList={setShowChatList}
                setShowRequests={setShowRequests}
              />
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* HandyPadi AI Assistant */}
      <div className="fixed bottom-20 md:bottom-6 right-6 z-[100]">
        <AnimatePresence>
          {handyPadiOpen && (
            <motion.div
              initial={{ opacity: 0, y: 20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 20, scale: 0.95 }}
              className="absolute bottom-16 right-0 w-[calc(100vw-3rem)] sm:w-80 h-[500px] max-h-[60vh] bg-white border border-slate-200 rounded-[2rem] shadow-2xl flex flex-col overflow-hidden"
            >
              <div className="p-4 bg-white border-b border-slate-100 text-slate-900 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Logo size={32} />
                  <span className="font-cartoon text-xl text-blue-600">HandyPadi <span className="font-sans font-bold text-sm text-slate-900">AI</span></span>
                </div>
                <button onClick={() => setHandyPadiOpen(false)} className="hover:bg-slate-100 p-1 rounded-lg text-slate-400">
                  <X size={18} />
                </button>
              </div>
              
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {handyPadiMessages.length === 0 && (
                  <div className="text-center py-8">
                    <div className="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center mx-auto mb-3">
                      <Logo size={48} />
                    </div>
                    <p className="text-slate-500 text-sm">Hi! I'm <span className="font-cartoon text-lg text-blue-600">HandyPadi</span>. How can I help you today?</p>
                  </div>
                )}
                {handyPadiMessages.map((msg, i) => (
                  <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[80%] p-3 rounded-2xl text-sm ${
                      msg.role === 'user' ? 'bg-blue-600 text-white rounded-tr-none' : 'bg-slate-100 text-slate-800 rounded-tl-none'
                    }`}>
                      <div className="flex flex-col gap-1">
                        {msg.text}
                        {msg.role === 'bot' && (
                          <button 
                            onClick={() => handleTranslate(msg.text, `bot-msg-${i}`)}
                            className="text-[10px] text-blue-600 font-bold flex items-center gap-1 hover:underline w-fit mt-1 border-t border-slate-200 pt-1"
                          >
                            <Globe size={10} />
                            {isTranslating === `bot-msg-${i}` ? t('Translating...', currentLanguage) : `${t('Translate to', currentLanguage)} ${currentLanguage}`}
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
                {isHandyPadiTyping && (
                  <div className="flex justify-start">
                    <div className="bg-slate-100 p-3 rounded-2xl rounded-tl-none flex gap-1">
                      <div className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" />
                      <div className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce [animation-delay:0.2s]" />
                      <div className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce [animation-delay:0.4s]" />
                    </div>
                  </div>
                )}
              </div>

              <form onSubmit={handleHandyPadiSend} className="p-3 border-t border-slate-100 bg-slate-50/50">
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={handyPadiInput}
                    onChange={(e) => setHandyPadiInput(e.target.value)}
                    placeholder="Ask HandyPadi..."
                    className="flex-1 min-w-0 bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-blue-500/20 outline-none transition-all"
                  />
                  <button 
                    type="submit" 
                    disabled={!handyPadiInput.trim() || isHandyPadiTyping}
                    className="bg-blue-600 text-white p-2.5 rounded-xl hover:bg-blue-700 transition-all flex items-center justify-center shrink-0 disabled:opacity-50 disabled:hover:bg-blue-600"
                  >
                    <Send size={18} fill="currentColor" />
                  </button>
                </div>
              </form>
            </motion.div>
          )}
        </AnimatePresence>
        <AnimatePresence>
          {showHandyPadiNudge && !handyPadiOpen && (
            <motion.button
              initial={{ opacity: 0, x: 20, scale: 0.8 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, x: 20, scale: 0.8 }}
              onClick={() => {
                setHandyPadiOpen(true);
                setShowHandyPadiNudge(false);
              }}
              className="absolute bottom-16 right-0 bg-blue-600 text-white px-4 py-2 rounded-2xl rounded-br-none shadow-xl flex items-center gap-2 whitespace-nowrap group hover:bg-blue-700 transition-all border border-blue-400/30"
            >
              <div className="flex flex-col items-start leading-none">
                <span className="text-xl font-cartoon opacity-90 mb-1">HandyPadi</span>
                <span className="text-sm font-bold">Ask me anything!</span>
              </div>
              <motion.div 
                animate={{ x: [0, 5, 0] }}
                transition={{ repeat: Infinity, duration: 1.5 }}
                className="bg-white/20 p-1 rounded-lg"
              >
                <ChevronRight size={14} className="text-white" />
              </motion.div>
            </motion.button>
          )}
        </AnimatePresence>
        <button
          onClick={() => {
            setHandyPadiOpen(!handyPadiOpen);
            setShowHandyPadiNudge(false);
          }}
          className={`w-14 h-14 bg-white/80 backdrop-blur-md border rounded-full shadow-xl flex items-center justify-center hover:scale-110 transition-all active:scale-95 z-[101] overflow-hidden ${
            handyPadiOpen ? 'border-slate-200' : 'border-blue-500 ring-4 ring-blue-500/10'
          }`}
        >
          {handyPadiOpen ? (
            <X size={24} className="text-slate-600" />
          ) : (
            <div className="relative w-full h-full flex items-center justify-center">
              <motion.div
                animate={{ 
                  scale: [1, 1.2, 1],
                  opacity: [0.5, 0.2, 0.5]
                }}
                transition={{ 
                  repeat: Infinity, 
                  duration: 2,
                  ease: "easeInOut"
                }}
                className="absolute inset-0 bg-blue-500 rounded-full"
              />
              <Logo size={40} className="relative z-10" />
            </div>
          )}
        </button>
        <Toaster position="top-right" richColors />
      </div>
      </div>
      </div>
    );
  }
}
