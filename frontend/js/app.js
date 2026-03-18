/* ════════════════════════════════════════════
   HALLEYX DASHBOARD BUILDER — APP.JS
════════════════════════════════════════════ */

const API = window.location.hostname === 'localhost' 
  ? 'http://localhost:3000/api' 
  : '/api';

// ─── State ───────────────────────────────────
let orders = [];
let dashboardLayout = []; // saved
let canvasWidgets = [];   // in-config
let editingWidgetId = null;
let chartInstances = {};
let dateFrom = null, dateTo = null;

// ─── Unique ID ────────────────────────────────
const uid = () => '_' + Math.random().toString(36).substr(2, 9);

// ─── Widget defaults ──────────────────────────
const WIDGET_DEFAULTS = {
  kpi:     { title: 'KPI Card',     colSpan: 3, rowSpan: 1, metric: 'totalAmount', aggregation: 'sum', format: 'currency', precision: 2 },
  bar:     { title: 'Bar Chart',    colSpan: 6, rowSpan: 2, xAxis: 'product', yAxis: 'totalAmount', color: '#00f5b4', showLabel: false },
  line:    { title: 'Line Chart',   colSpan: 6, rowSpan: 2, xAxis: 'createdAt', yAxis: 'totalAmount', color: '#7c6fff', showLabel: false },
  area:    { title: 'Area Chart',   colSpan: 6, rowSpan: 2, xAxis: 'createdAt', yAxis: 'totalAmount', color: '#00f5b4', showLabel: false },
  scatter: { title: 'Scatter Plot', colSpan: 6, rowSpan: 2, xAxis: 'quantity', yAxis: 'totalAmount', color: '#ffb84f', showLabel: false },
  pie:     { title: 'Pie Chart',    colSpan: 4, rowSpan: 2, chartData: 'status', showLegend: true },
  table:   { title: 'Data Table',   colSpan: 12, rowSpan: 3, columns: ['firstName','product','totalAmount','status'], sortBy: '', pagination: '10', applyFilter: false, fontSize: 12, headerBg: '#14141f' }
};

const FIELDS = ['firstName','lastName','email','product','quantity','unitPrice','totalAmount','status','createdBy','city','country'];
const FIELD_LABELS = { firstName:'First Name', lastName:'Last Name', email:'Email', product:'Product', quantity:'Quantity', unitPrice:'Unit Price', totalAmount:'Total Amount', status:'Status', createdBy:'Created By', city:'City', country:'Country', createdAt:'Date' };

// ═══════════════════════════════════════════════
// NAVIGATION
// ═══════════════════════════════════════════════
function navigate(page) {
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
  document.getElementById('page-' + page)?.classList.add('active');
  document.querySelector(`.nav-item[data-page="${page}"]`)?.classList.add('active');

  if (page === 'dashboard') renderDashboard();
  if (page === 'orders') loadOrders();
  if (page === 'configure') initConfigure();
}

function toggleSidebar() {
  document.getElementById('sidebar').classList.toggle('open');
}

// ═══════════════════════════════════════════════
// ORDERS
// ═══════════════════════════════════════════════
async function loadOrders() {
  try {
    const res = await fetch(`${API}/orders`);
    const data = await res.json();
    orders = data.data || [];
    renderOrdersTable();
  } catch(e) { showToast('Failed to load orders', 'error'); }
}

