# FlowGen Control Center - Frontend Generation Prompts

This document contains comprehensive prompts for generating the FlowGen Control Center UI.
Feed these prompts to a frontend-focused AI model to generate the complete UI.

---

## Master Prompt - Complete Control Center

```
You are an expert frontend developer specializing in secure, enterprise-grade control panels.
Create a complete FlowGen AGI Control Center with the following requirements:

### Project Overview
FlowGen is an emergent AGI system that requires a secure control center for:
- Authentication and session management
- API key provisioning and management
- Policy-based access controli
- Real-time network monitoring
- Memory/intelligence visualization
- Operator management

### Technical Requirements
- **Framework**: Next.js 14+ with App Router
- **Styling**: Tailwind CSS with dark mode by default
- **State**: Zustand for global state
- **API Client**: TanStack Query for data fetching
- **Deployment**: Cloudflare Pages
- **Auth**: JWT tokens with secure httpOnly cookies

### Security Requirements (CRITICAL)
1. All API calls must include Authorization header with Bearer token
2. Login page as the ONLY public route
3. Session timeout after 1 hour of inactivity
4. Rate limiting feedback in UI
5. CSRF protection on all forms
6. XSS prevention - sanitize all user inputs
7. Secure password requirements display
8. Failed login attempt tracking and lockout display
9. Activity audit log visible to admins

### File Structure
/app
  /layout.tsx              # Root layout with auth provider
  /page.tsx                # Redirects to /dashboard or /login
  /login/page.tsx          # Secure login page
  /dashboard/
    /layout.tsx            # Dashboard layout with sidebar
    /page.tsx              # Overview dashboard
    /keys/page.tsx         # API key management
    /policies/page.tsx     # Policy management
    /network/page.tsx      # Network visualization
    /memory/page.tsx       # Memory browser
    /operators/page.tsx    # Operator registry
    /brain/page.tsx        # Brain stats and goals
    /discovery/page.tsx    # Capability discovery
    /audit/page.tsx        # Audit logs
    /settings/page.tsx     # User settings
/components
  /auth/
    LoginForm.tsx
    AuthProvider.tsx
    ProtectedRoute.tsx
    SessionWarning.tsx
  /dashboard/
    Sidebar.tsx
    Header.tsx
    StatsCard.tsx
    ActivityFeed.tsx
  /keys/
    KeyList.tsx
    CreateKeyModal.tsx
    KeyDetailsModal.tsx
    RevokeKeyDialog.tsx
  /policies/
    PolicyList.tsx
    PolicyEditor.tsx
    PermissionMatrix.tsx
  /network/
    NetworkGraph.tsx
    SlotCard.tsx
    SignalFlow.tsx
  /memory/
    MemorySearch.tsx
    MemoryCard.tsx
    PatternList.tsx
  /operators/
    OperatorGrid.tsx
    OperatorDetails.tsx
    PipelineBuilder.tsx
  /brain/
    BrainStats.tsx
    GoalTracker.tsx
    ThoughtHistory.tsx
  /ui/
    Button.tsx
    Input.tsx
    Modal.tsx
    Table.tsx
    Badge.tsx
    Card.tsx
    Alert.tsx
    LoadingSpinner.tsx
/lib
  /api.ts                  # API client configuration
  /auth.ts                 # Auth utilities
  /hooks/
    useAuth.ts
    useSession.ts
    useKeys.ts
    usePolicies.ts
  /stores/
    authStore.ts
    dashboardStore.ts
  /utils/
    formatters.ts
    validators.ts
/types
  /api.ts                  # API response types
  /auth.ts                 # Auth types
  /models.ts               # Data models

Generate all files with complete, production-ready code.
```

---

## Prompt 1: Secure Login Page

