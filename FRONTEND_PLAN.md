# 🎨 Mockingbird Frontend - Clean Modern UI Plan

## Design Philosophy

**Inspiration**: SalesBox runner UI - clean, modern, sophisticated
**Key Principles**:
- Light theme by default (similar to SalesBox)
- Clean modern feel (not terminal/log style)
- Simple, intuitive interactions
- Tag-based filtering
- Minimal UI chrome
- Real-time updates
- Use UI component libraries (shadcn/ui or similar)

---

## UI Layout

```
┌─ 🐦 Mockingbird ───────────────────────────── [⚙️] [📊] [🔄] ─┐
│                                                                │
│ Filters: [GET] [POST] [servicex] [200] [504] [+Add filter...] │
│                                                                │
├────────────────────────────────────────────────────────────────┤
│                                                                │
│ [09:33:40] POST /servicex/users  query=value|query=value      │
│       -> username: charles, email: charles@example.com         │
│       <- [201] [200ms] {mock} id: 5662ea..., created_at: ...  │
│                                                                │
│ [09:27:10] GET /test/unmocked                                  │
│       -> (no body)                                             │
│       <- [504] [0ms] {timeout} No matching rule found         │
│                                                                │
│ [09:26:45] GET /servicex/users/123                             │
│       -> (no body)                                             │
│       <- [200] [145ms] {proxy} username: john, active: true   │
│                                                                │
└────────────────────────────────────────────────────────────────┘
```

**3-Line Format**:
- Line 1: `[timestamp] METHOD /path query=params`
- Line 2: `      -> request summary`
- Line 3: `      <- [status] [time] {type} response summary`

---

## Core Views

### 1. Traffic Stream (Default View)
**Purpose**: Live monitoring of all API traffic

**Features**:
- Real-time SSE stream from `/api/traffic/stream`
- Auto-scroll to bottom (with pause button)
- Compact log-style entries
- Color-coded by status:
  - 🟢 2xx (green)
  - 🟡 3xx/4xx (yellow)
  - 🔴 5xx (red)
- Click entry → expand details panel

**Entry Format**:
```
[HH:MM:SS] METHOD /path [STATUS] [delay] {type}
  key: value pairs from request
  → outcome description
```

### 2. Traffic Details (Expanded View)
**Triggered by**: Click on any traffic entry (replaces stream view)

**Layout**:
```
┌─ 🐦 Mockingbird ───────────────────────────── [⚙️] [📊] [🔄] ─┐
│                                                                │
│  /servicex/users/new  [POST]  [Matching Rule #1: servicex]    │
│                                                                │
│  query:                                                        │
│     (none)                                                     │
│                                                                │
│  headers:                                                      │
│     Content-Type: application/json                             │
│     User-Agent: curl/8.7.1                                     │
│     X-API-Key: [redacted]                                      │
│                                                                │
│  body:                                                         │
│     {                                                          │
│       "username": "charles",                                   │
│       "email": "charles@example.com"                           │
│     }                                                          │
│                                                                │
│  ->                                                            │
│                                                                │
│  +200ms                                                        │
│  [201]                                                         │
│                                                                │
│  headers:                                                      │
│     Content-Type: application/json                             │
│     X-Request-ID: c7a4d1a5-adb9-4213-8cbf-f5bb3ebe6211        │
│                                                                │
│  body:                                                         │
│     {                                                          │
│       "id": "5662ea6e-2a22-42a1-8749-cc0855349316",           │
│       "username": "charles",                                   │
│       "email": "charles@example.com",                          │
│       "created_at": "2025-11-04T09:33:40+11:00",              │
│       "confirmation_code": "USR-325913"                        │
│     }                                                          │
│                                                                │
│ [← Back to Stream] [Create Rule] [Copy as cURL]               │
└────────────────────────────────────────────────────────────────┘
```

### 3. Rules View
**Access**: Gear icon in header

