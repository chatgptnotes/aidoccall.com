# Product Requirements Document (PRD)
## AidocCall Medical Platform - Telecaller & Patient Application

---

## 📋 **EXECUTIVE SUMMARY**

### **Product Vision**
Transform AidocCall into a comprehensive medical coordination platform serving both telecallers and patients, with seamless doctor discovery and consultation management. This application will work as the central hub for telecaller operations and patient healthcare management.

### **Business Objectives**
- Create efficient telecaller workflow for managing 10 simultaneous consultations
- Provide patients with Zomato-like doctor discovery experience
- Establish seamless coordination between patients, telecallers, and external doctors
- Generate revenue through consultation fees and premium services
- Scale to 100 doctors and 2,000 patients in Year 1

### **Success Metrics**
- Consultation completion rate > 90%
- Average response time < 2 minutes
- Patient satisfaction score > 4.5/5
- Telecaller productivity: 50+ consultations/day
- Platform revenue growth: 25% monthly

---

## 👥 **TARGET USERS**

### **Primary Users**
1. **Telecallers (10 concurrent users)**
   - Medical coordinators managing patient requests
   - Handle consultation assignments and scheduling
   - Coordinate with both verified and external doctors

2. **Patients (2,000 target users)**
   - Individuals seeking medical consultations
   - Upload medical documents and manage health records
   - Book appointments and make payments

### **Secondary Users**
3. **Doctors (100 target - External App Integration)**
   - Medical professionals providing consultations
   - Managed through separate doctor application
   - Integrated via shared database and real-time notifications

---

## 🎯 **CORE FUNCTIONAL REQUIREMENTS**

## **A. TELECALLER MODULES**

### **1. Telecaller Dashboard**
**Purpose**: Central command center for managing patient consultation requests

**Features**:
- Real-time consultation request queue (10 requests visible simultaneously)
- Priority classification system (Emergency/Routine/Follow-up)
- Doctor availability matrix with real-time status
- Patient-doctor assignment interface
- Call progress tracking and monitoring
- Daily/weekly performance analytics

**User Stories**:
- As a telecaller, I want to see all pending consultation requests in real-time
- As a telecaller, I want to prioritize emergency cases over routine consultations
- As a telecaller, I want to view available doctors filtered by specialization and location

### **2. Doctor Assignment System**
**Purpose**: Match patients with appropriate doctors based on multiple criteria

**Features**:
- Doctor filtering by specialization, location, availability
- Real-time doctor status (online/offline, busy/free)
- Patient load balancing across doctors
- Green flag (verified) vs non-green flag (external) doctor management
- Automatic video call room generation

**User Stories**:
- As a telecaller, I want to assign the nearest available cardiologist to a heart patient
- As a telecaller, I want to create video call rooms automatically when assigning doctors
- As a telecaller, I want to coordinate with external doctors when platform doctors are unavailable

### **3. External Doctor Coordination**
**Purpose**: Manage consultations with doctors outside the platform

**Features**:
- External doctor search and contact interface
- Manual coordination workflow
- Different pricing structure for non-verified doctors
- Patient consent management for external consultations
- Communication tracking and logs

**User Stories**:
- As a telecaller, I want to search and contact external doctors when no platform doctors are available
- As a telecaller, I want to inform patients about pricing differences for external doctors
- As a telecaller, I want to track all communications with external medical providers

### **4. Payment and Analytics Dashboard**
**Purpose**: Monitor financial transactions and performance metrics

**Features**:
- Real-time payment status tracking
- Commission calculations for doctors
- Daily/weekly/monthly revenue reports
- Telecaller performance metrics
- Consultation completion rates
- Call recording access and quality control

**User Stories**:
- As a telecaller, I want to verify payment status before connecting patients to doctors
- As a telecaller, I want to view my daily performance metrics and targets
- As a telecaller supervisor, I want to access call recordings for quality assurance

---

## **B. PATIENT MODULES**

### **1. Patient Dashboard**
**Purpose**: Central hub for patient healthcare management

**Features**:
- Personal health profile and medical history
- Upcoming appointment tracking
- Consultation history with doctor notes
- Document management (reports, prescriptions)
- Payment history and billing
- Emergency consultation quick access

**User Stories**:
- As a patient, I want to view all my past consultations and doctor notes
- As a patient, I want to access my medical documents anytime
- As a patient, I want to see upcoming appointments with doctor details

### **2. Doctor Discovery and Booking**
**Purpose**: Zomato-like interface for finding and booking doctors

**Features**:
- Location-based doctor search with map integration
- Doctor profiles with photos, specializations, ratings, pricing
- Filter by specialization, price range, ratings, availability
- Direct booking for verified (green flag) doctors
- Doctor reviews and ratings from other patients
- Favorite doctors list

