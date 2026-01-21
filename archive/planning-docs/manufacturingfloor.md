Manufacturing Control Floor Integration Plan
Based on the attached concept document, here's a comprehensive plan to integrate an advanced Manufacturing Control Floor system into your existing application.

Overview
The Manufacturing Control Floor will be a spatial, real-time production visualization system that serves as the primary landing view for manufacturer role users. It will integrate with your existing manufacturing infrastructure while providing a dramatically improved operational interface.

Architecture Integration
1. Data Model Extensions
New Tables Required:

// Manufacturing Machines
- machines (id, name, type, zone, capacity, status, manufacturerId)
- machine_assignments (id, machineId, orderId, lineItemId, startedAt, completedAt)
- machine_maintenance_logs (id, machineId, type, scheduledDate, completedDate, notes)
- machine_metrics (id, machineId, utilizationPercent, uptime, downtime, timestamp)
// Manufacturing Employees
- manufacturing_employees (id, name, manufacturerId, skills, shiftType, status)
- employee_assignments (id, employeeId, machineId, zoneId, assignedAt, unassignedAt)
- employee_utilization (id, employeeId, hoursWorked, efficiency, timestamp)
// Production Zones
- production_zones (id, name, order, capacity, manufacturerId)
- zone_metrics (id, zoneId, currentLoad, maxLoad, avgThroughput, timestamp)
// Production Steps (extends existing manufacturing statuses)
- production_step_logs (id, manufacturerJobId, step, machineId, employeeId, startedAt, completedAt, notes)
Schema Extensions to Existing Tables:

// Add to manufacturerJobs table
- currentZoneId (FK to production_zones)
- assignedMachineId (FK to machines)
- assignedEmployeeIds (array of employee IDs)
- stepCompletions (JSON tracking per-step progress)
- exceptionFlags (JSON for SLA misses, QC fails, etc.)
// Add to orderLineItems table
- currentProductionStep (manufacturing step status)
- assignedMachineId
- assignedEmployeeId
- stepStartedAt
- stepCompletedAt
2. New Routes & Endpoints
API Routes (server/routes/manufacturing-control-floor.routes.ts):

// Real-time floor state
GET /api/manufacturing-control-floor/state
  - Returns complete floor state: zones, machines, employees, jobs, exceptions
// Zone management
GET /api/manufacturing-control-floor/zones
POST /api/manufacturing-control-floor/zones
PUT /api/manufacturing-control-floor/zones/:id
DELETE /api/manufacturing-control-floor/zones/:id
// Machine management
GET /api/manufacturing-control-floor/machines
POST /api/manufacturing-control-floor/machines
PUT /api/manufacturing-control-floor/machines/:id
PATCH /api/manufacturing-control-floor/machines/:id/status
POST /api/manufacturing-control-floor/machines/:id/assign-job
POST /api/manufacturing-control-floor/machines/:id/maintenance
// Employee management
GET /api/manufacturing-control-floor/employees
POST /api/manufacturing-control-floor/employees
PUT /api/manufacturing-control-floor/employees/:id
POST /api/manufacturing-control-floor/employees/:id/assign
POST /api/manufacturing-control-floor/employees/:id/unassign
// Assignment & flow control
POST /api/manufacturing-control-floor/assign-job-to-machine
POST /api/manufacturing-control-floor/move-job-to-zone
POST /api/manufacturing-control-floor/reassign-employee
// Metrics & analytics
GET /api/manufacturing-control-floor/metrics/zones
GET /api/manufacturing-control-floor/metrics/machines
GET /api/manufacturing-control-floor/metrics/employees
GET /api/manufacturing-control-floor/capacity-analysis
// Exceptions & alerts
GET /api/manufacturing-control-floor/exceptions
POST /api/manufacturing-control-floor/exceptions/:id/resolve
// Playback / audit (advanced feature)
GET /api/manufacturing-control-floor/playback/:timestamp
GET /api/manufacturing-control-floor/timeline/:jobId
3. Frontend Architecture
New Pages:

// Primary view (replaces current manufacturer home for manufacturer role)
client/src/pages/manufacturing-control-floor.tsx
  - Production floor spatial view (default)
  - View switcher to toggle to legacy list/board view
  - Real-time WebSocket integration
  - Exception-first filtering
  - Zone-based layout
// Management pages
client/src/pages/manufacturing-floor-machines.tsx
  - Machine CRUD, maintenance scheduling, metrics
client/src/pages/manufacturing-floor-employees.tsx
  - Employee CRUD, skill management, shift scheduling
client/src/pages/manufacturing-floor-zones.tsx
  - Zone configuration, capacity settings
New Components:

client/src/components/manufacturing-control-floor/
  - ProductionFloorCanvas.tsx (main spatial view)
  - ProductionZone.tsx (zone container with capacity visualization)
  - ProductionUnit.tsx (order/job card that moves between zones)
  - MachineStation.tsx (machine tile with status, queue, assignments)
  - EmployeeBadge.tsx (employee avatar with skills, status, assignment)
  - ExceptionPanel.tsx (floating panel showing active issues)
  - CapacityGauge.tsx (visual load indicator per zone/machine)
  - OrderExplodedView.tsx (detailed line item breakdown)
  - ShiftBoundary.tsx (time separator overlay)
  - ProcessSpine.tsx (vertical/horizontal step indicator)
  - FloorMetricsHUD.tsx (top bar with key stats)
  - ViewSwitcher.tsx (toggle between floor view and legacy views)
  - PlaybackScrubber.tsx (timeline control for audit mode)