```
Create a secure login page for FlowGen Control Center with:

### Visual Design
- Dark theme (bg-gray-900)
- Centered card with subtle glow effect
- FlowGen logo at top (neural network icon)
- "Control Center" title with gradient text
- Glassmorphism effect on card

### Form Fields
1. API Key input (password type with toggle visibility)
   - Label: "API Key"
   - Placeholder: "Enter your API key"
   - Validation: Must start with "fgk_"
   
2. Remember device checkbox (optional)

3. Submit button with loading state
   - Text: "Access Control Center"
   - Loading: Spinner + "Authenticating..."

### Security Features
- Rate limit warning after 3 failed attempts
- Lockout message after 5 failed attempts
- Error messages that don't leak info ("Invalid credentials")
- Honeypot field (hidden, detect bots)
- Time-based lockout display (countdown)

### Error States
- Invalid key format
- Network error
- Rate limited
- Account suspended

### Success Flow
1. Show success animation
2. Redirect to /dashboard
3. Store token securely

### Accessibility
- Keyboard navigation
- Screen reader support
- Focus indicators
- Error announcements

Generate the complete login page with all components.
```

---

#deompt 2: Dashboard Layout & Overview

```
Create the main dashboard layout and overview page:

### Sidebar Navigation
Width: 280px (collapsible to 64px)
Items:
- Dashboard (home icon)
- API Keys (key icon)
- Policies (shield icon)
- Network (network icon)
- Memory (brain icon)
- Operators (cpu icon)
- Brain (sparkles icon)
- Discovery (search icon)
- Audit Log (list icon)
- Settings (gear icon)

Bottom:
- User info (key scope badge)
- Logout button
- Theme toggle

### Header
- Page title (dynamic)
- Search bar
- Notifications bell
- Quick actions menu

### Overview Dashboard Content

#### Stats Row (4 cards)
1. Brain Status
   - State indicator (Ready/Processing/Learning)
   - Uptime
   - Success rate

2. Active Keys
   - Total active keys
   - Created today
   - Expiring soon warning

3. Network Health
   - Active slots count
   - Signals/minute
   - Connection status

4. Memory Usage
   - Total memories
   - Patterns recognized
   - Importance distribution

#### Main Content Area

Left Column (60%):
- Activity Timeline
  - Recent thoughts processed
  - Key events
  - System alerts

Right Column (40%):
- Quick Actions Card
  - Create Key
  - Set Goal
  - Run Discovery
  
- System Health Indicators
  - API latency
  - Memory pressure
  - Discovery status

### Responsive Behavior
- Sidebar collapses on tablet
- Stack cards on mobile
- Bottom navigation on mobile

Generate complete layout with all components.
```

---

## Prompt 3: API Key Management

```
Create the API Key management page:

### Key List Table
Columns:
- Key ID (truncated with copy button)
- Scope (color-coded badge)
  - Master: red
  - Admin: purple
  - User: blue
  - Service: green
  - Readonly: gray
- Owner
- Created date
- Expires date (warning if < 7 days)
- Status (Active/Suspended/Expired)
- Last used
- Actions (View, Rotate, Revoke, Suspend)

Features:
- Search by key ID or owner
- Filter by scope
- Filter by status
- Sort by any column
- Pagination (20 per page)

### Create Key Modal
Form fields:
1. Scope dropdown
   - User (default)
   - Service
   - Readonly
   - Admin (if permitted)
   - Custom

2. Policy selection
   - Dropdown of available policies
   - "Create custom" option

3. Expiration
   - Days until expiry (default: 365)
   - Never expire checkbox (admin only)

4. Metadata
   - Description (optional)
   - Tags (comma separated)

5. Rate limits (advanced section)
   - Requests per minute
   - Requests per hour

Submit shows:
- WARNING: "Save this key now. It cannot be retrieved again."
- Generated key in highlighted box
- Copy button
- "I have saved this key" confirmation

### Key Details Modal
Shows:
- Full key ID
- Scope and policy
- Creation details
- Usage statistics
  - Total requests
  - Last 24h requests
  - Error rate
- Rate limit status
- Active sessions

Actions:
- Rotate key
- Suspend key
- Revoke key

### Revoke Confirmation Dialog
- Warning icon
- "This action cannot be undone"
- Affected sessions count
- Type key ID to confirm
- Revoke button (red)

Generate all components with proper state management.
```

---

## Prompt 4: Policy Management