function renderOrdersTable() {
  const tbody = document.getElementById('orders-tbody');
  document.getElementById('orders-count').textContent = `${orders.length} record${orders.length !== 1 ? 's' : ''}`;

  if (!orders.length) {
    tbody.innerHTML = `<tr><td colspan="11" class="empty-row">No orders yet. Create one!</td></tr>`;
    return;
  }

  const filtered = getFilteredOrders();
  tbody.innerHTML = filtered.map((o, i) => `
    <tr>
      <td><span style="color:var(--text-muted)">${i+1}</span></td>
      <td><strong style="color:var(--text-primary)">${o.firstName} ${o.lastName}</strong></td>
      <td>${o.email}</td>
      <td>${o.product}</td>
      <td>${o.quantity}</td>
      <td>₹${Number(o.unitPrice).toFixed(2)}</td>
      <td style="color:var(--accent);font-weight:600">₹${Number(o.totalAmount).toFixed(2)}</td>
      <td><span class="status-badge status-${o.status}">${o.status}</span></td>
      <td>${o.createdBy}</td>
      <td>${new Date(o.createdAt).toLocaleDateString()}</td>
      <td>
        <div class="action-btns">
          <button class="action-btn edit" onclick="openOrderModal('${o._id}')" title="Edit">✎</button>
          <button class="action-btn del" onclick="deleteOrder('${o._id}')" title="Delete">✕</button>
        </div>
      </td>
    </tr>
  `).join('');
}

function getFilteredOrders() {
  if (!dateFrom && !dateTo) return orders;
  return orders.filter(o => {
    const d = new Date(o.createdAt);
    if (dateFrom && d < new Date(dateFrom)) return false;
    if (dateTo && d > new Date(dateTo + 'T23:59:59')) return false;
    return true;
  });
}

function openOrderModal(id) {
  clearOrderForm();
  const modal = document.getElementById('order-modal');
  if (id) {
    const o = orders.find(o => o._id === id);
    if (!o) return;
    document.getElementById('modal-title').textContent = 'Edit Order';
    document.getElementById('order-id').value = o._id;
    ['firstName','lastName','email','phone','street','city','state','postalCode','country',
     'product','quantity','unitPrice','status','createdBy'].forEach(f => {
      const el = document.getElementById('f-' + f);
      if (el) el.value = o[f] || '';
    });
    calcTotal();
  } else {
    document.getElementById('modal-title').textContent = 'Create Order';
    document.getElementById('order-id').value = '';
  }
  modal.classList.add('open');
}

function clearOrderForm() {
  ['firstName','lastName','email','phone','street','city','state','postalCode','country',
   'product','quantity','unitPrice','totalAmount','status','createdBy'].forEach(f => {
    const el = document.getElementById('f-' + f);
    if (el) el.value = '';
  });
  document.querySelectorAll('.form-group .err').forEach(e => e.textContent = '');
}

function calcTotal() {
  const q = parseFloat(document.getElementById('f-quantity')?.value) || 0;
  const p = parseFloat(document.getElementById('f-unitPrice')?.value) || 0;
  document.getElementById('f-totalAmount').value = (q * p).toFixed(2);
}

async function submitOrder() {
  const fields = ['firstName','lastName','email','phone','street','city','state','postalCode','country','product','quantity','unitPrice','status','createdBy'];
  let valid = true;
  const data = {};

  fields.forEach(f => {
    const el = document.getElementById('f-' + f);
    const err = el?.parentElement.querySelector('.err');
    if (!el?.value?.trim()) {
      if (err) err.textContent = 'Please fill the field';
      valid = false;
    } else {
      if (err) err.textContent = '';
      data[f] = el.value.trim();
    }
  });

  if (!valid) return;

  const id = document.getElementById('order-id').value;
  try {
    const url = id ? `${API}/orders/${id}` : `${API}/orders`;
    const method = id ? 'PUT' : 'POST';
    const res = await fetch(url, { method, headers: {'Content-Type':'application/json'}, body: JSON.stringify(data) });
    const result = await res.json();
    if (result.success) {
      closeModal('order-modal');
      await loadOrders();
      showToast(id ? 'Order updated!' : 'Order created!', 'success');
    } else showToast(result.message || 'Error', 'error');
  } catch(e) { showToast('Server error', 'error'); }
}