**Layout**:
```
┌─ Rules by Service ───────────────────────────┐
│                                              │
│ ▼ servicex (3 rules)                         │
│   1. GET /servicex/users/error → mock       │
│   2. POST /servicex/users/** → mock         │
│   3. GET /servicex/** → proxy               │
│                                              │
│ ▼ openai (2 rules)                           │
│   1. POST /openai/v1/chat/completions       │
│   2. GET /openai/** → proxy                  │
│                                              │
│ [+ New Service]                              │
└──────────────────────────────────────────────┘
```

**Click rule** → Rule editor modal

### 4. Rule Editor (Modal)
Simple, clean form-based editor.

```
┌─ Edit Rule ──────────────────────────────────┐
│                                              │
│ Service: [servicex          ▼]              │
│                                              │
│ Match Conditions:                            │
│                                              │
│   Method:  ☑ GET  ☑ POST  ☐ PUT  ☐ DELETE  │
│                                              │
│   Path:    [/servicex/users/**            ]  │
│            (use ** for wildcards)            │
│                                              │
│   Match Headers (optional):                  │
│   [+ Add Header Match]                       │
│                                              │
│   Match Body Regex (optional):               │
│   [.*charles.*                            ]  │
│                                              │
│ ─────────────────────────────────────────── │
│                                              │
│ Action:                                      │
│   ◉ Return Mock Response                     │
│   ○ Proxy to Upstream                        │
│                                              │
│ Response:                                    │
│                                              │
│   Delay: [200] ms  (optional)                │
│   Status: [201]                              │
│                                              │
│   Headers:                                   │
│   ┌──────────────────────────────────────┐  │
│   │ Content-Type: application/json       │  │
│   │ X-Request-ID: {{ uuid }}             │  │
│   └──────────────────────────────────────┘  │
│                                              │
│   Body:                                      │
│   ┌──────────────────────────────────────┐  │
│   │ {                                    │  │
│   │   "id": "{{ uuid }}",                │  │
│   │   "username": "{{ reqBody `username` }}",│
│   │   "email": "{{ reqBody `email` }}"   │  │
│   │ }                                    │  │
│   └──────────────────────────────────────┘  │
│                                              │
│   (We'll format this correctly to YAML)     │
│                                              │
│ [Cancel] [Save Rule]                         │
└──────────────────────────────────────────────┘
```

**Key Points**:
- Simple dropdowns/checkboxes for method
- Text input for path
- Simple textareas for headers and body
- Basic indentation support in textareas
- Backend handles YAML formatting

### 5. Config View
**Access**: Settings icon in header

```
┌─ Configuration ──────────────────────────────┐
│                                              │
│ Server:                                      │
│   Proxy Port:  8769                          │
│   Admin Port:  9090                          │
│   Config Dir:  ~/.config/mockingbird         │
│                                              │
│ API Keys & Values:                           │
│   SERVICEX_API_KEY    sk-exa*** [Edit] [×]  │
│   OPENAI_API_KEY      sk-exa*** [Edit] [×]  │
│   STRIPE_API_KEY      sk_te*** [Edit] [×]   │
│                                              │
│   [+ Add New Value]                          │
│                                              │
│ [Save Changes]                               │
└──────────────────────────────────────────────┘
```

### 6. Stats View
**Access**: Stats icon in header

```
┌─ Statistics ─────────────────────────────────┐
│                                              │
│ Total Requests: 127                          │
│ Total Rules:    5                            │
│                                              │
│ By Service:                                  │
│   servicex ████████████████ 82 (3 rules)    │
│   openai   ████████ 45 (2 rules)             │
│                                              │
│ By Status:                                   │
│   2xx ████████████████████ 98                │
│   4xx ███ 15                                 │
│   5xx ██ 14                                  │
│                                              │
│ Response Types:                              │
│   mock    ████████████ 67                    │
│   proxy   ████████ 45                        │
│   timeout ██ 15                              │
│                                              │
└──────────────────────────────────────────────┘
```

---

## Technology Stack

### Frontend Framework
- **React** (with hooks)
- **Vite** for fast dev/build
- **TypeScript** for type safety

### Styling
- **TailwindCSS** for utility classes
- **Light theme by default** (clean, modern)
- **Sans-serif font** for UI (Inter, SF Pro, or system fonts)
- **Monospace** for code/JSON only (SF Mono, Consolas)

