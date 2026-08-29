'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { ChatMessage, StreamingStatus } from '../../types';
import { StatusBadge } from '../common/StatusBadge';
import { defaultRuntimeAdapter } from '../../services/runtimeAdapter';
import { takePendingPrompt } from '../../services/promptHandoff';
import {
  Send,
  Sparkles,
  Bot,
  User,
  Square,
  Copy,
  Check,
  AlertCircle,
  Paperclip,
  Mic,
  Trash2,
} from 'lucide-react';

export const SmartChatView: React.FC = () => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'msg-1',
      sender: 'assistant',
      content:
        'สวัสดีครับ! ผมคือ **LS_BOTAGENT** ผู้ช่วยอัจฉริยะประจำ LSUPERAGENT V11 ยินดีช่วยเหลือคุณในการคิด วางแผน เขียนคอนเทนต์ และวิเคราะห์ข้อมูล\n\n*(หมายเหตุ: ระบบทำงานในโหมดจำลอง DEMO เนื่องจาก Gateway เป็นสถานะ NOT_CONNECTED)*',
      timestamp: '10:00',
      status: 'completed',
      isDemo: true,
    },
  ]);

  const [inputValue, setInputValue] = useState('');
  const [streamingStatus, setStreamingStatus] = useState<StreamingStatus>('idle');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Everything that must be torn down when the user presses Stop, or when the
  // component unmounts mid-stream. Previously the typing interval kept running
  // after Stop and still marked the message completed.
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  const timeoutsRef = useRef<ReturnType<typeof setTimeout>[]>([]);

  const trackTimeout = useCallback((fn: () => void, ms: number) => {
    const id = setTimeout(fn, ms);
    timeoutsRef.current.push(id);
    return id;
  }, []);

  const teardown = useCallback(() => {
    if (intervalRef.current !== null) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    if (abortRef.current) {
      abortRef.current.abort();
      abortRef.current = null;
    }
    timeoutsRef.current.forEach(clearTimeout);
    timeoutsRef.current = [];
  }, []);

  // Never leave a timer running after the view goes away.
  useEffect(() => teardown, [teardown]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, streamingStatus]);

  const handleSendMessage = useCallback(
    async (textToSend?: string) => {
      const text = (textToSend ?? inputValue).trim();
      if (!text || streamingStatus === 'running' || streamingStatus === 'queued') return;

      const userMsg: ChatMessage = {
        id: `user-${Date.now()}`,
        sender: 'user',
        content: text,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        status: 'completed',
      };

      setMessages((prev) => [...prev, userMsg]);
      setInputValue('');
      setStreamingStatus('queued');

      const controller = new AbortController();
      abortRef.current = controller;

      try {
        setStreamingStatus('running');
        const botMsgId = `bot-${Date.now()}`;
        setMessages((prev) => [
          ...prev,
          {
            id: botMsgId,
            sender: 'assistant',
            content: '',
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            status: 'partial',
            isDemo: false,
          },
        ]);

        const result = await defaultRuntimeAdapter.executePrompt(text, 'smart_chat');

        // The user may have pressed Stop while the request was in flight.
        if (controller.signal.aborted) return;

        const fullResponse = result.message;
        const isDemo = result.status !== 'SUCCESS';

        let currentLength = 0;
        intervalRef.current = setInterval(() => {
          if (controller.signal.aborted) {
            if (intervalRef.current !== null) clearInterval(intervalRef.current);
            intervalRef.current = null;
            return;
          }

          currentLength += 20;

          if (currentLength >= fullResponse.length) {
            if (intervalRef.current !== null) clearInterval(intervalRef.current);
            intervalRef.current = null;
            abortRef.current = null;
            setMessages((prev) =>
              prev.map((m) =>
                m.id === botMsgId ? { ...m, content: fullResponse, status: 'completed', isDemo } : m
              )
            );
            setStreamingStatus('completed');
            trackTimeout(() => setStreamingStatus('idle'), 500);
          } else {
            const slice = fullResponse.slice(0, currentLength);
            setMessages((prev) =>
              prev.map((m) =>
                m.id === botMsgId ? { ...m, content: slice, status: 'partial', isDemo } : m
              )
            );
          }
        }, 40);
      } catch {
        if (controller.signal.aborted) return;
        setStreamingStatus('failed');
        trackTimeout(() => setStreamingStatus('idle'), 800);
      }
    },
    [inputValue, streamingStatus, trackTimeout]
  );

  /**
   * Stop actually stops: clears the typing interval, aborts the in-flight
   * request, and freezes the partial message instead of letting it finish.
   */
  const handleStopStreaming = useCallback(() => {
    teardown();
    setMessages((prev) =>
      prev.map((m) => (m.status === 'partial' ? { ...m, status: 'cancelled' } : m))
    );
    setStreamingStatus('cancelled');
    trackTimeout(() => setStreamingStatus('idle'), 600);
  }, [teardown, trackTimeout]);

  // A prompt typed on the landing page arrives here and is sent once.
  const handoffConsumed = useRef(false);
  useEffect(() => {
    if (handoffConsumed.current) return;
    handoffConsumed.current = true;
    const pending = takePendingPrompt();
    // sessionStorage is only readable on the client, so this hand-off can only
    // run after mount.
    if (!pending) return;
    const send = window.setTimeout(() => void handleSendMessage(pending), 0);
    return () => window.clearTimeout(send);
  }, [handleSendMessage]);

  const handleCopy = (id: string, text: string) => {
    void navigator.clipboard?.writeText(text);
    setCopiedId(id);
    trackTimeout(() => setCopiedId(null), 2000);
  };

  const handleClearChat = () => {
    teardown();
    setStreamingStatus('idle');
    setMessages([
      {
        id: 'msg-init',
        sender: 'assistant',
        content: 'เริ่มต้นบทสนทนาใหม่แล้วครับ คุณต้องการให้ LSUPERAGENT ช่วยอะไรในวันนี้?',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        status: 'completed',
        isDemo: true,
      },
    ]);
  };

  const suggestions = [
    'สรุปเนื้อหาบทความนี้ให้หน่อย',
    'ร่างโครงสร้างโครงการ AI สำหรับทีมงาน',
    'เขียนอีเมลประสานงานลูกค้าแบบมืออาชีพ',
    'ช่วยตั้งชื่อแคมเปญการตลาดใหม่',
  ];

  const isStreaming = streamingStatus === 'running' || streamingStatus === 'queued';

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)] max-w-[1120px] mx-auto px-2 sm:px-6 pb-16 md:pb-6">
      {/* Surface Header */}
      <div className="py-3 px-4 mb-2 bg-[#131525] border border-[#312E81] rounded-2xl flex items-center justify-between shadow-lg">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#FF00FF] to-[#7B2CFE] flex items-center justify-center text-white shadow-md shadow-[#7B2CFE]/30">
            <Bot className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-sm sm:text-base font-bold text-white">LS_BOTAGENT (Smart Chat)</h2>
              <StatusBadge type="demo" text="DEMO" size="sm" />
            </div>
            <p className="text-[11px] text-white/50">โหมดถาม-ตอบอัจฉริยะภาษาไทย · V11 Public Beta</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleClearChat}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#0C0D1A] border border-[#312E81] hover:border-[#7B2CFE] text-xs text-white/50 hover:text-white transition-colors min-h-[36px]"
            title="ล้างบทสนทนา"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">ล้างแชท</span>
          </button>
        </div>
      </div>

      {/* Honest Warning Banner */}
      <div className="mb-2 px-3.5 py-2 rounded-xl bg-red-500/10 border border-red-500/20 text-xs text-red-300 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
          <span>
            สถานะ Gateway: <strong>NOT_CONNECTED</strong> (Mock Adapter ทำงาน)
          </span>
        </div>
        <StatusBadge type="not_connected" text="OFFLINE" size="sm" />
      </div>

      {/* Messages Thread */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 rounded-2xl bg-[#0C0D1A] border border-[#312E81]">
        {messages.map((msg) => {
          const isUser = msg.sender === 'user';
          return (
            <div
              key={msg.id}
              className={`flex gap-3 max-w-[90%] sm:max-w-[80%] ${
                isUser ? 'ml-auto flex-row-reverse' : 'mr-auto'
              }`}
            >
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 mt-1 text-xs ${
                  isUser
                    ? 'bg-[#00D1FF] text-black font-bold'
                    : 'bg-gradient-to-br from-[#FF00FF] to-[#7B2CFE] text-white'
                }`}
              >
                {isUser ? <User className="w-4 h-4 text-black" /> : <Bot className="w-4 h-4" />}
              </div>

              <div
                className={`min-w-0 p-4 rounded-2xl text-sm leading-relaxed transition-all shadow-md ${
                  isUser
                    ? 'bg-[#1E2338] text-white border border-[#312E81]'
                    : 'bg-[#131525] text-white/90 border border-[#312E81]'
                }`}
              >
                {isUser ? (
                  <div className="whitespace-pre-wrap font-sans break-words">{msg.content}</div>
                ) : (
                  <div className="v11-markdown min-w-0 break-words">
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>{msg.content}</ReactMarkdown>
                  </div>
                )}

                <div className="flex items-center justify-between gap-4 mt-2 pt-1 border-t border-white/5 text-[11px] text-white/40">
                  <span>{msg.timestamp}</span>
                  <div className="flex items-center gap-2">
                    {msg.status === 'cancelled' && (
                      <span className="text-[10px] text-red-400 font-mono">STOPPED</span>
                    )}
                    {msg.isDemo && <span className="text-[10px] text-yellow-500 font-mono">DEMO</span>}
                    {!isUser && (
                      <button
                        onClick={() => handleCopy(msg.id, msg.content)}
                        className="hover:text-white transition-colors p-1"
                        title="คัดลอกข้อความ"
                      >
                        {copiedId === msg.id ? (
                          <Check className="w-3.5 h-3.5 text-emerald-400" />
                        ) : (
                          <Copy className="w-3.5 h-3.5" />
                        )}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          );
        })}

        {streamingStatus === 'running' && (
          <div className="flex items-center gap-2 text-xs text-[#7B2CFE] animate-pulse pl-11">
            <Sparkles className="w-4 h-4" />
            <span>LS_BOTAGENT กำลังตอบกลับ...</span>
          </div>
        )}

        {streamingStatus === 'queued' && (
          <div className="flex items-center gap-2 text-xs text-[#00D1FF] animate-pulse pl-11">
            <span className="w-2 h-2 rounded-full bg-[#00D1FF]" />
            <span>กำลังจัดคิวคำขอ...</span>
          </div>
        )}

        {streamingStatus === 'cancelled' && (
          <div className="flex items-center gap-2 text-xs text-red-400 pl-11">
            <Square className="w-3.5 h-3.5" />
            <span>หยุดการตอบแล้ว</span>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Suggestion Chips */}
      {messages.length <= 2 && (
        <div className="flex items-center gap-2 py-2 overflow-x-auto scrollbar-none">
          {suggestions.map((sug, i) => (
            <button
              key={i}
              onClick={() => handleSendMessage(sug)}
              className="whitespace-nowrap px-3.5 py-1.5 rounded-full bg-[#131525] border border-[#312E81] hover:border-[#7B2CFE] text-xs text-white/50 hover:text-white transition-all cursor-pointer min-h-[36px]"
            >
              💬 {sug}
            </button>
          ))}
        </div>
      )}

      {/* Composer */}
      <div className="relative pt-2">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            void handleSendMessage();
          }}
          className="relative flex items-center gap-2 bg-[#131525] border border-[#312E81] focus-within:border-[#7B2CFE] rounded-2xl p-2 transition-all shadow-lg"
        >
          <button
            type="button"
            className="w-10 h-10 rounded-xl text-white/40 hover:text-white hover:bg-[#1A1C30] flex items-center justify-center transition-colors min-h-[44px] min-w-[44px]"
            title="แนบไฟล์ (จำลอง)"
          >
            <Paperclip className="w-4 h-4" />
          </button>

          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder="พิมพ์คำถามของคุณ..."
            className="flex-1 min-w-0 bg-transparent text-sm sm:text-base text-white placeholder:text-white/30 outline-none px-2"
          />

          <button
            type="button"
            className="w-10 h-10 rounded-xl text-white/40 hover:text-white hover:bg-[#1A1C30] flex items-center justify-center transition-colors min-h-[44px] min-w-[44px]"
            title="พิมพ์ด้วยเสียง (จำลอง)"
          >
            <Mic className="w-4 h-4" />
          </button>

          {isStreaming ? (
            <button
              type="button"
              onClick={handleStopStreaming}
              className="w-11 h-11 rounded-xl bg-red-500 hover:bg-red-600 text-white flex items-center justify-center transition-all cursor-pointer min-h-[44px] min-w-[44px]"
              title="หยุดการทำงาน"
            >
              <Square className="w-4 h-4" />
            </button>
          ) : (
            <button
              type="submit"
              disabled={!inputValue.trim()}
              className="w-11 h-11 rounded-xl bg-gradient-to-r from-[#FF00FF] to-[#7B2CFE] hover:opacity-90 text-white flex items-center justify-center disabled:opacity-40 disabled:cursor-not-allowed transition-all cursor-pointer min-h-[44px] min-w-[44px] shadow-[0_2px_12px_rgba(123,44,254,0.4)]"
              title="ส่งข้อความ"
            >
              <Send className="w-4 h-4" />
            </button>
          )}
        </form>
      </div>
    </div>
  );
};
