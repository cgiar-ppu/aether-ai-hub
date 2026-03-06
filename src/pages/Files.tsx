import { motion } from 'framer-motion';
import { Search, Upload, FileText, FileSpreadsheet, Image, File, Folder, ChevronRight, LayoutGrid, List, MoreVertical, FolderPlus, Pencil, Trash2, FolderInput } from 'lucide-react';
import { useState } from 'react';
import GlassCard from '@/components/layout/GlassCard';
import { files as initialFiles, FileItem } from '@/data/mockData';
import { cn } from '@/lib/utils';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSub, DropdownMenuSubContent, DropdownMenuSubTrigger, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';

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
  const [filesList, setFilesList] = useState<FileItem[]>(initialFiles);
  const [newFolderOpen, setNewFolderOpen] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const [renameOpen, setRenameOpen] = useState(false);
  const [renameTarget, setRenameTarget] = useState<FileItem | null>(null);
  const [renameName, setRenameName] = useState('');

  const currentFolderItem = currentFolder ? filesList.find(f => f.id === currentFolder) : null;
  const folders = filesList.filter(f => f.type === 'folder' && !f.parentId);

  const visibleFiles = filesList.filter(f => {
    if (currentFolder) return f.parentId === currentFolder;
    return !f.parentId;
  });

  // Sort: folders first, then files
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

  const moveToFolder = (fileId: string, folderId: string) => {
    setFilesList(prev => {
      const updated = prev.map(f => f.id === fileId ? { ...f, parentId: folderId } : f);
      // Update folder item count
      return updated.map(f => {
        if (f.id === folderId) {
          const count = updated.filter(x => x.parentId === folderId).length;
          return { ...f, items: count };
        }
        return f;
      });
    });
  };

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
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold text-foreground">Files</h1>
          <p className="text-sm text-muted-foreground mt-1">Research data and documents</p>
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
      <div className="flex items-center gap-1 text-[11px] font-mono">
        <span className="text-muted-foreground hover:text-foreground cursor-pointer" onClick={navigateUp}>Home</span>
        <ChevronRight className="h-3 w-3 text-muted-foreground" />
        {currentFolderItem ? (
          <>
            <span className="text-muted-foreground hover:text-foreground cursor-pointer" onClick={navigateUp}>All Files</span>
            <ChevronRight className="h-3 w-3 text-muted-foreground" />
            <span className="text-foreground">{currentFolderItem.name}</span>
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
            const isFolder = file.type === 'folder';
            return (
              <motion.div key={file.id} variants={item}>
                <GlassCard className="p-4 group relative" onClick={() => handleFileClick(file)}>
                  <FileActions file={file} />
                  <div className="flex flex-col items-center text-center gap-3">
                    <div className={cn('w-10 h-10 rounded-xl flex items-center justify-center', isFolder ? 'bg-primary/10' : 'bg-secondary/50')}>
                      <Icon className={cn('h-5 w-5', isFolder ? 'text-primary' : 'text-muted-foreground')} />
                    </div>
                    <div className="w-full">
                      <p className="text-xs font-medium text-foreground truncate">{file.name}</p>
                      <div className="flex items-center justify-center gap-2 mt-1">
                        {file.size && <span className="text-[10px] font-mono text-muted-foreground">{file.size}</span>}
                        {isFolder && <span className="text-[10px] font-mono text-muted-foreground">{file.items} items</span>}
                        {!isFolder && (
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
                const isFolder = file.type === 'folder';
                return (
                  <tr
                    key={file.id}
                    className="border-b border-border/50 hover:bg-secondary/20 transition-colors cursor-pointer group"
                    onClick={() => handleFileClick(file)}
                  >
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <Icon className={cn('h-4 w-4 shrink-0', isFolder ? 'text-primary' : 'text-muted-foreground')} />
                        <span className="text-xs font-medium text-foreground truncate">{file.name}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 hidden sm:table-cell">
                      <span className="text-xs font-mono text-muted-foreground">
                        {file.size || (isFolder ? `${file.items} items` : '--')}
                      </span>
                    </td>
                    <td className="px-4 py-3 hidden md:table-cell">
                      {!isFolder && (
                        <span className={cn('text-[10px] font-mono px-1.5 py-0.5 rounded', typeBadgeColors[file.type] || 'bg-muted text-muted-foreground')}>
                          {file.type.toUpperCase()}
                        </span>
                      )}
                      {isFolder && <span className="text-[10px] font-mono text-muted-foreground">Folder</span>}
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-xs font-mono text-muted-foreground">{file.date}</span>
                    </td>
                    <td className="px-2">
                      {!isFolder && (
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