**User Stories**:
- As a patient, I want to find cardiologists near my location
- As a patient, I want to read reviews before booking a doctor
- As a patient, I want to book appointments directly with verified doctors
- As a patient, I want to filter doctors by consultation fees

### **3. Medical Document Management**
**Purpose**: Secure storage and management of medical records

**Features**:
- Upload medical reports, prescriptions, lab results
- Categorized document storage (X-rays, blood tests, prescriptions)
- Share documents with doctors during consultations
- Download and print documents
- Document history and version tracking
- Secure encrypted storage

**User Stories**:
- As a patient, I want to upload my lab reports before consultation
- As a patient, I want to share specific documents with my doctor during video calls
- As a patient, I want to organize my documents by date and type

### **4. Consultation and Communication**
**Purpose**: Manage appointment booking and doctor communication

**Features**:
- Video consultation interface
- Chat messaging with doctors
- Appointment scheduling and rescheduling
- Prescription delivery integration
- Follow-up appointment booking
- Emergency consultation requests

**User Stories**:
- As a patient, I want to join video calls seamlessly from the platform
- As a patient, I want to reschedule appointments if needed
- As a patient, I want to request emergency consultations 24/7

### **5. Payment and Billing**
**Purpose**: Handle all financial transactions and billing

**Features**:
- Multiple payment methods (UPI, cards, wallets)
- Prepaid consultation payments
- Pricing transparency with fee breakdown
- Payment history and receipts
- Insurance integration (future)
- Refund management

**User Stories**:
- As a patient, I want to pay for consultations using UPI
- As a patient, I want to see consultation fees before booking
- As a patient, I want to download payment receipts

---

## 🔧 **TECHNICAL REQUIREMENTS**

### **Authentication & Authorization**
- **Multi-role authentication** supporting telecaller and patient users
- **Role-based access control** with different UI/permissions per role
- **Session management** with automatic logout for security
- **Password policies** and two-factor authentication option

### **Database Schema**

#### **Core Tables**
```sql
-- Users table (telecallers and patients)
users (
  id, email, password, role, full_name, phone, 
  status, created_at, updated_at
)

-- Patient-specific data
patients (
  user_id, date_of_birth, gender, emergency_contact,
  medical_history, allergies, current_medications
)

-- Telecaller-specific data
telecallers (
  user_id, employee_id, shift_timing, specialization_focus,
  performance_metrics, supervisor_id
)

-- Doctor data (for reference and assignment)
doctors (
  id, full_name, email, phone, specialization, license_number,
  hospital_affiliation, rating, consultation_fee, status,
  availability_schedule, is_verified_green_flag
)

-- Consultations
consultations (
  id, patient_id, doctor_id, telecaller_id, appointment_time,
  status, priority_level, consultation_type, video_room_id,
  payment_status, total_amount, consultation_notes
)

-- Medical Documents
documents (
  id, patient_id, document_type, file_path, file_name,
  uploaded_date, consultation_id, is_shared_with_doctor
)

-- Payments
payments (
  id, consultation_id, patient_id, amount, payment_method,
  transaction_id, status, commission_amount, payment_date
)

-- Call Logs (for telecallers)
call_logs (
  id, telecaller_id, consultation_id, call_start_time,
  call_end_time, call_duration, recording_file_path, quality_score
)
```

### **Real-time Communication**
- **WebSocket connections** for live updates across telecaller dashboards
- **Push notifications** for appointment reminders and updates
- **Real-time doctor availability** status updates
- **Live consultation queue** updates

### **Video Integration**
- **Zoom SDK** integration for video consultations
- **WebRTC fallback** option for browser compatibility
- **Call recording** functionality with patient consent
- **Screen sharing** capability for document review

### **File Storage & Security**
- **Encrypted document storage** for medical records
- **HIPAA compliance** for healthcare data protection
- **Role-based file access** permissions
- **Secure file sharing** during consultations

### **Third-party Integrations**
- **Payment Gateway** (Razorpay/Stripe) for consultation fees
- **SMS Gateway** for appointment reminders and notifications
- **Google Maps API** for location-based doctor discovery
- **Email Service** for appointment confirmations and receipts

---

## 🎨 **USER INTERFACE REQUIREMENTS**

### **Telecaller Interface**
- **Dashboard Layout**: Multi-panel layout with consultation queue, doctor availability, and quick actions
- **Color Coding**: Priority-based color scheme (red for emergency, yellow for routine)
- **Real-time Updates**: Live refresh of queue status and doctor availability
- **Quick Filters**: Fast filtering by specialization, location, priority
- **Responsive Design**: Works on desktop and tablet devices

### **Patient Interface**
- **Mobile-first Design**: Optimized for smartphone usage
- **Intuitive Navigation**: Bottom navigation bar with key sections
- **Doctor Cards**: Zomato-style cards with photos, ratings, pricing
- **Search Interface**: Location-based search with map visualization
- **Document Upload**: Drag-and-drop interface for easy file uploads