```
Create the Policy management interface:

### Policy List
Display as cards (grid layout)

Card content:
- Policy name
- Description (truncated)
- Permissions count badge
- Rate limits summary
- Key count using this policy
- Edit/Delete actions

Features:
- Search policies
- Create new policy
- Duplicate policy
- Default policies (non-deletable)

### Policy Editor (Full page or modal)

#### Basic Info Section
- Policy ID (auto-generated, editable before save)
- Name
- Description

#### Permissions Section
Matrix view:
Rows: Resource types
- OPERATOR
- SLOT
- NETWORK
- KEY
- POLICY
- USER
- AUDIT
- SYSTEM

Columns: Permission levels
- None
- Read
- Execute
- Write
- Admin

Each cell is a radio button group.

Resource-specific permissions:
- Add specific resource ID override
- Wildcard (*) for all resources

#### Rate Limits Section
Inputs:
- Requests per minute (number, default: 60)
- Requests per hour (number, default: 1000)
- Requests per day (number, default: 10000)
- Max concurrent (number, default: 10)

#### Restrictions Section
- IP whitelist (textarea, one per line)
- IP blacklist (textarea)
- Time windows
  - Start time
  - End time
  - Days of week checkboxes
- Require 2FA toggle

### Visual Permission Preview
Show what this policy can/cannot do in plain English.
Example: "Can execute operators, read network status, cannot manage keys"

Generate complete policy editor with validation.
```

---

## Prompt 5: Network Visualization

```
Create real-time network visualization:

### Network Graph (Main component)
Using a force-directed graph library (e.g., react-force-graph or D3):

Nodes:
- Slots as circular nodes
- Color by state:
  - IDLE: gray
  - LISTENING: blue
  - PROCESSING: yellow
  - EXECUTING: green
  - WAITING: orange
  - ERROR: red
  - STOPPED: dark gray

- Size by operator count
- Glow effect on active slots

Edges:
- Connections between slots
- Animated flow for active signals
- Direction indicators

Interactions:
- Click node to select
- Hover for quick info
- Drag to reposition
- Zoom and pan

### Slot Details Panel (Right sidebar)
When slot selected:
- Slot ID
- Current state
- Operators attached
- Connected slots
- Recent signals (last 10)
- Bindings list
- Actions:
  - Send test signal
  - Add binding
  - Disconnect

### Signal Monitor (Bottom panel)
Collapsible panel showing:
- Real-time signal stream
- Filter by type
- Filter by source/target
- Signal details on click
- Pause/resume stream

### Network Controls (Top toolbar)
- Refresh layout
- Auto-arrange
- Show/hide labels
- Filter by state
- Create new slot
- Run network diagnostics

### Network Stats Cards
Row of small cards:
- Total slots
- Active slots
- Signals/minute
- Error count
- Avg latency

Generate with WebSocket integration for real-time updates.
```

---

## Prompt 6: Memory Browser

```
Create the memory browser interface:

### Search Bar (Top)
- Full-text search input
- Memory type filter dropdown
- Tags filter (multi-select)
- Importance range slider (0-1)
- Sort by: Importance, Recency, Access count

### Memory Grid/List Toggle
Two view modes:
1. Grid (cards)
2. List (compact table)

### Memory Card
- Memory ID (clickable)
- Content preview (truncated)
- Memory type badge
- Importance bar (visual)
- Tags as pills
- Created date
- Last accessed
- Access count
- Linked memories indicator

### Memory Details Modal
Full view:
- Complete content (formatted)
- All metadata
- Linked memories (clickable)
- Embedding visualization (optional)
- Actions:
  - Edit importance
  - Add tags
  - Create link
  - Compress memories
  - Delete memory

### Patterns Section (Tab or separate area)
Pattern cards:
- Pattern ID
- Pattern type
- Trigger conditions (JSON view)
- Response template
- Occurrence count
- Last triggered
- Success rate bar

### Memory Stats Panel
- Total memories by type (pie chart)
- Importance distribution (histogram)
- Memory growth over time (line chart)
- Recent decay applied

### Bulk Actions
Select multiple memories:
- Compress selected
- Delete selected
- Add tags to selected
- Adjust importance

Generate with pagination and lazy loading.
```

---

## Prompt 7: Brain Control Panel

