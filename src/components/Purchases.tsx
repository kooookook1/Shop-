import React, { useState } from 'react';
import { FileText, CheckCircle2, Copy, Key, Shield, AlertTriangle, ChevronLeft, CalendarClock } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Order } from '../types';

interface PurchasesProps {
  orders: Order[];
  onCopyText: (text: string, label: string) => void;
}

export function Purchases({ orders, onCopyText }: PurchasesProps) {
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const triggerCopy = (text: string, label: string, id: string) => {
    onCopyText(text, label);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const toggleExpand = (id: string) => {
    setExpandedId(expandedId === id ? null : id);
  };

  return (
    <div className="flex-1 pb-24 h-full flex flex-col justify-end">
      {/* HEADER SECTION */}
      <div className="px-6 py-6 pb-2 text-right relative z-10 shrink-0 mb-auto mt-6">
        <h1 className="text-4xl font-black text-white tracking-tight drop-shadow-lg">
          <span className="text-transparent bg-clip-text bg-gradient-to-l from-amber-400 via-amber-200 to-amber-500">مشترياتي</span>
        </h1>
        <p className="text-xs text-gray-300 mt-2.5 max-w-[280px] mr-auto leading-relaxed drop-shadow">
          سجل طلباتك وحساباتك المشتراة. كل بياناتك محفوظة هنا بأمان وتشفير تام.
        </p>
      </div>

      <div className="h-[78vh] glass-panel rounded-t-[40px] shadow-2xl relative border-t border-white/10 flex flex-col mt-4 bg-slate-950/80 backdrop-blur-xl">
        <div className="absolute top-3 left-1/2 -translate-x-1/2 w-12 h-1.5 bg-white/10 rounded-full"></div>
        <div className="absolute top-3 right-8 flex gap-1.5">
          <div className="w-2 h-2 rounded-full bg-red-500/80 animate-pulse"></div>
          <div className="w-2 h-2 rounded-full bg-amber-500/80 animate-pulse delay-75"></div>
          <div className="w-2 h-2 rounded-full bg-emerald-500/80 animate-pulse delay-150"></div>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-8 mt-2 space-y-4 scrollbar-none pb-32 block">
          <AnimatePresence>
            {orders.length === 0 ? (
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="glass-card rounded-[32px] p-8 flex flex-col justify-center items-center h-56 text-center text-gray-400 text-xs border border-white/5 space-y-4 bg-slate-900/30 shadow-inner"
              >
                <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center">
                  <FileText size={28} className="text-white/20" />
                </div>
                <p className="max-w-[200px] leading-relaxed">لم تقم بأي طلبات شراء بعد. تسوق في المتجر لطلب مفاتيحك الرقمية والحسابات!</p>
              </motion.div>
            ) : (
              orders.map((order, index) => {
                const isDelivered = order.status === 'تم تسليم الطلب' || order.status === 'مكتمل';
                const showCredentialsBox = isDelivered && order.credentials;
                const isExpanded = expandedId === order.id;

                return (
                  <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    key={order.id} 
                    className={`glass-card shrink-0 rounded-[28px] border relative overflow-hidden transition-all duration-300 flex flex-col ${
                      order.status === 'تم تسليم الطلب' ? 'border-amber-400/40 shadow-[0_8px_30px_rgba(251,191,36,0.12)] bg-amber-400/[0.02]' : 'border-white/5 shadow-xl shadow-black/40 bg-slate-900/40'
                    }`}
                  >
                    {/* Glowing effect for delivered items */}
                    {order.status === 'تم تسليم الطلب' && (
                      <div className="absolute top-0 right-0 w-32 h-32 bg-amber-400/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none"></div>
                    )}

                    <div 
                      className="p-4 flex items-center justify-between gap-4 w-full cursor-pointer group" 
                      dir="rtl"
                      onClick={() => showCredentialsBox && toggleExpand(order.id)}
                    >
                      <div className="flex items-center gap-4 flex-1 min-w-0">
                        <div className="w-16 h-16 bg-slate-950/80 rounded-[20px] flex items-center justify-center border border-white/10 overflow-hidden shrink-0 shadow-inner relative group-hover:border-white/20 transition-colors">
                          <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent z-10 pointer-events-none fade-in"></div>
                          {order.imageUrl ? (
                            <img 
                              src={order.imageUrl} 
                              alt={order.productName} 
                              referrerPolicy="no-referrer"
                              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                            />
                          ) : (
                            <span className="text-cyan-400 font-extrabold text-lg">RX</span>
                          )}
                        </div>
                        <div className="text-right flex-1 min-w-0">
                          <h3 className="font-bold text-[13px] text-white leading-tight line-clamp-2 pr-1">{order.productName}</h3>
                          <div className="flex items-center gap-2 mt-1.5">
                            <span className="flex items-center gap-1 text-[9px] bg-slate-950/50 border border-white/5 px-2 py-0.5 rounded-md text-gray-400 font-mono">
                              <span className="text-amber-400/70">#</span>{order.id}
                            </span>
                            <span className="flex items-center gap-1 text-[9px] text-gray-500">
                              <CalendarClock size={10} /> {order.date}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="text-left shrink-0 pl-1 flex flex-col items-end gap-1.5 h-full justify-center">
                        <p className="text-[15px] font-black text-white dir-ltr tracking-tight drop-shadow-md">
                          {(order.price ?? 0).toLocaleString('ar-EG')} د.ع
                        </p>
                        <div className={`flex items-center gap-1 text-[9px] font-bold px-2.5 py-1 rounded-full ${
                          order.status === 'تم تسليم الطلب' ? 'text-amber-300 bg-amber-400/15 border border-amber-400/30' : 
                          order.status === 'مكتمل' ? 'text-emerald-300 bg-emerald-400/10 border border-emerald-400/20' : 'text-orange-300 bg-orange-400/10 border border-orange-400/20'
                        }`}>
                          <span>{order.status}</span>
                          {isDelivered && <CheckCircle2 size={10} />}
                        </div>
                      </div>
                      
                      {showCredentialsBox && (
                         <div className="pr-1 text-gray-500 transition-transform duration-300">
                           <ChevronLeft size={16} className={`transform ${isExpanded ? '-rotate-90 text-amber-400' : ''}`} />
                         </div>
                      )}
                    </div>

                    <AnimatePresence>
                      {showCredentialsBox && isExpanded && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          className="overflow-hidden"
                        >
                          <div className="p-4 pt-0 border-t border-white/5 mt-1 bg-slate-900/20 inline-block w-full">
                            <div className="mt-4 bg-slate-950/90 rounded-[24px] p-5 space-y-3 relative overflow-hidden border border-white/5 shadow-[inset_0_2px_15px_rgba(0,0,0,0.5)]">
                              <div className="flex justify-between items-center text-[11px] text-amber-400 border-b border-white/10 pb-3 mb-2 select-none">
                                <span className="flex items-center gap-1.5 font-bold"><Key size={14} className="text-amber-400/70" /> بيانات حسابك جاهزة الآن</span>
                                <span className="text-gray-500 font-sans text-[10px]">معلومات التسليم الآمن</span>
                              </div>

                              {order.credentials?.username && (
                                <div className="flex items-center justify-between text-xs bg-slate-900/80 rounded-xl p-2.5 pl-3 border border-white/5 transition-colors hover:border-white/10">
                                  <button 
                                    onClick={() => triggerCopy(order.credentials!.username!, 'اسم المستخدم', `${order.id}-user`)}
                                    className="glass-button bg-white/5 text-white hover:text-cyan-400 text-[10px] px-3.5 py-1.5 rounded-lg border border-white/10 font-bold transition-all active:scale-95"
                                  >
                                    {copiedId === `${order.id}-user` ? 'تم النسخ ✓' : 'نسخ'}
                                  </button>
                                  <span className="text-cyan-300 text-right leading-tight break-all font-mono pl-3 selection:bg-amber-400 font-bold block max-w-[170px]">
                                    {order.credentials.username} <span className="text-gray-500 font-sans mr-1.5 text-[10px] font-normal inline-block">/ المستخدم</span>
                                  </span>
                                </div>
                              )}

                              {order.credentials?.password && (
                                <div className="flex items-center justify-between text-xs bg-slate-900/80 rounded-xl p-2.5 pl-3 border border-white/5 transition-colors hover:border-white/10">
                                  <button 
                                    onClick={() => triggerCopy(order.credentials!.password!, 'كلمة المرور', `${order.id}-pw`)}
                                    className="glass-button bg-white/5 text-white hover:text-amber-400 text-[10px] px-3.5 py-1.5 rounded-lg border border-white/10 font-bold transition-all active:scale-95"
                                  >
                                    {copiedId === `${order.id}-pw` ? 'تم النسخ ✓' : 'نسخ'}
                                  </button>
                                  <span className="text-amber-300 text-right leading-tight font-mono pl-3 selection:bg-amber-400 font-bold max-w-[170px] flex items-center justify-end">
                                    {order.credentials.password} <span className="text-gray-500 font-sans mr-1.5 text-[10px] items-center justify-center font-normal inline-block">/ كلمة المرور</span>
                                  </span>
                                </div>
                              )}

                              {order.credentials?.code && (
                                <div className="flex items-center justify-between text-xs bg-slate-900/80 rounded-xl p-2.5 pl-3 border border-white/5 transition-colors hover:border-white/10">
                                  <button 
                                    onClick={() => triggerCopy(order.credentials!.code!, 'كود التفعيل', `${order.id}-code`)}
                                    className="glass-button bg-white/5 text-white hover:text-emerald-400 text-[10px] px-3.5 py-1.5 rounded-lg border border-white/10 font-bold transition-all active:scale-95"
                                  >
                                    {copiedId === `${order.id}-code` ? 'تم النسخ ✓' : 'نسخ الكود'}
                                  </button>
                                  <span className="text-emerald-300 text-right leading-tight font-mono pl-3 selection:bg-amber-400 font-bold max-w-[170px]">
                                    {order.credentials.code} <span className="text-gray-500 font-sans mr-1.5 text-[10px] font-normal inline-block">/ الكود</span>
                                  </span>
                                </div>
                              )}
                              
                              {order.credentials?.keys && order.credentials.keys.map((key: string, idx: number) => (
                                <div key={idx} className="flex items-center justify-between text-xs bg-slate-900/80 rounded-xl p-2.5 pl-3 border border-white/5 transition-colors hover:border-white/10">
                                  <button 
                                    onClick={() => triggerCopy(key, 'المفتاح', `${order.id}-key-${idx}`)}
                                    className="glass-button bg-white/5 text-white hover:text-amber-400 text-[10px] px-3.5 py-1.5 rounded-lg border border-white/10 font-bold transition-all active:scale-95"
                                  >
                                    {copiedId === `${order.id}-key-${idx}` ? 'تم ✓' : 'نسخ'}
                                  </button>
                                  <span className="text-amber-300 text-right leading-tight font-mono pl-3 selection:bg-amber-400 font-bold max-w-[170px]">
                                    {key} <span className="text-gray-500 font-sans mr-1.5 text-[10px] font-normal inline-block">{order.credentials?.keys?.length === 1 ? '/ المفتاح الرقمي' : `/ المفتاح ${idx + 1}`}</span>
                                  </span>
                                </div>
                              ))}

                              {order.credentials?.playerId && (
                                <div className="flex items-center justify-between text-xs border border-cyan-400/20 rounded-xl border-dashed p-3 bg-cyan-950/20 mt-2">
                                  <span className="text-cyan-400 font-black ml-auto text-left leading-tight font-mono selection:bg-amber-400 text-sm">
                                    {order.credentials.playerId}
                                  </span>
                                  <span className="text-gray-400 text-right font-sans mr-1 text-[10px]">كود اللاعب المستهدف لشحن الطلب</span>
                                </div>
                              )}

                              {Object.entries(order.credentials || {}).map(([key, val]) => {
                                if (['username', 'password', 'code', 'keys', 'playerId'].includes(key)) return null;
                                return (
                                  <div key={key} className="flex items-center justify-between text-xs bg-slate-900/80 rounded-xl p-2.5 pl-3 border border-white/5 transition-colors hover:border-white/10">
                                    <button 
                                      onClick={() => triggerCopy(String(val), key, `${order.id}-${key}`)}
                                      className="glass-button bg-white/5 text-white hover:text-cyan-400 text-[10px] px-3.5 py-1.5 rounded-lg border border-white/10 font-bold transition-all active:scale-95"
                                    >
                                      {copiedId === `${order.id}-${key}` ? 'تم النسخ ✓' : 'نسخ'}
                                    </button>
                                    <span className="text-gray-300 text-right leading-tight font-mono pl-3 selection:bg-amber-400 font-bold max-w-[170px]">
                                      {String(val)} <span className="text-gray-500 font-sans mr-1.5 text-[10px] font-normal inline-block">/ {key}</span>
                                    </span>
                                  </div>
                                );
                              })}

                              {order.status === 'تم تسليم الطلب' && !order.isReceiptConfirmed && (
                                <div className="pt-3 border-t border-white/5 mt-3 flex items-start gap-2.5 text-right">
                                   <div className="bg-amber-400/10 p-1.5 rounded-lg text-amber-400 shrink-0 mt-0.5 border border-amber-400/20">
                                      <Shield size={12} />
                                   </div>
                                   <p className="text-[10px] text-gray-400 leading-relaxed font-sans pt-0.5">
                                     تم توفير البيانات الموضحة أعلاه بنجاح. بياناتك مشفرة ولا يمكن لأحد الاطلاع عليها سواك.
                                   </p>
                                </div>
                              )}
                            </div>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>

                    {order.status === 'قيد الانتظار' && (
                       <div className="p-3 mx-4 mb-4 rounded-xl bg-orange-500/10 border border-orange-500/20 flex gap-2 items-start text-right">
                         <AlertTriangle size={14} className="text-orange-400 shrink-0 mt-0.5" />
                         <div className="flex-1">
                           <h4 className="text-[10px] font-bold text-orange-400">الطلب قيد المراجعة والمعالجة</h4>
                           <p className="text-[9px] text-gray-400 mt-1 leading-relaxed">
                             جاري مراجعة طلبك وتوفير معلومات الحساب أو الشحن لكود اللعبة. سيتم التحديث قريباً وإرسال الإشعار هنا.
                           </p>
                         </div>
                       </div>
                    )}

                    {!isDelivered && order.status !== 'قيد الانتظار' && (
                      <div className="p-2.5 mx-4 mb-4 rounded-lg bg-red-500/10 border border-red-500/20 text-center">
                         <p className="text-[10px] text-red-400">
                           عذراً، لم يكتمل هذا الطلب لسبب معين. يرجى التواصل مع الدعم.
                         </p>
                      </div>
                    )}
                  </motion.div>
                );
              })
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
