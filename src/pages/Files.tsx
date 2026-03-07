import { motion } from 'framer-motion';
import { Search, Upload, FileText, FileSpreadsheet, Image, File, Folder, ChevronRight, LayoutGrid, List, MoreVertical, FolderPlus, Pencil, Trash2, FolderInput, RefreshCw, Wifi, WifiOff, AlertTriangle } from 'lucide-react';
import { useState, useCallback } from 'react';
import GlassCard from '@/components/layout/GlassCard';
import { files as initialFiles, FileItem } from '@/data/mockData';
import { cn } from '@/lib/utils';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSub, DropdownMenuSubContent, DropdownMenuSubTrigger, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { toast } from 'sonner';
import { filesService } from '@/services/files';
import { useApi } from '@/hooks/useApi';

const typeIcons: Record<string, React.ComponentType<{ className?: string }>> = {
  pdf: FileText,
  csv: FileSpreadsheet,
  docx: File,
  png: Image,
  folder: Folder,
  md: FileText,
  xlsx: FileSpreadsheet,
};

const typeBadgeColors: Record<string, string> = {
  pdf: 'bg-destructive/10 text-destructive',
  csv: 'bg-success/10 text-success',
  docx: 'bg-primary/10 text-primary',
  png: 'bg-warning/10 text-warning',
  md: 'bg-violet-500/10 text-violet-500',
  xlsx: 'bg-emerald-500/10 text-emerald-600',
};

const container = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.04 } },
};

const item = {
  hidden: { opacity: 0, scale: 0.95 },
  show: { opacity: 1, scale: 1, transition: { duration: 0.3 } },
};