4. Real-Time Updates
WebSocket Integration:

// server/websocket/manufacturing-floor.ws.ts
- Broadcast zone state changes
- Broadcast machine status updates
- Broadcast employee assignments
- Broadcast job movements
- Broadcast exception alerts
// client/src/hooks/useManufacturingFloorSocket.ts
- Subscribe to floor updates
- Optimistic updates for assignments
- Automatic reconnection
- State synchronization
5. State Management
// client/src/contexts/ManufacturingFloorContext.tsx
- Floor state (zones, machines, employees, jobs)
- Exception list
- Capacity calculations
- Assignment operations
- Filter state (exception-first mode, zone focus, etc.)
// client/src/hooks/useManufacturingFloor.ts
- CRUD operations for zones, machines, employees
- Job assignment/reassignment
- Capacity calculations
- Exception detection and resolution
Integration with Existing System
Role-Based Access
Update Navigation:

Add "Manufacturing Control Floor" to manufacturer role home page
Make it the default landing view for manufacturer role
Preserve access to existing manufacturing portal as secondary view
Permission Updates:

// server/permissions.ts
manufacturer: {
  manufacturingControlFloor: { read: true, write: true, delete: false, viewAll: false }
  machines: { read: true, write: true, delete: false, viewAll: false }
  manufacturingEmployees: { read: true, write: true, delete: false, viewAll: false }
  productionZones: { read: true, write: true, delete: false, viewAll: false }
}
Workflow Integration
Link to Existing Manufacturer Funnel:

Production zones map to manufacturer funnel stages
Moving a job to a zone updates manufacturerStatus
Step completions sync with funnel progression
Exceptions trigger based on funnel SLA rules
Preserve Backward Compatibility:

Existing manufacturer portal remains accessible
Jobs without machine/employee assignments still flow through funnel
API endpoints remain functional for existing integrations
Data Migration
Migration Script:

// scripts/migrate-to-control-floor.ts
1. Create default zones based on existing funnel stages
2. Create placeholder machines if none exist
3. Map existing jobs to zones based on current status
4. Generate initial capacity metrics
Implementation Phases
Phase 1: Core Infrastructure (Week 1-2)
Database schema additions
Basic API routes for zones, machines, employees
Simple floor canvas component
Zone and job visualization
Phase 2: Assignment System (Week 3)
Machine assignment logic
Employee assignment logic
Drag-and-drop interactions
Real-time updates via WebSocket
Phase 3: Visualization & UX (Week 4)
Capacity visualization
Exception-first mode
Process spine overlay
Shift boundaries
Metrics HUD
Phase 4: Advanced Features (Week 5-6)
Machine management UI
Employee management UI
Maintenance scheduling
Playback/audit mode
Order exploded view
Key Design Decisions
Visual Framework
Use React Flow or D3.js for spatial layout and node-based interactions
Use Framer Motion for smooth zone transitions and load animations
Leverage existing shadcn/ui components for panels and modals
Layout Strategy
Horizontal zone layout (left to right workflow)
Each zone expands/contracts based on current load
Orders flow naturally between zones with animated transitions
Exceptions "float" above normal flow
Color System
Normal flow: subtle, receded (muted blues/grays)
Exceptions: vibrant alerts (red for critical, yellow for warnings)
Machines: green (idle), blue (running), orange (paused), red (down)
Zones: dynamic gradient based on capacity (cool when under, warm when over)
Mobile Considerations
Floor view requires desktop/tablet (minimum 1024px width)
Fallback to list view on mobile devices
Touch-friendly assignments for tablets
Technical Requirements
Performance
Render up to 100 active jobs simultaneously
Sub-100ms update latency via WebSocket
Virtualized rendering for large machine/employee lists
Debounced capacity recalculations
Accessibility
Keyboard navigation for assignments
Screen reader support for exception alerts
High contrast mode option
Security
Manufacturer users see only their facility's data
Admin/ops can view all facilities
Audit trail for all assignments and reassignments
Success Metrics
Operational Efficiency

Time to identify bottlenecks reduced by 70%
Assignment changes reduced from 5 clicks to 1 drag
Exception Management

SLA violations detected 50% faster
Issue resolution time reduced by 40%
User Adoption

90% of manufacturer users prefer floor view over portal
Daily active usage of floor view > 80%
Conclusion
This Manufacturing Control Floor system represents a paradigm shift from list-based manufacturing management to spatial, real-time production control. By treating machines and employees as first-class system objects and visualizing flow rather than static records, we create an operations interface that mirrors the physical reality of the production floor.

The system integrates seamlessly with existing manufacturer funnel infrastructure while providing a dramatically superior user experience for day-to-day production management.