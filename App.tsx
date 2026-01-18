
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Ticket } from './types';
import { ICONS, CAROUSEL_IMAGES, LOCAL_VIDEOS, DEFAULT_VIDEO_URL, LOGO_URL } from './constants';
import Clock from './components/Clock';
import { generateQueueMessage } from './services/geminiService';
import Login from './login';

// Default AppScript URL
const INITIAL_BACKEND_URL = "https://script.google.com/macros/s/AKfycbwYyT9i67PryWSsk7bsR9RV98FyQkxusV9gs3MbpzwSp4OcgLIGJDyJVT48QDqH0e14/exec";

const PRIORITY_KEYWORDS = ['SENIOR', 'PWD', 'PREGNANT'];
const TIMER_DURATION = 15; 
const CAROUSEL_INTERVAL = 6000;

declare global {
  interface Window {
    onYouTubeIframeAPIReady: () => void;
    YT: any;
  }
}

type AdminTab = 'counters' | 'registration' | 'settings';

const App = () => {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());
  
  // App Backend URL - initialized from localStorage for persistence
  const [currentBackendUrl, setCurrentBackendUrl] = useState(() => {
    return localStorage.getItem('backend_url') || INITIAL_BACKEND_URL;
  });

  const [config, setConfig] = useState({
    officeName: "OFFICIAL SERVICE CENTER",
    videoUrl: DEFAULT_VIDEO_URL,
    logo: "", 
    bulletins: ["Welcome! Priority is given to SENIORS, PWDs, and PREGNANT clients."],
    carouselImages: CAROUSEL_IMAGES 
  });

  const [isAdmin, setIsAdmin] = useState(false);
  const [showLogin, setShowLogin] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [activeAdminTab, setActiveAdminTab] = useState<AdminTab>('counters');
  const [announcement, setAnnouncement] = useState("");
  
  // Local Carousel State
  const [carouselIndex, setCarouselIndex] = useState(0);
  
  const [activeServingIndex, setActiveServingIndex] = useState(0);
  const [servingTimer, setServingTimer] = useState<number>(0);
  const timerRef = useRef<any>(null);

  // Video Control States
  const [isPlaying, setIsPlaying] = useState(true);
  const [isMuted, setIsMuted] = useState(true);
  const [volume, setVolume] = useState(50);
  const ytPlayerRef = useRef<any>(null);
  const nativeVideoRef = useRef<HTMLVideoElement>(null);
  const [isYTReady, setIsYTReady] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    barangay: '',
    remarks: ''
  });

  // Load YouTube API Script
  useEffect(() => {
    if (!window.YT) {
      const tag = document.createElement('script');
      tag.src = "https://www.youtube.com/iframe_api";
      const firstScriptTag = document.getElementsByTagName('script')[0];
      firstScriptTag.parentNode?.insertBefore(tag, firstScriptTag);
      window.onYouTubeIframeAPIReady = () => setIsYTReady(true);
    } else if (window.YT && window.YT.Player) {
      setIsYTReady(true);
    }
  }, []);

  const getYoutubeId = (url: string): string | null => {
    if (!url) return null;
    const regex = /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/|youtube\.com\/shorts\/)([^"&?\/\s]{11})/i;
    const match = url.match(regex);
    return match ? match[1] : null;
  };

  const videoId = useMemo(() => getYoutubeId(config.videoUrl), [config.videoUrl]);

  // Handle YouTube Player Lifecycle
  useEffect(() => {
    if (!isYTReady || !videoId) return;

    const initPlayer = () => {
      const targetElement = document.getElementById('yt-player');
      if (!targetElement) return;

      if (ytPlayerRef.current && typeof ytPlayerRef.current.loadVideoById === 'function') {
        try {
          ytPlayerRef.current.loadVideoById({
            videoId: videoId,
            startSeconds: 0
          });
          return;
        } catch (e) {
          if (ytPlayerRef.current.destroy) ytPlayerRef.current.destroy();
          ytPlayerRef.current = null;
        }
      }

      if (ytPlayerRef.current && ytPlayerRef.current.destroy) {
        ytPlayerRef.current.destroy();
      }

      const safeOrigin = window.location.origin === 'null' ? '*' : window.location.origin;

      ytPlayerRef.current = new window.YT.Player('yt-player', {
        height: '100%',
        width: '100%',
        videoId: videoId,
        host: 'https://www.youtube.com',
        playerVars: {
          autoplay: 1,
          mute: 1,
          controls: 0,
          rel: 0,
          modestbranding: 1,
          loop: 1,
          playlist: videoId,
          playsinline: 1,
          enablejsapi: 1,
          origin: safeOrigin,
          widget_referrer: window.location.href
        },
        events: {
          onReady: (event: any) => {
            event.target.mute();
            event.target.playVideo();
            setIsMuted(true);
            setIsPlaying(true);
            event.target.setVolume(volume);
          },
          onStateChange: (event: any) => {
            if (event.data === window.YT.PlayerState.ENDED) {
              event.target.playVideo();
            }
            setIsPlaying(event.data === window.YT.PlayerState.PLAYING);
          },
          onError: (event: any) => {
            if (event.data === 153 || event.data === 5) {
               if (ytPlayerRef.current && ytPlayerRef.current.destroy) {
                 ytPlayerRef.current.destroy();
               }
               ytPlayerRef.current = null;
            }
          }
        }
      });
    };

    const timeout = setTimeout(initPlayer, 200);
    return () => {
      clearTimeout(timeout);
      if (ytPlayerRef.current && ytPlayerRef.current.destroy) {
        ytPlayerRef.current.destroy();
        ytPlayerRef.current = null;
      }
    };
  }, [isYTReady, videoId]);

  const togglePlay = () => {
    if (videoId && ytPlayerRef.current && typeof ytPlayerRef.current.getPlayerState === 'function') {
      const state = ytPlayerRef.current.getPlayerState();
      if (state === window.YT.PlayerState.PLAYING) {
        ytPlayerRef.current.pauseVideo();
      } else {
        ytPlayerRef.current.playVideo();
      }
    } else if (nativeVideoRef.current) {
      if (nativeVideoRef.current.paused) {
        nativeVideoRef.current.play().catch(console.error);
        setIsPlaying(true);
      } else {
        nativeVideoRef.current.pause();
        setIsPlaying(false);
      }
    }
  };

  const toggleMute = () => {
    if (videoId && ytPlayerRef.current && typeof ytPlayerRef.current.isMuted === 'function') {
      if (ytPlayerRef.current.isMuted()) {
        ytPlayerRef.current.unMute();
        setIsMuted(false);
      } else {
        ytPlayerRef.current.mute();
        setIsMuted(true);
      }
    } else if (nativeVideoRef.current) {
      nativeVideoRef.current.muted = !nativeVideoRef.current.muted;
      setIsMuted(nativeVideoRef.current.muted);
    }
  };

  const handleVolumeChange = (newVolume: number) => {
    setVolume(newVolume);
    if (videoId && ytPlayerRef.current && typeof ytPlayerRef.current.setVolume === 'function') {
      ytPlayerRef.current.setVolume(newVolume);
      if (newVolume > 0 && ytPlayerRef.current.isMuted()) {
        ytPlayerRef.current.unMute();
        setIsMuted(false);
      }
    } else if (nativeVideoRef.current) {
      nativeVideoRef.current.volume = newVolume / 100;
      if (newVolume > 0) {
        nativeVideoRef.current.muted = false;
        setIsMuted(false);
      }
    }
  };

  const refreshData = async () => {
    try {
      const ticketsRes = await fetch(`${currentBackendUrl}?action=getTickets`);
      const configRes = await fetch(`${currentBackendUrl}?action=getConfig`);
      
      const remoteTickets = await ticketsRes.json();
      const remoteConfig = await configRes.json();

      if (Array.isArray(remoteTickets)) {
        const mapped: Ticket[] = remoteTickets.map((t: any) => ({
          id: t.ID?.toString() || '',
          ticketNumber: t.TicketNumber?.toString() || '---',
          name: t.Name?.toString() || 'NO NAME',
          applicationType: t.ApplicationType?.toString() || '',
          barangay: t.Barangay?.toString() || '',
          voterType: t.VoterType?.toString() || '',
          civilStatus: t.Status?.toString() || '', 
          remarks: t.Remarks?.toString() || '',
          queueStatus: (t.QueueStatus?.toString().toUpperCase() || 'W') as Ticket['queueStatus'],
          timestamp: Number(t.Timestamp) || Date.now(),
          counter: Number(t.Counter) || 0
        }));
        setTickets(mapped);
        setLastUpdate(new Date());
      }
      
      if (remoteConfig && !remoteConfig.error) {
        setConfig(prev => ({ 
          ...prev, 
          ...remoteConfig, 
          carouselImages: remoteConfig.carouselImages && remoteConfig.carouselImages.length > 0 
            ? remoteConfig.carouselImages 
            : prev.carouselImages 
        }));
      }
    } catch (e) {
      console.error("Fetch failed", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refreshData();
    const interval = setInterval(refreshData, 8000);
    return () => clearInterval(interval);
  }, [currentBackendUrl]);

  // Carousel auto-rotate
  useEffect(() => {
    if (config.carouselImages.length === 0) return;
    const interval = setInterval(() => {
      setCarouselIndex((prev) => (prev + 1) % config.carouselImages.length);
    }, CAROUSEL_INTERVAL);
    return () => clearInterval(interval);
  }, [config.carouselImages.length]);

  const sortedWaiting = useMemo(() => {
    return [...tickets]
      .filter(t => t.queueStatus === 'W')
      .sort((a, b) => {
        const aPri = PRIORITY_KEYWORDS.includes(a.remarks.toUpperCase());
        const bPri = PRIORITY_KEYWORDS.includes(b.remarks.toUpperCase());
        if (aPri && !bPri) return -1;
        if (!aPri && bPri) return 1;
        return a.timestamp - b.timestamp;
      });
  }, [tickets]);

  const callingTickets = useMemo(() => {
    return tickets
      .filter(t => t.queueStatus === 'C')
      .sort((a, b) => a.timestamp - b.timestamp);
  }, [tickets]);

  const servingTickets = useMemo(() => {
    return tickets
      .filter(t => t.queueStatus === 'A')
      .sort((a, b) => b.timestamp - a.timestamp);
  }, [tickets]);

  const isAnyBeingServed = servingTickets.length > 0;

  const currentServing = useMemo(() => {
    if (isAnyBeingServed) return servingTickets[0];
    if (callingTickets.length === 0) return null;
    return callingTickets[activeServingIndex % callingTickets.length];
  }, [callingTickets, servingTickets, activeServingIndex, isAnyBeingServed]);

  useEffect(() => {
    if (isAnyBeingServed) {
      if (timerRef.current) clearInterval(timerRef.current);
      setServingTimer(0);
      return;
    }

    if (callingTickets.length > 0) {
      setServingTimer(TIMER_DURATION);
      if (timerRef.current) clearInterval(timerRef.current);
      
      timerRef.current = setInterval(() => {
        setServingTimer(prev => {
          if (prev <= 1) {
            if (activeServingIndex >= callingTickets.length - 1) {
              if (sortedWaiting.length > 0) {
                callNext(1);
                setActiveServingIndex(0);
              } else {
                setActiveServingIndex(0);
              }
            } else {
              setActiveServingIndex(prevIdx => prevIdx + 1);
            }
            return TIMER_DURATION;
          }
          return prev - 1;
        });
      }, 1000);
    } else if (sortedWaiting.length > 0) {
      callNext(1);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
      setServingTimer(0);
      setActiveServingIndex(0);
    }
    
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [callingTickets.length, isAnyBeingServed, sortedWaiting.length, activeServingIndex]);

  const updateStatus = async (id: string, newStatus: Ticket['queueStatus'], counter?: number) => {
    try {
      fetch(currentBackendUrl, {
        method: 'POST',
        mode: 'no-cors',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'updateTicketStatus', id, status: newStatus, counter })
      });

      setTickets(prev => prev.map(t => 
        t.id === id ? { ...t, queueStatus: newStatus, counter: counter ?? t.counter } : t
      ));
    } catch (e) {
      console.error("Update failed", e);
    }
  };

  const callNext = async (counterNumber: number) => {
    const currentW = tickets.filter(t => t.queueStatus === 'W').sort((a, b) => {
        const aPri = PRIORITY_KEYWORDS.includes(a.remarks.toUpperCase());
        const bPri = PRIORITY_KEYWORDS.includes(b.remarks.toUpperCase());
        if (aPri && !bPri) return -1;
        if (!aPri && bPri) return 1;
        return a.timestamp - b.timestamp;
    });

    if (currentW.length === 0) return;
    const nextToCall = currentW[0];
    updateStatus(nextToCall.id, 'C', counterNumber);

    const msg = await generateQueueMessage(nextToCall.ticketNumber, counterNumber);
    setAnnouncement(`${nextToCall.name}: ${msg}`);
    
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(`Ticket ${nextToCall.ticketNumber}. ${nextToCall.name}. Please proceed to counter ${counterNumber}.`);
      utterance.pitch = 1.1;
      utterance.rate = 0.9;
      window.speechSynthesis.speak(utterance);
    }
  };

  const saveSettings = async () => {
    setIsSaving(true);
    try {
      // Save backend URL to localStorage
      localStorage.setItem('backend_url', currentBackendUrl);

      await fetch(currentBackendUrl, {
        method: 'POST',
        mode: 'no-cors',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          action: 'updateSettings', 
          officeName: config.officeName,
          videoUrl: config.videoUrl,
          logo: config.logo,
          bulletins: config.bulletins,
          carouselImages: config.carouselImages
        })
      });
      alert("Settings saved successfully!");
    } catch (e) {
      console.error("Save settings failed", e);
      alert("Failed to save settings. Check if the Backend URL is valid.");
    } finally {
      setIsSaving(false);
    }
  };

  const convertFileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const base64 = await convertFileToBase64(file);
      setConfig(prev => ({ ...prev, logo: base64 }));
    }
  };

  const handleCarouselUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      const newImages: string[] = [];
      for (let i = 0; i < files.length; i++) {
        const base64 = await convertFileToBase64(files[i]);
        newImages.push(base64);
      }
      setConfig(prev => ({ 
        ...prev, 
        carouselImages: [...prev.carouselImages, ...newImages] 
      }));
    }
  };

  const handleVideoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const base64 = await convertFileToBase64(file);
      setConfig(prev => ({ ...prev, videoUrl: base64 }));
    }
  };

  const registerManualEntry = async () => {
    if (!formData.name) return;
    const ts = Date.now();
    const newTicket: Ticket = {
      id: ts.toString(),
      ticketNumber: (tickets.length + 100).toString(),
      name: formData.name.toUpperCase(),
      applicationType: "MANUAL",
      barangay: formData.barangay.toUpperCase(),
      voterType: "REGULAR",
      civilStatus: "SINGLE",
      remarks: formData.remarks,
      queueStatus: 'W',
      timestamp: ts
    };
    
    setTickets([...tickets, newTicket]);
    setFormData({ name: '', barangay: '', remarks: '' });

    await fetch(currentBackendUrl, {
      method: 'POST',
      mode: 'no-cors',
      body: JSON.stringify({ action: 'addTicket', ticket: newTicket })
    });
  };

  const handleAdminToggle = () => {
    if (isLoggedIn) {
      setIsAdmin(true);
    } else {
      setShowLogin(true);
    }
  };

  const handleLoginSuccess = (success: boolean) => {
    if (success) {
      setIsLoggedIn(true);
      setShowLogin(false);
      setIsAdmin(true);
    }
  };

  const GroupedQueueDisplay = ({ ticketsList }: { ticketsList: Ticket[] }) => {
    const displayList = ticketsList.slice(0, 10);
    
    return (
      <div className="grid grid-cols-5 gap-y-4 gap-x-2 w-full">
        {displayList.map((ticket, idx) => {
          const isLast = idx === displayList.length - 1;
          const comma = !isLast ? ',' : '';
          return (
            <div key={ticket.id} className="flex flex-col min-w-0">
              <div className="h-4 flex items-center mb-0.5">
                {ticket.remarks ? (
                  <span className="text-[0.7rem] font-black text-yellow-400 uppercase tracking-tighter truncate bg-yellow-400/10 px-1 rounded">
                    ({ticket.remarks})
                  </span>
                ) : (
                  <div className="h-4" /> 
                )}
              </div>
              <div className="text-[1.7rem] font-black text-white whitespace-nowrap flex items-baseline leading-none">
                <span className="tracking-tighter">{ticket.id.slice(-6)}</span>
                {comma && <span className="text-slate-600 ml-1">{comma}</span>}
              </div>
            </div>
          );
        })}
        {displayList.length === 0 && (
          <div className="col-span-5 py-4 text-slate-700 font-bold uppercase tracking-[0.3em] text-xs italic opacity-40">
            None in queue
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="flex flex-col h-screen w-screen overflow-hidden bg-slate-950 font-sans text-slate-100">
      
      {showLogin && <Login onLogin={handleLoginSuccess} onClose={() => setShowLogin(false)} />}

      <header className="flex items-center justify-between px-10 py-4 border-b border-slate-800 bg-slate-900/90 backdrop-blur-xl z-30 shadow-2xl">
        <div className="flex items-center gap-6">
          <div className="w-12 h-12 bg-indigo-600 rounded-2xl flex items-center justify-center shadow-2xl shadow-indigo-500/20 overflow-hidden">
             <img 
              src={config.logo || LOGO_URL} 
              alt="Logo" 
              className="w-full h-full object-contain p-1" 
              onError={(e) => {
                const target = e.target as HTMLImageElement;
                target.src = LOGO_URL;
              }}
             />
          </div>
          <div>
            <h1 className="text-xl font-black tracking-tighter text-white uppercase">{config.officeName}</h1>
            <div className="flex items-center gap-2">
               <div className={`w-1.5 h-1.5 rounded-full ${loading ? 'bg-amber-500 animate-pulse' : 'bg-emerald-500'}`} />
               <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">
                 {loading ? "FETCHING..." : `LIVE SYNC OK | ${lastUpdate.toLocaleTimeString()}`}
               </p>
            </div>
          </div>
        </div>
        
        <div className="flex items-center gap-12">
          <Clock />
          <button 
            onClick={handleAdminToggle}
            className="p-3 rounded-2xl bg-slate-800/80 hover:bg-indigo-600 transition-all border border-slate-700 text-slate-300 hover:text-white"
          >
            {ICONS.Settings}
          </button>
        </div>
      </header>

      <main className="flex flex-1 overflow-hidden">
        {/* LEFT MEDIA & CAROUSEL SECTION */}
        <section className="flex-[0.35] relative overflow-hidden bg-black p-4 flex flex-col gap-4">
          <div className="relative flex-1 rounded-[2.5rem] overflow-hidden shadow-2xl border border-slate-800 bg-slate-900 group">
            <div className="absolute inset-0 w-full h-full overflow-hidden pointer-events-none">
                {videoId ? (
                    <div className="absolute inset-0 w-full h-full opacity-60 scale-[1.01] pointer-events-none">
                      <div id="yt-player" className="w-full h-full" />
                    </div>
                ) : (
                    <video 
                      ref={nativeVideoRef} 
                      autoPlay 
                      muted 
                      loop 
                      playsInline
                      className="absolute inset-0 w-full h-full object-cover opacity-40" 
                      src={config.videoUrl} 
                    />
                )}
            </div>
            
            <div className="absolute inset-0 flex flex-col justify-end opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-40 p-6 pointer-events-none">
                <div className="glass-morphism rounded-2xl p-4 flex items-center gap-4 pointer-events-auto border border-white/10 shadow-2xl">
                    <button 
                        onClick={togglePlay}
                        className="w-10 h-10 flex items-center justify-center rounded-full bg-white text-slate-950 hover:bg-indigo-500 hover:text-white transition-all shadow-lg"
                    >
                        {isPlaying ? ICONS.Pause : ICONS.Play}
                    </button>
                    
                    <button 
                        onClick={toggleMute}
                        className="w-10 h-10 flex items-center justify-center rounded-full bg-slate-800/80 text-white hover:bg-indigo-600 transition-all border border-white/5"
                    >
                        {isMuted || volume === 0 ? ICONS.VolumeX : volume < 50 ? ICONS.Volume1 : ICONS.Volume2}
                    </button>

                    <div className="flex-1 flex items-center gap-3">
                        <input 
                            type="range" 
                            min="0" 
                            max="100" 
                            value={volume} 
                            onChange={(e) => handleVolumeChange(parseInt(e.target.value))}
                            className="flex-1 h-1 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-indigo-500"
                        />
                        <span className="text-[10px] font-black text-slate-400 w-6">{volume}%</span>
                    </div>
                </div>
            </div>

            <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-transparent to-transparent z-20 pointer-events-none" />
            
            {announcement && (
              <div className="absolute bottom-6 left-6 right-6 glass-morphism p-5 rounded-[2rem] border-l-8 border-l-indigo-500 animate-pulse shadow-2xl z-30">
                <div className="flex items-center gap-2 mb-1">
                  <div className="p-1 bg-indigo-500 rounded scale-75">{ICONS.Bell}</div>
                  <span className="text-indigo-400 font-black uppercase tracking-widest text-[9px]">Now Calling</span>
                </div>
                <p className="text-lg font-bold text-white leading-tight">{announcement}</p>
              </div>
            )}
          </div>

          <div className="glass-morphism rounded-[2rem] border border-white/5 h-64 relative overflow-hidden group">
             <div className="absolute top-4 left-4 z-10 flex items-center gap-2">
               <div className="px-3 py-1 bg-indigo-600/90 backdrop-blur rounded-xl text-[9px] text-white font-black tracking-widest uppercase flex items-center gap-2 shadow-lg">
                 {ICONS.Image} Highlights
               </div>
             </div>
             
             {config.carouselImages.length > 0 ? config.carouselImages.map((img, idx) => (
               <div 
                 key={idx}
                 className={`absolute inset-0 transition-all duration-1000 ease-in-out transform ${idx === carouselIndex ? 'opacity-100 scale-100' : 'opacity-0 scale-110'}`}
               >
                 <img 
                    src={img} 
                    alt={`Gallery Item ${idx}`} 
                    className="w-full h-full object-cover" 
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = "https://images.unsplash.com/photo-1557683316-973673baf926?auto=format&fit=crop&q=80&w=800";
                    }}
                 />
                 <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-transparent to-transparent" />
               </div>
             )) : (
               <div className="absolute inset-0 flex items-center justify-center bg-slate-900">
                 <p className="text-slate-600 font-black uppercase tracking-widest text-xs opacity-50">No images configured</p>
               </div>
             )}

             <div className="absolute bottom-4 right-6 flex gap-2 z-10">
               {config.carouselImages.map((_, idx) => (
                 <div 
                   key={idx} 
                   className={`h-1 rounded-full transition-all duration-500 ${idx === carouselIndex ? 'w-8 bg-indigo-500 shadow-lg shadow-indigo-500/50' : 'w-2 bg-white/10'}`} 
                 />
               ))}
             </div>
          </div>
        </section>

        {/* RIGHT QUEUE DISPLAY SECTION */}
        <aside className="flex-[0.65] flex flex-col p-4 space-y-6 overflow-hidden">
          <div className="space-y-3">
            <h2 className="text-[18px] font-black uppercase tracking-[0.5em] text-white text-center drop-shadow-lg">
              {isAnyBeingServed ? "Currently at Counter" : "Now Calling"}
            </h2>
            <div className={`bg-gradient-to-br from-indigo-950/40 to-slate-900/60 rounded-[3.5rem] py-8 px-14 border shadow-2xl relative overflow-hidden min-h-[220px] flex items-center justify-center transition-all duration-500 ${isAnyBeingServed ? 'border-emerald-400 shadow-emerald-500/10' : servingTimer > 0 ? 'border-amber-400 scale-[1.01] shadow-amber-500/10' : 'border-indigo-500/20'}`}>
               
               {!isAnyBeingServed && servingTimer > 0 && (
                 <div className="absolute bottom-0 left-0 h-1.5 bg-amber-400 transition-all duration-1000 ease-linear shadow-[0_-4px_10px_rgba(251,191,36,0.5)]" style={{ width: `${(servingTimer / TIMER_DURATION) * 100}%` }} />
               )}

               {isAnyBeingServed && (
                 <div className="absolute bottom-0 left-0 w-full h-1.5 bg-emerald-500 shadow-[0_-4px_10px_rgba(16,185,129,0.5)]" />
               )}

               {servingTimer > 0 && !isAnyBeingServed && (
                  <div className="absolute top-4 right-4 w-16 h-16 rounded-full bg-amber-400 border-4 border-amber-500/50 flex flex-col items-center justify-center text-slate-950 shadow-[0_0_30px_rgba(251,191,36,0.4)] animate-pulse z-50">
                    <span className="text-2xl font-black leading-none">{servingTimer}</span>
                    <span className="text-[7px] font-black uppercase tracking-[0.1em] mt-0.5">SEC</span>
                  </div>
               )}

               {isAnyBeingServed && (
                  <div className="absolute top-4 right-4 w-16 h-16 rounded-full bg-emerald-500 border-4 border-emerald-400/50 flex flex-col items-center justify-center text-white shadow-[0_0_30px_rgba(16,185,129,0.4)] z-50">
                    <div className="scale-110">{ICONS.Users}</div>
                    <span className="text-[7px] font-black uppercase tracking-[0.1em] mt-1">ACTIVE</span>
                  </div>
               )}

               {currentServing ? (
                 <div className="relative z-10 flex items-center justify-between w-full">
                    <div className="flex flex-col items-start gap-2">
                       <div className="flex flex-col">
                         <div className="text-[7.5rem] font-black tracking-tighter text-white leading-none flex items-baseline gap-6 relative">
                          {currentServing.id.slice(-6)}
                          {PRIORITY_KEYWORDS.includes(currentServing.remarks.toUpperCase()) && (
                            <span className="text-4xl text-amber-500 font-bold animate-bounce">★</span>
                          )}
                         </div>
                         <div className="text-indigo-400/80 text-3xl font-black tracking-tighter ml-2 mt-1 uppercase">
                           {currentServing.ticketNumber}
                         </div>
                       </div>
                       <div className="mt-2 px-10 py-3 bg-white text-slate-950 font-black uppercase text-2xl rounded-2xl shadow-2xl">
                         Proceed to Counter {currentServing.counter || 1}
                       </div>
                    </div>
                    <div className="text-right flex flex-col gap-1 max-w-[50%] mr-6">
                      <span className={`font-black uppercase tracking-widest text-[11px] transition-opacity duration-300 ${isAnyBeingServed ? 'text-emerald-400' : 'text-indigo-400 animate-pulse'}`}>
                        {isAnyBeingServed ? "IN SERVICE" : callingTickets.length > 1 ? `Cycling (${activeServingIndex + 1}/${callingTickets.length})` : 'Now Calling'}
                      </span>
                      <h3 className="text-2xl font-black text-white leading-tight uppercase mb-0.5 break-words">
                        {currentServing.name}
                      </h3>
                      <p className="text-lg font-bold text-slate-400 uppercase tracking-tight">{currentServing.barangay}</p>
                      {currentServing.remarks && (
                         <div className="inline-block mt-1 bg-amber-500/10 text-amber-500 border border-amber-500/20 px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest self-end">
                           {currentServing.remarks}
                         </div>
                      )}
                    </div>
                 </div>
               ) : (
                 <div className="text-center">
                   <p className="text-slate-600 text-3xl font-black italic tracking-widest opacity-30 uppercase">System Ready</p>
                   <p className="text-slate-500 text-xs mt-3 font-bold tracking-[0.3em] uppercase opacity-40">Please wait for your turn</p>
                 </div>
               )}
            </div>
          </div>

          <div className="flex-1 grid grid-cols-2 gap-10 overflow-hidden px-4">
             <div className="flex flex-col overflow-hidden">
                <div className="flex items-center justify-between border-b border-indigo-500/30 pb-2 mb-6">
                   <h2 className="text-[13px] font-black uppercase tracking-[0.5em] text-indigo-400 flex items-center gap-3">
                     {ICONS.Bell} Calling
                   </h2>
                   <span className="text-[9px] font-bold text-indigo-400 opacity-50 uppercase tracking-widest">Next 10</span>
                </div>
                <GroupedQueueDisplay ticketsList={callingTickets} />
             </div>

             <div className="flex flex-col overflow-hidden">
                <div className="flex items-center justify-between border-b border-slate-700 pb-2 mb-6">
                   <h2 className="text-[13px] font-black uppercase tracking-[0.5em] text-slate-500 flex items-center gap-3">
                     {ICONS.Users} Waiting
                   </h2>
                   <span className="text-[9px] font-bold text-slate-500 opacity-50 uppercase tracking-widest">Upcoming</span>
                </div>
                <GroupedQueueDisplay ticketsList={sortedWaiting} />
             </div>
          </div>
        </aside>
      </main>

      <footer className="h-14 border-t border-slate-800 bg-indigo-700 flex items-center overflow-hidden z-20 shadow-2xl">
        <div className="bg-indigo-800 px-10 h-full flex items-center z-10 shadow-2xl border-r border-white/10">
           <span className="text-white font-black uppercase tracking-[0.4em] text-[10px] whitespace-nowrap">Official Bulletin</span>
        </div>
        <div className="flex-1 whitespace-nowrap overflow-hidden">
          <div className="inline-block animate-marquee py-2">
            {config.bulletins.map((msg, idx) => (
              <span key={idx} className="mx-16 text-white font-black tracking-[0.1em] text-lg uppercase">
                {msg} {config.bulletins.length > 1 && <span className="ml-16 opacity-30 text-indigo-300">•</span>}
              </span>
            ))}
          </div>
        </div>
      </footer>

      {isAdmin && isLoggedIn && (
        <div className="fixed inset-0 z-[100] bg-slate-950/98 backdrop-blur-3xl flex items-center justify-center p-6 lg:p-12">
          <div className="bg-slate-900 w-full max-w-7xl h-full max-h-[95vh] rounded-[3.5rem] border border-white/10 shadow-3xl overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-200">
            
            <div className="p-8 border-b border-white/5 flex items-center justify-between bg-slate-900/50 backdrop-blur-md">
              <div className="flex items-center gap-5">
                 <div className="p-3.5 bg-indigo-600 rounded-2xl shadow-2xl shadow-indigo-500/20">{ICONS.Settings}</div>
                 <div>
                   <h2 className="text-3xl font-black text-white tracking-tighter uppercase">Management Console</h2>
                   <div className="flex items-center gap-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                      <p className="text-indigo-400 font-black uppercase tracking-widest text-[10px]">Administrator Access Active</p>
                   </div>
                 </div>
              </div>
              <div className="flex items-center gap-4">
                <button 
                  onClick={() => setIsLoggedIn(false)}
                  className="px-6 py-4 bg-slate-800 hover:bg-slate-700 text-slate-300 font-black uppercase tracking-widest text-xs rounded-2xl transition-all"
                >
                  Logout
                </button>
                <button 
                  onClick={() => setIsAdmin(false)} 
                  className="bg-red-600 hover:bg-red-500 px-8 py-4 rounded-2xl transition-all text-white font-black uppercase tracking-widest text-xs shadow-xl shadow-red-900/20 active:scale-95"
                >
                  Close Panel
                </button>
              </div>
            </div>

            <div className="flex-1 flex overflow-hidden">
              <nav className="w-64 border-r border-white/5 bg-slate-900/30 p-6 space-y-3">
                {[
                  { id: 'counters', label: 'Counters', icon: ICONS.LayoutGrid },
                  { id: 'registration', label: 'Registration', icon: ICONS.ClipboardList },
                  { id: 'settings', label: 'Settings', icon: ICONS.MonitorPlay },
                ].map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveAdminTab(tab.id as AdminTab)}
                    className={`w-full flex items-center gap-4 px-6 py-4 rounded-2xl transition-all duration-300 font-black uppercase text-[11px] tracking-widest ${activeAdminTab === tab.id ? 'bg-indigo-600 text-white shadow-xl shadow-indigo-500/10' : 'text-slate-500 hover:text-slate-200 hover:bg-white/5'}`}
                  >
                    <span className={activeAdminTab === tab.id ? 'text-white' : 'text-slate-500'}>{tab.icon}</span>
                    {tab.label}
                  </button>
                ))}
              </nav>

              <div className="flex-1 overflow-y-auto p-10 custom-scrollbar">
                
                {activeAdminTab === 'counters' && (
                  <div className="space-y-10">
                    <div className="flex items-center justify-between">
                       <h3 className="text-xl font-black text-white uppercase tracking-widest border-l-4 border-indigo-500 pl-4">Counter Stations</h3>
                       <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Real-time Station Monitoring</p>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                      {[1, 2, 3, 4, 5, 6].map(num => {
                        const counterTicket = tickets.find(t => t.counter === num && (t.queueStatus === 'C' || t.queueStatus === 'A'));
                        const isServing = counterTicket?.queueStatus === 'A';
                        
                        return (
                          <div key={num} className={`relative overflow-hidden group transition-all duration-300 rounded-[2.5rem] border ${counterTicket ? (isServing ? 'bg-emerald-950/20 border-emerald-500/30' : 'bg-indigo-950/20 border-indigo-500/30') : 'bg-slate-800/20 border-white/5'}`}>
                            <div className="p-6 space-y-6">
                              <div className="flex justify-between items-center">
                                <div className="flex items-center gap-2">
                                  <span className="text-[10px] text-slate-500 font-black uppercase tracking-tighter">Station</span>
                                  <span className="text-xl font-black text-white">{num}</span>
                                </div>
                                {counterTicket && (
                                  <div className={`flex items-center gap-1.5 px-2 py-1 rounded-full text-[8px] font-black uppercase tracking-widest ${isServing ? 'bg-emerald-500/20 text-emerald-400' : 'bg-indigo-500/20 text-indigo-400'}`}>
                                    <div className={`w-1 h-1 rounded-full ${isServing ? 'bg-emerald-400 animate-pulse' : 'bg-indigo-400'}`} />
                                    {isServing ? 'Active' : 'Calling'}
                                  </div>
                                )}
                              </div>
                              <div className="min-h-[100px] flex flex-col justify-center">
                                {counterTicket ? (
                                  <div className="space-y-2">
                                    <div className="text-4xl font-black text-white tracking-tighter leading-none">{counterTicket.id.slice(-6)}</div>
                                    <div className="text-[11px] text-slate-300 font-bold uppercase truncate pr-4">{counterTicket.name}</div>
                                    <div className="text-[9px] text-slate-500 font-black uppercase tracking-widest">{counterTicket.ticketNumber}</div>
                                  </div>
                                ) : (
                                  <div className="text-center py-4">
                                    <p className="text-slate-600 text-xs font-black uppercase tracking-widest opacity-40">Ready for next</p>
                                  </div>
                                )}
                              </div>
                              <div className="grid grid-cols-1 gap-2">
                                {counterTicket ? (
                                  <>
                                    {counterTicket.queueStatus === 'C' && (
                                      <button 
                                        onClick={() => updateStatus(counterTicket.id, 'A')} 
                                        className="w-full bg-emerald-600 hover:bg-emerald-500 py-3 rounded-2xl text-[10px] font-black uppercase text-white transition-all shadow-lg shadow-emerald-900/10 active:scale-95"
                                      >
                                        Start Serving
                                      </button>
                                    )}
                                    <button 
                                      onClick={() => updateStatus(counterTicket.id, 'S')} 
                                      className="w-full bg-slate-700/80 hover:bg-slate-600 py-3 rounded-2xl text-[10px] font-black uppercase text-white transition-all active:scale-95"
                                    >
                                      Finish & Close
                                    </button>
                                  </>
                                ) : (
                                  <button 
                                    onClick={() => callNext(num)} 
                                    className="w-full py-5 bg-indigo-600 hover:bg-indigo-500 rounded-[1.5rem] text-sm font-black uppercase text-white transition-all shadow-lg shadow-indigo-900/10 active:scale-95"
                                  >
                                    Call Next
                                  </button>
                                )}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {activeAdminTab === 'registration' && (
                  <div className="grid grid-cols-1 xl:grid-cols-5 gap-10">
                    <div className="xl:col-span-2 space-y-10">
                      <div className="flex flex-col gap-2">
                         <h3 className="text-xl font-black text-white uppercase tracking-widest border-l-4 border-emerald-500 pl-4">Manual Entry</h3>
                      </div>
                      <div className="bg-slate-800/40 p-8 rounded-[3rem] border border-white/5 space-y-8 shadow-2xl relative overflow-hidden group">
                        <div className="space-y-6">
                          <div className="space-y-2">
                            <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest">Full Name</label>
                            <input 
                              placeholder="CLIENT NAME" 
                              className="w-full bg-slate-950 border border-white/5 rounded-2xl px-6 py-4 text-white font-black text-xl uppercase focus:border-indigo-500/50 outline-none" 
                              value={formData.name} 
                              onChange={(e) => setFormData({...formData, name: e.target.value})}
                            />
                          </div>
                          <div className="space-y-2">
                            <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest">Barangay</label>
                            <input 
                              placeholder="LOCATION" 
                              className="w-full bg-slate-950 border border-white/5 rounded-2xl px-6 py-4 text-white font-black text-lg uppercase focus:border-indigo-500/50 outline-none" 
                              value={formData.barangay} 
                              onChange={(e) => setFormData({...formData, barangay: e.target.value})}
                            />
                          </div>
                          <div className="space-y-2">
                            <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest">Client Priority</label>
                            <select 
                              className="w-full bg-slate-950 border border-white/5 rounded-2xl px-6 py-4 text-white font-black text-base outline-none cursor-pointer appearance-none" 
                              value={formData.remarks} 
                              onChange={(e) => setFormData({...formData, remarks: e.target.value})}
                            >
                              <option value="">STANDARD REGULAR</option>
                              <option value="SENIOR">SENIOR CITIZEN</option>
                              <option value="PWD">PERSON W/ DISABILITY</option>
                              <option value="PREGNANT">EXPECTANT MOTHER</option>
                            </select>
                          </div>
                        </div>
                        <button 
                          onClick={registerManualEntry} 
                          className="w-full py-6 bg-indigo-600 hover:bg-indigo-500 rounded-[1.5rem] text-2xl font-black text-white shadow-2xl transition-all active:scale-[0.98]"
                        >
                          ENQUEUE CLIENT
                        </button>
                      </div>
                    </div>
                    <div className="xl:col-span-3 space-y-10">
                      <div className="flex flex-col gap-2">
                         <h3 className="text-xl font-black text-white uppercase tracking-widest border-l-4 border-slate-700 pl-4">Recent Entries</h3>
                      </div>
                      <div className="bg-slate-950/40 rounded-[2.5rem] border border-white/5 overflow-hidden shadow-2xl">
                        <table className="w-full text-left text-[11px]">
                          <thead className="bg-slate-800/80 text-slate-500 font-black uppercase tracking-widest">
                            <tr>
                              <th className="px-8 py-5">System ID</th>
                              <th className="px-8 py-5">Full Name</th>
                              <th className="px-8 py-5">Ticket #</th>
                              <th className="px-8 py-5">Status</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-white/5">
                            {tickets.slice(-8).reverse().map(t => (
                              <tr key={t.id} className="text-slate-300 hover:bg-white/5 transition-colors group">
                                <td className="px-8 py-4 font-black text-white/40">#{t.id.slice(-6)}</td>
                                <td className="px-8 py-4 uppercase font-bold text-xs tracking-tight">{t.name}</td>
                                <td className="px-8 py-4 font-black text-indigo-400 uppercase tracking-widest">{t.ticketNumber}</td>
                                <td className="px-8 py-4">
                                   <span className={`px-2 py-1 rounded text-[9px] font-black uppercase tracking-widest ${t.queueStatus === 'W' ? 'bg-amber-500/10 text-amber-500' : t.queueStatus === 'S' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-indigo-500/10 text-indigo-500'}`}>
                                     {t.queueStatus === 'W' ? 'WAITING' : t.queueStatus === 'S' ? 'SERVED' : 'ACTIVE'}
                                   </span>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>
                )}

                {activeAdminTab === 'settings' && (
                  <div className="max-w-5xl space-y-12 animate-in fade-in slide-in-from-right-4 duration-300">
                    
                    <div className="flex items-center justify-between">
                       <div className="flex flex-col gap-2">
                         <h3 className="text-xl font-black text-white uppercase tracking-widest border-l-4 border-indigo-600 pl-4">System Configuration</h3>
                         <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-5">Configure branding, API endpoints, and assets</p>
                       </div>
                       <button 
                         onClick={saveSettings}
                         disabled={isSaving}
                         className="px-8 py-4 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-black uppercase tracking-widest text-xs rounded-2xl shadow-xl transition-all active:scale-95"
                       >
                         {isSaving ? "Saving..." : "Save All Settings"}
                       </button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                       <div className="space-y-4 bg-slate-800/20 p-6 rounded-3xl border border-white/5">
                          <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Office Brand Title</label>
                          <input 
                            className="w-full bg-slate-950 border border-white/10 rounded-2xl px-6 py-4 text-white font-bold text-base focus:border-indigo-500/50 outline-none transition-all" 
                            value={config.officeName} 
                            onChange={(e) => setConfig({...config, officeName: e.target.value.toUpperCase()})}
                          />
                       </div>

                       <div className="space-y-4 bg-slate-800/20 p-6 rounded-3xl border border-white/5">
                          <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Backend API URL (Google AppScript)</label>
                          <input 
                            className="w-full bg-slate-950 border border-white/10 rounded-2xl px-6 py-4 text-white font-mono text-xs focus:border-indigo-500/50 outline-none transition-all" 
                            value={currentBackendUrl} 
                            onChange={(e) => setCurrentBackendUrl(e.target.value)}
                            placeholder="https://script.google.com/macros/s/.../exec"
                          />
                          <p className="text-[8px] text-slate-500 font-bold uppercase px-1">Changes here will switch the database source immediately.</p>
                       </div>

                       <div className="space-y-4 bg-slate-800/20 p-6 rounded-3xl border border-white/5">
                          <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Advertising Video Source (YouTube/Direct)</label>
                          <div className="space-y-3">
                             <input 
                               className="w-full bg-slate-950 border border-white/10 rounded-2xl px-6 py-4 text-white font-mono text-xs focus:border-indigo-500/50 outline-none transition-all" 
                               value={config.videoUrl} 
                               onChange={(e) => setConfig({...config, videoUrl: e.target.value})}
                             />
                             <div className="flex items-center gap-4">
                               <input 
                                 type="file" 
                                 accept="video/*" 
                                 onChange={handleVideoUpload}
                                 className="text-[10px] text-slate-500 file:mr-4 file:py-1 file:px-3 file:rounded-full file:border-0 file:bg-indigo-600/20 file:text-indigo-400"
                               />
                             </div>
                          </div>
                       </div>

                       <div className="space-y-4 bg-slate-800/20 p-6 rounded-3xl border border-white/5">
                          <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Logo Management</label>
                          <div className="flex items-center gap-8">
                             <div className="w-24 h-24 bg-slate-950 rounded-2xl border border-white/10 flex items-center justify-center overflow-hidden">
                                <img src={config.logo || LOGO_URL} className="w-full h-full object-contain p-2" alt="Logo" />
                             </div>
                             <div className="flex-1 space-y-2">
                                <input 
                                  type="file" 
                                  accept="image/*" 
                                  onChange={handleLogoUpload}
                                  className="text-xs text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:bg-indigo-600 file:text-white"
                                />
                             </div>
                          </div>
                       </div>
                    </div>

                    <div className="space-y-8">
                       <h3 className="text-xl font-black text-white uppercase tracking-widest border-l-4 border-emerald-500 pl-4">Carousel Gallery</h3>
                       <div className="bg-slate-800/20 p-8 rounded-[2.5rem] border border-white/5 space-y-6">
                          <label className="px-6 py-3 bg-indigo-600 hover:bg-indigo-500 text-white text-[10px] font-black uppercase tracking-widest rounded-xl cursor-pointer shadow-lg active:scale-95 transition-all">
                               {ICONS.ImagePlus} Upload Photos
                               <input type="file" multiple accept="image/*" onChange={handleCarouselUpload} className="hidden" />
                          </label>
                          <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-4">
                             {config.carouselImages.map((img, idx) => (
                               <div key={idx} className="group relative aspect-square bg-slate-950 rounded-xl overflow-hidden border border-white/5 shadow-inner">
                                  <img src={img} className="w-full h-full object-cover" alt={`Carousel ${idx}`} />
                                  <div className="absolute inset-0 bg-slate-950/80 opacity-0 group-hover:opacity-100 flex items-center justify-center">
                                     <button onClick={() => setConfig({...config, carouselImages: config.carouselImages.filter((_, i) => i !== idx)})} className="p-2 bg-red-600 text-white rounded-lg">{ICONS.Trash}</button>
                                  </div>
                               </div>
                             ))}
                          </div>
                       </div>
                    </div>

                    <div className="space-y-8">
                       <h3 className="text-xl font-black text-white uppercase tracking-widest border-l-4 border-slate-600 pl-4">Bulletin Announcements</h3>
                       <div className="bg-slate-800/20 p-8 rounded-[2.5rem] border border-white/5 space-y-6">
                          {config.bulletins.map((bulletin, idx) => (
                            <div key={idx} className="space-y-2">
                               <div className="flex justify-between items-center px-1">
                                 <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Message #{idx + 1}</label>
                                 <button onClick={() => setConfig({...config, bulletins: config.bulletins.filter((_, i) => i !== idx)})} className="text-[8px] font-black text-red-500/50 uppercase tracking-widest">Remove</button>
                               </div>
                               <textarea 
                                  className="w-full bg-slate-950 border border-white/10 rounded-2xl px-6 py-4 text-white font-bold text-sm focus:border-indigo-500/50 outline-none min-h-[80px] resize-none"
                                  value={bulletin}
                                  onChange={(e) => {
                                    const newB = [...config.bulletins];
                                    newB[idx] = e.target.value;
                                    setConfig({...config, bulletins: newB});
                                  }}
                               />
                            </div>
                          ))}
                          <button className="flex items-center gap-2 px-8 py-4 rounded-2xl bg-white/5 text-[10px] font-black text-slate-400 uppercase tracking-widest" onClick={() => setConfig({...config, bulletins: [...config.bulletins, ""]})}>
                            {ICONS.Plus} Add Item
                          </button>
                       </div>
                    </div>

                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;
