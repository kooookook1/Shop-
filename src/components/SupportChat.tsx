import React, { useState, useRef, useEffect } from 'react';
import { ChevronRight, Send, Image as ImageIcon, X, HelpCircle, Loader2, Maximize2 } from 'lucide-react';
import { Message } from '../types';
import { motion, AnimatePresence } from 'motion/react';

interface SupportChatProps {
  messages: Message[];
  onSendMessage: (text: string, image?: string) => void;
  onBackToStore: () => void;
  userId?: string;
}

export default function SupportChat({ messages, onSendMessage, onBackToStore, userId }: SupportChatProps) {
  const [inputText, setInputText] = useState('');
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [zoomImage, setZoomImage] = useState<string | null>(null);
  
  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Mark conversations as read on entry and on new message arrivals
  useEffect(() => {
    const markAsRead = async () => {
      if (!userId) return;
      try {
        await fetch("/api/messages/read", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ userId, sender: "agent" })
        });
      } catch (err) {
        console.error("Error marking messages as read:", err);
      }
    };
    markAsRead();
  }, [userId, messages]);

  // Handle smooth scroll-to-bottom on messages arrival
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = () => {
    if (!inputText.trim() && !selectedImage) return;
    
    // Call onSendMessage with both text and image
    onSendMessage(inputText.trim(), selectedImage || undefined);
    
    // Reset states
    setInputText('');
    setSelectedImage(null);
  };

  const handleQuickAction = (text: string) => {
    onSendMessage(text);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setIsUploading(true);
      const reader = new FileReader();
      reader.onloadend = () => {
        if (typeof reader.result === 'string') {
          setSelectedImage(reader.result);
        }
        setIsUploading(false);
      };
      reader.onerror = () => {
        setIsUploading(false);
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="relative min-h-screen flex flex-col justify-between bg-slate-950 font-sans text-white pb-safe">
      
      {/* Background radial effects */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_var(--tw-gradient-stops))] from-blue-900/20 via-slate-950 to-slate-950 pointer-events-none z-0" />

      {/* HEADER SECTION AREA */}
      <header className="px-4 py-4 flex items-center justify-between border-b border-white/5 bg-slate-950/60 backdrop-blur-md relative z-10">
        <button 
          onClick={onBackToStore}
          className="text-gray-400 p-2 hover:bg-white/5 rounded-full hover:text-white transition-all flex items-center gap-1 text-xs"
          id="back-to-store-btn"
        >
          <ChevronRight size={18} />
          <span>العودة للمتجر</span>
        </button>

        <div className="flex items-center gap-3">
          <div className="text-right">
            <h1 className="font-extrabold text-sm leading-tight text-white">محادثة الدعم الفاخر</h1>
            <p className="text-emerald-400 text-[9px] font-semibold flex items-center justify-end gap-1 mt-0.5">
              <span>متصل الآن</span>
              <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse"></span>
            </p>
          </div>
          <div className="relative">
            <img 
              src="https://lh3.googleusercontent.com/aida-public/AB6AXuDMnUSFqirx6s5peLr3xsrkhVxEgzkkD2mFMXoYzytUEyIh_x2ZuMGK0OCj9JID-jVaxWkYWrj7Iez6hNk05PZcJv7FfViavTKp8GLbnBZ4wcjT4ewfV4SQarjPlEnPkV9G3xXsHJgx4HrC82Gsoft-5kKuAsOXFRn9XvpEuMGvaxBWTbnrXagngMhEj4f9McMO4LtDLVUx4lO63f0v7OLuDzN2nETwCm9tWnHNhOHld8b_4Z6NbceO17ZGX_gXQ_hh24ceam20vFc1" 
              alt="Support Agent" 
              referrerPolicy="no-referrer"
              className="w-10 h-10 rounded-full border border-white/10 object-cover object-top"
            />
            <div className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-emerald-500 border-2 border-slate-950 rounded-full"></div>
          </div>
        </div>
      </header>

      {/* CHAT MESSAGES PANEL */}
      <main className="flex-1 max-w-md w-full mx-auto relative z-10 flex flex-col justify-between py-2 px-1">
        
        {/* Messages List Scroller */}
        <section className="flex-grow overflow-y-auto px-3.5 py-4 space-y-4 max-h-[500px] no-scrollbar">
          {messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 text-center space-y-3 opacity-60">
              <HelpCircle className="w-12 h-12 text-cyan-400/50 animate-bounce" />
              <p className="text-xs font-bold text-gray-300">أهلاً بك في الدعم المباشر الفاخر 🕊️</p>
              <p className="text-[10px] text-gray-400 max-w-xs leading-relaxed">
                اكتب أي استفسار أو مشكلة تواجهك مع الاشتراكات وسنقوم بمساعدتك فوراً. يمكنك رفع لقطات الشاشة أو الصور لتسهيل المساعدة!
              </p>
            </div>
          ) : (
            <AnimatePresence>
              {messages.map((msg, index) => {
                const isAgent = msg.sender === 'agent';
                return (
                  <motion.div
                    key={msg.id || `user-msg-key-${index}`}
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.2 }}
                    className={`flex ${isAgent ? 'justify-start' : 'justify-end'}`}
                  >
                    <div className={`relative max-w-[85%] rounded-2xl p-3 shadow-md border ${
                      isAgent 
                        ? 'bg-slate-900/90 border-[#52579b]/20 text-white rounded-tr-none' 
                        : 'bg-cyan-500 text-slate-950 border-cyan-400/20 rounded-tl-none font-medium'
                    }`}>
                      {isAgent && (
                        <p className="font-extrabold text-[9px] text-cyan-400 opacity-90 mb-1">
                          {msg.senderName}
                        </p>
                      )}
                      
                      {/* Attached Image presentation */}
                      {msg.image && (
                        <div className="relative rounded-lg overflow-hidden border border-white/10 mb-2 max-w-[200px] group cursor-zoom-in">
                          <img 
                            src={msg.image} 
                            alt="Attachment" 
                            className="w-full h-auto max-h-48 object-cover transition-transform group-hover:scale-105"
                            onClick={() => setZoomImage(msg.image || null)}
                          />
                          <div className="absolute bottom-1 right-1 bg-black/60 p-1 rounded-md opacity-0 group-hover:opacity-100 transition-opacity">
                            <Maximize2 className="w-3.5 h-3.5 text-white" />
                          </div>
                        </div>
                      )}

                      {msg.text && (
                        <p className="text-xs leading-relaxed text-right whitespace-pre-wrap">{msg.text}</p>
                      )}

                      <div className={`text-[8px] mt-1.5 text-left ${isAgent ? 'text-gray-400' : 'text-slate-800'}`}>
                        {msg.timestamp}
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          )}
          <div ref={messagesEndRef} />
        </section>

        {/* QUICK HELPER ACTION PILLS */}
        <div className="px-2 py-2 flex gap-1.5 justify-center z-10 select-none overflow-x-auto no-scrollbar">
          <button 
            type="button"
            onClick={() => handleQuickAction('استفسار عن تتبع الطلبات الأخيرة؟')}
            className="whitespace-nowrap bg-slate-900 border border-white/5 hover:border-cyan-400/30 text-white text-[10px] font-bold py-2 px-3 rounded-full transition-all"
          >
            تتبع الطلب
          </button>
          <button 
            type="button"
            onClick={() => handleQuickAction('ما هي المشكلات الشائعة للحسابات؟')}
            className="whitespace-nowrap bg-slate-900 border border-white/5 hover:border-cyan-400/30 text-white text-[10px] font-bold py-2 px-3 rounded-full transition-all"
          >
            المشكلات الشائعة
          </button>
          <button 
            type="button"
            onClick={() => handleQuickAction('كيف يمكنني زيادة شحن محفظتي؟')}
            className="whitespace-nowrap bg-slate-900 border border-white/5 hover:border-cyan-400/30 text-white text-[10px] font-bold py-2 px-3 rounded-full transition-all"
          >
            طريقة الشحن 💳
          </button>
        </div>

        {/* CHAT INPUT AREA */}
        <footer className="p-3 bg-slate-900/40 border border-white/5 rounded-3xl backdrop-blur-xl mx-2">
          
          {/* Selected attachment preview */}
          {selectedImage && (
            <div className="mb-2.5 flex items-center justify-between bg-slate-950 p-2 rounded-2xl border border-white/5">
              <div className="flex items-center gap-2">
                <img 
                  src={selectedImage} 
                  alt="Attachment Preview" 
                  className="w-12 h-12 object-cover rounded-xl border border-white/10"
                />
                <div className="text-right">
                  <p className="text-[10px] font-bold text-gray-300">مستعد للإرسال 📸</p>
                  <p className="text-[8px] text-gray-500">من معرض صورك الخاص</p>
                </div>
              </div>
              <button 
                type="button"
                onClick={() => setSelectedImage(null)}
                className="bg-red-500/15 text-red-400 hover:bg-red-500/30 p-1.5 rounded-xl transition-all"
              >
                <X size={15} />
              </button>
            </div>
          )}

          <form 
            onSubmit={(e) => { e.preventDefault(); handleSend(); }}
            className="flex items-center gap-2"
          >
            {/* Native file upload controller hidden */}
            <input 
              type="file" 
              accept="image/*" 
              className="hidden" 
              ref={fileInputRef} 
              onChange={handleFileChange}
            />

            <button 
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="text-gray-400 hover:text-cyan-400 p-2.5 bg-slate-950/80 hover:bg-slate-950 rounded-xl border border-white/5 transition-all shrink-0 relative flex items-center justify-center"
              title="إرفاق صورة من المعرض"
            >
              {isUploading ? (
                <Loader2 size={18} className="animate-spin text-cyan-400" />
              ) : (
                <ImageIcon size={18} />
              )}
            </button>
            
            <div className="flex-1 relative flex items-center">
              <input 
                type="text" 
                placeholder={selectedImage ? "اكتب تعليقاً على الصورة أو أرسلها مباشرة..." : "اكتب رسالتك للدعم الفني..."}
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                className="w-full bg-slate-950 border border-white/5 rounded-2xl py-3 pr-4 pl-12 text-right text-xs text-white focus:outline-none focus:border-cyan-400/50 transition-colors"
              />
              
              <button 
                type="submit"
                className="absolute left-1.5 top-1/2 -translate-y-1/2 bg-cyan-400 hover:bg-cyan-300 text-slate-950 p-2.5 rounded-xl transform rotate-180 transition-all active:scale-95 flex items-center justify-center shrink-0"
              >
                <Send size={15} />
              </button>
            </div>
          </form>
        </footer>

      </main>

      {/* ZOOM IMAGE MODAL */}
      <AnimatePresence>
        {zoomImage && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/95 z-50 flex flex-col items-center justify-center p-4"
            onClick={() => setZoomImage(null)}
          >
            <button 
              type="button"
              className="absolute top-6 right-6 bg-white/10 text-white p-3 rounded-full hover:bg-white/20 transition-all"
              onClick={() => setZoomImage(null)}
            >
              <X size={20} />
            </button>
            
            <img 
              src={zoomImage} 
              alt="Zoomed attachment" 
              className="max-w-full max-h-[80vh] rounded-2xl border border-white/10 object-contain shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            />
            
            <div className="mt-4 text-center">
              <p className="text-xs text-gray-400">انقر في أي مكان للإغلاق</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}
