

# CGIAR AI Co-Scientist Platform — Implementation Plan

## Overview
A futuristic, glassmorphic AI agent management platform for agricultural research. Dark-first design with immersive animations, command palette, and interactive workflow visualization. All data is mock/static.

## Design System Setup
- Custom CSS variables for light/dark glassmorphic theme (glass blur, accent glows, surface transparencies)
- Inter + JetBrains Mono fonts from Google Fonts
- Animated gradient mesh background (subtle, dark-mode-first)
- Framer Motion as the animation engine throughout
- Glass card base component with hover lift + glow effects

## Layout
- **No sidebar** — horizontal top bar (56px, glassmorphic, sticky) with logo, pill-tab navigation (Dashboard, Agents, Workflows, Files, Settings), search trigger (⌘K), theme toggle, user avatar
- Full-width content area below, padded 32px
- Animated page transitions via AnimatePresence

## Core Features

### 1. Command Palette (⌘K)
- Glass modal using shadcn Command component
- Groups: Quick Actions, Navigate, Recent
- Fuzzy search, keyboard navigable, shortcut hints

### 2. Dashboard Page
- Greeting banner with 4 animated stat cards (count-up numbers, sparklines, trend indicators)
- Bento grid layout:
  - **Agent Activity Chart** (Recharts AreaChart, 14-day data, interactive tooltips, clickable data points)
  - **Top Agents Leaderboard** (top 5 by tasks)
  - **System Health** (3 animated SVG circular progress rings — CPU, Memory, API)
  - **Recent Activity Timeline** (8 entries, animated, vertical timeline)
  - **Active Workflows** (3 mini cards with progress bars)

### 3. Agents Page
- 3-column grid of glass agent cards with stagger animation
- Each card: unique gradient avatar, status dot (pulse for active), description, 3 mini stats, tag badges, hover arrow
- Search + "New Agent" button
- 6 mock agents (Literature Analyst, Data Harmonizer, etc.)

### 4. Workflows Page
- Split layout: workflow list (left 40%) + React Flow node canvas (right 60%)
- Custom glassmorphic React Flow nodes with status-based styling (running=pulse, completed=green border, pending=dashed)
- Animated dashed edges for active paths
- Canvas controls (zoom, fit-view, minimap)
- 3 mock workflows with different statuses

### 5. Files Page
- 4-column grid of mini glass file cards
- File type icons (Lucide), type badges, hover checkbox selection
- Folder cards with item counts
- Breadcrumb navigation
- Mock: 2 folders, 6 files

### 6. Settings Page
- Stacked full-width glass cards: Profile, Appearance (theme + accent color picker with 5 swatches), Notifications (toggle switches), API Configuration, Team list

## Global Behaviors
- Framer Motion on every element: page transitions, card stagger, hover lift/glow, count-up numbers, skeleton loading states
- Responsive: 3→2→1 column breakpoints
- Custom thin scrollbar styling
- Focus-visible rings for keyboard navigation
- Empty states with centered icon + message

## Dependencies to Add
- `framer-motion` for animations
- `reactflow` for workflow node editor
- Google Fonts: Inter + JetBrains Mono

## File Structure
- `src/data/mockData.ts` — all mock data
- `src/components/layout/TopBar.tsx`, `GlassCard.tsx`, `BackgroundMesh.tsx`, `CommandPalette.tsx`
- `src/components/dashboard/` — stat cards, activity chart, leaderboard, health rings, timeline, workflow minis
- `src/components/agents/` — agent card grid
- `src/components/workflows/` — workflow list, custom React Flow nodes/edges
- `src/components/files/` — file/folder cards, breadcrumb
- `src/components/settings/` — profile, appearance, notifications, API, team sections
- `src/pages/` — Dashboard, Agents, Workflows, Files, Settings

