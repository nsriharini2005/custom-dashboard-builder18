# Halleyx Custom Dashboard Builder
## Full Stack Engineer Challenge II — 2026

---

## Tech Stack
- **Frontend**: HTML5, CSS3 (CSS Variables + Grid), Vanilla JavaScript
- **Backend**: Node.js + Express.js
- **Database**: MongoDB (Mongoose)
- **Charts**: Chart.js
- **Drag & Drop**: SortableJS (CDN)

---

## Project Structure
```
dashboard-builder/
├── backend/
│   ├── server.js         ← Express API + Mongoose models
│   └── package.json
└── frontend/
    ├── index.html        ← Single page app
    ├── css/
    │   └── style.css     ← Full responsive styles
    └── js/
        └── app.js        ← All frontend logic
```

---

## Setup & Run

### 1. Start MongoDB
Make sure MongoDB is running:
```bash
# Windows
net start MongoDB

# Or manually:
mongod
```

### 2. Install Backend Dependencies
```bash
cd backend
npm install
```

### 3. Start the Server
```bash
node server.js
```

### 4. Open in Browser
```
http://localhost:3000
```

---

## Features Implemented

### ✅ Dashboard Page
- Empty state with "Configure Dashboard" CTA
- Date range filter (filters all widgets)
- Widget grid (12-col desktop / 8-col tablet / 4-col mobile)
- Widget hover: Settings (⚙) and Delete (✕) icons
- Auto-refresh after configuration save

### ✅ Dashboard Configuration Page
- Drag widgets from left panel → drop onto canvas
- Reorder widgets via drag-and-drop (SortableJS)
- Per-widget Settings panel (side panel)
- Delete confirmation dialog
- Save Configuration → stored in MongoDB

### ✅ Widget Types
| Widget | Description |
|--------|-------------|
| KPI Card | Metric + aggregation (sum/avg/count/min/max) |
| Bar Chart | Grouped bar chart |
| Line Chart | Trend line |
| Area Chart | Filled area |
| Scatter Plot | X/Y correlation |
| Pie/Doughnut | Distribution by field |
| Data Table | Sortable, paginated, filterable |

### ✅ Customer Orders Module
- Create / Edit / Delete orders
- All form fields with mandatory validation ("Please fill the field")
- Auto-calculated Total Amount
- Status badges with color coding
- Context menu (Edit / Delete per row)

### ✅ Responsive Design
| Screen | Grid |
|--------|------|
| Desktop (>1024px) | 12 columns |
| Tablet (641–1024px) | 8 columns |
| Mobile (≤640px) | 4 columns |

---

## API Endpoints

| Method | URL | Description |
|--------|-----|-------------|
| GET | /api/orders | List all orders |
| POST | /api/orders | Create order |
| PUT | /api/orders/:id | Update order |
| DELETE | /api/orders/:id | Delete order |
| GET | /api/dashboard | Get dashboard layout |
| POST | /api/dashboard | Save dashboard layout |

---

## Design Highlights
- **Dark Obsidian** theme with **Electric Teal** accent (`#00f5b4`)
- **Syne** (display) + **DM Sans** (body) fonts
- Glassmorphic cards, animated empty states
- Fully keyboard accessible
- No UI frameworks — pure CSS + vanilla JS
