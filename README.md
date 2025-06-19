# 💊 MedReminder - Smart Medicine Management System

## 🌟 **Features**

### 🔐 **Authentication & Security**

- **Secure User Registration** with email verification
- **JWT-based Authentication** via Supabase Auth
- **Password Reset** functionality
- **Protected Routes** and user session management

### 💊 **Medicine Management**

- **Add/Edit/Delete Medicines** with detailed information
- **Flexible Dosing Schedules** (Daily, Every Other Day, Weekly)
- **Multiple Dose Times** per day support
- **Medicine Information** (Name, Formula, Company, Strength)
- **Duration-based Treatment** planning

### ⏰ **Smart Push Notifications**

- **Real-time Browser Push Notifications** via Service Workers
- **Custom Notification Actions** (Mark as Taken, View Dashboard)
- **Automatic Dose Scheduling** based on frequency
- **Missed Dose Detection** with grace periods
- **Notification Permission Management**

### 📊 **Analytics & Tracking**

- **Adherence Rate Calculation** and visualization
- **Dose History** with detailed timestamps
- **Medicine Statistics** (Taken, Missed, Upcoming)
- **Progress Tracking** with visual indicators
- **Comprehensive Dashboard** with health insights

### 📱 **Modern UI/UX**

- **Fully Responsive Design** (Mobile, Tablet, Desktop)
- **Material Design 3** components
- **Gradient Backgrounds** and modern aesthetics
- **Intuitive Navigation** with sidebar layout
- **Loading States** and error handling
- **Progressive Web App** capabilities

---

## 🛠️ **Tech Stack**

### **Frontend**

