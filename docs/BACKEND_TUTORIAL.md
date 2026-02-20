# Backend Development Tutorial
## Learn Backend Using Your AiDocCall Project

---

## Table of Contents
1. [What is Frontend vs Backend?](#1-what-is-frontend-vs-backend)
2. [Why Do We Need a Backend?](#2-why-do-we-need-a-backend)
3. [Your Current Architecture](#3-your-current-architecture)
4. [What is Express.js?](#4-what-is-expressjs)
5. [HTTP Basics](#5-http-basics)
6. [API Routes Explained](#6-api-routes-explained)
7. [Request and Response](#7-request-and-response)
8. [Middleware Concept](#8-middleware-concept)
9. [How Frontend Talks to Backend](#9-how-frontend-talks-to-backend)
10. [Security Concepts](#10-security-concepts)
11. [Hands-On: Your Payment Feature](#11-hands-on-your-payment-feature)
12. [Common Patterns](#12-common-patterns)

---

## 1. What is Frontend vs Backend?

### Frontend (Client-Side)
**What the user sees and interacts with.**

In your project:
- **aidoccall.com** - React + Vite application
- **AiSurgeonPilot** - Next.js application

Frontend code runs in the **browser**. When a patient opens aidoccall.com:
1. Browser downloads HTML, CSS, JavaScript
2. React renders the UI
3. User clicks buttons, fills forms
4. All this happens in the user's browser

```
Your Frontend Files:
aidoccall.com/src/
├── pages/           <- What users see
├── components/      <- Reusable UI pieces
├── lib/             <- Helper functions
└── assets/          <- Images, styles
```

### Backend (Server-Side)
**Code that runs on a server, not in the browser.**

Backend handles:
- Database operations
- Authentication
- Payment processing
- Sending emails
- Storing secrets (API keys)

**Currently, your "backend" is Supabase** - it handles database and auth for you.

```
The Problem:
- Supabase is great for database + auth
- But payment gateway needs SECRET keys
- SECRET keys cannot be in frontend code
- Anyone can see frontend code (browser dev tools)
```

---

## 2. Why Do We Need a Backend?

### Real Example from Your Project

**Current Flow (No Backend):**
```
Patient Browser                          Supabase
     |                                      |
     |--- "Get doctors" ------------------->|
     |<-- Returns doctor list --------------|
     |                                      |
     |--- "Book appointment" -------------->|
     |<-- Appointment created --------------|
```

This works because Supabase handles it.

**Payment Flow (Needs Backend):**
```
Patient Browser                    Razorpay Server
     |                                   |
     |--- Create payment order --------->|
     |    (needs SECRET key!)            |
     |                                   |
     PROBLEM: We can't put Razorpay
     SECRET key in browser code!
```

**Why?**
```javascript
// If you put this in React code:
const RAZORPAY_SECRET = "rzp_live_xxxxxxxxxxxxx";

// Anyone can:
// 1. Open browser Developer Tools (F12)
// 2. Go to "Sources" tab
// 3. Search for "rzp_live"
// 4. See your secret key
// 5. Use YOUR key to steal money!
```

**Solution - Add Backend:**
```
Patient Browser         Your Backend Server       Razorpay
     |                        |                      |
     |-- Create order ------->|                      |
     |                        |-- Uses SECRET key -->|
     |                        |<-- Order created ----|
     |<-- Order ID -----------|                      |
     |                                               |
     |-- Pay with Order ID (PUBLIC key only) ------->|
```

The SECRET key stays on your server. Browser only gets the public key.

---

## 3. Your Current Architecture

### Project Structure
```
Whole_project/
├── AiSurgeonPilot/          <- Next.js (has backend capability)
│   ├── src/app/api/         <- API Routes (backend endpoints)
│   └── src/app/             <- Frontend pages
│
├── aidoccall.com/           <- React + Vite (frontend only)
│   └── src/                 <- All frontend code
│
└── Supabase                 <- Cloud Database + Auth
```

### Next.js vs React (Important!)

**Next.js (AiSurgeonPilot):**
- Can have both frontend AND backend
- `src/app/api/` folder = backend code
- Runs on Node.js server

**React + Vite (aidoccall.com):**
- Frontend ONLY
- No server-side code
- Just static files served to browser

This is why we need to add Express to aidoccall.com.

---

## 4. What is Express.js?

Express is a **Node.js framework** for building backends.

Think of it like this:
- **React** helps you build UI easily
- **Express** helps you build API servers easily

### Simplest Express Server

```javascript
// server/index.js
import express from 'express';

// Create an Express application
const app = express();

// Define a route
app.get('/hello', (req, res) => {
  res.send('Hello World!');
});

// Start listening on port 3001
app.listen(3001, () => {
  console.log('Server running on http://localhost:3001');
});
```

When you run this:
1. Node.js starts a server on port 3001
2. If someone visits `http://localhost:3001/hello`
3. Server responds with "Hello World!"

### Comparison with Your React Code

```javascript
// React Component (Frontend)
function HelloButton() {
  return <button>Hello</button>;  // Shows button in browser
}

// Express Route (Backend)
app.get('/hello', (req, res) => {
  res.send('Hello');  // Sends data to whoever asks
});
```

---

## 5. HTTP Basics

When your React app talks to a backend, it uses HTTP.

### HTTP Methods

| Method | Purpose | Example |
|--------|---------|---------|
| GET | Read data | Get list of doctors |
| POST | Create new data | Create appointment |
| PUT | Update data (full) | Replace entire doctor profile |
| PATCH | Update data (partial) | Update just email |
| DELETE | Remove data | Cancel appointment |

### In Your Project (Supabase):

```javascript
// These Supabase calls actually use HTTP internally:

// GET - fetch doctors
const { data } = await supabase
  .from('doc_doctors')
  .select('*');

// POST - insert appointment
const { data } = await supabase
  .from('doc_appointments')
  .insert({ doctor_id: '123', ... });

// PATCH - update status
const { data } = await supabase
  .from('doc_appointments')
  .update({ status: 'confirmed' })
  .eq('id', appointmentId);

// DELETE - remove record
const { data } = await supabase
  .from('doc_appointments')
  .delete()
  .eq('id', appointmentId);
```

---

## 6. API Routes Explained

An **API route** is a URL path that does something on the backend.

### Structure
```
https://yourserver.com/api/payments/create-order
        |              |      |         |
      Domain         prefix  resource  action
```

### Express Routes Example

```javascript
import express from 'express';
const app = express();

// Route: GET /api/doctors
// Purpose: Get all doctors
app.get('/api/doctors', (req, res) => {
  // Fetch from database
  const doctors = getDoctorsFromDB();
  res.json(doctors);
});

// Route: POST /api/appointments
// Purpose: Create new appointment
app.post('/api/appointments', (req, res) => {
  // req.body contains the data sent by frontend
  const { doctorId, date, time } = req.body;

  // Save to database
  const appointment = createAppointment(doctorId, date, time);

  // Send back the created appointment
  res.json(appointment);
});

// Route: GET /api/doctors/:id
// Purpose: Get specific doctor
// :id is a URL parameter
app.get('/api/doctors/:id', (req, res) => {
  const doctorId = req.params.id;  // Get ID from URL
  const doctor = getDoctorById(doctorId);
  res.json(doctor);
});
```

### Your Payment Routes Will Be:

```javascript
// POST /api/payments/create-order
// - Frontend sends: doctorId, amount, appointmentId
// - Backend: Gets admin's Razorpay keys, creates order
// - Returns: orderId, publicKey

// POST /api/payments/verify
// - Frontend sends: razorpay_payment_id, razorpay_signature
// - Backend: Verifies payment, updates appointment status
// - Returns: success/failure
```

---

## 7. Request and Response

Every API call has a **Request** (what frontend sends) and **Response** (what backend returns).

### Request Object (req)

```javascript
app.post('/api/payments/create-order', (req, res) => {
  // req.body - Data sent in POST request
  console.log(req.body);
  // { doctorId: "123", amount: 500, appointmentId: "456" }

  // req.params - URL parameters
  // If URL is /api/doctors/123
  console.log(req.params.id);  // "123"

  // req.query - Query string parameters
  // If URL is /api/doctors?specialization=cardiology
  console.log(req.query.specialization);  // "cardiology"

  // req.headers - HTTP headers
  console.log(req.headers.authorization);  // "Bearer token..."
});
```

### Response Object (res)

```javascript
app.get('/api/doctors', (req, res) => {
  // res.json() - Send JSON response
  res.json({ doctors: [...] });

  // res.status() - Set HTTP status code
  res.status(404).json({ error: 'Not found' });

  // Common status codes:
  // 200 - OK (success)
  // 201 - Created (new resource created)
  // 400 - Bad Request (client error)
  // 401 - Unauthorized (not logged in)
  // 403 - Forbidden (no permission)
  // 404 - Not Found
  // 500 - Internal Server Error
});
```

### Real Example from Your Payment Feature

```javascript
// Frontend (React) - Makes request
const response = await fetch('/api/payments/create-order', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    doctorId: 'doc_123',
    amount: 500,
    appointmentId: 'apt_456'
  })
});

const data = await response.json();
console.log(data);  // { orderId: 'order_xxx', razorpayKeyId: 'rzp_xxx' }
```

```javascript
// Backend (Express) - Handles request
app.post('/api/payments/create-order', async (req, res) => {
  try {
    // 1. Get data from request
    const { doctorId, amount, appointmentId } = req.body;

    // 2. Get admin's payment credentials from database
    const credentials = await getAdminCredentials(doctorId);

    // 3. Create Razorpay order using SECRET key
    const razorpay = new Razorpay({
      key_id: credentials.keyId,
      key_secret: credentials.keySecret  // SECRET - only on backend!
    });

    const order = await razorpay.orders.create({
      amount: amount * 100,
      currency: 'INR'
    });

    // 4. Send response (only public key, not secret)
    res.json({
      orderId: order.id,
      razorpayKeyId: credentials.keyId  // Public key is safe
    });

  } catch (error) {
    res.status(500).json({ error: 'Payment failed' });
  }
});
```

---

## 8. Middleware Concept

Middleware is code that runs **before** your route handler.

Think of it like security checkpoints:
```
Request --> Middleware 1 --> Middleware 2 --> Route Handler --> Response
               |                 |
           (logging)        (auth check)
```

### Common Middleware

```javascript
import express from 'express';
import cors from 'cors';

const app = express();

// Middleware 1: Parse JSON body
// Without this, req.body would be undefined
app.use(express.json());

// Middleware 2: Enable CORS
// Allows frontend on different port to call this backend
app.use(cors({
  origin: 'http://localhost:5173'  // Your React app
}));

// Middleware 3: Logging (custom)
app.use((req, res, next) => {
  console.log(`${req.method} ${req.path}`);
  next();  // IMPORTANT: Call next() to continue
});

// Now routes...
app.get('/api/doctors', (req, res) => {
  // This runs AFTER all middleware
});
```

### Authentication Middleware

```javascript
// middleware/auth.js
export function requireAuth(req, res, next) {
  const token = req.headers.authorization?.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'No token provided' });
  }

  try {
    // Verify token (you'd use Supabase or JWT here)
    const user = verifyToken(token);
    req.user = user;  // Attach user to request
    next();  // Continue to route handler
  } catch (error) {
    res.status(401).json({ error: 'Invalid token' });
  }
}

// Usage
app.get('/api/protected', requireAuth, (req, res) => {
  // Only runs if requireAuth calls next()
  res.json({ message: `Hello ${req.user.name}` });
});
```

---

## 9. How Frontend Talks to Backend

### Method 1: fetch() API (Built-in)

```javascript
// In your React component
async function bookAppointment() {
  const response = await fetch('/api/appointments', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${userToken}`
    },
    body: JSON.stringify({
      doctorId: selectedDoctor.id,
      date: selectedDate,
      time: selectedTime
    })
  });

  if (!response.ok) {
    throw new Error('Booking failed');
  }

  const appointment = await response.json();
  return appointment;
}
```

### Method 2: Axios (Popular Library)

```javascript
import axios from 'axios';

async function bookAppointment() {
  const response = await axios.post('/api/appointments', {
    doctorId: selectedDoctor.id,
    date: selectedDate,
    time: selectedTime
  }, {
    headers: {
      'Authorization': `Bearer ${userToken}`
    }
  });

  return response.data;
}
```

### How Your Current Code Talks to Supabase

```javascript
// You're already doing this! Supabase client handles HTTP internally
const { data, error } = await supabase
  .from('doc_appointments')
  .insert({
    doctor_id: doctorId,
    appointment_date: date
  });

// Under the hood, Supabase does:
// POST https://your-project.supabase.co/rest/v1/doc_appointments
// with proper headers and body
```

### Vite Proxy (Why /api works)

When you run both servers:
- React: http://localhost:5173
- Express: http://localhost:3001

Without proxy:
```javascript
// Won't work! Browser blocks cross-origin requests
fetch('http://localhost:3001/api/payments')
```

With Vite proxy (vite.config.js):
```javascript
export default defineConfig({
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:3001',
        changeOrigin: true
      }
    }
  }
});
```

Now:
```javascript
// Works! Vite forwards /api to Express
fetch('/api/payments')
```

---

## 10. Security Concepts

### Why Backend for Secrets?

```javascript
// WRONG - In React (frontend) code
const RAZORPAY_SECRET = "rzp_live_xxx";  // Anyone can see this!

// RIGHT - In Express (backend) code
const RAZORPAY_SECRET = process.env.RAZORPAY_SECRET;  // Stored in .env
```

### Environment Variables

```bash
# .env file (NEVER commit this to git!)
SUPABASE_URL=https://xxx.supabase.co
SUPABASE_SERVICE_KEY=eyJxxx...
RAZORPAY_SECRET=rzp_live_xxx
ENCRYPTION_KEY=32-character-random-string
```

```javascript
// Access in Node.js
import dotenv from 'dotenv';
dotenv.config();

console.log(process.env.RAZORPAY_SECRET);  // rzp_live_xxx
```

### Encryption for Stored Credentials

Since each clinical admin has their own Razorpay keys, we store them in the database.
But we encrypt them first:

```javascript
import CryptoJS from 'crypto-js';

const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY;

// Encrypt before saving to database
function encrypt(text) {
  return CryptoJS.AES.encrypt(text, ENCRYPTION_KEY).toString();
}

// Decrypt when reading from database
function decrypt(ciphertext) {
  const bytes = CryptoJS.AES.decrypt(ciphertext, ENCRYPTION_KEY);
  return bytes.toString(CryptoJS.enc.Utf8);
}

// Usage
const keySecret = "rzp_live_actual_secret";
const encrypted = encrypt(keySecret);
// Stored in DB: "U2FsdGVkX1+..." (unreadable)

const decrypted = decrypt(encrypted);
// decrypted = "rzp_live_actual_secret"
```

### CORS (Cross-Origin Resource Sharing)

Browsers block requests to different domains for security.

```javascript
// Without CORS config, this fails:
// Frontend: http://localhost:5173
// Backend: http://localhost:3001

import cors from 'cors';

app.use(cors({
  origin: ['http://localhost:5173', 'https://aidoccall.com'],
  credentials: true  // Allow cookies
}));
```

---

## 11. Hands-On: Your Payment Feature

Now let's see how all concepts apply to your payment feature.

### The Complete Flow

```
┌──────────────────┐    ┌──────────────────┐    ┌──────────────────┐
│  Patient Browser │    │  Express Backend │    │    Razorpay      │
│  (aidoccall.com) │    │  (your server)   │    │    Server        │
└────────┬─────────┘    └────────┬─────────┘    └────────┬─────────┘
         │                       │                       │
         │ 1. Click "Pay"        │                       │
         │──────────────────────>│                       │
         │   POST /api/payments  │                       │
         │   {doctorId, amount}  │                       │
         │                       │                       │
         │                       │ 2. Get doctor's admin │
         │                       │────────┐              │
         │                       │        │ Query DB     │
         │                       │<───────┘              │
         │                       │                       │
         │                       │ 3. Get admin's keys   │
         │                       │────────┐              │
         │                       │        │ Decrypt      │
         │                       │<───────┘              │
         │                       │                       │
         │                       │ 4. Create order       │
         │                       │──────────────────────>│
         │                       │  (using SECRET key)   │
         │                       │                       │
         │                       │<──────────────────────│
         │                       │   Order ID            │
         │                       │                       │
         │<──────────────────────│                       │
         │ 5. Return orderId +   │                       │
         │    publicKey          │                       │
         │                       │                       │
         │ 6. Open Razorpay      │                       │
         │    checkout modal ────────────────────────────>
         │    (uses public key)  │                       │
         │                       │                       │
         │<────────────────────────────────────────────────
         │ 7. Payment complete   │                       │
         │                       │                       │
         │ 8. Verify payment     │                       │
         │──────────────────────>│                       │
         │   POST /api/verify    │                       │
         │                       │                       │
         │                       │ 9. Update DB          │
         │                       │────────┐              │
         │                       │        │              │
         │                       │<───────┘              │
         │<──────────────────────│                       │
         │ 10. Success!          │                       │
         │                       │                       │
```

### Code Breakdown

**Step 1: Frontend calls backend**
```javascript
// In aidoccall.com booking page
const handlePayment = async () => {
  const response = await fetch('/api/payments/create-order', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      doctorId: selectedDoctor.id,
      amount: 500,
      appointmentId: appointment.id
    })
  });

  const { orderId, razorpayKeyId } = await response.json();
  // Continue to step 6...
};
```

**Steps 2-5: Backend processes request**
```javascript
// server/routes/payments.js
app.post('/api/payments/create-order', async (req, res) => {
  const { doctorId, amount, appointmentId } = req.body;

  // Step 2: Get doctor's admin (created_by field)
  const { data: doctor } = await supabase
    .from('doc_doctors')
    .select('created_by')
    .eq('id', doctorId)
    .single();

  // Step 3: Get admin's encrypted payment keys
  const { data: config } = await supabase
    .from('payment_gateway_configs')
    .select('encrypted_key_id, encrypted_key_secret')
    .eq('admin_clinical_id', doctor.created_by)
    .single();

  // Decrypt the keys
  const keyId = decrypt(config.encrypted_key_id);
  const keySecret = decrypt(config.encrypted_key_secret);

  // Step 4: Create Razorpay order
  const razorpay = new Razorpay({ key_id: keyId, key_secret: keySecret });
  const order = await razorpay.orders.create({
    amount: amount * 100,
    currency: 'INR'
  });

  // Step 5: Return to frontend
  res.json({
    orderId: order.id,
    razorpayKeyId: keyId  // Public key only
  });
});
```

**Steps 6-7: Patient pays**
```javascript
// Continue in frontend
const options = {
  key: razorpayKeyId,  // Public key from backend
  amount: amount * 100,
  order_id: orderId,
  handler: function(response) {
    // Step 8: Verify after payment
    verifyPayment(response);
  }
};

const razorpay = new window.Razorpay(options);
razorpay.open();
```

**Steps 8-10: Verify payment**
```javascript
// Frontend
const verifyPayment = async (response) => {
  await fetch('/api/payments/verify', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      razorpay_payment_id: response.razorpay_payment_id,
      razorpay_signature: response.razorpay_signature,
      appointmentId: appointment.id
    })
  });

  alert('Payment successful!');
};

