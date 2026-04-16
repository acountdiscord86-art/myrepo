import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Send, Image as ImageIcon, Mic, Paperclip, MoreVertical, Trash2, RotateCcw, User as UserIcon, Bot, Sparkles, Copy, Check as CheckIcon, Code } from 'lucide-react';
import { GoogleGenAI } from "@google/genai";
import ReactMarkdown from 'react-markdown';
import { cn } from '../lib/utils';
import { auth, db } from '../firebase';
import { collection, addDoc, query, orderBy, onSnapshot, serverTimestamp, setDoc, doc, deleteDoc, getDocs } from 'firebase/firestore';
import { useDropzone } from 'react-dropzone';

const getApiKey = () => {
  const localKey = localStorage.getItem('custom_gemini_api_key');
  if (localKey && localKey.trim() !== "") return localKey;
  return process.env.GEMINI_API_KEY;
};

const ai = new GoogleGenAI({ apiKey: getApiKey() || "" });

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: any;
  attachments?: string[];
}

import { User } from 'firebase/auth';
import { handleFirestoreError, OperationType } from '../lib/firestoreErrorHandler';

interface ChatProps {
  user: User;
  bubbleStyle?: string;
  initialChatId?: string | null;
  onChatCreated?: (id: string) => void;
}

export default function Chat({ user, bubbleStyle = 'modern', initialChatId, onChatCreated }: ChatProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [chatId, setChatId] = useState<string | null>(initialChatId || null);
  const [attachments, setAttachments] = useState<File[]>([]);
  const [isRecording, setIsRecording] = useState(false);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setChatId(initialChatId || null);
    if (!initialChatId) {
      setMessages([]);
    }
  }, [initialChatId]);

  useEffect(() => {
    const currentId = chatId || 'initial-placeholder';
    const chatPath = collection(db, 'users', user.uid, 'chats', currentId, 'messages');
    const q = query(
      chatPath,
      orderBy('timestamp', 'asc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const msgs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Message));
      if (chatId) setMessages(msgs);
    }, (error) => {
      if (chatId) handleFirestoreError(error, OperationType.GET, `users/${user.uid}/chats/${chatId}/messages`);
    });

    return () => unsubscribe();
  }, [user.uid, chatId]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages, isTyping]);

  const onDrop = (acceptedFiles: File[]) => {
    setAttachments([...attachments, ...acceptedFiles]);
  };

  const { getRootProps, getInputProps, isDragActive, open } = useDropzone({ 
    onDrop,
    accept: { 
      'image/*': [],
      'audio/*': [],
      'application/pdf': [],
      'text/*': []
    },
    noClick: true
  });

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      
      const chunks: Blob[] = [];
      mediaRecorder.ondataavailable = (e) => chunks.push(e.data);
      mediaRecorder.onstop = () => {
        const blob = new Blob(chunks, { type: 'audio/webm' });
        setAudioBlob(blob);
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
    } catch (err) {
      console.error("Error accessing microphone:", err);
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const copyCodeOnly = (content: string, id: string) => {
    const codeBlockRegex = /```(?:[\w]*\n)?([\s\S]*?)```/g;
    const matches = [...content.matchAll(codeBlockRegex)];
    if (matches.length > 0) {
      const allCode = matches.map(m => m[1]).join('\n\n');
      navigator.clipboard.writeText(allCode);
      setCopiedId(id + '-code');
      setTimeout(() => setCopiedId(null), 2000);
    }
  };

  const copyToClipboard = (text: string, id: string) => {
    // Remove code blocks for "text only" copy if desired, or keep as is.
    // User asked for code-only copy, so we'll keep this as "Copy All" but add a specific "Copy Code" button.
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const extractCodeToIDE = async (content: string) => {
    const codeBlockRegex = /```(?:[\w]*\n)?([\s\S]*?)```/g;
    const matches = [...content.matchAll(codeBlockRegex)];
    
    if (matches.length > 0) {
      const code = matches[0][1]; // Get first code block
      try {
        await setDoc(doc(db, 'users', user.uid, 'ide', 'current'), {
          code,
          language: 'javascript',
          updatedAt: serverTimestamp()
        }, { merge: true });
        alert("Code has been sent to the Coding IDE!");
      } catch (error) {
        console.error("Error sending code to IDE:", error);
      }
    }
  };

  const deleteChatHistory = async () => {
    if (!chatId) return;
    if (!confirm("Are you sure you want to delete all messages in this chat?")) return;
    
    const chatPath = collection(db, 'users', user.uid, 'chats', chatId, 'messages');
    const snapshot = await getDocs(chatPath);
    
    const deletePromises = snapshot.docs.map(d => deleteDoc(d.ref));
    await Promise.all(deletePromises);
    
    await setDoc(doc(db, 'users', user.uid, 'chats', chatId), {
      lastMessage: '',
      updatedAt: serverTimestamp()
    }, { merge: true });
  };

  const startNewChat = () => {
    setMessages([]);
    setChatId(null);
  };

  const sendMessage = async () => {
    if ((!input.trim() && attachments.length === 0 && !audioBlob) || !auth.currentUser) return;

    const userContent = input;
    const currentAttachments = [...attachments];
    const currentAudio = audioBlob;
    const isNew = !chatId;
    const currentChatId = chatId || doc(collection(db, 'users', user.uid, 'chats')).id;
    
    setInput('');
    setAttachments([]);
    setAudioBlob(null);
    setIsTyping(true);

    if (isNew) {
      setChatId(currentChatId);
      if (onChatCreated) onChatCreated(currentChatId);
    }

    try {
      const chatPath = collection(db, 'users', user.uid, 'chats', currentChatId, 'messages');
      
      // Add user message to Firestore
      await addDoc(chatPath, {
        role: 'user',
        content: userContent,
        timestamp: serverTimestamp(),
        attachments: [
          ...currentAttachments.map(f => f.name),
          ...(currentAudio ? ['voice_message.webm'] : [])
        ]
      });

      // Update parent chat document
      await setDoc(doc(db, 'users', user.uid, 'chats', currentChatId), {
        title: userContent.slice(0, 30) + (userContent.length > 30 ? '...' : '') || 'New Chat',
        lastMessage: userContent.slice(0, 50) + (userContent.length > 50 ? '...' : ''),
        createdAt: isNew ? serverTimestamp() : undefined,
        updatedAt: serverTimestamp()
      }, { merge: true });

      // Prepare Gemini parts
      const parts: any[] = [{ text: userContent || "Analyze this media:" }];
      
      for (const file of currentAttachments) {
        const base64 = await fileToBase64(file);
        parts.push({
          inlineData: {
            mimeType: file.type,
            data: base64.split(',')[1]
          }
        });
      }

      if (currentAudio) {
        const reader = new FileReader();
        const base64Promise = new Promise<string>((resolve) => {
          reader.onloadend = () => resolve(reader.result as string);
          reader.readAsDataURL(currentAudio);
        });
        const base64 = await base64Promise;
        parts.push({
          inlineData: {
            mimeType: 'audio/webm',
            data: base64.split(',')[1]
          }
        });
      }

      // Call Gemini
      try {
        const response = await ai.models.generateContent({
          model: "gemini-flash-latest",
          contents: { parts },
          config: {
            systemInstruction: "You are RyeenzyAI, a futuristic and highly intelligent AI assistant. Your responses should be helpful, creative, and professional. You can assist with coding, creative writing, and general knowledge. If the user sends an image or audio, analyze it carefully."
          }
        });

        const aiResponse = response.text;

        // Add AI response to Firestore
        await addDoc(chatPath, {
          role: 'assistant',
          content: aiResponse,
          timestamp: serverTimestamp()
        });
      } catch (geminiError: any) {
        console.error("Gemini Error:", geminiError);
        let errorMessage = "I encountered an error processing your request.";
        
        const errorBody = geminiError.message || String(geminiError);
        if (errorBody.includes('429') || errorBody.includes('RESOURCE_EXHAUSTED')) {
          errorMessage = "Quota exceeded for the Gemini API. This usually happens on the free tier when too many requests are sent in a short time. Please wait a minute and try again, or check your API quota at https://aistudio.google.com/app/plan_and_billing";
        } else if (geminiError.message === "API_KEY_MISSING" || errorBody.includes('API_KEY_INVALID') || errorBody.includes('API key not valid')) {
          errorMessage = "Gemini API Key is missing or invalid. Please make sure you have an API Key set in your Google AI Studio settings.";
        } else if (errorBody.includes('500')) {
          errorMessage = "The AI service is currently experiencing issues. Please try again later.";
        } else {
          errorMessage = `Gemini API Error: ${errorBody}`;
        }

        await addDoc(chatPath, {
          role: 'assistant',
          content: `⚠️ **System Note:** ${errorMessage}`,
          timestamp: serverTimestamp()
        });
      }

    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, `users/${user.uid}/chats/default/messages`);
    } finally {
      setIsTyping(false);
    }
  };

  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = error => reject(error);
    });
  };

  return (
    <div className="h-full flex flex-col bg-black/20 backdrop-blur-sm" {...getRootProps()}>
      <input {...getInputProps()} />
      
      {/* Header */}
      <header className="px-4 md:px-6 py-3 md:py-4 border-b border-white/10 flex items-center justify-between bg-black/40">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 md:w-10 md:h-10 rounded-full overflow-hidden border border-white/10 flex items-center justify-center">
            <img 
              src="https://www.image2url.com/r2/default/images/1776259988731-7cc679d1-4c75-4ec5-b335-ad5c748f0010.png" 
              alt="AI Logo" 
              className="w-full h-full object-cover"
              referrerPolicy="no-referrer"
            />
          </div>
          <div>
            <h2 className="font-bold text-sm md:text-base">RyeenzyAI</h2>
            <div className="flex items-center gap-1.5">
              <div className="w-1 h-1 md:w-1.5 md:h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-[8px] md:text-[10px] text-silver/40 uppercase tracking-widest">System Online</span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-1 md:gap-2">
          <button 
            onClick={deleteChatHistory}
            className="p-1.5 md:p-2 hover:bg-red-500/10 rounded-lg text-silver/40 hover:text-red-400 transition-colors"
            title="Delete History"
          >
            <Trash2 className="w-3.5 h-3.5 md:w-4 md:h-4" />
          </button>
          <button 
            onClick={startNewChat}
            className="p-1.5 md:p-2 hover:bg-white/5 rounded-lg text-silver/40 hover:text-white transition-colors"
            title="New Chat"
          >
            <RotateCcw className="w-3.5 h-3.5 md:w-4 md:h-4" />
          </button>
          <button className="p-1.5 md:p-2 hover:bg-white/5 rounded-lg text-silver/40 hover:text-white transition-colors">
            <MoreVertical className="w-3.5 h-3.5 md:w-4 md:h-4" />
          </button>
        </div>
      </header>

      {/* Messages */}
      <div 
        ref={scrollRef}
        className="flex-1 overflow-y-auto p-4 md:p-6 space-y-6 md:space-y-8 custom-scrollbar"
      >
        {messages.length === 0 && !isTyping && (
          <div className="h-full flex flex-col items-center justify-center text-center opacity-40 p-4">
            <Sparkles className="w-10 h-10 md:w-12 md:h-12 mb-4 text-silver" />
            <h3 className="text-lg md:text-xl font-bold mb-2">How can I help you today?</h3>
            <p className="text-xs md:text-sm max-w-xs">Ask me anything, from complex coding problems to creative storytelling.</p>
          </div>
        )}

        {messages.map((msg) => (
          <motion.div
            key={msg.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className={cn(
              "flex gap-3 md:gap-4 max-w-4xl mx-auto",
              msg.role === 'user' ? "flex-row-reverse" : "flex-row"
            )}
          >
            <div className={cn(
              "w-7 h-7 md:w-8 md:h-8 rounded-lg flex items-center justify-center shrink-0 overflow-hidden",
              msg.role === 'user' ? "bg-white/10" : "bg-accent/10"
            )}>
              {msg.role === 'user' ? (
                <UserIcon className="w-3.5 h-3.5 md:w-4 md:h-4" />
              ) : (
                <img 
                  src="https://www.image2url.com/r2/default/images/1776259988731-7cc679d1-4c75-4ec5-b335-ad5c748f0010.png" 
                  alt="AI" 
                  className="w-full h-full object-cover"
                  referrerPolicy="no-referrer"
                />
              )}
            </div>
            <div className={cn(
              "space-y-2 max-w-[85%] md:max-w-[80%]",
              msg.role === 'user' ? "items-end" : "items-start"
            )}>
              <div className={cn(
                "p-3 md:p-4 rounded-2xl text-xs md:text-sm leading-relaxed transition-all",
                bubbleStyle === 'glass' && "bubble-glass",
                bubbleStyle === 'minimal' && (msg.role === 'user' ? "bubble-minimal-user" : "bubble-minimal"),
                bubbleStyle === 'modern' && (msg.role === 'user' ? "bubble-modern" : "bubble-bot-modern"),
                bubbleStyle === 'cyber' && (msg.role === 'user' ? "bubble-cyber" : "bubble-bot-cyber"),
                bubbleStyle === 'neo' && (msg.role === 'user' ? "bubble-neo" : "bubble-bot-neo"),
                msg.role === 'user' 
                  ? "rounded-tr-none" 
                  : "rounded-tl-none"
              )}>
                <div className="prose prose-invert prose-xs md:prose-sm max-w-none">
                  <ReactMarkdown>
                    {msg.content}
                  </ReactMarkdown>
                </div>
                <div className="mt-2 flex flex-wrap items-center gap-2 border-t border-white/5 pt-2">
                  <button 
                    onClick={() => copyToClipboard(msg.content, msg.id)}
                    className="p-1 hover:bg-white/5 rounded text-silver/40 hover:text-white transition-colors flex items-center gap-1 text-[10px]"
                  >
                    {copiedId === msg.id ? <CheckIcon className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3" />}
                    {copiedId === msg.id ? 'Copied' : 'Copy All'}
                  </button>
                  {msg.role === 'assistant' && msg.content.includes('```') && (
                    <>
                      <button 
                        onClick={() => copyCodeOnly(msg.content, msg.id)}
                        className="p-1 hover:bg-white/5 rounded text-silver/40 hover:text-white transition-colors flex items-center gap-1 text-[10px]"
                      >
                        {copiedId === msg.id + '-code' ? <CheckIcon className="w-3 h-3 text-emerald-500" /> : <Code className="w-3 h-3" />}
                        {copiedId === msg.id + '-code' ? 'Code Copied' : 'Copy Code'}
                      </button>
                      <button 
                        onClick={() => extractCodeToIDE(msg.content)}
                        className="p-1 hover:bg-white/5 rounded text-silver/40 hover:text-white transition-colors flex items-center gap-1 text-[10px]"
                      >
                        <Code className="w-3 h-3" />
                        Send to IDE
                      </button>
                    </>
                  )}
                </div>
              </div>
              {msg.attachments && msg.attachments.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {msg.attachments.map((att, i) => (
                    <div key={i} className="px-2 py-1 bg-white/5 border border-white/10 rounded text-[10px] text-silver/40">
                      {att}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        ))}

        {isTyping && (
          <div className="flex gap-4 max-w-4xl mx-auto">
            <div className="w-8 h-8 rounded-lg bg-accent/10 flex items-center justify-center shrink-0 overflow-hidden">
              <img 
                src="https://www.image2url.com/r2/default/images/1776259988731-7cc679d1-4c75-4ec5-b335-ad5c748f0010.png" 
                alt="AI" 
                className="w-full h-full object-cover"
                referrerPolicy="no-referrer"
              />
            </div>
            <div className="bg-white/5 border border-white/10 p-4 rounded-2xl rounded-tl-none">
              <div className="flex gap-1">
                <motion.div animate={{ opacity: [0.3, 1, 0.3] }} transition={{ repeat: Infinity, duration: 1 }} className="w-1.5 h-1.5 bg-accent rounded-full" />
                <motion.div animate={{ opacity: [0.3, 1, 0.3] }} transition={{ repeat: Infinity, duration: 1, delay: 0.2 }} className="w-1.5 h-1.5 bg-accent rounded-full" />
                <motion.div animate={{ opacity: [0.3, 1, 0.3] }} transition={{ repeat: Infinity, duration: 1, delay: 0.4 }} className="w-1.5 h-1.5 bg-accent rounded-full" />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Input Area */}
      <footer className="p-6 bg-black/40 border-t border-white/10">
        <div className="max-w-4xl mx-auto relative">
          { (attachments.length > 0 || audioBlob) && (
            <div className="absolute bottom-full left-0 mb-4 flex flex-wrap gap-2">
              {attachments.map((file, i) => (
                <div key={i} className="flex items-center gap-2 bg-white/10 border border-white/10 px-3 py-1.5 rounded-full text-xs">
                  <ImageIcon className="w-3 h-3" />
                  <span className="truncate max-w-[100px]">{file.name}</span>
                  <button onClick={() => setAttachments(attachments.filter((_, idx) => idx !== i))} className="hover:text-red-400">
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              ))}
              {audioBlob && (
                <div className="flex items-center gap-2 bg-emerald-500/20 border border-emerald-500/20 px-3 py-1.5 rounded-full text-xs text-emerald-400">
                  <Mic className="w-3 h-3" />
                  <span>Voice Message</span>
                  <button onClick={() => setAudioBlob(null)} className="hover:text-red-400">
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              )}
            </div>
          )}

          <div className={cn(
            "relative bg-white/5 border border-white/10 rounded-2xl p-2 transition-all duration-300",
            isDragActive && "border-silver bg-white/10 scale-[1.01]"
          )}>
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  sendMessage();
                }
              }}
              placeholder={isDragActive ? "Drop images here..." : "Type your message..."}
              className="w-full bg-transparent border-none focus:ring-0 text-sm p-3 min-h-[50px] max-h-[200px] resize-none placeholder:text-silver/20"
            />
            <div className="flex items-center justify-between px-2 pb-1">
              <div className="flex items-center gap-1">
                <button 
                  onClick={() => open()}
                  className="p-2 hover:bg-white/5 rounded-lg text-silver/40 hover:text-white transition-colors"
                >
                  <Paperclip className="w-4 h-4" />
                </button>
                <button 
                  onClick={() => open()}
                  className="p-2 hover:bg-white/5 rounded-lg text-silver/40 hover:text-white transition-colors"
                >
                  <ImageIcon className="w-4 h-4" />
                </button>
                <button 
                  onMouseDown={startRecording}
                  onMouseUp={stopRecording}
                  onMouseLeave={stopRecording}
                  onTouchStart={startRecording}
                  onTouchEnd={stopRecording}
                  className={cn(
                    "p-2 rounded-lg transition-all",
                    isRecording ? "bg-red-500 text-white animate-pulse" : "hover:bg-white/5 text-silver/40 hover:text-white"
                  )}
                >
                  <Mic className="w-4 h-4" />
                </button>
              </div>
              <button
                onClick={sendMessage}
                disabled={(!input.trim() && attachments.length === 0 && !audioBlob) || isTyping}
                className="bg-accent text-black p-2.5 rounded-xl hover:opacity-90 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Send className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