```
Create the Brain control panel:

### Brain Status Header
Large status card:
- Brain state (large text with icon)
  - INITIALIZING: loading spinner
  - LEARNING: brain icon pulsing
  - READY: green checkmark
  - PROCESSING: gear spinning
  - ADAPTING: refresh icon
  - SUSPENDED: pause icon
  - ERROR: warning icon
- Uptime display
- Success rate circular progress

### Statistics Grid (4 columns)
1. Total Thoughts
   - Number
   - Chart of thoughts over time

2. Success Rate
   - Percentage
   - Pass/fail breakdown

3. Active Goals
   - Count
   - Progress bars

4. Learning Rate
   - Current rate
   - Adjustment slider

### Thought Submission Form
"Submit a Thought" card:
- Thought type selector
  - Query
  - Command
  - Observation
  - Reflection
  - Planning
  - Learning

- Content input (textarea)
- Context fields (dynamic key-value pairs)
- Submit button
- Result display area

### Thought History (Expandable)
Timeline of recent thoughts:
- Timestamp
- Type badge
- Content preview
- Result summary
- Duration
- Expand for full details

### Goals Manager
List of goals:
- Goal description
- Priority slider
- Progress bar (manual update)
- Mark complete
- Add sub-goals
- Delete

Create new goal:
- Description
- Priority (1-10)
- Sub-goals (optional)

### Brain Actions
Control buttons:
- Trigger Adaptation
- Run Reflection
- Suspend Brain
- Resume Brain

### Subsystem Status
Cards for each subsystem:
- Operators (count, healthy)
- Network (slots, signals)
- Memory (total, patterns)
- Discovery (capabilities, sources)

Generate with real-time status updates.
```

---

## Prompt 8: Discovery Dashboard

```
Create the capability discovery dashboard:

### Discovery Sources (Top section)
Table of registered sources:
- Source ID
- Name
- Base URL
- Discovery method
- Last discovery time
- Capabilities found
- Status (Active/Inactive)
- Actions (Discover, Edit, Remove)

Add Source modal:
- Name
- Base URL
- Discovery method dropdown
- Discovery path
- Auth type
- Credentials (secure input)
- Auto-refresh interval

### Discovered Capabilities (Main section)
Filterable grid:

Filters:
- Type (REST, GraphQL, WebSocket, etc.)
- Tags
- Health status
- Source

Capability cards:
- Name
- Type badge
- Endpoint (truncated)
- Method badge (GET/POST/etc.)
- Health indicator
- Success rate
- Response time
- Last health check
- Tags

### Capability Details Modal
Full information:
- Name and description
- Type and method
- Full endpoint
- Input schema (collapsible JSON)
- Output schema (collapsible JSON)
- Health history chart
- Usage statistics
- Test capability button

### Test Capability Panel
When testing:
- Input form (generated from schema)
- Send request button
- Response viewer
- Error display
- Save as example

### Discovery Actions
Toolbar:
- Discover All
- Health Check All
- Export capabilities
- Import capabilities

### Statistics
Bottom row:
- Total sources
- Total capabilities
- Healthy %
- Capabilities by type (bar chart)

Generate with capability testing functionality.
```

---

## Prompt 9: Audit Log

```
Create the audit log viewer:

### Filters Bar
- Date range picker
- Action type filter
  - Authentication
  - Key management
  - Policy changes
  - API calls
  - System events
- User/Key filter
- Resource type filter
- Outcome filter (Success/Failed)
- Search text

### Audit Log Table
Columns:
- Timestamp (with timezone)
- Action type (icon + text)
- Actor (key ID or user)
- Resource
- Outcome (badge)
- IP Address
- Details (expand button)

Features:
- Infinite scroll or pagination
- Export to CSV
- Refresh
- Auto-refresh toggle

### Entry Details (Expandable row)
- Full action description
- Request payload (if applicable)
- Response summary
- Duration
- Additional metadata

### Activity Timeline View (Alternative)
Grouped by day:
- Visual timeline
- Activity summary per day
- Drill down to entries

### Statistics Panel (Collapsible top)
- Total actions (24h, 7d, 30d)
- Failed actions count
- Most active keys
- Action distribution chart

### Alerts Configuration
Set up notifications for:
- Failed auth attempts
- Policy changes
- Key revocations
- Unusual activity

Generate with real-time updates and export functionality.
```

---

## Prompt 10: Settings Page

