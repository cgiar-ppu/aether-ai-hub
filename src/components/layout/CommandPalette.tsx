import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { CommandDialog, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList, CommandSeparator, CommandShortcut } from '@/components/ui/command';
import { Plus, Play, Upload, LayoutDashboard, Bot, GitBranch, FolderOpen, Settings, Clock } from 'lucide-react';

const CommandPalette = () => {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((o) => !o);
      }
    };
    document.addEventListener('keydown', down);
    return () => document.removeEventListener('keydown', down);
  }, []);

  const runCommand = (command: () => void) => {
    setOpen(false);
    command();
  };

  return (
    <CommandDialog open={open} onOpenChange={setOpen}>
      <CommandInput placeholder="Search commands..." />
      <CommandList>
        <CommandEmpty>No results found.</CommandEmpty>
        <CommandGroup heading="Quick Actions">
          <CommandItem onSelect={() => runCommand(() => navigate('/agents'))}>
            <Plus className="mr-2 h-4 w-4" />
            <span>Create Agent</span>
            <CommandShortcut>⌘N</CommandShortcut>
          </CommandItem>
          <CommandItem onSelect={() => runCommand(() => navigate('/workflows'))}>
            <Play className="mr-2 h-4 w-4" />
            <span>Run Workflow</span>
            <CommandShortcut>⌘R</CommandShortcut>
          </CommandItem>
          <CommandItem onSelect={() => runCommand(() => navigate('/files'))}>
            <Upload className="mr-2 h-4 w-4" />
            <span>Upload File</span>
            <CommandShortcut>⌘U</CommandShortcut>
          </CommandItem>
        </CommandGroup>
        <CommandSeparator />
        <CommandGroup heading="Navigate">
          <CommandItem onSelect={() => runCommand(() => navigate('/'))}>
            <LayoutDashboard className="mr-2 h-4 w-4" />
            <span>Dashboard</span>
          </CommandItem>
          <CommandItem onSelect={() => runCommand(() => navigate('/agents'))}>
            <Bot className="mr-2 h-4 w-4" />
            <span>Agents</span>
          </CommandItem>
          <CommandItem onSelect={() => runCommand(() => navigate('/workflows'))}>
            <GitBranch className="mr-2 h-4 w-4" />
            <span>Workflows</span>
          </CommandItem>
          <CommandItem onSelect={() => runCommand(() => navigate('/files'))}>
            <FolderOpen className="mr-2 h-4 w-4" />
            <span>Files</span>
          </CommandItem>
          <CommandItem onSelect={() => runCommand(() => navigate('/settings'))}>
            <Settings className="mr-2 h-4 w-4" />
            <span>Settings</span>
          </CommandItem>
        </CommandGroup>
        <CommandSeparator />
        <CommandGroup heading="Recent">
          <CommandItem onSelect={() => runCommand(() => navigate('/'))}>
            <Clock className="mr-2 h-4 w-4" />
            <span>Crop Yield Analysis</span>
          </CommandItem>
          <CommandItem onSelect={() => runCommand(() => navigate('/agents'))}>
            <Clock className="mr-2 h-4 w-4" />
            <span>Literature Analyst</span>
          </CommandItem>
          <CommandItem onSelect={() => runCommand(() => navigate('/files'))}>
            <Clock className="mr-2 h-4 w-4" />
            <span>Soil Data 2025.csv</span>
          </CommandItem>
        </CommandGroup>
      </CommandList>
    </CommandDialog>
  );
};

export default CommandPalette;