### **Shared Components**
- **Video Call Interface**: Clean, professional video consultation layout
- **Payment Interface**: Secure, transparent payment forms
- **Notification System**: Non-intrusive popup notifications
- **Loading States**: Professional loading indicators for all async operations

---

## 🚀 **IMPLEMENTATION ROADMAP**

### **Phase 1: Foundation (Weeks 1-2)**
- Remove existing doctor registration/dashboard components
- Implement dual-role authentication system
- Create basic telecaller and patient dashboard layouts
- Set up database schema for new user types

### **Phase 2: Telecaller Core (Weeks 3-4)**
- Develop consultation request queue system
- Implement doctor assignment workflow
- Add real-time updates using WebSocket
- Create priority management system

### **Phase 3: Patient Core (Weeks 5-6)**
- Build doctor discovery interface with location search
- Implement document upload and management
- Add appointment booking system
- Integrate payment gateway

### **Phase 4: Advanced Features (Weeks 7-8)**
- Add video consultation integration
- Implement external doctor coordination
- Add analytics and reporting dashboards
- Create call recording functionality

### **Phase 5: Integration & Testing (Weeks 9-10)**
- End-to-end testing of all workflows
- Performance optimization
- Security audit and compliance review
- User acceptance testing

---

## 📊 **ACCEPTANCE CRITERIA**

### **Telecaller Acceptance Criteria**
- [ ] Telecaller can view and manage 10 consultation requests simultaneously
- [ ] System updates doctor availability in real-time
- [ ] Telecaller can assign doctors based on specialization and location
- [ ] External doctor coordination workflow is functional
- [ ] Payment status is visible and tracked accurately
- [ ] Call recording and quality metrics are accessible

### **Patient Acceptance Criteria**
- [ ] Patients can discover doctors within 5km radius
- [ ] Document upload supports multiple file types (PDF, JPG, PNG)
- [ ] Direct booking works for verified doctors
- [ ] Payment integration supports UPI, cards, and wallets
- [ ] Video consultations launch without technical issues
- [ ] Medical history is securely stored and accessible

### **System Performance Criteria**
- [ ] Page load times < 3 seconds
- [ ] Real-time updates have < 500ms latency
- [ ] System supports 50 concurrent users without degradation
- [ ] 99.9% uptime during business hours
- [ ] All medical data is encrypted at rest and in transit

---

## 🔒 **SECURITY & COMPLIANCE**

### **Data Protection**
- HIPAA compliance for medical data handling
- End-to-end encryption for sensitive information
- Audit logs for all data access and modifications
- Regular security assessments and penetration testing

### **Access Control**
- Role-based permissions with principle of least privilege
- Multi-factor authentication for telecaller accounts
- Session timeouts and automatic logout
- IP whitelisting for telecaller access (optional)

### **Privacy**
- Patient consent management for data sharing
- Right to data deletion (GDPR compliance)
- Anonymized analytics and reporting
- Clear privacy policy and terms of service

---

## 📈 **FUTURE ENHANCEMENTS**

### **AI & Automation**
- AI-powered doctor recommendation engine
- Automated appointment scheduling
- Intelligent document categorization
- Predictive analytics for patient health

### **Mobile Application**
- Native iOS and Android apps for patients
- Offline functionality for viewing medical records
- Push notifications for appointments and reminders
- Biometric authentication

### **Advanced Features**
- Pharmacy integration for prescription delivery
- Lab test booking and result integration
- Insurance claim management
- Multi-language support (Hindi, English, regional languages)

---

## 💰 **BUSINESS MODEL**

### **Revenue Streams**
- Commission from verified doctor consultations (15-20%)
- Premium fees for external doctor coordination (25-30%)
- Platform transaction fees (2-3%)
- Subscription plans for frequent users
- Advertisement revenue from healthcare brands

### **Pricing Strategy**
- **Green Flag Doctors**: Standard consultation fees + platform commission
- **External Doctors**: Higher consultation fees + coordination charges
- **Emergency Consultations**: Premium pricing (1.5x regular rates)
- **Follow-up Consultations**: Discounted rates to encourage continuity

---

## 🔍 **RISK MITIGATION**

### **Technical Risks**
- **Video Call Failures**: Multiple backup integrations (Zoom + WebRTC)
- **Database Downtime**: Regular backups and failover systems
- **Payment Failures**: Multiple payment gateway integrations
- **Security Breaches**: Regular audits and penetration testing

### **Business Risks**
- **Doctor Availability**: Maintain buffer capacity of verified doctors
- **Patient Adoption**: User onboarding and education programs
- **Regulatory Changes**: Legal compliance monitoring and adaptation
- **Competition**: Unique value proposition through external doctor network

---

**Document Version**: 1.0
**Last Updated**: December 31, 2025
**Next Review**: January 15, 2025