```
Create the settings page:

### Profile Section
- Current key information
  - Key ID
  - Scope
  - Policy name
  - Expiration
- Active sessions list
  - Session ID
  - Created
  - Last activity
  - IP address
  - Revoke button

### Security Settings
- Change API key (request new key)
- Rotate current key
- View key permissions (read-only)
- Session timeout setting
- Require re-auth for sensitive actions

### Notification Preferences
Email notifications (if email configured):
- Key expiration warnings
- Security alerts
- System status updates
- Weekly digest

### Appearance
- Theme toggle (Dark/Light/System)
- Sidebar compact mode
- Dashboard layout customization
- Date/time format

### API Access
- Current rate limits
- Usage this period
- API endpoint reference
- Generate access token for external tools

### Danger Zone
Red bordered section:
- Revoke all sessions
- Revoke current key
- Export all data

Each action requires confirmation.

Generate with form validation and save confirmation.
```

---

## Cloudflare Pages Configuration

```
Create deployment configuration for Cloudflare Pages:

### wrangler.toml
name = "flowgen-control-center"
compatibility_date = "2024-01-01"

[site]
bucket = "./out"

### next.config.js for static export
const nextConfig = {
  output: 'export',
  trailingSlash: true,
  images: {
    unoptimized: true,
  },
  env: {
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL,
  },
};

### Environment Variables
NEXT_PUBLIC_API_URL - API endpoint (Worker URL)

### Build Command
npm run build

### Output Directory
out/

Generate complete configuration files.
```

---

## API Client Configuration

```
Create the API client with proper error handling:

### Base Configuration
- Base URL from environment
- Request interceptor for auth token
- Response interceptor for errors
- Retry logic for 5xx errors
- Rate limit handling (429)
- Token refresh on 401

### API Endpoints
Auth:
  POST /api/auth/login
  POST /api/auth/logout
  POST /api/auth/refresh

Keys:
  GET /api/keys
  POST /api/keys
  DELETE /api/keys/:id
  POST /api/keys/:id/rotate
  POST /api/keys/:id/suspend
  POST /api/keys/:id/reactivate

Policies:
  GET /api/policies
  POST /api/policies
  PUT /api/policies/:id
  DELETE /api/policies/:id

Brain:
  GET /api/brain/stats
  POST /api/brain/think
  POST /api/brain/goals
  POST /api/brain/adapt

Network:
  GET /api/network/slots
  POST /api/network/signal
  GET /api/network/stats

Memory:
  POST /api/memory/store
  POST /api/memory/recall
  GET /api/memory/stats

Operators:
  GET /api/operators
  POST /api/operators/:name/invoke

Discovery:
  GET /api/discovery/capabilities
  POST /api/discovery/discover

Audit:
  GET /api/audit

Health:
  GET /api/health
  GET /api/health/detailed

### Types for all endpoints
Generate TypeScript types matching the API responses.

### React Query hooks for all endpoints
Generate custom hooks with proper caching and invalidation.
```

---

## Component Library Prompt

```
Create a reusable component library for the control center:

### Button
Variants: primary, secondary, danger, ghost
Sizes: sm, md, lg
States: loading, disabled
Icons: left, right, only

### Input
Types: text, password, number, email
States: error, disabled
Addons: left icon, right icon, button

### Select
Single and multi-select
Searchable option
Custom option rendering

### Modal
Sizes: sm, md, lg, xl, full
Overlay click to close option
Close button
Footer with actions

### Card
Variants: default, outlined, elevated
Header with actions
Collapsible content
Footer

### Table
Sortable columns
Selectable rows
Pagination
Loading state
Empty state

### Badge
Variants matching key scopes
Custom colors
Sizes

### Alert
Types: info, success, warning, error
Dismissible option
Icon

### Tabs
Horizontal and vertical
Lazy loading content
Controlled and uncontrolled

### Loading States
Spinner
Skeleton
Progress bar

### Charts
Line chart
Bar chart
Pie/Donut chart
Using a lightweight library

All components must:
- Be fully accessible
- Support dark mode
- Use Tailwind classes
- Have TypeScript types
- Include usage examples

Generate the complete component library.
```

---

## Usage Instructions

1. **Start with Master Prompt** - Provides overall structure and requirements
2. **Generate in Order** - Login → Layout → Pages → Components
3. **Adjust for Your Stack** - Modify if using different libraries
4. **Test Security** - Ensure auth works before other pages
5. **Deploy to Cloudflare Pages** - Use provided configuration

Each prompt is self-contained but references the overall architecture from the master prompt.