const Files = () => {
  const [search, setSearch] = useState('');
  const [currentFolder, setCurrentFolder] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [newFolderOpen, setNewFolderOpen] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const [renameOpen, setRenameOpen] = useState(false);
  const [renameTarget, setRenameTarget] = useState<FileItem | null>(null);
  const [renameName, setRenameName] = useState('');
  const [dragOverTarget, setDragOverTarget] = useState<string | null>(null);
  const [draggingId, setDraggingId] = useState<string | null>(null);

  const { data: apiFiles, error, isLive, refetch } = useApi(
    () => filesService.list(),
    initialFiles,
  );

  const [filesList, setFilesList] = useState<FileItem[]>(initialFiles);

  // Use live data if available, otherwise use local state
  const effectiveFiles = isLive ? apiFiles : filesList;

  const currentFolderItem = currentFolder ? effectiveFiles.find(f => f.id === currentFolder) : null;
  const folders = effectiveFiles.filter(f => f.type === 'folder' && !f.parentId);

  const visibleFiles = effectiveFiles.filter(f => {
    if (currentFolder) return f.parentId === currentFolder;
    return !f.parentId;
  });

  const sorted = [...visibleFiles].sort((a, b) => {
    if (a.type === 'folder' && b.type !== 'folder') return -1;
    if (a.type !== 'folder' && b.type === 'folder') return 1;
    return 0;
  });

  const filtered = sorted.filter(f =>
    f.name.toLowerCase().includes(search.toLowerCase())
  );

  const handleFileClick = (file: FileItem) => {
    if (file.type === 'folder') {
      setCurrentFolder(file.id);
      setSearch('');
    }
  };

  const navigateUp = () => {
    setCurrentFolder(null);
    setSearch('');
  };

  const createFolder = () => {
    if (!newFolderName.trim()) return;
    const newFolder: FileItem = {
      id: `folder-${Date.now()}`,
      name: newFolderName.trim(),
      type: 'folder',
      date: new Date().toISOString().split('T')[0],
      items: 0,
    };
    setFilesList(prev => [...prev, newFolder]);
    setNewFolderName('');
    setNewFolderOpen(false);
  };

  const moveToFolder = useCallback((fileId: string, folderId: string) => {
    setFilesList(prev => {
      const file = prev.find(f => f.id === fileId);
      const folder = prev.find(f => f.id === folderId);
      if (!file || !folder) return prev;

      const updated = prev.map(f => f.id === fileId ? { ...f, parentId: folderId } : f);
      const result = updated.map(f => {
        if (f.type === 'folder') {
          const count = updated.filter(x => x.parentId === f.id).length;
          return { ...f, items: count };
        }
        return f;
      });

      toast.success(`Moved "${file.name}" to "${folder.name}"`);
      return result;
    });
  }, []);

  const moveToRoot = useCallback((fileId: string) => {
    setFilesList(prev => {
      const file = prev.find(f => f.id === fileId);
      if (!file || !file.parentId) return prev;

      const updated = prev.map(f => f.id === fileId ? { ...f, parentId: undefined } : f);
      const result = updated.map(f => {
        if (f.type === 'folder') {
          const count = updated.filter(x => x.parentId === f.id).length;
          return { ...f, items: count };
        }
        return f;
      });

      toast.success(`Moved "${file.name}" to root`);
      return result;
    });
  }, []);

  const deleteFile = (fileId: string) => {
    setFilesList(prev => prev.filter(f => f.id !== fileId));
  };

  const startRename = (file: FileItem) => {
    setRenameTarget(file);
    setRenameName(file.name);
    setRenameOpen(true);
  };

  const confirmRename = () => {
    if (!renameTarget || !renameName.trim()) return;
    setFilesList(prev => prev.map(f => f.id === renameTarget.id ? { ...f, name: renameName.trim() } : f));
    setRenameOpen(false);
    setRenameTarget(null);
  };

  // Drag and Drop handlers
  const handleDragStart = (e: React.DragEvent, fileId: string) => {
    e.dataTransfer.setData('text/plain', fileId);
    e.dataTransfer.effectAllowed = 'move';
    setDraggingId(fileId);
  };

  const handleDragEnd = () => {
    setDraggingId(null);
    setDragOverTarget(null);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleFolderDragEnter = (e: React.DragEvent, folderId: string) => {
    e.preventDefault();
    setDragOverTarget(folderId);
  };

  const handleFolderDragLeave = (e: React.DragEvent) => {
    const related = e.relatedTarget as HTMLElement;
    if (!e.currentTarget.contains(related)) {
      setDragOverTarget(null);
    }
  };

  const handleFolderDrop = (e: React.DragEvent, folderId: string) => {
    e.preventDefault();
    const fileId = e.dataTransfer.getData('text/plain');
    if (fileId && fileId !== folderId) {
      moveToFolder(fileId, folderId);
    }
    setDragOverTarget(null);
    setDraggingId(null);
  };

  const handleBreadcrumbDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const fileId = e.dataTransfer.getData('text/plain');
    if (fileId) {
      moveToRoot(fileId);
    }
    setDragOverTarget(null);
    setDraggingId(null);
  };

  const handleBreadcrumbDragEnter = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOverTarget('breadcrumb-home');
  };

  const handleBreadcrumbDragLeave = (e: React.DragEvent) => {
    const related = e.relatedTarget as HTMLElement;
    if (!e.currentTarget.contains(related)) {
      setDragOverTarget(null);
    }
  };

  const isFolder = (file: FileItem) => file.type === 'folder';

  const FileActions = ({ file }: { file: FileItem }) => {
    if (file.type === 'folder') return null;
    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button
            className="absolute top-2 right-2 p-1 rounded-md opacity-0 group-hover:opacity-100 transition-opacity bg-background/60 hover:bg-background text-muted-foreground hover:text-foreground z-10"
            onClick={(e) => e.stopPropagation()}
          >
            <MoreVertical className="h-3.5 w-3.5" />
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-48">
          <DropdownMenuSub>
            <DropdownMenuSubTrigger className="text-xs gap-2">
              <FolderInput className="h-3.5 w-3.5" />
              Move to folder
            </DropdownMenuSubTrigger>
            <DropdownMenuSubContent>
              {folders.map(folder => (
                <DropdownMenuItem
                  key={folder.id}
                  className="text-xs gap-2"
                  onClick={(e) => { e.stopPropagation(); moveToFolder(file.id, folder.id); }}
                >
                  <Folder className="h-3.5 w-3.5" />
                  {folder.name}
                </DropdownMenuItem>
              ))}
            </DropdownMenuSubContent>
          </DropdownMenuSub>
          <DropdownMenuItem className="text-xs gap-2" onClick={(e) => { e.stopPropagation(); startRename(file); }}>
            <Pencil className="h-3.5 w-3.5" />
            Rename
          </DropdownMenuItem>
          <DropdownMenuItem className="text-xs gap-2 text-destructive" onClick={(e) => { e.stopPropagation(); deleteFile(file.id); }}>
            <Trash2 className="h-3.5 w-3.5" />
            Delete
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    );
  };

  return (
    <motion.div
      className="p-6 md:p-8 space-y-6 relative z-10"
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -12 }}
      transition={{ duration: 0.3 }}
    >
      {/* Error Banner */}
      {error && (
        <div className="flex items-center gap-3 bg-destructive/10 border border-destructive/20 text-destructive rounded-xl px-4 py-3">
          <AlertTriangle className="h-4 w-4 shrink-0" />
          <span className="text-xs flex-1">{error}</span>
          <button onClick={refetch} className="flex items-center gap-1 text-xs font-medium hover:underline">
            <RefreshCw className="h-3 w-3" /> Retry
          </button>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div>
            <h1 className="text-xl font-semibold text-foreground">Files</h1>
            <p className="text-sm text-muted-foreground mt-1">Research data and documents</p>
          </div>
          {isLive ? (
            <span className="flex items-center gap-1.5 text-[10px] font-mono bg-success/10 text-success px-2.5 py-1 rounded-full">
              <Wifi className="h-3 w-3" /> Live
            </span>
          ) : !error ? (
            <span className="flex items-center gap-1.5 text-[10px] font-mono bg-muted text-muted-foreground px-2.5 py-1 rounded-full">
              <WifiOff className="h-3 w-3" /> Using sample data
            </span>
          ) : null}
        </div>
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
            <Input
              placeholder="Search files..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 h-9 glass border-border text-sm w-56"
            />
          </div>
          <div className="flex items-center glass rounded-lg overflow-hidden">
            <button
              onClick={() => setViewMode('grid')}
              className={cn('p-2 transition-colors', viewMode === 'grid' ? 'bg-primary/10 text-primary' : 'text-muted-foreground hover:text-foreground')}
            >
              <LayoutGrid className="h-4 w-4" />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={cn('p-2 transition-colors', viewMode === 'list' ? 'bg-primary/10 text-primary' : 'text-muted-foreground hover:text-foreground')}
            >
              <List className="h-4 w-4" />
            </button>
          </div>
          <Button variant="outline" className="h-9 rounded-xl gap-2 text-sm" onClick={() => setNewFolderOpen(true)}>
            <FolderPlus className="h-3.5 w-3.5" />
            New Folder
          </Button>
          <Button className="h-9 rounded-xl gap-2 text-sm">
            <Upload className="h-3.5 w-3.5" />
            Upload
          </Button>
        </div>
      </div>

      {/* Breadcrumb */}
      <div
        className={cn(
          'flex items-center gap-1 text-[11px] font-mono rounded-lg px-2 py-1.5 transition-all',
          dragOverTarget === 'breadcrumb-home' && currentFolder
            ? 'border-2 border-dashed border-primary bg-primary/5'
            : 'border-2 border-transparent'
        )}
        onDragOver={currentFolder ? handleDragOver : undefined}
        onDragEnter={currentFolder ? handleBreadcrumbDragEnter : undefined}
        onDragLeave={currentFolder ? handleBreadcrumbDragLeave : undefined}
        onDrop={currentFolder ? handleBreadcrumbDrop : undefined}
      >
        <span className="text-muted-foreground hover:text-foreground cursor-pointer" onClick={navigateUp}>Home</span>
        <ChevronRight className="h-3 w-3 text-muted-foreground" />
        {currentFolderItem ? (
          <>
            <span className="text-muted-foreground hover:text-foreground cursor-pointer" onClick={navigateUp}>All Files</span>
            <ChevronRight className="h-3 w-3 text-muted-foreground" />
            <span className="text-foreground">{currentFolderItem.name}</span>
            {dragOverTarget === 'breadcrumb-home' && (
              <span className="text-[10px] text-primary ml-2">← Drop here to move to root</span>
            )}
          </>
        ) : (
          <span className="text-foreground">All Files</span>
        )}
      </div>

      {/* Grid View */}
      {viewMode === 'grid' && (
        <motion.div
          className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4"
          variants={container}
          initial="hidden"
          animate="show"
          key={`grid-${currentFolder}`}
        >
          {filtered.map((file) => {
            const Icon = typeIcons[file.type] || File;
            const isFolderItem = isFolder(file);
            const isDragging = draggingId === file.id;
            const isDragTarget = dragOverTarget === file.id && isFolderItem;

            return (
              <motion.div
                key={file.id}
                variants={item}
                draggable={!isFolderItem}
                onDragStart={!isFolderItem ? (e) => handleDragStart(e as unknown as React.DragEvent, file.id) : undefined}
                onDragEnd={handleDragEnd}
                style={{
                  opacity: isDragging ? 0.5 : 1,
                  transform: isDragging ? 'scale(1.02)' : undefined,
                  transition: 'opacity 0.2s, transform 0.2s',
                }}
              >
                <GlassCard
                  className={cn(
                    'p-4 group relative transition-all',
                    isDragTarget && 'border-2 !border-dashed !border-primary bg-primary/5',
                    !isFolderItem && 'cursor-grab active:cursor-grabbing'
                  )}
                  onClick={() => handleFileClick(file)}
                  onDragOver={isFolderItem ? handleDragOver : undefined}
                  onDragEnter={isFolderItem ? (e: React.DragEvent) => handleFolderDragEnter(e, file.id) : undefined}
                  onDragLeave={isFolderItem ? handleFolderDragLeave : undefined}
                  onDrop={isFolderItem ? (e: React.DragEvent) => handleFolderDrop(e, file.id) : undefined}
                >
                  <FileActions file={file} />
                  <div className="flex flex-col items-center text-center gap-3">
                    <div className={cn('w-10 h-10 rounded-xl flex items-center justify-center', isFolderItem ? 'bg-primary/10' : 'bg-secondary/50')}>
                      <Icon className={cn('h-5 w-5', isFolderItem ? 'text-primary' : 'text-muted-foreground')} />
                    </div>
                    <div className="w-full">
                      {isDragTarget && (
                        <p className="text-[10px] text-primary font-medium mb-1">Drop here</p>
                      )}
                      <p className="text-xs font-medium text-foreground truncate">{file.name}</p>
                      <div className="flex items-center justify-center gap-2 mt-1">
                        {file.size && <span className="text-[10px] font-mono text-muted-foreground">{file.size}</span>}
                        {isFolderItem && <span className="text-[10px] font-mono text-muted-foreground">{file.items} items</span>}
                        {!isFolderItem && (
                          <span className={cn('text-[10px] font-mono px-1.5 py-0.5 rounded', typeBadgeColors[file.type] || 'bg-muted text-muted-foreground')}>
                            {file.type.toUpperCase()}
                          </span>
                        )}
                      </div>
                      <span className="text-[10px] font-mono text-muted-foreground block mt-1">{file.date}</span>
                    </div>
                  </div>
                </GlassCard>
              </motion.div>
            );
          })}
        </motion.div>
      )}

      {/* List View */}
      {viewMode === 'list' && (
        <motion.div
          className="glass rounded-2xl overflow-hidden"
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          key={`list-${currentFolder}`}
        >
          <table className="w-full">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left text-label text-muted-foreground px-4 py-3">Name</th>
                <th className="text-left text-label text-muted-foreground px-4 py-3 hidden sm:table-cell">Size</th>
                <th className="text-left text-label text-muted-foreground px-4 py-3 hidden md:table-cell">Type</th>
                <th className="text-left text-label text-muted-foreground px-4 py-3">Date Modified</th>
                <th className="w-10 px-2"></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((file) => {
                const Icon = typeIcons[file.type] || File;
                const isFolderItem = isFolder(file);
                const isDragging = draggingId === file.id;
                const isDragTarget = dragOverTarget === file.id && isFolderItem;

                return (
                  <tr
                    key={file.id}
                    className={cn(
                      'border-b border-border/50 hover:bg-secondary/20 transition-all cursor-pointer group',
                      isDragTarget && 'bg-primary/5 outline outline-2 outline-dashed outline-primary',
                      isDragging && 'opacity-50',
                    )}
                    onClick={() => handleFileClick(file)}
                    draggable={!isFolderItem}
                    onDragStart={!isFolderItem ? (e) => handleDragStart(e, file.id) : undefined}
                    onDragEnd={handleDragEnd}
                    onDragOver={isFolderItem ? handleDragOver : undefined}
                    onDragEnter={isFolderItem ? (e) => handleFolderDragEnter(e, file.id) : undefined}
                    onDragLeave={isFolderItem ? handleFolderDragLeave : undefined}
                    onDrop={isFolderItem ? (e) => handleFolderDrop(e, file.id) : undefined}
                  >
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <Icon className={cn('h-4 w-4 shrink-0', isFolderItem ? 'text-primary' : 'text-muted-foreground')} />
                        <span className="text-xs font-medium text-foreground truncate">{file.name}</span>
                        {isDragTarget && <span className="text-[10px] text-primary font-medium">Drop here</span>}
                      </div>
                    </td>
                    <td className="px-4 py-3 hidden sm:table-cell">
                      <span className="text-xs font-mono text-muted-foreground">
                        {file.size || (isFolderItem ? `${file.items} items` : '--')}
                      </span>
                    </td>
                    <td className="px-4 py-3 hidden md:table-cell">
                      {!isFolderItem && (
                        <span className={cn('text-[10px] font-mono px-1.5 py-0.5 rounded', typeBadgeColors[file.type] || 'bg-muted text-muted-foreground')}>
                          {file.type.toUpperCase()}
                        </span>
                      )}
                      {isFolderItem && <span className="text-[10px] font-mono text-muted-foreground">Folder</span>}
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-xs font-mono text-muted-foreground">{file.date}</span>
                    </td>
                    <td className="px-2">
                      {!isFolderItem && (
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <button
                              className="p-1 rounded-md opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-foreground"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <MoreVertical className="h-3.5 w-3.5" />
                            </button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-48">
                            <DropdownMenuSub>
                              <DropdownMenuSubTrigger className="text-xs gap-2">
                                <FolderInput className="h-3.5 w-3.5" />
                                Move to folder
                              </DropdownMenuSubTrigger>
                              <DropdownMenuSubContent>
                                {folders.map(folder => (
                                  <DropdownMenuItem
                                    key={folder.id}
                                    className="text-xs gap-2"
                                    onClick={(e) => { e.stopPropagation(); moveToFolder(file.id, folder.id); }}
                                  >
                                    <Folder className="h-3.5 w-3.5" />
                                    {folder.name}
                                  </DropdownMenuItem>
                                ))}
                              </DropdownMenuSubContent>
                            </DropdownMenuSub>
                            <DropdownMenuItem className="text-xs gap-2" onClick={(e) => { e.stopPropagation(); startRename(file); }}>
                              <Pencil className="h-3.5 w-3.5" />
                              Rename
                            </DropdownMenuItem>
                            <DropdownMenuItem className="text-xs gap-2 text-destructive" onClick={(e) => { e.stopPropagation(); deleteFile(file.id); }}>
                              <Trash2 className="h-3.5 w-3.5" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </motion.div>
      )}

      {/* New Folder Dialog */}
      <Dialog open={newFolderOpen} onOpenChange={setNewFolderOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Create New Folder</DialogTitle>
          </DialogHeader>
          <Input
            placeholder="Folder name"
            value={newFolderName}
            onChange={(e) => setNewFolderName(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && createFolder()}
            autoFocus
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setNewFolderOpen(false)}>Cancel</Button>
            <Button onClick={createFolder}>Create</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Rename Dialog */}
      <Dialog open={renameOpen} onOpenChange={setRenameOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Rename File</DialogTitle>
          </DialogHeader>
          <Input
            placeholder="New name"
            value={renameName}
            onChange={(e) => setRenameName(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && confirmRename()}
            autoFocus
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setRenameOpen(false)}>Cancel</Button>
            <Button onClick={confirmRename}>Rename</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </motion.div>
  );
};

export default Files;
