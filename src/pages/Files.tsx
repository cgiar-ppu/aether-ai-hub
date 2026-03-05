import { motion } from 'framer-motion';
import { Search, Upload, FileText, FileSpreadsheet, Image, File, Folder, ChevronRight } from 'lucide-react';
import { useState } from 'react';
import GlassCard from '@/components/layout/GlassCard';
import { files } from '@/data/mockData';
import { cn } from '@/lib/utils';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

const typeIcons: Record<string, React.ComponentType<{ className?: string }>> = {
  pdf: FileText,
  csv: FileSpreadsheet,
  docx: File,
  png: Image,
  folder: Folder,
};

const typeBadgeColors: Record<string, string> = {
  pdf: 'bg-destructive/10 text-destructive',
  csv: 'bg-success/10 text-success',
  docx: 'bg-primary/10 text-primary',
  png: 'bg-warning/10 text-warning',
};

const container = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.06 } },
};

const item = {
  hidden: { opacity: 0, scale: 0.95 },
  show: { opacity: 1, scale: 1, transition: { duration: 0.3 } },
};

const Files = () => {
  const [search, setSearch] = useState('');
  const filtered = files.filter(f =>
    f.name.toLowerCase().includes(search.toLowerCase())
  );

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
          <Button className="h-9 rounded-xl gap-2 text-sm">
            <Upload className="h-3.5 w-3.5" />
            Upload
          </Button>
        </div>
      </div>

      {/* Breadcrumb */}
      <div className="flex items-center gap-1 text-[11px] font-mono">
        <span className="text-muted-foreground hover:text-foreground cursor-pointer">Home</span>
        <ChevronRight className="h-3 w-3 text-muted-foreground" />
        <span className="text-foreground">All Files</span>
      </div>

      {/* Grid */}
      <motion.div
        className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4"
        variants={container}
        initial="hidden"
        animate="show"
      >
        {filtered.map((file) => {
          const Icon = typeIcons[file.type] || File;
          const isFolder = file.type === 'folder';

          return (
            <motion.div key={file.id} variants={item}>
              <GlassCard className="p-4 group">
                <div className="flex flex-col items-center text-center gap-3">
                  <div className={cn(
                    'w-10 h-10 rounded-xl flex items-center justify-center',
                    isFolder ? 'bg-primary/10' : 'bg-secondary/50'
                  )}>
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
    </motion.div>
  );
};

export default Files;