### Libraries
- **EventSource** for SSE (native browser API)
- **react-syntax-highlighter** for JSON display
- **date-fns** for timestamp formatting
- **zustand** for state management (lightweight)
- **react-hot-toast** for notifications

### UI Components
- **shadcn/ui** or similar component library
- Simple, clean components:
  - Buttons
  - Dropdowns/Select
  - Checkboxes
  - Text inputs
  - Textareas
  - Modals
  - Tags for filters

---

## Color Palette

**Light Theme** (similar to SalesBox)

```css
/* Light Theme (Primary) */
--bg-primary:    #ffffff  /* White background */
--bg-secondary:  #f6f8fa  /* Light gray */
--bg-tertiary:   #f0f2f5  /* Slightly darker gray */

--text-primary:  #1f2937  /* Dark gray - main text */
--text-secondary:#6b7280  /* Medium gray - muted */
--text-tertiary: #9ca3af  /* Light gray - very muted */

--accent-blue:   #3b82f6  /* Links, info */
--accent-green:  #10b981  /* Success, 2xx */
--accent-yellow: #f59e0b  /* Warning, 4xx */
--accent-red:    #ef4444  /* Error, 5xx */
--accent-purple: #8b5cf6  /* Special */

--border:        #e5e7eb  /* Subtle borders */
--border-focus:  #3b82f6  /* Focused elements */
```

---

## Component Architecture

```
src/
├── App.tsx                    # Main app shell
├── components/
│   ├── layout/
│   │   ├── Header.tsx         # Top bar with icons
│   │   ├── FilterBar.tsx      # Tag-based filters
│   │   └── StatusBar.tsx      # Bottom status
│   ├── traffic/
│   │   ├── TrafficStream.tsx  # Main log view
│   │   ├── TrafficEntry.tsx   # Single log line
│   │   ├── TrafficDetails.tsx # Side panel
│   │   └── useTrafficSSE.ts   # SSE hook
│   ├── rules/
│   │   ├── RulesList.tsx      # Tree view
│   │   ├── RuleEditor.tsx     # Modal editor
│   │   └── RuleForm.tsx       # Form components
│   ├── config/
│   │   └── ConfigPanel.tsx    # Settings view
│   ├── stats/
│   │   └── StatsPanel.tsx     # Charts/stats
│   └── ui/
│       ├── Tag.tsx            # Filter tag
│       ├── Button.tsx         # Styled button
│       ├── Modal.tsx          # Modal overlay
│       ├── Panel.tsx          # Side panel
│       └── CodeEditor.tsx     # Template editor
├── hooks/
│   ├── useTraffic.ts          # Traffic management
│   ├── useRules.ts            # Rules API
│   └── useConfig.ts           # Config API
├── stores/
│   └── appStore.ts            # Global state
├── types/
│   └── api.ts                 # TypeScript types
└── utils/
    ├── api.ts                 # API client
    └── formatters.ts          # Format helpers
```

---

## Key Features

### 1. Real-Time Updates
- SSE connection to `/api/traffic/stream`
- Auto-reconnect on disconnect
- Visual indicator of connection status
- Pause/resume stream

### 2. Smart Filtering
- Click tags to add/remove filters
- Combine multiple filters (AND logic)
- Filter by:
  - Service name
  - HTTP method
  - Status code
  - Response type (mock/proxy/timeout)
  - Time range
- Save filter presets

### 3. Keyboard Shortcuts
```
/          Focus filter input
Esc        Clear filters / close modals
j/k        Navigate entries up/down
Enter      Expand selected entry
c          Copy request as cURL
r          Create rule from selected
?          Show keyboard shortcuts
```

### 4. Rule Creation Workflow
1. Click traffic entry
2. Click "Create Rule from This"
3. Pre-filled rule editor opens
4. Edit match conditions
5. Choose mock or proxy
6. Edit template
7. Test rule (sends test request)
8. Save

### 5. Simple Form Inputs
- Dropdowns for method selection (multi-select)
- Text inputs for paths
- Textareas for headers (simple, with basic indent support)
- Textareas for body (simple, with basic indent support)
- Optional: Basic JSON validation on blur
- Backend handles formatting to YAML

