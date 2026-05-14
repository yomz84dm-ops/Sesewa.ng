import * as React from 'react';
import { useState, useRef, useEffect } from 'react';
import { Star, X, CreditCard, PenTool, Sparkles, AlertCircle, ShieldCheck, CheckCircle2, MessageCircle, Briefcase, Bell, Volume2, VolumeX, Loader2, Smartphone, Send, MapPin, RotateCcw, Calculator, Search, AlertTriangle } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { PricingPlan, Notification, AppUser, Chat, Message } from './types';
import { auth, db, handleFirestoreError, OperationType } from './firebase';
import { doc, updateDoc, addDoc, collection, serverTimestamp, getDoc, query, orderBy, onSnapshot } from 'firebase/firestore';
import { geminiService } from './services/geminiService';
import { getPriceEstimation, PriceEstimation } from './services/aiService';
import { t } from './translations';
// --- Components ---
export const StarRating = ({ rating, onRate, interactive = false }: { rating: number, onRate?: (r: number) => void, interactive?: boolean }) => {
  return (
    <div className="flex items-center gap-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          disabled={!interactive}
          onClick={() => onRate?.(star)}
          className={`${interactive ? 'cursor-pointer hover:scale-110 transition-transform' : 'cursor-default'}`}
        >
          <Star
            size={interactive ? 24 : 14}
            className={`${
              star <= rating 
                ? 'text-amber-400 fill-amber-400' 
                : 'text-slate-200'
            }`}
          />
        </button>
      ))}
    </div>
  );
};

