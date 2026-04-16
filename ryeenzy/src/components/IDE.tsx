import { useState, useEffect } from 'react';
import Editor from '@monaco-editor/react';
import { motion, AnimatePresence } from 'motion/react';
import { File, Folder, Plus, Trash2, Play, Save, ChevronRight, ChevronDown, X, Monitor, Code as CodeIcon, Download, Check } from 'lucide-react';
import { cn } from '../lib/utils';
import { auth, db } from '../firebase';
import { collection, query, onSnapshot, doc, setDoc, deleteDoc, updateDoc, serverTimestamp } from 'firebase/firestore';

interface ProjectFile {
  id: string;
  name: string;
  content: string;
  language: string;
}

import { User } from 'firebase/auth';
import { handleFirestoreError, OperationType } from '../lib/firestoreErrorHandler';

interface IDEProps {
  user: User;
}

export default function IDE({ user }: IDEProps) {
  const [files, setFiles] = useState<ProjectFile[]>([]);
  const [activeFileId, setActiveFileId] = useState<string | null>(null);
  const [previewContent, setPreviewContent] = useState('');
  const [showPreview, setShowPreview] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(window.innerWidth > 1024);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [showNewFileModal, setShowNewFileModal] = useState(false);
  const [newFileName, setNewFileName] = useState('');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const activeFile = files.find(f => f.id === activeFileId);

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth <= 1024) setIsSidebarOpen(false);
      else setIsSidebarOpen(true);
    };
    window.addEventListener('resize', handleResize);
    
    // Load files from a default project for now
    const q = query(collection(db, 'users', user.uid, 'projects', 'default', 'files'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const loadedFiles = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as ProjectFile));
      setFiles(loadedFiles);
      if (loadedFiles.length > 0 && !activeFileId) {
        setActiveFileId(loadedFiles[0].id);
      }
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, `users/${user.uid}/projects/default/files`);
    });

    // Listen for code extractions from AI
    const unsubIDE = onSnapshot(doc(db, 'users', user.uid, 'ide', 'current'), async (snap) => {
      if (snap.exists()) {
        const data = snap.data();
        if (data.code) {
          // Check if index.html exists, if not create it
          const fileId = 'index-html';
          await setDoc(doc(db, 'users', user.uid, 'projects', 'default', 'files', fileId), {
            name: 'index.html',
            content: data.code,
            language: 'html',
            updatedAt: serverTimestamp()
          }, { merge: true });
          setActiveFileId(fileId);
          
          // Clear the extraction trigger
          await updateDoc(doc(db, 'users', user.uid, 'ide', 'current'), {
            code: null
          });
        }
      }
    });

    return () => {
      window.removeEventListener('resize', handleResize);
      unsubscribe();
      unsubIDE();
    };
  }, [user.uid]);

  const createFile = async () => {
    if (!newFileName) return;
    const name = newFileName;
    const extension = name.split('.').pop()?.toLowerCase();
    let language = 'plaintext';
    if (extension === 'html') language = 'html';
    else if (extension === 'css') language = 'css';
    else if (extension === 'js') language = 'javascript';
    else if (extension === 'ts') language = 'typescript';
    else if (extension === 'py') language = 'python';
    else if (extension === 'java') language = 'java';
    else if (extension === 'cpp' || extension === 'cc') language = 'cpp';
    else if (extension === 'c') language = 'c';
    else if (extension === 'php') language = 'php';
    else if (extension === 'rb') language = 'ruby';
    else if (extension === 'go') language = 'go';
    else if (extension === 'rs') language = 'rust';
    else if (extension === 'json') language = 'json';
    else if (extension === 'md') language = 'markdown';
    else if (extension === 'sql') language = 'sql';

    const fileId = Math.random().toString(36).substr(2, 9);
    try {
      await setDoc(doc(db, 'users', user.uid, 'projects', 'default', 'files', fileId), {
        name,
        content: '',
        language,
        updatedAt: serverTimestamp()
      });
      
      await setDoc(doc(db, 'users', user.uid, 'projects', 'default'), {
        name: 'PROJECT_DEFAULT',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      }, { merge: true });

      setActiveFileId(fileId);
      setShowNewFileModal(false);
      setNewFileName('');
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, `users/${user.uid}/projects/default/files/${fileId}`);
    }
  };

  const deleteFile = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm('Delete this file?')) return;
    try {
      await deleteDoc(doc(db, 'users', user.uid, 'projects', 'default', 'files', id));
      if (activeFileId === id) setActiveFileId(files.find(f => f.id !== id)?.id || null);
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `users/${user.uid}/projects/default/files/${id}`);
    }
  };

  const handleEditorChange = (value: string | undefined) => {
    if (!activeFileId) return;
    setFiles(prev => prev.map(f => f.id === activeFileId ? { ...f, content: value || '' } : f));
  };

  const saveFiles = async () => {
    setIsSaving(true);
    try {
      const savePromises = files.map(file => 
        updateDoc(doc(db, 'users', user.uid, 'projects', 'default', 'files', file.id), {
          content: file.content,
          updatedAt: serverTimestamp()
        })
      );
      await Promise.all(savePromises);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 2000);
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `users/${user.uid}/projects/default/files`);
    } finally {
      setIsSaving(false);
    }
  };

  const deleteProject = async () => {
    try {
      const deletePromises = files.map(file => deleteDoc(doc(db, 'users', user.uid, 'projects', 'default', 'files', file.id)));
      await Promise.all(deletePromises);
      await deleteDoc(doc(db, 'users', user.uid, 'projects', 'default'));
      setFiles([]);
      setActiveFileId(null);
      setShowDeleteConfirm(false);
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `users/${user.uid}/projects/default`);
    }
  };

  const downloadProject = () => {
    files.forEach(file => {
      const blob = new Blob([file.content], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = file.name;
      a.click();
      URL.revokeObjectURL(url);
    });
  };

  const runCode = () => {
    const isWeb = files.some(f => ['index.html', 'style.css', 'script.js'].includes(f.name));
    
    if (isWeb) {
      const html = files.find(f => f.name === 'index.html')?.content || '';
      const css = files.find(f => f.name === 'style.css')?.content || '';
      const js = files.find(f => f.name === 'script.js')?.content || '';

      const combined = `
        <html>
          <head>
            <style>${css}</style>
          </head>
          <body>
            ${html}
            <script>${js}</script>
          </body>
        </html>
      `;
      setPreviewContent(combined);
    } else if (activeFile) {
      // Simulation for other languages
      const output = `[System] Running ${activeFile.name} (${activeFile.language})...\n\n> Output:\n${activeFile.content.slice(0, 500)}\n\n[System] Execution finished.`;
      setPreviewContent(`<html><body style="background:#111;color:#0f0;font-family:monospace;padding:20px;white-space:pre-wrap;">${output}</body></html>`);
    }
    setShowPreview(true);
  };

  return (
    <div className="h-full flex bg-[#0c0c0c] text-silver/90 overflow-hidden">
      {/* File Explorer Sidebar */}
      <motion.aside 
        initial={false}
        animate={{ width: isSidebarOpen ? 260 : 0 }}
        className="bg-[#111] border-r border-white/5 flex flex-col overflow-hidden"
      >
        <div className="p-4 flex items-center justify-between border-b border-white/5 shrink-0">
          <span className="text-xs font-bold uppercase tracking-widest text-silver/40">Explorer</span>
          <button onClick={() => setShowNewFileModal(true)} className="p-1 hover:bg-white/5 rounded text-silver/60 hover:text-white">
            <Plus className="w-4 h-4" />
          </button>
        </div>
        
        <div className="flex-1 overflow-y-auto p-2 space-y-1 custom-scrollbar">
          <div className="flex items-center gap-2 px-2 py-1.5 text-xs font-semibold text-silver/60">
            <ChevronDown className="w-3 h-3" />
            <Folder className="w-3 h-3" />
            <span>PROJECT_DEFAULT</span>
          </div>
          
          {files.map(file => (
            <div
              key={file.id}
              onClick={() => setActiveFileId(file.id)}
              className={cn(
                "w-full flex items-center gap-2 px-6 py-1.5 rounded-md text-sm group transition-colors cursor-pointer",
                activeFileId === file.id ? "bg-white/10 text-white" : "hover:bg-white/5 text-silver/60"
              )}
            >
              <File className="w-3.5 h-3.5" />
              <span className="flex-1 text-left truncate">{file.name}</span>
              <button 
                onClick={(e) => deleteFile(file.id, e)}
                className="opacity-0 group-hover:opacity-100 p-1 hover:text-red-400 transition-all"
              >
                <Trash2 className="w-3 h-3" />
              </button>
            </div>
          ))}
        </div>
        <div className="p-4 mt-auto border-t border-white/5">
          <button 
            onClick={() => setShowDeleteConfirm(true)}
            className="w-full py-2 rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500/20 transition-all flex items-center justify-center gap-2 text-xs font-bold"
          >
            <Trash2 className="w-3.5 h-3.5" />
            Delete All Files
          </button>
        </div>
      </motion.aside>

      {/* New File Modal */}
      <AnimatePresence>
        {showNewFileModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="bg-[#111] border border-white/10 p-6 rounded-2xl w-full max-w-sm shadow-2xl"
            >
              <h3 className="text-lg font-bold mb-4">Create New File</h3>
              <input
                autoFocus
                type="text"
                placeholder="index.html"
                value={newFileName}
                onChange={(e) => setNewFileName(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && createFile()}
                className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 text-white placeholder:text-silver/20 focus:outline-none focus:border-accent/40 mb-6"
              />
              <div className="flex gap-3">
                <button
                  onClick={() => setShowNewFileModal(false)}
                  className="flex-1 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 transition-colors text-sm font-medium"
                >
                  Cancel
                </button>
                <button
                  onClick={createFile}
                  className="flex-1 py-2.5 rounded-xl bg-accent text-black hover:opacity-90 transition-all text-sm font-bold"
                >
                  Create
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Delete Project Modal */}
      <AnimatePresence>
        {showDeleteConfirm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="bg-[#111] border border-red-500/20 p-6 rounded-2xl w-full max-w-sm shadow-2xl"
            >
              <h3 className="text-lg font-bold mb-2">Delete Project?</h3>
              <p className="text-xs text-silver/40 mb-6 font-mono leading-relaxed">
                This will ARCHIVE and PERMANENTLY DELETE all files in the current repository. This action cannot be undone.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowDeleteConfirm(false)}
                  className="flex-1 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 transition-colors text-sm font-medium"
                >
                  Cancel
                </button>
                <button
                  onClick={deleteProject}
                  className="flex-1 py-2.5 rounded-xl bg-red-500 text-white hover:bg-red-600 transition-all text-sm font-bold"
                >
                  Confirm Delete
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Main Editor Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Tabs */}
        <div className="flex bg-[#111] border-b border-white/5 overflow-x-auto no-scrollbar shrink-0">
          {files.map(file => (
            <button
              key={file.id}
              onClick={() => setActiveFileId(file.id)}
              className={cn(
                "flex items-center gap-2 px-4 py-2.5 border-r border-white/5 text-xs min-w-[120px] transition-colors relative",
                activeFileId === file.id ? "bg-[#1e1e1e] text-white" : "bg-[#111] text-silver/40 hover:bg-[#181818]"
              )}
            >
              <File className="w-3 h-3" />
              <span className="truncate">{file.name}</span>
              {activeFileId === file.id && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-accent" />
              )}
            </button>
          ))}
        </div>

        {/* Toolbar */}
        <div className="flex items-center justify-between px-4 py-2 bg-[#1e1e1e] border-b border-white/5 shrink-0">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 text-[10px] text-silver/40 uppercase tracking-widest">
              <CodeIcon className="w-3 h-3" />
              <span>{activeFile?.language || 'No file selected'}</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button 
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className="lg:hidden p-1.5 hover:bg-white/5 rounded text-silver/40"
            >
              <Folder className="w-4 h-4" />
            </button>
            <button 
              onClick={runCode}
              className="flex items-center gap-2 px-3 py-1 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-md text-xs hover:bg-emerald-500/20 transition-colors"
            >
              <Play className="w-3 h-3" />
              Run
            </button>
            <button 
              onClick={saveFiles}
              disabled={isSaving}
              className={cn(
                "p-1.5 rounded transition-all flex items-center gap-1 text-xs",
                saveSuccess ? "text-emerald-400 bg-emerald-500/10" : "hover:bg-white/5 text-silver/40"
              )}
              title="Save All Files"
            >
              {saveSuccess ? <Check className="w-4 h-4" /> : <Save className="w-4 h-4" />}
              <span className="hidden md:inline">{saveSuccess ? 'Saved' : 'Save'}</span>
            </button>
            <button 
              onClick={downloadProject}
              className="p-1.5 hover:bg-white/5 rounded text-silver/40 flex items-center gap-1 text-xs"
              title="Download Files"
            >
              <Download className="w-4 h-4" />
              <span className="hidden md:inline">Download</span>
            </button>
            <button 
              onClick={() => setShowPreview(!showPreview)}
              className={cn(
                "p-1.5 rounded transition-colors",
                showPreview ? "bg-white/10 text-white" : "hover:bg-white/5 text-silver/40"
              )}
            >
              <Monitor className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Editor & Preview Split */}
        <div className="flex-1 flex overflow-hidden">
          <div className={cn("flex-1", showPreview && "border-r border-white/5")}>
            {activeFileId ? (
              <Editor
                height="100%"
                theme="vs-dark"
                language={activeFile?.language}
                value={activeFile?.content}
                onChange={handleEditorChange}
                options={{
                  fontSize: 14,
                  fontFamily: 'JetBrains Mono, monospace',
                  minimap: { enabled: false },
                  scrollBeyondLastLine: false,
                  automaticLayout: true,
                  padding: { top: 20 }
                }}
              />
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-silver/20">
                <CodeIcon className="w-16 h-16 mb-4" />
                <p>Select a file to start coding</p>
              </div>
            )}
          </div>

          <AnimatePresence>
            {showPreview && (
              <motion.div 
                initial={{ width: 0, opacity: 0 }}
                animate={{ 
                  width: window.innerWidth > 1024 ? '40%' : '100%',
                  height: window.innerWidth > 1024 ? '100%' : '50%',
                  opacity: 1 
                }}
                exit={{ width: 0, opacity: 0 }}
                className={cn(
                  "bg-white flex flex-col overflow-hidden z-20",
                  window.innerWidth <= 1024 && "fixed inset-x-0 bottom-0 h-1/2 border-t border-white/10"
                )}
              >
                <div className="bg-[#111] p-2 flex items-center justify-between border-b border-white/5">
                  <span className="text-[10px] text-silver/40 uppercase tracking-widest px-2">Live Preview</span>
                  <button onClick={() => setShowPreview(false)} className="p-1 hover:bg-white/5 rounded text-silver/40">
                    <X className="w-3 h-3" />
                  </button>
                </div>
                <iframe
                  title="preview"
                  srcDoc={previewContent}
                  className="flex-1 w-full border-none bg-white"
                />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