---

## Implementation Phases

### Phase 1: Core Infrastructure (Week 1)
- [ ] Project setup (Vite + React + TypeScript)
- [ ] Layout components (Header, FilterBar, StatusBar)
- [ ] Dark theme with terminal styling
- [ ] API client setup
- [ ] State management (zustand)

### Phase 2: Traffic View (Week 1)
- [ ] SSE hook for live traffic
- [ ] Traffic stream component
- [ ] Entry formatting
- [ ] Auto-scroll logic
- [ ] Basic filtering

### Phase 3: Details & Rules (Week 2)
- [ ] Traffic details side panel
- [ ] JSON/YAML syntax highlighting
- [ ] Rules list view
- [ ] Rule editor modal
- [ ] Template syntax highlighting

### Phase 4: Polish & Features (Week 2)
- [ ] Config management
- [ ] Stats view
- [ ] Keyboard shortcuts
- [ ] Copy as cURL
- [ ] Create rule from traffic
- [ ] Notifications/toasts
- [ ] Error handling

### Phase 5: Testing & Docs (Week 3)
- [ ] Component tests
- [ ] E2E tests
- [ ] User documentation
- [ ] Deployment guide
- [ ] Performance optimization

---

## Example React Component (TrafficEntry)

```tsx
interface TrafficEntryProps {
  entry: TrafficEntry;
  onClick: () => void;
  selected: boolean;
}

export function TrafficEntry({ entry, onClick, selected }: TrafficEntryProps) {
  const statusColor = getStatusColor(entry.response?.status_code);
  const typeIcon = getTypeIcon(entry.rule_type);

  return (
    <div
      className={cn(
        "font-mono text-sm px-4 py-2 border-l-2 cursor-pointer",
        "hover:bg-tertiary transition-colors",
        selected && "bg-tertiary",
        statusColor
      )}
      onClick={onClick}
    >
      <div className="flex items-center gap-2">
        <span className="text-secondary">
          [{formatTime(entry.timestamp)}]
        </span>
        <Tag variant="method">{entry.method}</Tag>
        <span className="text-primary">{entry.path}</span>
        <Tag variant="status">{entry.response?.status_code}</Tag>
        <span className="text-secondary">
          [{entry.response?.delay_ms}ms]
        </span>
        <Tag variant="type">{typeIcon} {entry.rule_type}</Tag>
      </div>

      {entry.body && (
        <div className="ml-28 text-secondary text-xs mt-1">
          {formatBodySummary(entry.body)}
        </div>
      )}

      <div className="ml-28 text-tertiary text-xs mt-1">
        → {getOutcomeDescription(entry)}
      </div>
    </div>
  );
}
```

---

## Integration with Backend

### API Endpoints Used
- `GET /api/traffic/stream` - SSE for live traffic
- `GET /api/traffic?limit=100` - Initial load
- `GET /api/rules` - List all rules
- `POST /api/rules/:service` - Create rule
- `PUT /api/rules/:service/:index` - Update rule
- `DELETE /api/rules/:service/:index` - Delete rule
- `GET /api/config` - Get config
- `PUT /api/config/:key` - Update config
- `GET /api/stats` - Get statistics

### Deployment
- Built files served from `internal/admin/static/`
- Embedded in Go binary using `embed.FS`
- Accessible at `http://localhost:9090/`

---

## Success Criteria

✅ Real-time traffic updates without page refresh
✅ Filter traffic by multiple criteria simultaneously
✅ Create rules directly from traffic entries
✅ Edit rules with syntax highlighting and validation
✅ Manage config values securely
✅ Keyboard navigation for power users
✅ Responsive design (works on laptop/desktop)
✅ < 1s initial load time
✅ Clean terminal aesthetic maintained throughout

---

## Future Enhancements (Post-MVP)

- Export traffic as HAR files
- Import/export rule sets
- Rule templates library
- Request replay functionality
- Dark/light theme toggle
- Traffic search (full-text)
- Rule testing sandbox
- Analytics dashboard
- Collaborative features (share rules)

---

Ready to build this terminal-style beauty! 🚀
