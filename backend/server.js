const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static(path.join('C:\\Users\\SRI HARINI\\OneDrive\\Desktop\\dashboard-builder\\frontend')));

mongoose.connect('mongodb://localhost:27017/halleyx_dashboard')
  .then(() => console.log('MongoDB connected'))
  .catch(err => console.error('MongoDB error:', err));
// Auto-seed sample data
async function seedData() {
  const count = await Order.countDocuments();
  if (count === 0) {
    await Order.insertMany([
      { firstName:'John', lastName:'Doe', email:'john@email.com', phone:'9876543210', street:'123 Main St', city:'Chennai', state:'TN', postalCode:'600001', country:'India', product:'Laptop Pro X1', quantity:2, unitPrice:75000, totalAmount:150000, status:'Delivered', createdBy:'Admin', createdAt: new Date('2026-01-15') },
      { firstName:'Priya', lastName:'Kumar', email:'priya@email.com', phone:'9876543211', street:'456 Park Ave', city:'Mumbai', state:'MH', postalCode:'400001', country:'India', product:'Smart Watch Series 5', quantity:3, unitPrice:15000, totalAmount:45000, status:'Shipped', createdBy:'Sales Team', createdAt: new Date('2026-01-20') },
      { firstName:'Raj', lastName:'Singh', email:'raj@email.com', phone:'9876543212', street:'789 Oak Rd', city:'Delhi', state:'DL', postalCode:'110001', country:'India', product:'Wireless Headphones', quantity:5, unitPrice:5000, totalAmount:25000, status:'Processing', createdBy:'Admin', createdAt: new Date('2026-02-05') },
      { firstName:'Anita', lastName:'Sharma', email:'anita@email.com', phone:'9876543213', street:'321 Lake Dr', city:'Bangalore', state:'KA', postalCode:'560001', country:'India', product:'4K Monitor', quantity:1, unitPrice:35000, totalAmount:35000, status:'Pending', createdBy:'Manager', createdAt: new Date('2026-02-10') },
      { firstName:'Vikram', lastName:'Patel', email:'vikram@email.com', phone:'9876543214', street:'654 Hill St', city:'Hyderabad', state:'TS', postalCode:'500001', country:'India', product:'Gaming Mouse', quantity:4, unitPrice:3000, totalAmount:12000, status:'Delivered', createdBy:'Sales Team', createdAt: new Date('2026-02-20') },
      { firstName:'Meera', lastName:'Nair', email:'meera@email.com', phone:'9876543215', street:'987 River Rd', city:'Pune', state:'MH', postalCode:'411001', country:'India', product:'Mechanical Keyboard', quantity:2, unitPrice:8000, totalAmount:16000, status:'Cancelled', createdBy:'Admin', createdAt: new Date('2026-03-01') },
      { firstName:'Arjun', lastName:'Reddy', email:'arjun@email.com', phone:'9876543216', street:'147 Palm Ave', city:'Chennai', state:'TN', postalCode:'600002', country:'India', product:'Portable SSD 1TB', quantity:3, unitPrice:7000, totalAmount:21000, status:'Delivered', createdBy:'Manager', createdAt: new Date('2026-03-10') },
      { firstName:'Kavya', lastName:'Menon', email:'kavya@email.com', phone:'9876543217', street:'258 Rose St', city:'Kochi', state:'KL', postalCode:'682001', country:'India', product:'USB-C Hub', quantity:6, unitPrice:2000, totalAmount:12000, status:'Shipped', createdBy:'Sales Team', createdAt: new Date('2026-03-15') }
    ]);
    console.log('✅ Sample data seeded!');
  }
}
seedData();
const orderSchema = new mongoose.Schema({
  firstName: String, lastName: String, email: String, phone: String,
  street: String, city: String, state: String, postalCode: String, country: String,
  product: String, quantity: Number, unitPrice: Number, totalAmount: Number,
  status: String, createdBy: String, createdAt: { type: Date, default: Date.now }
});
const Order = mongoose.model('Order', orderSchema);

const dashboardSchema = new mongoose.Schema({
  layout: { type: Array, default: [] },
  updatedAt: { type: Date, default: Date.now }
});
const Dashboard = mongoose.model('Dashboard', dashboardSchema);