export const SimulatedCheckout = ({ plan, onClose, onComplete, lang }: { plan: PricingPlan, onClose: () => void, onComplete: () => void, lang: string }) => {
  const [step, setStep] = useState<'options' | 'processing' | 'success'>('options');
  const [method, setMethod] = useState<'card' | 'transfer' | 'ussd'>('card');

  const handlePay = async () => {
    setStep('processing');
    
    try {
      if (auth.currentUser) {
        const userRef = doc(db, 'users', auth.currentUser.uid);
        
        if (plan.id.startsWith('credits-')) {
          const amount = parseInt(plan.id.split('-')[1]);
          // We need the current credits from the user document
          const userSnap = await getDoc(userRef);
          const currentCredits = userSnap.data()?.credits || 0;
          await updateDoc(userRef, {
            credits: currentCredits + amount
          });
        } else {
          await updateDoc(userRef, {
            plan: plan.id
          });
        }
      }
      setStep('success');
    } catch (error) {
      console.error('Payment update error:', error);
      setStep('options');
      alert('Payment was successful, but we encountered an error updating your account. Please contact support.');
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl animate-in zoom-in-95 duration-200 max-h-[90vh] overflow-y-auto">
        {step === 'options' && (
          <div className="p-8">
            <div className="flex justify-between items-start mb-6">
              <div>
                <h3 className="text-xl font-bold text-slate-900">Checkout</h3>
                <p className="text-slate-500 text-sm">Secure payment via Paystack</p>
              </div>
              <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full transition-colors">
                <X size={20} />
              </button>
            </div>

            <div className="bg-slate-50 p-4 rounded-2xl mb-8 flex justify-between items-center">
              <div>
                <div className="text-xs text-slate-400 uppercase font-bold tracking-wider">Plan</div>
                <div className="font-bold text-slate-900">{plan.name}</div>
              </div>
              <div className="text-right">
                <div className="text-xs text-slate-400 uppercase font-bold tracking-wider">Amount</div>
                <div className="font-bold text-blue-600">{plan.price}</div>
              </div>
            </div>

            <div className="space-y-3 mb-8">
              <button 
                onClick={() => setMethod('card')}
                className={`w-full flex items-center gap-4 p-4 rounded-2xl border-2 transition-all ${
                  method === 'card' ? 'border-blue-600 bg-blue-50' : 'border-slate-100 hover:border-slate-200'
                }`}
              >
                <div className={`p-2 rounded-lg ${method === 'card' ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-400'}`}>
                  <CreditCard size={20} />
                </div>
                <div className="text-left">
                  <div className="font-bold text-sm">Pay with Card</div>
                  <div className="text-xs text-slate-500">Visa, Mastercard, Verve</div>
                </div>
              </button>

              <button 
                onClick={() => setMethod('transfer')}
                className={`w-full flex items-center gap-4 p-4 rounded-2xl border-2 transition-all ${
                  method === 'transfer' ? 'border-blue-600 bg-blue-50' : 'border-slate-100 hover:border-slate-200'
                }`}
              >
                <div className={`p-2 rounded-lg ${method === 'transfer' ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-400'}`}>
                  <Smartphone size={20} />
                </div>
                <div className="text-left">
                  <div className="font-bold text-sm">Bank Transfer</div>
                  <div className="text-xs text-slate-500">Fast and secure local transfer</div>
                </div>
              </button>
            </div>

            <button 
              onClick={handlePay}
              className="w-full bg-blue-600 text-white py-4 rounded-2xl font-bold hover:bg-blue-700 transition-all flex items-center justify-center gap-2"
            >
              Pay {plan.price}
            </button>

            <PaystackBankTransferGuide lang={lang} />
            
            <div className="mt-6 flex items-center justify-center gap-2 text-slate-400 text-xs font-medium">
              <ShieldCheck size={14} className="text-emerald-500" />
              Secured by Paystack
            </div>
          </div>
        )}

        {step === 'processing' && (
          <div className="p-12 text-center">
            <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-6"></div>
            <h3 className="text-xl font-bold mb-2">Processing Payment</h3>
            <p className="text-slate-500">Please do not close this window...</p>
          </div>
        )}

        {step === 'success' && (
          <div className="p-12 text-center animate-in fade-in slide-in-from-bottom-4">
            <div className="w-20 h-20 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle2 size={40} />
            </div>
            <h3 className="text-2xl font-bold mb-2">Payment Successful!</h3>
            <p className="text-slate-500 mb-8">
              Your subscription to <strong>{plan.name}</strong> is now active.
            </p>
            <button 
              onClick={onComplete}
              className="w-full bg-slate-900 text-white py-4 rounded-2xl font-bold hover:bg-slate-800 transition-all"
            >
              Continue to Dashboard
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export const NotificationList = ({ 
  notifications, 
  onClose, 
  onMarkRead,
  setShowChatList,
  setShowRequests
}: { 
  notifications: Notification[], 
  onClose: () => void,
  onMarkRead: (id: string) => void,
  setShowChatList: (show: boolean) => void,
  setShowRequests: (show: boolean) => void
}) => {
  const handleNotificationClick = (notif: Notification) => {
    onMarkRead(notif.id);
    onClose();
    
    if (notif.type === 'message') {
      setShowChatList(true);
      setShowRequests(false);
    } else if (notif.type === 'job_status' || notif.type === 'quote') {
      setShowRequests(true);
      setShowChatList(false);
    }
  };

  return (
    <div className="w-[calc(100vw-2rem)] sm:w-80 bg-white border border-slate-200 rounded-2xl shadow-xl overflow-hidden">
      <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-white">
        <h3 className="font-bold text-slate-900">Notifications</h3>
        <button onClick={onClose} className="p-1 hover:bg-slate-100 rounded-full transition-colors">
          <X size={16} />
        </button>
      </div>
      <div className="max-h-96 overflow-y-auto">
        {notifications.length === 0 ? (
          <div className="p-8 text-center">
            <Bell size={32} className="mx-auto text-slate-200 mb-2" />
            <p className="text-slate-400 text-sm">No notifications yet.</p>
          </div>
        ) : (
          notifications.map((n) => (
            <div 
              key={n.id} 
              className={`p-4 border-b border-slate-50 hover:bg-slate-50 transition-colors cursor-pointer ${!n.read ? 'bg-blue-50/50' : ''}`}
              onClick={() => handleNotificationClick(n)}
            >
              <div className="flex gap-3">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                  n.type === 'message' ? 'bg-blue-100 text-blue-600' :
                  n.type === 'job_status' ? 'bg-green-100 text-green-600' :
                  'bg-purple-100 text-purple-600'
                }`}>
                  {n.type === 'message' ? <MessageCircle size={14} /> :
                   n.type === 'job_status' ? <CheckCircle2 size={14} /> :
                   <Briefcase size={14} />}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-slate-900">{n.title}</p>
                  <p className="text-xs text-slate-600 line-clamp-2">{n.message}</p>
                  <p className="text-[10px] text-slate-400 mt-1">
                    {n.createdAt?.toDate ? n.createdAt.toDate().toLocaleString() : 'Just now'}
                  </p>
                </div>
                {!n.read && <div className="w-2 h-2 bg-blue-600 rounded-full mt-1.5 flex-shrink-0" />}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export const ChatWindow = ({ 
  chat, 
  currentUser, 
  onClose,
  createNotification
}: { 
  chat: Chat, 
  currentUser: AppUser, 
  onClose: () => void,
  createNotification: (userId: string, title: string, message: string, type: 'message' | 'job_status' | 'quote', relatedId?: string) => Promise<void>
}) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const scrollRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    const q = query(
      collection(db, 'chats', chat.id, 'messages'),
      orderBy('createdAt', 'asc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const msgs = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Message[];
      setMessages(msgs);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, `chats/${chat.id}/messages`);
    });

    return () => unsubscribe();
  }, [chat.id]);

  React.useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim()) return;

    const text = newMessage;
    setNewMessage('');

    try {
      const msgData = {
        chatId: chat.id,
        senderId: currentUser.uid,
        text,
        createdAt: serverTimestamp()
      };
      await addDoc(collection(db, 'chats', chat.id, 'messages'), msgData);
      await updateDoc(doc(db, 'chats', chat.id), {
        lastMessage: text,
        lastMessageAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });

      const otherId = chat.participants.find(p => p !== currentUser.uid);
      if (otherId) {
        await createNotification(
          otherId,
          `New message from ${currentUser.name}`,
          text.length > 50 ? text.substring(0, 47) + '...' : text,
          'message',
          chat.id
        );
      }
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, `chats/${chat.id}/messages`);
    }
  };

  return (
    <div className="flex flex-col h-full bg-white">
      <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-white sticky top-0 z-10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-blue-50 rounded-full flex items-center justify-center text-blue-600 font-bold">
            {chat.otherParticipantName?.charAt(0) || '?'}
          </div>
          <div>
            <h4 className="font-bold text-slate-900">{chat.otherParticipantName}</h4>
            <p className="text-[10px] text-green-500 font-bold uppercase tracking-wider">Active Chat</p>
          </div>
        </div>
        <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full transition-colors">
          <X size={20} />
        </button>
      </div>

      <div 
        ref={scrollRef}
        className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50/50"
      >
        {messages.map((msg) => (
          <div 
            key={msg.id}
            className={`flex ${msg.senderId === currentUser.uid ? 'justify-end' : 'justify-start'}`}
          >
            <div className={`max-w-[80%] p-3 rounded-2xl text-sm ${
              msg.senderId === currentUser.uid 
              ? 'bg-blue-600 text-white rounded-tr-none' 
              : 'bg-white text-slate-700 border border-slate-100 rounded-tl-none shadow-sm'
            }`}>
              {msg.text}
            </div>
          </div>
        ))}
      </div>

      <form onSubmit={handleSendMessage} className="p-4 border-t border-slate-100 bg-white">
        <div className="flex gap-2">
          <input 
            type="text"
            placeholder="Type a message..."
            className="flex-1 bg-slate-50 border-none rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-blue-500/20 outline-none"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
          />
          <button 
            type="submit"
            className="bg-blue-600 text-white px-4 py-3 rounded-xl hover:bg-blue-700 transition-all shadow-lg shadow-blue-600/20 flex items-center gap-2"
          >
            <span className="hidden sm:inline font-bold">Send</span>
            <Send size={20} />
          </button>
        </div>
      </form>
    </div>
  );
};

export const SafetyTips = ({ lang }: { lang: string }) => {
  const tips = [
    {
      title: lang === 'Pidgin' ? 'Verify Oga' : 'Verify Identity',
      desc: lang === 'Pidgin' ? 'Check if dem get verified badge before you call dem.' : 'Always check for the verified badge on a professional\'s profile.'
    },
    {
      title: lang === 'Pidgin' ? 'No pay first' : 'Use Escrow',
      desc: lang === 'Pidgin' ? 'No pay full money until work finish. Use our escrow system.' : 'Never pay the full amount upfront. Use our secure escrow system.'
    },
    {
      title: lang === 'Pidgin' ? 'Meet for public' : 'Public Meetings',
      desc: lang === 'Pidgin' ? 'If dem need come your house, make sure person dey around.' : 'If meeting for the first time, try to meet in a public place or ensure someone is with you.'
    },
    {
      title: lang === 'Pidgin' ? 'Check work' : 'Inspect Work',
      desc: lang === 'Pidgin' ? 'Check the work well well before you release money.' : 'Thoroughly inspect the completed work before releasing funds from escrow.'
    }
  ];

  return (
    <div className="bg-amber-50 border border-amber-100 rounded-3xl p-6 mb-8">
      <div className="flex items-center gap-3 mb-4">
        <div className="p-2 bg-amber-100 text-amber-600 rounded-xl">
          <ShieldCheck size={24} />
        </div>
        <h3 className="text-lg font-bold text-amber-900">{t('Safety Tips', lang)}</h3>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {tips.map((tip, idx) => (
          <div key={idx} className="flex gap-3">
            <div className="mt-1">
              <div className="w-5 h-5 rounded-full bg-amber-200 text-amber-700 flex items-center justify-center text-[10px] font-bold">
                {idx + 1}
              </div>
            </div>
            <div>
              <div className="font-bold text-amber-900 text-sm">{tip.title}</div>
              <div className="text-amber-700 text-xs leading-relaxed">{tip.desc}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export const VoiceWelcome = ({ lang }: { lang: string }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [hasInteracted, setHasInteracted] = useState(false);
  const audioContextRef = useRef<AudioContext | null>(null);
  const audioBufferRef = useRef<AudioBuffer | null>(null);
  const sourceNodeRef = useRef<AudioBufferSourceNode | null>(null);

  // Initialize context on first interaction
  useEffect(() => {
    const handleInteraction = () => {
      if (!hasInteracted) {
        setHasInteracted(true);
        if (!audioContextRef.current) {
          audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({
            sampleRate: 24000
          });
        }
        if (audioContextRef.current.state === 'suspended') {
          audioContextRef.current.resume();
        }
      }
    };
    window.addEventListener('click', handleInteraction, { once: true });
    window.addEventListener('touchstart', handleInteraction, { once: true });
    return () => {
      window.removeEventListener('click', handleInteraction);
      window.removeEventListener('touchstart', handleInteraction);
    };
  }, [hasInteracted]);

  const fetchAudio = async (retryCount = 0) => {
    try {
      const url = `${import.meta.env.VITE_API_URL || '/api'}/ai/speak-welcome`;
      console.log(`[DEBUG] fetchAudio starting (attempt ${retryCount + 1}). URL: ${url}, lang: ${lang}`);
      const base64Audio = await geminiService.speakWelcome(lang);
      if (!base64Audio) {
        console.warn("[DEBUG] No audio data returned from AI service");
        setIsLoading(false);
        return;
      }
      console.log(`[DEBUG] fetchAudio success. Audio data length: ${base64Audio.length}`);

      if (!audioContextRef.current) {
        audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({
          sampleRate: 24000
        });
      }
      const ctx = audioContextRef.current;

      // Decode base64 to ArrayBuffer
      const binaryString = atob(base64Audio);
      const len = binaryString.length;
      const bytes = new Uint8Array(len);
      for (let i = 0; i < len; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }

      // Convert Int16 PCM to Float32
      const pcmLen = Math.floor(len / 2);
      const int16Data = new Int16Array(bytes.buffer, 0, pcmLen);
      const float32Data = new Float32Array(pcmLen);
      
      for (let i = 0; i < pcmLen; i++) {
        float32Data[i] = int16Data[i] / 32768.0;
      }

      // Create AudioBuffer
      const audioBuffer = ctx.createBuffer(1, pcmLen, 24000);
      audioBuffer.getChannelData(0).set(float32Data);
      audioBufferRef.current = audioBuffer;
      setIsLoading(false);
      
      // Auto-play if we have interaction
      if (hasInteracted && audioBufferRef.current) {
        playBuffer(audioBufferRef.current);
      }
    } catch (e) {
      console.error("Fetch audio error:", e);
      if (retryCount < 2) {
        console.log(`[DEBUG] Retrying fetchAudio in 2s... (${retryCount + 1}/2)`);
        setTimeout(() => fetchAudio(retryCount + 1), 2000);
      } else {
        setIsLoading(false);
      }
    }
  };

  const playBuffer = async (buffer: AudioBuffer) => {
    const ctx = audioContextRef.current;
    if (!ctx) return;
    
    // Resume context safely
    try {
      if (ctx.state === 'suspended') {
        await ctx.resume();
      }
    } catch (err) {
      console.warn("Could not resume AudioContext:", err);
    }

    if (sourceNodeRef.current) {
      try { sourceNodeRef.current.stop(); } catch(e) {}
    }

    const source = ctx.createBufferSource();
    source.buffer = buffer;
    source.connect(ctx.destination);
    source.onended = () => setIsPlaying(false);
    sourceNodeRef.current = source;
    setIsPlaying(true);
    source.start();
  };

  const handlePlay = async () => {
    if (isPlaying) {
      if (sourceNodeRef.current) {
        try { sourceNodeRef.current.stop(); } catch (e) {}
      }
      setIsPlaying(false);
      return;
    }

    if (!audioBufferRef.current) {
      setIsLoading(true);
      await fetchAudio();
    } else {
      playBuffer(audioBufferRef.current);
    }
  };

  useEffect(() => {
    // Reset buffer on language change and fetch in background
    audioBufferRef.current = null;
    setIsLoading(true);
    fetchAudio();
    
    return () => {
      try {
        if (sourceNodeRef.current) {
          sourceNodeRef.current.stop();
          sourceNodeRef.current = null;
        }
      } catch (err) { }
    };
  }, [lang]);

  return (
    <div className="flex items-center">
      {isPlaying ? (
        <button 
          onClick={handlePlay}
          className="flex items-center gap-1.5 px-2.5 py-1.5 bg-red-50 text-red-600 rounded-full border border-red-100 hover:bg-red-100 transition-all active:scale-95 group"
        >
          <div className="flex items-end gap-0.5 h-3">
            {[1, 2, 3, 4].map(i => (
              <motion.div 
                key={i} 
                animate={{ height: [4, 12, 4] }}
                transition={{ repeat: Infinity, duration: 0.6, delay: i * 0.1 }}
                className="w-1 bg-red-500 rounded-full" 
              />
            ))}
          </div>
          <span className="text-[9px] font-black uppercase tracking-widest">Stop</span>
        </button>
      ) : (
        <motion.button 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          whileHover={{ scale: 1.05, y: -1 }}
          whileTap={{ scale: 0.95 }}
          onClick={handlePlay}
          className={`relative flex items-center gap-2 px-3 py-1.5 rounded-full transition-all group overflow-hidden ${
            isLoading 
              ? 'bg-slate-50 text-slate-400 border border-slate-100 cursor-wait' 
              : 'bg-blue-600 text-white hover:shadow-lg hover:shadow-blue-500/30'
          }`}
          id="listen-welcome-btn"
        >
          {isLoading ? (
            <>
              <Loader2 size={14} className="animate-spin text-blue-500" />
              <span className="text-[9px] font-black uppercase tracking-widest hidden sm:inline">Preparing...</span>
            </>
          ) : (
            <>
              <Volume2 size={16} className="shrink-0" />
              <span className="text-[9px] sm:text-[10px] font-black uppercase tracking-widest whitespace-nowrap">
                {t('Hi Padi', lang)}
              </span>
              <div className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full border border-white" />
            </>
          )}
        </motion.button>
      )}
    </div>
  );
};

const PaystackBankTransferGuide = ({ lang }: { lang: string }) => {
  return (
    <div className="bg-blue-50 border border-blue-100 rounded-2xl p-4 mt-4 text-left">
      <div className="flex items-center gap-2 mb-2">
        <CreditCard size={16} className="text-blue-600" />
        <h4 className="font-bold text-blue-900 text-sm">Paying via Bank Transfer?</h4>
      </div>
      <p className="text-xs text-blue-700 leading-relaxed">
        {lang === 'Pidgin' 
          ? 'If you wan pay with bank transfer, just select "Transfer" inside Paystack window. E easy well well!'
          : 'When the Paystack window opens, select "Transfer" to get a temporary bank account number for this payment.'}
      </p>
    </div>
  );
};

// --- AI Price Guide Component ---
export const AIEstimationSection = ({ onSearch, market }: { onSearch: (query: string) => void, market: { name: string, currency: string } }) => {
  const [task, setTask] = useState('');
  const [location, setLocation] = useState('Lagos');
  const [estimation, setEstimation] = useState<PriceEstimation | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleEstimate = async () => {
    if (!task.trim()) return;
    setLoading(true);
    setError(null);
    try {
      const result = await getPriceEstimation(task, location, market.name, market.currency);
      setEstimation(result);
    } catch (err) {
      setError('Could not get estimation. Please try again.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleFindHandymen = () => {
    if (task) {
      onSearch(task);
      // Scroll to list
      const listElement = document.querySelector('#handyman-list');
      if (listElement) {
        listElement.scrollIntoView({ behavior: 'smooth' });
      }
    }
  };

  const currencySymbol = market.currency === 'NGN' ? '₦' : market.currency === 'GHS' ? 'GH₵' : market.currency === 'KES' ? 'KSh' : market.currency === 'ZAR' ? 'R' : market.currency;

  return (
    <section className="py-20 bg-slate-900 overflow-hidden relative">
      <div className="absolute top-0 right-0 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
      <div className="absolute bottom-0 left-0 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2" />

      <div className="max-w-4xl mx-auto px-4 relative z-10">
        <div className="text-center mb-12">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 font-medium mb-6"
          >
            <Sparkles size={16} />
            <span>AI Price Estimator</span>
          </motion.div>
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-6 tracking-tight">Know the Fair Price Before You Book</h2>
          <p className="text-slate-400 text-lg max-w-2xl mx-auto">
            Our AI analyzes current market trends in {market.name} to give you a fair price range for any repair task.
          </p>
        </div>

        <div className="bg-white/5 border border-white/10 p-2 rounded-3xl backdrop-blur-sm shadow-2xl">
          <div className="bg-slate-800 rounded-2xl p-6 md:p-8">
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-slate-300 text-sm font-medium ml-1">What needs fixing?</label>
                  <div className="relative">
                    <PenTool className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
                    <input 
                      type="text" 
                      placeholder="e.g. Repair 3HP AC leak" 
                      value={task}
                      onChange={(e) => setTask(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-700 text-white pl-12 pr-4 py-4 rounded-xl focus:ring-2 focus:ring-blue-500 transition-all outline-none"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-slate-300 text-sm font-medium ml-1">Where are you?</label>
                  <div className="relative">
                    <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
                    <select 
                      value={location}
                      onChange={(e) => setLocation(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-700 text-white pl-12 pr-4 py-4 rounded-xl focus:ring-2 focus:ring-blue-500 transition-all outline-none appearance-none"
                    >
                      <option value="Lagos">Lagos</option>
                      <option value="Abuja">Abuja</option>
                      <option value="Port Harcourt">Port Harcourt</option>
                      <option value="Ibadan">Ibadan</option>
                      <option value="Kano">Kano</option>
                      <option value="Enugu">Enugu</option>
                    </select>
                  </div>
                </div>
              </div>

              <button 
                onClick={handleEstimate}
                disabled={loading || !task.trim()}
                className="w-full bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-bold py-4 rounded-xl transition-all flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <RotateCcw className="animate-spin" size={20} />
                    <span>Analyzing Market Data...</span>
                  </>
                ) : (
                  <>
                    <Calculator size={20} />
                    <span>Get Instant Estimate</span>
                  </>
                )}
              </button>

              {error && (
                <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-4 rounded-xl flex items-center gap-3">
                  <AlertCircle size={20} />
                  <p>{error}</p>
                </div>
              )}

              <AnimatePresence>
                {estimation && !loading && (
                  <motion.div 
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="pt-8 border-t border-slate-700"
                  >
                    <div className="flex flex-col md:flex-row gap-8">
                      <div className="flex-1 space-y-6">
                        <div>
                          <p className="text-slate-500 text-sm font-medium mb-1 uppercase tracking-wider">Estimated Fair Range</p>
                          <div className="flex items-baseline gap-2">
                            <span className="text-5xl font-black text-white">
                              {currencySymbol}{estimation.minPrice.toLocaleString()} - {currencySymbol}{estimation.maxPrice.toLocaleString()}
                            </span>
                          </div>
                        </div>

                        <div className="bg-blue-500/5 border border-blue-500/10 rounded-2xl p-5">
                          <div className="flex items-start gap-3">
                            <Sparkles className="text-blue-400 shrink-0 mt-1" size={20} />
                            <p className="text-slate-300 leading-relaxed italic text-lg">"{estimation.reasoning}"</p>
                          </div>
                        </div>

                        <button 
                          onClick={handleFindHandymen}
                          className="w-full bg-white text-slate-900 font-bold py-4 rounded-xl hover:bg-slate-100 transition-all flex items-center justify-center gap-2"
                        >
                          <Search size={20} />
                          Find Professionals Now
                        </button>
                      </div>

                      <div className="md:w-1/3 space-y-6">
                        <div>
                          <p className="text-slate-500 text-sm font-medium mb-3 uppercase tracking-wider">Price Factors</p>
                          <ul className="space-y-2">
                            {estimation.factors.map((factor, i) => (
                              <li key={i} className="flex items-center gap-2 text-slate-300 text-sm">
                                <CheckCircle2 className="text-emerald-500 shrink-0" size={14} />
                                {factor}
                              </li>
                            ))}
                          </ul>
                        </div>

                        <div className="p-4 rounded-xl bg-orange-500/5 border border-orange-500/10">
                          <div className="flex items-center gap-2 text-orange-400 mb-2">
                            <AlertTriangle size={16} />
                            <span className="text-xs font-bold uppercase tracking-wider">Expert's Note</span>
                          </div>
                          <p className="text-slate-400 text-xs leading-relaxed">
                            {estimation.marketNotes}
                          </p>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

