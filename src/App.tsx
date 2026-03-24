import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Sparkles, 
  Globe, 
  Zap, 
  Shield, 
  ArrowRight, 
  Layout, 
  Layers, 
  MousePointer2,
  ChevronRight,
  Plus,
  Monitor,
  Smartphone,
  Tablet,
  Download,
  Share2,
  Settings,
  BarChart3,
  LogOut,
  User,
  Menu,
  X,
  CheckCircle2,
  Eye,
  ExternalLink,
  Github,
  Loader2
} from 'lucide-react';
import { generateWebsite, GeneratedSite } from './services/aiService';
import { 
  auth, 
  db, 
  googleProvider, 
  signInWithPopup, 
  signOut, 
  collection, 
  addDoc, 
  query, 
  where, 
  onSnapshot, 
  serverTimestamp,
  doc,
  updateDoc,
  getDoc
} from './firebase';
import { onAuthStateChanged, User as FirebaseUser } from 'firebase/auth';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

// Utility for tailwind classes
function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export default function App() {
  const [view, setView] = useState<'landing' | 'generator' | 'dashboard' | 'preview' | 'hosted'>('landing');
  const [prompt, setPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationProgress, setGenerationProgress] = useState(0);
  const [generationStatus, setGenerationStatus] = useState('');
  const [generatedSite, setGeneratedSite] = useState<any | null>(null);
  const [userSites, setUserSites] = useState<any[]>([]);
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [isAuthReady, setIsAuthReady] = useState(false);
  const [showPlanModal, setShowPlanModal] = useState(false);

  // Hosting Logic: Check URL for siteId
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const siteId = params.get('site');
    if (siteId) {
      const fetchSite = async () => {
        const docRef = doc(db, 'sites', siteId);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          setGeneratedSite(docSnap.data());
          setView('hosted');
        }
      };
      fetchSite();
    }
  }, []);

  // Auth Listener
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (u) => {
      setUser(u);
      setIsAuthReady(true);
    });
    return () => unsubscribe();
  }, []);

  // Firestore Listener
  useEffect(() => {
    if (!user) {
      setUserSites([]);
      return;
    }

    const q = query(collection(db, 'sites'), where('userId', '==', user.uid));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const sites = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setUserSites(sites);
    }, (error) => {
      console.error("Firestore Error:", error);
    });

    return () => unsubscribe();
  }, [user]);

  const handleLogin = async () => {
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (error) {
      console.error("Login failed:", error);
    }
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
      setView('landing');
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };

  const handleGenerate = async () => {
    if (!prompt) return;
    if (!user) {
      handleLogin();
      return;
    }

    setIsGenerating(true);
    setGenerationProgress(0);
    setGenerationStatus('Initializing AI Engine...');

    // Simulate progress using an asymptotic curve
    const startTime = Date.now();
    const progressInterval = setInterval(() => {
      const elapsed = (Date.now() - startTime) / 1000;
      
      setGenerationProgress(prev => {
        // Asymptotic approach: progress = 100 * (1 - e^(-k * t))
        // This ensures it never hits 100% until the AI actually finishes
        const targetProgress = 100 * (1 - Math.exp(-0.08 * elapsed));
        
        // Update status based on elapsed time
        if (elapsed < 5) setGenerationStatus('Analyzing your vision...');
        else if (elapsed < 15) setGenerationStatus('Designing professional layout...');
        else if (elapsed < 30) setGenerationStatus('Generating production-ready code...');
        else if (elapsed < 45) setGenerationStatus('Finalizing assets and theme...');
        else if (elapsed < 60) setGenerationStatus('Polishing the final design details...');
        else setGenerationStatus('Almost there! AI is finishing the final touches...');

        // Ensure progress only moves forward and stays below 99.9%
        const nextProgress = Math.max(prev, targetProgress);
        return nextProgress > 99.9 ? 99.9 : nextProgress;
      });
    }, 200);

    try {
      const site = await generateWebsite(prompt);
      clearInterval(progressInterval);
      setGenerationProgress(100);
      setGenerationStatus('Success! Launching preview...');
      
      setTimeout(() => {
        setGeneratedSite(site);
        setView('preview');
        setIsGenerating(false);
      }, 800);
    } catch (error) {
      clearInterval(progressInterval);
      console.error("Generation failed:", error);
      alert("Failed to generate website. Please try again. Error: " + (error instanceof Error ? error.message : String(error)));
      setIsGenerating(false);
    }
  };

  const handleSave = async () => {
    if (!generatedSite || !user) return;

    try {
      await addDoc(collection(db, 'sites'), {
        ...generatedSite,
        userId: user.uid,
        createdAt: serverTimestamp(),
        views: 0
      });
      setView('dashboard');
    } catch (error) {
      console.error("Save failed:", error);
      alert("Failed to save site.");
    }
  };

  if (!isAuthReady) {
    return (
      <div className="min-h-screen bg-[#050505] flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-white/10 border-t-orange-500 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#050505] text-white font-sans selection:bg-orange-500 selection:text-white">
      {/* Global Nav for Auth */}
      {view !== 'preview' && (
        <div className="fixed top-8 right-8 z-[60] flex items-center gap-4">
          {user ? (
            <div className="flex items-center gap-4 bg-white/5 p-2 pr-4 rounded-full border border-white/10">
              <img src={user.photoURL || ''} alt={user.displayName || ''} className="w-8 h-8 rounded-full border border-white/20" referrerPolicy="no-referrer" />
              <span className="text-xs font-bold uppercase tracking-widest hidden md:block">{user.displayName}</span>
              <button onClick={handleLogout} className="p-2 hover:bg-white/10 rounded-full transition-colors">
                <LogOut className="w-4 h-4 opacity-50" />
              </button>
            </div>
          ) : (
            <button 
              onClick={handleLogin}
              className="px-6 py-2 bg-white text-black text-xs font-bold uppercase tracking-widest rounded-full hover:bg-orange-500 hover:text-white transition-all"
            >
              Login
            </button>
          )}
        </div>
      )}

      <AnimatePresence mode="wait">
        {view === 'landing' && (
          <LandingPage key="landing" onStart={() => setView(user ? 'dashboard' : 'generator')} />
        )}
        {view === 'generator' && (
          <Generator 
            key="generator"
            prompt={prompt}
            setPrompt={setPrompt}
            onGenerate={handleGenerate}
            isGenerating={isGenerating}
            generationProgress={generationProgress}
            generationStatus={generationStatus}
            onBack={() => setView('landing')}
          />
        )}
        {view === 'preview' && generatedSite && (
          <Preview 
            key="preview"
            site={generatedSite}
            onBack={() => setView('generator')}
          />
        )}
        {view === 'dashboard' && (
          <Dashboard 
            key="dashboard"
            sites={userSites}
            onNew={() => setView('generator')}
            onViewSite={(site) => {
              setGeneratedSite(site);
              setView('preview');
            }}
            onUpgrade={() => setShowPlanModal(true)}
          />
        )}
        {view === 'hosted' && generatedSite && (
          <div className="fixed inset-0 bg-white">
            <iframe 
              srcDoc={`
                <!DOCTYPE html>
                <html>
                  <head>
                    <script src="https://unpkg.com/@tailwindcss/browser@4"></script>
                    <style>
                      body { font-family: '${generatedSite.theme.fontFamily}', sans-serif; }
                    </style>
                  </head>
                  <body>
                    ${generatedSite.html}
                  </body>
                </html>
              `}
              className="w-full h-full border-none"
              title="Hosted Site"
            />
          </div>
        )}
      </AnimatePresence>

      {/* Plan Modal */}
      <AnimatePresence>
        {showPlanModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowPlanModal(false)}
              className="absolute inset-0 bg-black/80 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="relative bg-[#0a0a0a] border border-white/10 rounded-[40px] p-12 max-w-4xl w-full"
            >
              <div className="text-center mb-12">
                <h2 className="text-4xl font-black uppercase tracking-tighter mb-4">Select Your Plan</h2>
                <p className="opacity-50">Scale your digital presence with professional tools.</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <PlanCard 
                  name="Free"
                  price="$0"
                  features={['1 Website', 'Standard AI', 'Subdomain Hosting']}
                  onSelect={() => setShowPlanModal(false)}
                />
                <PlanCard 
                  name="Pro"
                  price="$29"
                  featured
                  features={['Unlimited Sites', 'Advanced AI 3.1', 'Custom Domains', 'Analytics']}
                  onSelect={() => setShowPlanModal(false)}
                />
                <PlanCard 
                  name="Enterprise"
                  price="$99"
                  features={['White-label', 'API Access', 'Priority Support', 'Team Collab']}
                  onSelect={() => setShowPlanModal(false)}
                />
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

function PlanCard({ name, price, features, featured, onSelect }: any) {
  return (
    <div className={cn(
      "p-8 rounded-3xl border transition-all flex flex-col",
      featured ? "bg-white text-black border-white scale-105" : "bg-white/5 border-white/10"
    )}>
      <h3 className="text-xl font-bold uppercase tracking-tight mb-2">{name}</h3>
      <div className="text-4xl font-black mb-8">{price}<span className="text-sm font-normal opacity-50">/mo</span></div>
      <ul className="space-y-4 mb-12 flex-1">
        {features.map((f: string) => (
          <li key={f} className="flex items-center gap-2 text-xs uppercase tracking-widest font-medium">
            <CheckCircle2 className={cn("w-4 h-4", featured ? "text-black" : "text-orange-500")} />
            {f}
          </li>
        ))}
      </ul>
      <button 
        onClick={onSelect}
        className={cn(
          "w-full py-4 rounded-full font-bold uppercase tracking-widest text-xs transition-all",
          featured ? "bg-black text-white hover:bg-orange-500" : "bg-white/10 hover:bg-white hover:text-black"
        )}
      >
        Select Plan
      </button>
    </div>
  );
}

// --- Components ---

function LandingPage({ onStart }: { onStart: () => void }) {
  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="relative overflow-hidden"
    >
      {/* Navigation */}
      <nav className="fixed top-0 w-full z-50 px-6 py-8 flex justify-between items-center mix-blend-difference">
        <div className="flex items-center gap-2">
          <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center">
            <Globe className="text-black w-6 h-6" />
          </div>
          <span className="text-2xl font-bold tracking-tighter uppercase italic">WebCraft AI</span>
        </div>
        <div className="hidden md:flex items-center gap-12 text-sm font-medium uppercase tracking-widest opacity-70">
          <a href="#" className="hover:opacity-100 transition-opacity">Features</a>
          <a href="#" className="hover:opacity-100 transition-opacity">Pricing</a>
          <a href="#" className="hover:opacity-100 transition-opacity">Showcase</a>
        </div>
        <button 
          onClick={onStart}
          className="px-8 py-3 bg-white text-black text-sm font-bold uppercase tracking-widest hover:bg-orange-500 hover:text-white transition-all rounded-full"
        >
          Get Started
        </button>
      </nav>

      {/* Hero Section */}
      <section className="min-h-screen flex flex-col justify-center px-6 pt-32 pb-20">
        <div className="max-w-screen-2xl mx-auto w-full">
          <motion.div
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          >
            <span className="text-orange-500 font-mono text-sm uppercase tracking-[0.3em] mb-8 block">
              The Future of Web Development
            </span>
            <h1 className="text-[15vw] md:text-[10vw] leading-[0.85] font-black uppercase tracking-tighter mb-12">
              Build <br />
              <span className="text-orange-500 border-t-2 border-b-2 border-white/20 px-4 inline-block my-2">Beyond</span> <br />
              Limits
            </h1>
          </motion.div>

          <div className="grid md:grid-cols-2 gap-20 items-end">
            <motion.p 
              initial={{ x: -50, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ delay: 0.4 }}
              className="text-xl md:text-2xl opacity-60 max-w-xl leading-relaxed"
            >
              Stop building websites. Start crafting experiences. 
              Our AI engine generates production-ready, high-performance 
              digital ecosystems in seconds. No code. No limits. Just vision.
            </motion.p>
            
            <motion.div 
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.6 }}
              className="flex justify-end"
            >
              <button 
                onClick={onStart}
                className="group relative w-48 h-48 rounded-full border border-white/20 flex items-center justify-center overflow-hidden hover:border-orange-500 transition-colors"
              >
                <div className="absolute inset-0 bg-orange-500 translate-y-full group-hover:translate-y-0 transition-transform duration-500" />
                <span className="relative z-10 text-sm font-bold uppercase tracking-widest group-hover:text-white">
                  Create Now
                </span>
                <ArrowRight className="relative z-10 w-5 h-5 ml-2 group-hover:translate-x-2 transition-transform" />
              </button>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Stats / Features Grid */}
      <section className="py-40 border-t border-white/10">
        <div className="max-w-screen-2xl mx-auto px-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-1px bg-white/10 border border-white/10">
            <FeatureCard 
              icon={<Zap className="w-8 h-8" />}
              title="Instant Gen"
              desc="From prompt to live site in under 30 seconds."
            />
            <FeatureCard 
              icon={<Shield className="w-8 h-8" />}
              title="Auto-Hosting"
              desc="Every site gets a global CDN and SSL automatically."
            />
            <FeatureCard 
              icon={<Sparkles className="w-8 h-8" />}
              title="AI Design"
              desc="Dynamic layouts that adapt to your brand identity."
            />
          </div>
        </div>
      </section>
    </motion.div>
  );
}