app.get('/api/orders', async (req, res) => {
  try {
    const orders = await Order.find().sort({ createdAt: -1 });
    res.json({ success: true, data: orders });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
});

app.post('/api/orders', async (req, res) => {
  try {
    req.body.totalAmount = parseFloat(req.body.quantity) * parseFloat(req.body.unitPrice);
    const order = new Order(req.body);
    await order.save();
    res.json({ success: true, data: order });
  } catch (e) { res.status(400).json({ success: false, message: e.message }); }
});

app.put('/api/orders/:id', async (req, res) => {
  try {
    req.body.totalAmount = parseFloat(req.body.quantity) * parseFloat(req.body.unitPrice);
    const order = await Order.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json({ success: true, data: order });
  } catch (e) { res.status(400).json({ success: false, message: e.message }); }
});

app.delete('/api/orders/:id', async (req, res) => {
  try {
    await Order.findByIdAndDelete(req.params.id);
    res.json({ success: true });
  } catch (e) { res.status(400).json({ success: false, message: e.message }); }
});

app.get('/api/dashboard', async (req, res) => {
  try {
    let d = await Dashboard.findOne();
    if (!d) d = new Dashboard({ layout: [] });
    res.json({ success: true, data: d });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
});

app.post('/api/dashboard', async (req, res) => {
  try {
    let d = await Dashboard.findOne();
    if (!d) { d = new Dashboard({ layout: req.body.layout }); }
    else { d.layout = req.body.layout; d.updatedAt = new Date(); }
    await d.save();
    res.json({ success: true, data: d });
  } catch (e) { res.status(400).json({ success: false, message: e.message }); }
});

app.get('*', (req, res) => {
  res.sendFile(path.join('C:\\Users\\SRI HARINI\\OneDrive\\Desktop\\dashboard-builder\\frontend', 'index.html'));
});

app.listen(3000, () => {
  console.log('Server running on http://localhost:3000');
  seedData();
});

async function seedData() {
  try {
    const count = await Order.countDocuments();
    if (count === 0) {
      await Order.insertMany([
        { firstName:'John', lastName:'Doe', email:'john@email.com', phone:'9876543210', street:'123 Main St', city:'Chennai', state:'TN', postalCode:'600001', country:'India', product:'Laptop Pro X1', quantity:2, unitPrice:75000, totalAmount:150000, status:'Delivered', createdBy:'Admin', createdAt: new Date('2026-01-15') },
        { firstName:'Priya', lastName:'Kumar', email:'priya@email.com', phone:'9876543211', street:'456 Park Ave', city:'Mumbai', state:'MH', postalCode:'400001', country:'India', product:'Smart Watch Series 5', quantity:3, unitPrice:15000, totalAmount:45000, status:'Shipped', createdBy:'Sales Team', createdAt: new Date('2026-01-20') },
        { firstName:'Raj', lastName:'Singh', email:'raj@email.com', phone:'9876543212', street:'789 Oak Rd', city:'Delhi', state:'DL', postalCode:'110001', country:'India', product:'Wireless Headphones', quantity:5, unitPrice:5000, totalAmount:25000, status:'Processing', createdBy:'Admin', createdAt: new Date('2026-02-05') },
        { firstName:'Anita', lastName:'Sharma', email:'anita@email.com', phone:'9876543213', street:'321 Lake Dr', city:'Bangalore', state:'KA', postalCode:'560001', country:'India', product:'4K Monitor', quantity:1, unitPrice:35000, totalAmount:35000, status:'Pending', createdBy:'Manager', createdAt: new Date('2026-02-10') },
        { firstName:'Vikram', lastName:'Patel', email:'vikram@email.com', phone:'9876543214', street:'654 Hill St', city:'Hyderabad', state:'TS', postalCode:'500001', country:'India', product:'Gaming Mouse', quantity:4, unitPrice:3000, totalAmount:12000, status:'Delivered', createdBy:'Sales Team', createdAt: new Date('2026-02-20') },
        { firstName:'Meera', lastName:'Nair', email:'meera@email.com', phone:'9876543215', street:'987 River Rd', city:'Pune', state:'MH', postalCode:'411001', country:'India', product:'Mechanical Keyboard', quantity:2, unitPrice:8000, totalAmount:16000, status:'Cancelled', createdBy:'Admin', createdAt: new Date('2026-03-01') },
        { firstName:'Arjun', lastName:'Reddy', email:'arjun@email.com', phone:'9876543216', street:'147 Palm Ave', city:'Chennai', state:'TN', postalCode:'600002', country:'India', product:'Portable SSD 1TB', quantity:3, unitPrice:7000, totalAmount:21000, status:'Delivered', createdBy:'Manager', createdAt: new Date('2026-03-10') },
        { firstName:'Kavya', lastName:'Menon', email:'kavya@email.com', phone:'9876543217', street:'258 Rose St', city:'Kochi', state:'KL', postalCode:'682001', country:'India', product:'USB-C Hub', quantity:6, unitPrice:2000, totalAmount:12000, status:'Shipped', createdBy:'Sales Team', createdAt: new Date('2026-03-15') }
      ]);
      console.log('✅ Sample data seeded!');
    }
  } catch(e) { console.log('Seed error:', e.message); }
}