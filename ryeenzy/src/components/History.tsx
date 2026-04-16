import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Search, MessageSquare, Code, Trash2, Calendar, Clock, ChevronRight } from 'lucide-react';
import { auth, db } from '../firebase';
import { collection, query, orderBy, onSnapshot, deleteDoc, doc } from 'firebase/firestore';
import { cn } from '../lib/utils';
import { Tab } from '../App';

import { handleFirestoreError, OperationType } from '../lib/firestoreErrorHandler';

interface HistoryProps {
  setActiveTab: (tab: Tab) => void;
  setSelectedChatId: (id: string | null) => void;
}

export default function History({ setActiveTab, setSelectedChatId }: HistoryProps) {
  const [chats, setChats] = useState<any[]>([]);
  const [projects, setProjects] = useState<any[]>([]);
  const [activeType, setActiveType] = useState<'chats' | 'projects'>('chats');
  const [search, setSearch] = useState('');
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<any>(null);
  const [isClearingAll, setIsClearingAll] = useState(false);

  useEffect(() => {
    const user = auth.currentUser;
    if (!user) return;

    const chatsQ = query(collection(db, 'users', user.uid, 'chats'), orderBy('createdAt', 'desc'));
    const projectsQ = query(collection(db, 'users', user.uid, 'projects'), orderBy('createdAt', 'desc'));

    const unsubChats = onSnapshot(chatsQ, (snapshot) => {
      setChats(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, `users/${user.uid}/chats`);
    });

    const unsubProjects = onSnapshot(projectsQ, (snapshot) => {
      setProjects(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, `users/${user.uid}/projects`);
    });

    return () => {
      unsubChats();
      unsubProjects();
    };
  }, []);

  const deleteItem = async () => {
    const user = auth.currentUser;
    if (!user || !itemToDelete) return;
    try {
      await deleteDoc(doc(db, 'users', user.uid, activeType, itemToDelete.id));
      setShowDeleteModal(false);
      setItemToDelete(null);
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `users/${user.uid}/${activeType}/${itemToDelete.id}`);
    }
  };

  const clearAllHistory = async () => {
    const user = auth.currentUser;
    if (!user) return;
    
    try {
      const items = activeType === 'chats' ? chats : projects;
      const deletePromises = items.map(item => deleteDoc(doc(db, 'users', user.uid, activeType, item.id)));
      await Promise.all(deletePromises);
      setShowDeleteModal(false);
      setIsClearingAll(false);
    } catch (error) {
      console.error("Error clearing history:", error);
    }
  };

  const openItem = (item: any) => {
    if (activeType === 'chats') {
      setSelectedChatId(item.id);
      setActiveTab('ai');
    } else {
      setActiveTab('coding');
    }
  };

  const filteredItems = (activeType === 'chats' ? chats : projects).filter(item => 
    (item.title || item.name || '').toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="h-full p-4 md:p-8 overflow-y-auto custom-scrollbar">
      <div className="max-w-4xl mx-auto">
        <header className="mb-6 md:mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight mb-2">History</h1>
            <p className="text-silver/40 text-xs md:text-sm">Manage your previous interactions and projects.</p>
          </div>
          <div className="flex bg-white/5 p-1 rounded-xl border border-white/10 self-start md:self-auto">
            <button
              onClick={() => setActiveType('chats')}
              className={cn(
                "px-4 py-2 rounded-lg text-sm font-medium transition-all",
                activeType === 'chats' ? "bg-white text-black" : "text-silver/60 hover:text-white"
              )}
            >
              Chats
            </button>
            <button
              onClick={() => setActiveType('projects')}
              className={cn(
                "px-4 py-2 rounded-lg text-sm font-medium transition-all",
                activeType === 'projects' ? "bg-white text-black" : "text-silver/60 hover:text-white"
              )}
            >
              Projects
            </button>
          </div>
        </header>

        <div className="relative mb-8 flex gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-silver/40" />
            <input
              type="text"
              placeholder={`Search ${activeType}...`}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 pl-12 pr-4 text-white placeholder:text-silver/20 focus:outline-none focus:border-silver/40 transition-colors"
            />
          </div>
          <button 
            onClick={() => {
              setIsClearingAll(true);
              setShowDeleteModal(true);
            }}
            className="px-6 py-4 bg-red-500/10 text-red-400 border border-red-500/20 rounded-2xl hover:bg-red-500/20 transition-all flex items-center gap-2 text-sm font-bold"
          >
            <Trash2 className="w-4 h-4" />
            <span className="hidden md:inline">Clear All</span>
          </button>
        </div>

        <div className="space-y-4">
          {filteredItems.length === 0 ? (
            <div className="text-center py-20 opacity-20">
              <Clock className="w-16 h-16 mx-auto mb-4" />
              <p>No history found</p>
            </div>
          ) : (
            filteredItems.map((item, i) => (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                onClick={() => openItem(item)}
                className="group flex items-center gap-4 p-4 rounded-2xl bg-white/5 border border-white/10 hover:border-white/20 transition-all cursor-pointer"
              >
                <div className="w-12 h-12 rounded-xl bg-white/5 flex items-center justify-center shrink-0">
                  {activeType === 'chats' ? <MessageSquare className="w-5 h-5 text-blue-400" /> : <Code className="w-5 h-5 text-emerald-400" />}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold truncate">{item.title || item.name}</h3>
                  <div className="flex items-center gap-3 text-xs text-silver/40 mt-1">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      {new Date(item.createdAt?.seconds * 1000 || item.createdAt).toLocaleDateString()}
                    </span>
                    {item.lastMessage && (
                      <span className="truncate max-w-[200px]">{item.lastMessage}</span>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button 
                    onClick={(e) => { 
                      e.stopPropagation(); 
                      setItemToDelete(item);
                      setIsClearingAll(false);
                      setShowDeleteModal(true);
                    }}
                    className="p-2 hover:bg-red-500/10 text-silver/40 hover:text-red-400 rounded-lg transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                  <ChevronRight className="w-4 h-4 text-silver/20" />
                </div>
              </motion.div>
            ))
          )}
        </div>

        <AnimatePresence>
          {showDeleteModal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
              <motion.div
                initial={{ opacity: 0, scale: 0.9, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9, y: 20 }}
                className="bg-[#0a0a0a] border border-red-500/30 p-8 rounded-[2.5rem] w-full max-w-sm shadow-[0_0_80px_rgba(239,68,68,0.15)] relative overflow-hidden"
              >
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-red-500 to-transparent opacity-50" />
                
                <div className="w-20 h-20 bg-red-500/10 rounded-3xl flex items-center justify-center mb-8 mx-auto relative group">
                  <motion.div
                    animate={{ scale: [1, 1.2, 1], opacity: [0.5, 0.8, 0.5] }}
                    transition={{ duration: 2, repeat: Infinity }}
                    className="absolute inset-0 bg-red-500/20 rounded-3xl blur-xl"
                  />
                  <Trash2 className="w-10 h-10 text-red-500 relative z-10" />
                </div>
                
                <h3 className="text-2xl font-bold mb-3 text-center tracking-tight">
                  {isClearingAll ? `Purge all ${activeType}?` : 'Confirm Deletion'}
                </h3>
                
                <p className="text-sm text-silver/50 mb-10 text-center leading-relaxed px-4">
                  {isClearingAll 
                    ? `This will permanently erase every single ${activeType} entry. This action is terminal and cannot be reversed.`
                    : "This entry will be permanently removed from the neural archive. Proceed with caution."}
                </p>
                
                <div className="grid grid-cols-2 gap-4">
                  <button
                    onClick={() => {
                      setShowDeleteModal(false);
                      setItemToDelete(null);
                      setIsClearingAll(false);
                    }}
                    className="py-4 rounded-2xl bg-white/5 border border-white/5 hover:bg-white/10 hover:border-white/10 transition-all text-sm font-semibold text-silver/80"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={isClearingAll ? clearAllHistory : deleteItem}
                    className="py-4 rounded-2xl bg-red-500 text-white hover:bg-red-600 transition-all text-sm font-bold shadow-[0_10px_30px_rgba(239,68,68,0.3)] border border-red-400/20"
                  >
                    Delete Forever
                  </button>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