async function deleteOrder(id) {
  showConfirm('Are you sure you want to delete this order?', async () => {
    try {
      const res = await fetch(`${API}/orders/${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) { await loadOrders(); showToast('Order deleted', 'success'); }
    } catch(e) { showToast('Error deleting order', 'error'); }
  });
}

// ═══════════════════════════════════════════════
// DATE FILTER
// ═══════════════════════════════════════════════
function applyDateFilter() {
  dateFrom = document.getElementById('dateFrom')?.value || null;
  dateTo = document.getElementById('dateTo')?.value || null;
  renderDashboard();
}

function clearDateFilter() {
  dateFrom = null; dateTo = null;
  const df = document.getElementById('dateFrom'), dt = document.getElementById('dateTo');
  if (df) df.value = ''; if (dt) dt.value = '';
  renderDashboard();
}

// ═══════════════════════════════════════════════
// CONFIGURE PAGE
// ═══════════════════════════════════════════════
function initConfigure() {
  canvasWidgets = dashboardLayout.map(w => ({...w}));
  renderCanvas();
}

// ─ Palette drag ──
function paletteDragStart(e) {
  e.dataTransfer.setData('palette-type', e.currentTarget.dataset.type);
}

function canvasDragOver(e) {
  e.preventDefault();
  document.getElementById('canvas-grid').classList.add('drag-over');
}

function canvasDragLeave(e) {
  if (!e.currentTarget.contains(e.relatedTarget)) {
    document.getElementById('canvas-grid').classList.remove('drag-over');
  }
}

function canvasDrop(e) {
  e.preventDefault();
  document.getElementById('canvas-grid').classList.remove('drag-over');
  const type = e.dataTransfer.getData('palette-type');
  if (!type) return;
  const def = WIDGET_DEFAULTS[type];
  const w = { id: uid(), type, ...JSON.parse(JSON.stringify(def)) };
  canvasWidgets.push(w);
  renderCanvas();
}

function renderCanvas() {
  const grid = document.getElementById('canvas-grid');
  const placeholder = document.getElementById('canvas-placeholder');

  // Clear previous widgets (keep placeholder)
  Array.from(grid.children).forEach(c => {
    if (c !== placeholder) c.remove();
  });

  if (!canvasWidgets.length) {
    placeholder.style.display = 'flex';
    return;
  }
  placeholder.style.display = 'none';

  canvasWidgets.forEach((w, idx) => {
    const el = document.createElement('div');
    el.className = 'canvas-widget';
    el.style.gridColumn = `span ${w.colSpan}`;
    el.dataset.idx = idx;
    el.draggable = true;
    el.innerHTML = `
      <div class="cw-actions">
        <button class="cw-btn" onclick="openWidgetSettings(${idx})" title="Settings">⚙</button>
        <button class="cw-btn del" onclick="removeCanvasWidget(${idx})" title="Delete">✕</button>
      </div>
      <div class="widget-label">${typeIcon(w.type)} ${w.title}</div>
      <div class="widget-meta">${w.colSpan} cols × ${w.rowSpan} rows · ${w.type}</div>
    `;
    grid.appendChild(el);
  });

  // SortableJS for canvas reorder
  if (window._sortable) window._sortable.destroy();
  window._sortable = Sortable.create(grid, {
    animation: 150,
    filter: '.canvas-placeholder',
    onEnd: (evt) => {
      // Adjust for placeholder offset
      const from = evt.oldIndex - 1;
      const to = evt.newIndex - 1;
      if (from >= 0 && to >= 0 && from !== to) {
        const moved = canvasWidgets.splice(from, 1)[0];
        canvasWidgets.splice(to, 0, moved);
        renderCanvas();
      }
    }
  });
}

function removeCanvasWidget(idx) {
  showConfirm('Remove this widget from the dashboard?', () => {
    canvasWidgets.splice(idx, 1);
    renderCanvas();
  });
}

function typeIcon(type) {
  const icons = { kpi:'◆', bar:'▦', line:'◟', area:'◜', scatter:'⋯', pie:'◔', table:'▤' };
  return `<span style="color:var(--accent)">${icons[type] || '◈'}</span>`;
}

// ─ Save ──
async function saveConfiguration() {
  try {
    const res = await fetch(`${API}/dashboard`, {
      method: 'POST',
      headers: {'Content-Type':'application/json'},
      body: JSON.stringify({ layout: canvasWidgets })
    });
    const data = await res.json();
    if (data.success) {
      dashboardLayout = [...canvasWidgets];
      showToast('Dashboard saved!', 'success');
      navigate('dashboard');
    }
  } catch(e) { showToast('Failed to save', 'error'); }
}

// ═══════════════════════════════════════════════
// WIDGET SETTINGS PANEL
// ═══════════════════════════════════════════════
function openWidgetSettings(idx) {
  editingWidgetId = idx;
  const w = canvasWidgets[idx];
  document.getElementById('panel-title').textContent = w.title + ' Settings';
  document.getElementById('panel-body').innerHTML = buildSettingsForm(w);
  document.getElementById('settings-overlay').classList.add('open');
  document.getElementById('settings-panel').classList.add('open');
}

function openDashboardWidgetSettings(id) {
  const w = dashboardLayout.find(w => w.id === id);
  if (!w) return;
  editingWidgetId = dashboardLayout.indexOf(w);
  document.getElementById('panel-title').textContent = w.title + ' Settings';
  document.getElementById('panel-body').innerHTML = buildSettingsForm(w);
  document.getElementById('settings-overlay').classList.add('open');
  document.getElementById('settings-panel').classList.add('open');
}

function closeSettings() {
  document.getElementById('settings-overlay').classList.remove('open');
  document.getElementById('settings-panel').classList.remove('open');
  editingWidgetId = null;
}

function saveWidgetSettings() {
  const isConfigure = document.getElementById('page-configure').classList.contains('active');
  const arr = isConfigure ? canvasWidgets : dashboardLayout;
  const w = arr[editingWidgetId];
  if (!w) return;

  const get = id => document.getElementById(id)?.value ?? null;
  const getCheck = id => document.getElementById(id)?.checked ?? false;

  w.title = get('ws-title') || w.title;
  w.colSpan = parseInt(get('ws-colSpan')) || w.colSpan;
  w.rowSpan = parseInt(get('ws-rowSpan')) || w.rowSpan;

  if (w.type === 'kpi') {
    w.metric = get('ws-metric') || w.metric;
    w.aggregation = get('ws-agg') || w.aggregation;
    w.format = get('ws-format') || w.format;
    w.precision = parseInt(get('ws-precision')) || w.precision;
    w.description = get('ws-desc') || '';
  } else if (['bar','line','area','scatter'].includes(w.type)) {
    w.xAxis = get('ws-xaxis') || w.xAxis;
    w.yAxis = get('ws-yaxis') || w.yAxis;
    w.color = get('ws-color') || w.color;
    w.showLabel = getCheck('ws-showlabel');
    w.description = get('ws-desc') || '';
  } else if (w.type === 'pie') {
    w.chartData = get('ws-chartdata') || w.chartData;
    w.showLegend = getCheck('ws-legend');
    w.description = get('ws-desc') || '';
  } else if (w.type === 'table') {
    w.sortBy = get('ws-sortby') || '';
    w.pagination = get('ws-pagination') || '10';
    w.applyFilter = getCheck('ws-applyfilter');
    w.fontSize = parseInt(get('ws-fontsize')) || 12;
    w.headerBg = get('ws-headerbg') || '#14141f';
    // Columns multi-select
    const sel = document.getElementById('ws-columns');
    if (sel) w.columns = Array.from(sel.selectedOptions).map(o => o.value);
    w.description = get('ws-desc') || '';
  }

  closeSettings();

  if (isConfigure) renderCanvas();
  else { renderDashboard(); }

  showToast('Widget updated', 'success');
}

function buildSettingsForm(w) {
  const fieldOpts = FIELDS.map(f => `<option value="${f}" ${w.columns?.includes(f) ? 'selected' : ''}>${FIELD_LABELS[f]||f}</option>`).join('');
  const axisOpts = ['product','status','country','city','createdBy','quantity','unitPrice','totalAmount','createdAt']
    .map(f => `<option value="${f}">${FIELD_LABELS[f]||f}</option>`).join('');

  let specific = '';

  if (w.type === 'kpi') {
    specific = `
      <div class="panel-section">
        <div class="panel-section-title">Data Settings</div>
        <div class="panel-field"><label>Select Metric</label>
          <select id="ws-metric">
            ${['totalAmount','quantity','unitPrice'].map(m => `<option value="${m}" ${w.metric===m?'selected':''}>${FIELD_LABELS[m]||m}</option>`).join('')}
          </select></div>
        <div class="panel-field"><label>Aggregation</label>
          <select id="ws-agg">
            ${['sum','avg','count','min','max'].map(a => `<option value="${a}" ${w.aggregation===a?'selected':''}>${a.toUpperCase()}</option>`).join('')}
          </select></div>
        <div class="panel-field"><label>Data Format</label>
          <select id="ws-format">
            ${['currency','number','percentage'].map(f => `<option value="${f}" ${w.format===f?'selected':''}>${f}</option>`).join('')}
          </select></div>
        <div class="panel-field"><label>Decimal Precision</label>
          <input type="number" id="ws-precision" value="${w.precision}" min="0" max="5"/></div>
      </div>`;
  } else if (['bar','line','area','scatter'].includes(w.type)) {
    specific = `
      <div class="panel-section">
        <div class="panel-section-title">Data Settings</div>
        <div class="panel-field"><label>X-Axis Data</label>
          <select id="ws-xaxis">${['product','status','country','city','createdBy','quantity','createdAt'].map(f=>`<option value="${f}" ${w.xAxis===f?'selected':''}>${FIELD_LABELS[f]||f}</option>`).join('')}</select></div>
        <div class="panel-field"><label>Y-Axis Data</label>
          <select id="ws-yaxis">${['totalAmount','quantity','unitPrice'].map(f=>`<option value="${f}" ${w.yAxis===f?'selected':''}>${FIELD_LABELS[f]||f}</option>`).join('')}</select></div>
      </div>
      <div class="panel-section">
        <div class="panel-section-title">Styling</div>
        <div class="panel-field"><label>Chart Color</label><input type="color" id="ws-color" value="${w.color||'#00f5b4'}"/></div>
        <div class="checkbox-group"><input type="checkbox" id="ws-showlabel" ${w.showLabel?'checked':''}/><label for="ws-showlabel">Show Data Labels</label></div>
      </div>`;
  } else if (w.type === 'pie') {
    specific = `
      <div class="panel-section">
        <div class="panel-section-title">Data Settings</div>
        <div class="panel-field"><label>Chart Data</label>
          <select id="ws-chartdata">${['status','product','country','createdBy','city'].map(f=>`<option value="${f}" ${w.chartData===f?'selected':''}>${FIELD_LABELS[f]||f}</option>`).join('')}</select></div>
        <div class="checkbox-group"><input type="checkbox" id="ws-legend" ${w.showLegend?'checked':''}/><label for="ws-legend">Show Legend</label></div>
      </div>`;
  } else if (w.type === 'table') {
    specific = `
      <div class="panel-section">
        <div class="panel-section-title">Data Settings</div>
        <div class="panel-field"><label>Choose Columns (Ctrl+Click multi-select)</label>
          <select id="ws-columns" multiple size="7" style="height:140px">${fieldOpts}</select></div>
        <div class="panel-field"><label>Sort By</label>
          <select id="ws-sortby"><option value="">None</option>${FIELDS.map(f=>`<option value="${f}" ${w.sortBy===f?'selected':''}>${FIELD_LABELS[f]||f}</option>`).join('')}</select></div>
        <div class="panel-field"><label>Pagination</label>
          <select id="ws-pagination">${['5','10','20','50'].map(n=>`<option ${w.pagination===n?'selected':''}>${n}</option>`).join('')}</select></div>
        <div class="checkbox-group"><input type="checkbox" id="ws-applyfilter" ${w.applyFilter?'checked':''}/><label for="ws-applyfilter">Apply Date Filter</label></div>
      </div>
      <div class="panel-section">
        <div class="panel-section-title">Styling</div>
        <div class="panel-field"><label>Font Size</label><input type="number" id="ws-fontsize" value="${w.fontSize||12}" min="10" max="20"/></div>
        <div class="panel-field"><label>Header Background</label><input type="color" id="ws-headerbg" value="${w.headerBg||'#14141f'}"/></div>
      </div>`;
  }

  return `
    <div class="panel-section">
      <div class="panel-section-title">General</div>
      <div class="panel-field"><label>Widget Title</label><input type="text" id="ws-title" value="${w.title}"/></div>
      <div class="panel-field"><label>Widget Type (read only)</label><input type="text" value="${w.type.toUpperCase()}" readonly style="opacity:.5;cursor:not-allowed"/></div>
      <div class="panel-field"><label>Description</label><textarea id="ws-desc" rows="2">${w.description||''}</textarea></div>
    </div>
    <div class="panel-section">
      <div class="panel-section-title">Widget Size</div>
      <div class="panel-row">
        <div class="panel-field"><label>Width (Columns)</label><input type="number" id="ws-colSpan" value="${w.colSpan}" min="1" max="12"/></div>
        <div class="panel-field"><label>Height (Rows)</label><input type="number" id="ws-rowSpan" value="${w.rowSpan}" min="1" max="6"/></div>
      </div>
    </div>
    ${specific}
  `;
}

// ═══════════════════════════════════════════════
// DASHBOARD RENDER
// ═══════════════════════════════════════════════
async function renderDashboard() {
  // Load layout from server if empty
  if (!dashboardLayout.length) {
    try {
      const res = await fetch(`${API}/dashboard`);
      const data = await res.json();
      dashboardLayout = data.data?.layout || [];
    } catch(e) {}
  }

  if (!orders.length) {
    try {
      const res = await fetch(`${API}/orders`);
      const data = await res.json();
      orders = data.data || [];
    } catch(e) {}
  }

  const grid = document.getElementById('dashboard-grid');
  const empty = document.getElementById('dashboard-empty');

  if (!dashboardLayout.length) {
    empty.style.display = 'flex'; grid.style.display = 'none'; return;
  }
  empty.style.display = 'none'; grid.style.display = 'grid';

  // Destroy old charts
  Object.values(chartInstances).forEach(c => c.destroy());
  chartInstances = {};

  grid.innerHTML = dashboardLayout.map(w => renderWidgetHTML(w)).join('');

  // Init charts
  dashboardLayout.forEach(w => {
    if (['bar','line','area','scatter','pie'].includes(w.type)) {
      initChart(w);
    }
  });
}

function renderWidgetHTML(w) {
  const colSpan = w.colSpan || 6;
  const rowHeight = (w.rowSpan || 2) * 120;

  const actionsHTML = `
    <div class="widget-actions">
      <button class="widget-action-btn" onclick="openDashboardWidgetSettings('${w.id}')" title="Settings">⚙</button>
      <button class="widget-action-btn del" onclick="removeDashboardWidget('${w.id}')" title="Delete">✕</button>
    </div>`;

  let inner = '';

  if (w.type === 'kpi') {
    const val = computeKPI(w);
    inner = `<div class="widget-title">${w.title}</div>
      <div class="kpi-value">${formatValue(val, w.format, w.precision)}</div>
      ${w.description ? `<div class="kpi-description">${w.description}</div>` : ''}`;
  } else if (['bar','line','area','scatter','pie'].includes(w.type)) {
    inner = `<div class="widget-title">${w.title}</div>
      <div class="chart-container"><canvas id="chart-${w.id}"></canvas></div>`;
  } else if (w.type === 'table') {
    inner = `<div class="widget-title">${w.title}</div>${buildTableWidget(w)}`;
  }

  return `
    <div class="widget-card" style="grid-column:span ${colSpan}; min-height:${rowHeight}px" data-col-span="${colSpan}" id="wcard-${w.id}">
      ${actionsHTML}
      <div class="widget-card-inner">${inner}</div>
    </div>`;
}

function removeDashboardWidget(id) {
  showConfirm('Remove this widget?', async () => {
    dashboardLayout = dashboardLayout.filter(w => w.id !== id);
    await fetch(`${API}/dashboard`, { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ layout: dashboardLayout }) });
    renderDashboard();
    showToast('Widget removed', 'success');
  });
}

// ─ KPI Computation ──
function computeKPI(w) {
  const data = getFilteredOrders();
  if (!data.length) return 0;
  const vals = data.map(o => parseFloat(o[w.metric]) || 0);
  switch (w.aggregation) {
    case 'sum': return vals.reduce((a, b) => a + b, 0);
    case 'avg': return vals.reduce((a, b) => a + b, 0) / vals.length;
    case 'count': return vals.length;
    case 'min': return Math.min(...vals);
    case 'max': return Math.max(...vals);
    default: return 0;
  }
}

function formatValue(val, format, precision = 2) {
  if (format === 'currency') return '₹' + Number(val).toLocaleString('en-IN', { minimumFractionDigits: precision, maximumFractionDigits: precision });
  if (format === 'percentage') return Number(val).toFixed(precision) + '%';
  return Number(val).toLocaleString('en-IN', { minimumFractionDigits: precision, maximumFractionDigits: precision });
}

// ─ Chart Initialization ──
function initChart(w) {
  const canvas = document.getElementById(`chart-${w.id}`);
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const data = getFilteredOrders();

  const COLORS = ['#ec5840','#2d6a8f','#f59e0b','#059669','#8b5cf6','#0891b2','#dc2626','#d97706'];

  let chartConfig;

  if (w.type === 'pie') {
    const groups = groupBy(data, w.chartData);
    const labels = Object.keys(groups);
    const values = labels.map(l => groups[l].length);
    chartConfig = {
      type: 'doughnut',
      data: { labels, datasets: [{ data: values, backgroundColor: COLORS, borderColor: '#09090f', borderWidth: 2 }] },
      options: { plugins: { legend: { display: w.showLegend, labels: { color: 'rgba(240,240,248,0.7)', font: { family: 'DM Sans', size: 11 }, boxWidth: 12 } } }, responsive: true, maintainAspectRatio: false }
    };
  } else if (w.type === 'scatter') {
    const points = data.map(o => ({ x: parseFloat(o[w.xAxis]) || 0, y: parseFloat(o[w.yAxis]) || 0 }));
    chartConfig = {
      type: 'scatter',
      data: { datasets: [{ label: w.title, data: points, backgroundColor: w.color + 'aa', borderColor: w.color, pointRadius: 5 }] },
      options: getChartOptions(w)
    };
  } else {
    // Group by xAxis
    const groups = groupBy(data, w.xAxis);
    const labels = Object.keys(groups);
    const values = labels.map(l => groups[l].reduce((s, o) => s + (parseFloat(o[w.yAxis]) || 0), 0));

    const isArea = w.type === 'area';
    chartConfig = {
      type: w.type === 'area' ? 'line' : w.type,
      data: {
        labels,
        datasets: [{
          label: w.title, data: values,
          backgroundColor: isArea ? w.color + '33' : w.color + 'bb',
          borderColor: w.color,
          fill: isArea,
          tension: isArea ? 0.4 : 0.3,
          pointBackgroundColor: w.color,
          pointRadius: 3,
          datalabels: w.showLabel ? { color: '#fff', font: { size: 10 } } : { display: false }
        }]
      },
      options: getChartOptions(w)
    };
  }

  chartInstances[w.id] = new Chart(ctx, chartConfig);
}

function getChartOptions(w) {
  return {
    responsive: true, maintainAspectRatio: false,
    plugins: { legend: { display: false }, tooltip: { backgroundColor: '#ffffff', titleColor: '#1a1614', bodyColor: '#6b5f58', borderColor: 'rgba(0,0,0,0.08)', borderWidth: 1 } },
    scales: {
      x: { ticks: { color: 'rgba(0,0,0,0.35)', font: { family: 'DM Sans', size: 10 }, maxRotation: 30 }, grid: { color: 'rgba(0,0,0,0.04)' } },
      y: { ticks: { color: 'rgba(0,0,0,0.35)', font: { family: 'DM Sans', size: 10 } }, grid: { color: 'rgba(0,0,0,0.06)' } }
    }
  };
}

function groupBy(arr, field) {
  return arr.reduce((acc, item) => {
    const key = field === 'createdAt' ? new Date(item[field]).toLocaleDateString() : (item[field] || 'Unknown');
    acc[key] = acc[key] || [];
    acc[key].push(item);
    return acc;
  }, {});
}

// ─ Table Widget ──
function buildTableWidget(w) {
  const data = w.applyFilter ? getFilteredOrders() : [...orders];
  const cols = w.columns || ['firstName','product','totalAmount','status'];
  let sorted = [...data];
  if (w.sortBy) sorted.sort((a, b) => String(a[w.sortBy]).localeCompare(String(b[w.sortBy])));
  const limit = parseInt(w.pagination) || 10;
  const rows = sorted.slice(0, limit);

  return `
    <div style="overflow:auto">
      <table class="widget-table" style="font-size:${w.fontSize||12}px">
        <thead><tr>${cols.map(c => `<th style="background:${w.headerBg||'#14141f'}">${FIELD_LABELS[c]||c}</th>`).join('')}</tr></thead>
        <tbody>${rows.length ? rows.map(r => `<tr>${cols.map(c => `<td>${c==='totalAmount'?'₹'+Number(r[c]||0).toFixed(2): (c==='status'?`<span class="status-badge status-${r[c]}">${r[c]}</span>`:r[c]||'—')}</td>`).join('')}</tr>`).join('') : `<tr><td colspan="${cols.length}" style="text-align:center;color:var(--text-muted);padding:20px">No data</td></tr>`}</tbody>
      </table>
    </div>`;
}

// ═══════════════════════════════════════════════
// MODAL HELPERS
// ═══════════════════════════════════════════════
function closeModal(id) {
  document.getElementById(id)?.classList.remove('open');
}

function closeOnOverlay(e, id) {
  if (e.target === e.currentTarget) closeModal(id);
}

function showConfirm(msg, cb) {
  document.getElementById('confirm-msg').textContent = msg;
  const btn = document.getElementById('confirm-btn');
  btn.onclick = () => { cb(); closeModal('confirm-modal'); };
  document.getElementById('confirm-modal').classList.add('open');
}

// ═══════════════════════════════════════════════
// TOAST
// ═══════════════════════════════════════════════
let toastTimer;
function showToast(msg, type = '') {
  const t = document.getElementById('toast');
  t.textContent = msg;
  t.className = 'toast show ' + type;
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => { t.classList.remove('show'); }, 2800);
}

// ═══════════════════════════════════════════════
// INIT
// ═══════════════════════════════════════════════
document.addEventListener('DOMContentLoaded', () => {
  // Set today as default max date
  const today = new Date().toISOString().split('T')[0];
  const df = document.getElementById('dateFrom'), dt = document.getElementById('dateTo');
  if (df) df.max = today;
  if (dt) dt.max = today;

  navigate('dashboard');
});