// Backend
app.post('/api/payments/verify', async (req, res) => {
  const { razorpay_payment_id, appointmentId } = req.body;

  // Step 9: Update appointment as paid
  await supabase
    .from('doc_appointments')
    .update({
      payment_status: 'paid',
      payment_id: razorpay_payment_id
    })
    .eq('id', appointmentId);

  // Step 10: Return success
  res.json({ success: true });
});
```

---

## 12. Common Patterns

### Pattern 1: Error Handling

```javascript
app.post('/api/payments', async (req, res) => {
  try {
    // Try to do something
    const result = await riskyOperation();
    res.json(result);
  } catch (error) {
    // Log for debugging (only you see this)
    console.error('Payment error:', error);

    // Send generic message to user (security)
    res.status(500).json({
      error: 'Payment processing failed. Please try again.'
    });
  }
});
```

### Pattern 2: Input Validation

```javascript
app.post('/api/appointments', (req, res) => {
  const { doctorId, date, time } = req.body;

  // Validate required fields
  if (!doctorId || !date || !time) {
    return res.status(400).json({
      error: 'Missing required fields: doctorId, date, time'
    });
  }

  // Validate data types
  if (typeof doctorId !== 'string') {
    return res.status(400).json({
      error: 'doctorId must be a string'
    });
  }

  // Continue with valid data...
});
```

### Pattern 3: Route Organization

```javascript
// server/routes/payments.js
import express from 'express';
const router = express.Router();