\`\`\`javascript
{
"framework": "Next.js 15 (App Router)",
"ui_library": "Material-UI (MUI) v5",
"styling": "Tailwind CSS v3",
"language": "JavaScript/JSX",
"icons": "Material Icons + Lucide React",
"animations": "CSS Transitions + Transform"
}
\`\`\`

### **Backend & Database**

\`\`\`javascript
{
"backend": "Supabase (BaaS)",
"database": "PostgreSQL",
"authentication": "Supabase Auth",
"real_time": "Supabase Realtime",
"row_level_security": "Supabase RLS"
}
\`\`\`

### **Notifications**

\`\`\`javascript
{
"push_notifications": "Web Push API",
"service_worker": "Custom Service Worker",
"vapid": "VAPID Protocol",
"browser_support": "Chrome, Firefox, Safari, Edge"
}
\`\`\`

### **Deployment & DevOps**

\`\`\`javascript
{
"hosting": "Vercel",
"domain": "Custom Domain Support",
"ci_cd": "Vercel Git Integration",
"environment": "Production + Preview",
"monitoring": "Vercel Analytics"
}
\`\`\`

---

## 🚀 **Quick Start**

### **Prerequisites**

- Node.js 18+
- npm/yarn/pnpm
- Supabase account
- Vercel account (for deployment)

### **1. Install Dependencies**

\`\`\`bash
npm install

# or

yarn install

# or

pnpm install
\`\`\`

### **2. Environment Setup**

Create `.env.local` file:
\`\`\`env

# Supabase Configuration

NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY

# VAPID Keys for Push Notifications

NEXT_PUBLIC_VAPID_PUBLIC_KEY=your_vapid_public_key
VAPID_PRIVATE_KEY
VAPID_EMAIL
\`\`\`

### **3. Database Setup**

Run these SQL commands in Supabase SQL Editor:

\`\`\`sql
-- Create medicines table
CREATE TABLE medicines (
id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
name TEXT NOT NULL,
formula TEXT,
company TEXT,
strength TEXT,
start_date DATE NOT NULL,
frequency TEXT NOT NULL,
timings TEXT[] NOT NULL,
duration_days INTEGER NOT NULL,
status TEXT DEFAULT 'active',
created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create doses table
CREATE TABLE doses (
id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
medicine_id UUID REFERENCES medicines(id) ON DELETE CASCADE,
dose_time TIMESTAMP WITH TIME ZONE NOT NULL,
taken BOOLEAN DEFAULT FALSE,
taken_at TIMESTAMP WITH TIME ZONE,
status TEXT DEFAULT 'pending',
created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create push_subscriptions table
CREATE TABLE push_subscriptions (
id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
endpoint TEXT NOT NULL,
p256dh TEXT NOT NULL,
auth TEXT NOT NULL,
is_active BOOLEAN DEFAULT TRUE,
created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE medicines ENABLE ROW LEVEL SECURITY;
ALTER TABLE doses ENABLE ROW LEVEL SECURITY;
ALTER TABLE push_subscriptions ENABLE ROW LEVEL SECURITY;

-- Create RLS Policies
CREATE POLICY "Users can manage their own medicines" ON medicines
FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can manage their own doses" ON doses
FOR ALL USING (
EXISTS (
SELECT 1 FROM medicines
WHERE medicines.id = doses.medicine_id
AND medicines.user_id = auth.uid()
)
);

CREATE POLICY "Users can manage their own subscriptions" ON push_subscriptions
FOR ALL USING (auth.uid() = user_id);
\`\`\`

### **4. Run Development Server**

\`\`\`bash
npm run dev

# or

yarn dev

# or

pnpm dev
\`\`\`

## 📱 **Usage Guide**

### **1. Getting Started**

1. **Sign Up** with your email address
2. **Verify Email** through the confirmation link
3. **Sign In** to access your dashboard

### **2. Adding Medicines**

1. Click **"Add Medicine"** button
2. Fill in medicine details:
   - Name (required)
   - Formula, Company, Strength (optional)
   - Start date and duration
   - Frequency (Daily/Every Other Day/Weekly)
   - Dose times
3. **Save** to create dose schedule

### **3. Setting Up Push Notifications**

1. Go to **Settings** → **Notification Preferences**
2. Click **"Enable"** for push notifications
3. **Allow** browser permission when prompted
4. **Test** notifications to verify setup

### **4. Tracking Your Medicine**

1. View **upcoming doses** on dashboard
2. **Mark doses as taken** when you take them
3. Check **adherence rate** and statistics
4. Review **dose history** for patterns

---

## 🏗️ **Project Structure**

\`\`\`
medreminder/
├── app/ # Next.js App Router
│ ├── auth/ # Authentication callbacks
│ │ └── callback/ # Email verification callback
│ ├── dashboard/ # Main application pages
│ │ ├── medicines/ # Medicine management
│ │ │ ├── add/ # Add new medicine
│ │ │ ├── edit/[id]/ # Edit medicine
│ │ │ ├── [id]/ # Medicine details
│ │ │ └── page.jsx # Medicines list
│ │ ├── history/ # Dose history
│ │ ├── settings/ # User settings
│ │ └── layout.jsx # Dashboard layout
│ ├── components/ # Reusable components
│ │ ├── medicine-card.jsx # Medicine card component
│ │ └── upcoming-doses.jsx # Upcoming doses component
│ ├── lib/ # Utility libraries
│ │ ├── auth-provider.jsx # Authentication context
│ │ ├── supabase-provider.jsx # Supabase client
│ │ ├── notifications.jsx # Notification system
│ │ └── push-notifications.js # Push notification logic
│ ├── login/ # Login page
│ ├── signup/ # Registration page
│ ├── globals.css # Global styles
│ └── layout.jsx # Root layout
├── public/ # Static assets
│ ├── sw.js # Service Worker
│ └── favicon.ico # App icon
├── .env.local # Environment variables
├── next.config.mjs # Next.js configuration
├── tailwind.config.ts # Tailwind CSS configuration
└── package.json # Dependencies
\`\`\`

---

## 🔧 **API Reference**

### **Authentication**

\`\`\`javascript
// Sign Up
const { data, error } = await supabase.auth.signUp({
email: 'user@example.com',
password: 'password123',
options: {
emailRedirectTo: `${window.location.origin}/auth/callback`
}
});

// Sign In
const { data, error } = await supabase.auth.signInWithPassword({
email: 'user@example.com',
password: 'password123'
});
\`\`\`

### **Medicine Management**

\`\`\`javascript
// Create Medicine
const { data, error } = await supabase
.from('medicines')
.insert({
user_id: userId,
name: 'Aspirin',
strength: '500mg',
frequency: 'daily',
timings: ['08:00', '20:00'],
duration_days: 30
});

// Get User Medicines
const { data, error } = await supabase
.from('medicines')
.select('\*')
.eq('user_id', userId)
.order('created_at', { ascending: false });
\`\`\`

### **Dose Tracking**

\`\`\`javascript
// Mark Dose as Taken
const { error } = await supabase
.from('doses')
.update({
taken: true,
taken_at: new Date().toISOString()
})
.eq('id', doseId);

// Get Upcoming Doses
const { data, error } = await supabase
.from('doses')
.select(`    *,
    medicines (
      id,
      name,
      strength
    )
 `)
.eq('taken', false)
.gte('dose_time', new Date().toISOString())
.order('dose_time', { ascending: true })
.limit(5);
\`\`\`

### **Push Notifications**

\`\`\`javascript
// Subscribe to Push Notifications
import { subscribeToPushNotifications } from './lib/push-notifications';

const subscription = await subscribeToPushNotifications(supabase, userId);

// Test Push Notification
import { testPushNotification } from './lib/push-notifications';

await testPushNotification();
\`\`\`

---

## 🚀 **Deployment**

### **Deploy to Vercel**

1. **Connect GitHub** repository to Vercel
2. **Add Environment Variables** in Vercel dashboard:
   \`\`\`env
   NEXT_PUBLIC_SUPABASE_URL=your_production_supabase_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_production_anon_key
   NEXT_PUBLIC_VAPID_PUBLIC_KEY=your_vapid_public_key
   VAPID_PRIVATE_KEY
   VAPID_EMAIL
   \`\`\`
3. **Deploy** automatically on git push
4. **Configure Custom Domain** (optional)

### **Post-Deployment Setup**

1. Update **Site URL** in Supabase Auth settings
2. Add **Redirect URLs** for email verification
3. Test **push notifications** on live site

---

## 📊 **Key Features Showcase**

### **Dashboard Analytics**

- Real-time adherence tracking
- Visual progress indicators
- Medicine statistics overview
- Upcoming dose reminders

### **Smart Notifications**

- Browser push notifications
- Service worker integration
- Custom notification actions
- Automatic scheduling

### **Responsive Design**

- Mobile-first approach
- Tablet optimization
- Desktop experience
- Touch-friendly interface

### **Data Security**

- Row Level Security (RLS)
- JWT authentication
- Secure API endpoints
- User data isolation


**🎯 This README perfectly showcases your MedReminder project with push notifications!**