function FeatureCard({ icon, title, desc }: { icon: React.ReactNode, title: string, desc: string }) {
  return (
    <div className="bg-[#050505] p-12 hover:bg-white/5 transition-colors group">
      <div className="text-orange-500 mb-8 group-hover:scale-110 transition-transform origin-left">{icon}</div>
      <h3 className="text-2xl font-bold uppercase tracking-tight mb-4">{title}</h3>
      <p className="opacity-50 leading-relaxed">{desc}</p>
    </div>
  );
}

function Generator({ prompt, setPrompt, onGenerate, isGenerating, generationProgress, generationStatus, onBack }: any) {
  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 1.05 }}
      className="min-h-screen flex items-center justify-center p-6"
    >
      <div className="max-w-3xl w-full">
        <button onClick={onBack} disabled={isGenerating} className="mb-12 opacity-50 hover:opacity-100 flex items-center gap-2 uppercase text-xs tracking-widest disabled:opacity-20">
          <ChevronRight className="rotate-180 w-4 h-4" /> Back to Home
        </button>
        
        <div className="space-y-8">
          <AnimatePresence mode="wait">
            {isGenerating ? (
              <motion.div 
                key="loading"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="py-20 flex flex-col items-center text-center"
              >
                <div className="relative w-48 h-48 mb-12">
                  <svg className="w-full h-full -rotate-90">
                    <circle
                      cx="96"
                      cy="96"
                      r="88"
                      stroke="currentColor"
                      strokeWidth="4"
                      fill="transparent"
                      className="text-white/5"
                    />
                    <motion.circle
                      cx="96"
                      cy="96"
                      r="88"
                      stroke="currentColor"
                      strokeWidth="4"
                      fill="transparent"
                      strokeDasharray={553}
                      initial={{ strokeDashoffset: 553 }}
                      animate={{ strokeDashoffset: 553 - (553 * generationProgress) / 100 }}
                      className="text-orange-500"
                    />
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-4xl font-black">{Math.round(generationProgress)}%</span>
                    <span className="text-[10px] uppercase tracking-widest opacity-40">Crafting</span>
                  </div>
                </div>
                <h2 className="text-3xl font-bold uppercase tracking-tight mb-4 animate-pulse">{generationStatus}</h2>
                <p className="max-w-md opacity-40 text-sm">Our AI is architecting your digital presence. This usually takes 15-30 seconds. Please don't refresh the page.</p>
              </motion.div>
            ) : (
              <motion.div 
                key="input"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="space-y-8"
              >
                <div>
                  <h2 className="text-5xl font-black uppercase tracking-tighter mb-4">What are we building?</h2>
                  <p className="text-lg opacity-50">Describe your vision in detail. The more specific, the better.</p>
                </div>

                <div className="relative">
                  <textarea 
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    placeholder="e.g. A minimalist portfolio for a luxury watch brand with dark theme and smooth animations..."
                    className="w-full h-64 bg-white/5 border border-white/10 rounded-3xl p-8 text-xl focus:outline-none focus:border-orange-500 transition-colors resize-none placeholder:opacity-20"
                  />
                  <div className="absolute bottom-6 right-6 flex items-center gap-4">
                    <span className="text-[10px] uppercase tracking-widest opacity-30">Gemini 3.1 Pro Engine</span>
                    <button 
                      onClick={onGenerate}
                      disabled={isGenerating || !prompt}
                      className={cn(
                        "px-10 py-4 bg-white text-black rounded-full font-bold uppercase tracking-widest transition-all flex items-center gap-3",
                        (isGenerating || !prompt) ? "opacity-20 cursor-not-allowed" : "hover:bg-orange-500 hover:text-white hover:scale-105 active:scale-95"
                      )}
                    >
                      Craft Site
                      <Sparkles className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <div className="flex flex-wrap gap-3">
                  {['SaaS Platform', 'Portfolio', 'E-commerce', 'Landing Page', 'Blog'].map(tag => (
                    <button 
                      key={tag}
                      onClick={() => setPrompt(`A modern ${tag} for...`)}
                      className="px-4 py-2 rounded-full border border-white/10 text-xs uppercase tracking-widest hover:bg-white/10 transition-colors"
                    >
                      {tag}
                    </button>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </motion.div>
  );
}

function PublishModal({ 
  site, 
  onClose, 
  onPublish 
}: { 
  site: GeneratedSite, 
  onClose: () => void, 
  onPublish: (slug: string) => Promise<void> 
}) {
  const [slug, setSlug] = useState(site.title.toLowerCase().replace(/[^a-z0-9]/g, '-'));
  const [isPublishing, setIsPublishing] = useState(false);
  const [publishedUrl, setPublishedUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handlePublish = async () => {
    setIsPublishing(true);
    setError(null);
    try {
      await onPublish(slug);
      setPublishedUrl(`${window.location.origin}/v/${slug}`);
    } catch (err: any) {
      setError(err.message || 'Publishing failed');
    } finally {
      setIsPublishing(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
      <motion.div 
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-[#0a0a0a] border border-white/10 rounded-3xl p-8 max-w-md w-full shadow-2xl"
      >
        <div className="flex justify-between items-center mb-8">
          <h3 className="text-xl font-bold uppercase tracking-widest">Publish to Web</h3>
          <button onClick={onClose} className="p-2 hover:bg-white/5 rounded-full transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {!publishedUrl ? (
          <div className="space-y-6">
            <div className="p-6 bg-white/5 rounded-2xl border border-white/5">
              <div className="flex items-center gap-4 mb-4">
                <div className="w-12 h-12 bg-orange-500/20 rounded-xl flex items-center justify-center">
                  <Globe className="w-6 h-6 text-orange-500" />
                </div>
                <div>
                  <h4 className="font-bold">Instant Hosting</h4>
                  <p className="text-xs opacity-40">Zero setup required</p>
                </div>
              </div>
              
              <div className="space-y-4">
                <div>
                  <label className="text-[10px] uppercase tracking-widest opacity-40 mb-2 block">Website URL Slug</label>
                  <div className="flex items-center gap-2 bg-black p-3 rounded-xl border border-white/10">
                    <span className="opacity-20 text-sm">/v/</span>
                    <input 
                      type="text" 
                      value={slug}
                      onChange={(e) => setSlug(e.target.value)}
                      className="bg-transparent border-none outline-none text-sm w-full"
                      placeholder="my-awesome-site"
                    />
                  </div>
                </div>
                
                <p className="text-[10px] text-white/40 leading-relaxed uppercase tracking-wider">
                  Your site will be live at <strong>{window.location.hostname}/v/{slug}</strong>
                </p>
              </div>
            </div>

            {error && (
              <p className="text-red-500 text-xs text-center font-bold uppercase tracking-widest">{error}</p>
            )}

            <button 
              onClick={handlePublish}
              disabled={isPublishing}
              className="w-full py-4 bg-orange-500 text-white rounded-2xl font-bold uppercase tracking-widest hover:bg-orange-600 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {isPublishing ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" /> Publishing...
                </>
              ) : (
                'Publish Now'
              )}
            </button>
          </div>
        ) : (
          <div className="text-center space-y-6 py-4">
            <div className="w-20 h-20 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle2 className="w-10 h-10 text-green-500" />
            </div>
            <h4 className="text-2xl font-bold uppercase tracking-tight">Site is Live!</h4>
            <p className="text-sm opacity-40 max-w-xs mx-auto">Your website has been successfully published to our secure hosting.</p>
            
            <div className="space-y-3 pt-4">
              <a 
                href={publishedUrl} 
                target="_blank" 
                rel="noopener noreferrer"
                className="block w-full py-4 bg-white text-black rounded-2xl font-bold uppercase tracking-widest hover:bg-orange-500 hover:text-white transition-all"
              >
                View Live Site
              </a>
              <button 
                onClick={onClose}
                className="block w-full py-4 bg-white/5 text-white rounded-2xl font-bold uppercase tracking-widest hover:bg-white/10 transition-all"
              >
                Back to Editor
              </button>
            </div>
          </div>
        )}
      </motion.div>
    </div>
  );
}

function Preview({ site, onBack }: { site: GeneratedSite, onBack: () => void }) {
  const [device, setDevice] = useState<'desktop' | 'tablet' | 'mobile'>('desktop');
  const [showPublishModal, setShowPublishModal] = useState(false);

  const handlePublish = async (slug: string) => {
    if (!auth.currentUser) throw new Error('You must be logged in to publish');

    const siteData = {
      userId: auth.currentUser.uid,
      title: site.title,
      html: site.html,
      theme: site.theme,
      slug: slug,
      isPublished: true,
      createdAt: new Date().toISOString(),
      views: 0
    };

    const sitesRef = collection(db, 'sites');
    await addDoc(sitesRef, siteData);
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="fixed inset-0 bg-[#050505] flex flex-col"
    >
      {/* Toolbar */}
      <div className="h-20 border-b border-white/10 px-6 flex items-center justify-between bg-[#0a0a0a]">
        <div className="flex items-center gap-6">
          <button onClick={onBack} className="p-2 hover:bg-white/5 rounded-lg transition-colors">
            <X className="w-6 h-6" />
          </button>
          <div className="h-8 w-px bg-white/10" />
          <h3 className="font-bold uppercase tracking-widest text-sm">{site.title}</h3>
        </div>

        <div className="flex items-center gap-2 bg-white/5 p-1 rounded-xl">
          <button 
            onClick={() => setDevice('desktop')}
            className={cn("p-2 rounded-lg transition-all", device === 'desktop' ? "bg-white text-black" : "opacity-50 hover:opacity-100")}
          >
            <Monitor className="w-4 h-4" />
          </button>
          <button 
            onClick={() => setDevice('tablet')}
            className={cn("p-2 rounded-lg transition-all", device === 'tablet' ? "bg-white text-black" : "opacity-50 hover:opacity-100")}
          >
            <Tablet className="w-4 h-4" />
          </button>
          <button 
            onClick={() => setDevice('mobile')}
            className={cn("p-2 rounded-lg transition-all", device === 'mobile' ? "bg-white text-black" : "opacity-50 hover:opacity-100")}
          >
            <Smartphone className="w-4 h-4" />
          </button>
        </div>

        <div className="flex items-center gap-2 md:gap-4">
          <button 
            onClick={() => {
              const win = window.open('', '_blank');
              if (win) {
                win.document.write(`
                  <!DOCTYPE html>
                  <html>
                    <head>
                      <title>${site.title}</title>
                      <script src="https://unpkg.com/@tailwindcss/browser@4"></script>
                      <style>
                        body { font-family: '${site.theme.fontFamily}', sans-serif; }
                        * { transition: all 0.3s ease; }
                      </style>
                    </head>
                    <body class="bg-white">
                      ${site.html}
                    </body>
                  </html>
                `);
                win.document.close();
              }
            }}
            className="hidden sm:flex items-center gap-2 px-4 md:px-6 py-2.5 bg-white/5 text-white rounded-full text-[10px] md:text-xs font-bold uppercase tracking-widest hover:bg-white/10 transition-all active:scale-95 border border-white/10"
          >
            <Eye className="w-4 h-4" /> <span className="hidden md:inline">Full Preview</span>
          </button>
          <button 
            onClick={() => setShowPublishModal(true)}
            className="flex items-center gap-2 px-4 md:px-6 py-2.5 bg-orange-500 text-white rounded-full text-[10px] md:text-xs font-bold uppercase tracking-widest hover:bg-orange-600 shadow-lg shadow-orange-500/20 transition-all active:scale-95"
          >
            <Zap className="w-4 h-4" /> Publish <span className="hidden md:inline">Site</span>
          </button>
        </div>
      </div>

      {showPublishModal && (
        <PublishModal 
          site={site} 
          onClose={() => setShowPublishModal(false)}
          onPublish={handlePublish}
        />
      )}

      {/* Preview Area */}
      <div className="flex-1 bg-[#111] p-12 flex justify-center overflow-hidden">
        <motion.div 
          layout
          className={cn(
            "bg-white rounded-2xl shadow-2xl overflow-hidden transition-all duration-500",
            device === 'desktop' && "w-full max-w-6xl",
            device === 'tablet' && "w-[768px]",
            device === 'mobile' && "w-[375px]"
          )}
        >
          <iframe 
            srcDoc={`
              <!DOCTYPE html>
              <html>
                <head>
                  <script src="https://unpkg.com/@tailwindcss/browser@4"></script>
                  <style>
                    body { font-family: '${site.theme.fontFamily}', sans-serif; margin: 0; padding: 0; }
                    :root { --primary: ${site.theme.primaryColor}; --secondary: ${site.theme.secondaryColor}; }
                    * { pointer-events: auto !important; }
                  </style>
                </head>
                <body class="bg-white">
                  ${site.html}
                </body>
              </html>
            `}
            className="w-full h-full border-none pointer-events-auto"
            title="Preview"
          />
        </motion.div>
      </div>
    </motion.div>
  );
}

function Dashboard({ sites, onNew, onViewSite, onUpgrade }: { sites: any[], onNew: () => void, onViewSite: (s: any) => void, onUpgrade: () => void }) {
  const copyToClipboard = (id: string) => {
    const url = `${window.location.origin}${window.location.pathname}?site=${id}`;
    navigator.clipboard.writeText(url);
    alert("Site link copied to clipboard!");
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="min-h-screen p-12"
    >
      <div className="max-w-screen-2xl mx-auto">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-8 mb-20">
          <div>
            <h1 className="text-6xl font-black uppercase tracking-tighter mb-4">Dashboard</h1>
            <p className="text-xl opacity-50">Manage your digital empire.</p>
          </div>
          <div className="flex items-center gap-4">
            <button 
              onClick={onUpgrade}
              className="px-8 py-4 border border-white/20 rounded-full font-bold uppercase tracking-widest text-xs hover:bg-white hover:text-black transition-all"
            >
              Upgrade Plan
            </button>
            <button 
              onClick={onNew}
              className="px-8 py-4 bg-white text-black rounded-full font-bold uppercase tracking-widest hover:bg-orange-500 hover:text-white transition-all flex items-center gap-3"
            >
              <Plus className="w-5 h-5" /> New Project
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {sites.map((site, i) => (
            <motion.div 
              key={site.id}
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: i * 0.1 }}
              className="group bg-white/5 border border-white/10 rounded-3xl overflow-hidden hover:border-orange-500/50 transition-all"
            >
              <div className="aspect-video bg-white/10 relative overflow-hidden">
                <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/60 z-10 gap-2">
                  <button 
                    onClick={() => onViewSite(site)}
                    className="px-4 py-2 bg-white text-black rounded-full font-bold uppercase text-[10px] tracking-widest hover:bg-orange-500 hover:text-white transition-colors"
                  >
                    Edit
                  </button>
                  <button 
                    onClick={() => onViewSite(site)}
                    className="px-4 py-2 bg-orange-500 text-white rounded-full font-bold uppercase text-[10px] tracking-widest hover:bg-orange-600 transition-colors"
                  >
                    Publish
                  </button>
                  <button 
                    onClick={() => window.open(`${window.location.origin}${window.location.pathname}?site=${site.id}`, '_blank')}
                    className="px-4 py-2 bg-white/10 text-white rounded-full font-bold uppercase text-[10px] tracking-widest hover:bg-white hover:text-black transition-colors"
                  >
                    <ExternalLink className="w-3 h-3 inline mr-1" /> View
                  </button>
                </div>
                <div className="p-4 transform scale-50 origin-top-left opacity-30 group-hover:opacity-100 transition-all pointer-events-none">
                   <div dangerouslySetInnerHTML={{ __html: site.html.slice(0, 1000) }} />
                </div>
              </div>
              <div className="p-8">
                <div className="flex justify-between items-start mb-4">
                  <h3 className="text-xl font-bold uppercase tracking-tight">{site.title}</h3>
                  <span className="px-3 py-1 bg-emerald-500/10 text-emerald-500 text-[10px] font-bold uppercase tracking-widest rounded-full">Live</span>
                </div>
                <p className="text-sm opacity-40 mb-8 line-clamp-2">{site.description}</p>
                <div className="flex items-center justify-between pt-6 border-t border-white/5">
                  <div className="flex items-center gap-2 text-[10px] uppercase tracking-widest opacity-30">
                    <BarChart3 className="w-3 h-3" /> {site.views || 0} Views
                  </div>
                  <div className="flex items-center gap-2">
                    <button className="p-2 hover:bg-white/10 rounded-lg transition-colors">
                      <Settings className="w-4 h-4 opacity-30" />
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
          
          {sites.length === 0 && (
            <div className="col-span-full py-40 border-2 border-dashed border-white/10 rounded-3xl flex flex-col items-center justify-center text-center">
              <div className="w-20 h-20 bg-white/5 rounded-full flex items-center justify-center mb-6">
                <Layout className="w-8 h-8 opacity-20" />
              </div>
              <h3 className="text-2xl font-bold uppercase tracking-tight mb-2">No projects yet</h3>
              <p className="opacity-40 mb-8">Start your first AI-crafted website today.</p>
              <button 
                onClick={onNew}
                className="px-8 py-3 border border-white/20 rounded-full text-xs font-bold uppercase tracking-widest hover:bg-white hover:text-black transition-all"
              >
                Create Website
              </button>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}