router.post('/create-order', (req, res) => { ... });
router.post('/verify', (req, res) => { ... });

export default router;

// server/index.js
import paymentRoutes from './routes/payments.js';
app.use('/api/payments', paymentRoutes);

// Results in:
// POST /api/payments/create-order
// POST /api/payments/verify
```

### Pattern 4: Async/Await with Database

```javascript
app.get('/api/doctors', async (req, res) => {
  try {
    // await pauses until database responds
    const { data, error } = await supabase
      .from('doc_doctors')
      .select('*');

    if (error) throw error;

    res.json(data);
  } catch (error) {
    res.status(500).json({ error: 'Database error' });
  }
});
```

---

## Quick Reference

### Starting the Server
```bash
cd aidoccall.com
npm run dev  # Runs both React (5173) and Express (3001)
```

### File Structure
```
aidoccall.com/
├── src/                    # React frontend
├── server/                 # Express backend
│   ├── index.js           # Main entry point
│   ├── routes/            # API endpoints
│   │   ├── payments.js    # Payment routes
│   │   └── admin.js       # Admin routes
│   ├── middleware/        # Auth, logging, etc.
│   └── utils/             # Helpers (encryption)
├── .env                   # Secrets (gitignored)
└── package.json           # Dependencies
```

### Common Commands
```bash
# Install Express dependencies
npm install express cors dotenv razorpay crypto-js

# Run backend only
node server/index.js

# Run with auto-reload
npx nodemon server/index.js
```

### HTTP Status Codes Cheat Sheet
| Code | Meaning | When to Use |
|------|---------|-------------|
| 200 | OK | Success |
| 201 | Created | New resource created |
| 400 | Bad Request | Invalid input |
| 401 | Unauthorized | Not logged in |
| 403 | Forbidden | No permission |
| 404 | Not Found | Resource doesn't exist |
| 500 | Server Error | Something broke |

---

## Next Steps

1. Read this document completely
2. Ask questions if anything is unclear
3. We'll implement the Express backend together step by step

The plan is ready in: `/Users/murali/.claude/plans/compressed-exploring-giraffe.md`

---

v1.0 - 2026-01-30
