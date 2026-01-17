// Patient Portal Service
// Handles all patient-related database operations

import { supabase } from '../lib/supabaseClient';

// ============================================
// Patient Profile Operations
// ============================================

export const createPatientProfile = async (authUserId, profileData) => {
  // Split fullName into first_name and last_name
  const nameParts = (profileData.fullName || '').trim().split(' ');
  const firstName = nameParts[0] || '';
  const lastName = nameParts.slice(1).join(' ') || '';

  const { data, error } = await supabase
    .from('doc_patients')
    .insert({
      user_id: authUserId,  // Changed from auth_user_id to user_id
      email: profileData.email,
      first_name: firstName,  // Changed from full_name
      last_name: lastName,    // Added last_name
      phone_number: profileData.phone,  // Changed from phone to phone_number
      date_of_birth: profileData.dateOfBirth,
      gender: profileData.gender,
      // blood_group removed - collected at Step 5, not Step 1
      height_cm: profileData.heightCm,
      weight_kg: profileData.weightKg,
      registration_step: 1,
      registration_completed: false
    })
    .select()
    .single();

  if (error) throw error;
  return data;
};

export const getPatientProfile = async (authUserId) => {
  const { data, error } = await supabase
    .from('doc_patients')
    .select('*')
    .eq('user_id', authUserId)  // Changed from auth_user_id to user_id
    .single();

  if (error && error.code !== 'PGRST116') throw error; // PGRST116 = no rows found
  return data;
};

export const updatePatientProfile = async (patientId, profileData) => {
  // Split fullName into first_name and last_name if provided
  let firstName, lastName;
  if (profileData.fullName) {
    const nameParts = profileData.fullName.trim().split(' ');
    firstName = nameParts[0] || '';
    lastName = nameParts.slice(1).join(' ') || '';
  }

  const updateData = {
    phone_number: profileData.phone,  // Changed from phone to phone_number
    date_of_birth: profileData.dateOfBirth,
    gender: profileData.gender,
    blood_group: profileData.bloodGroup,
    height_cm: profileData.heightCm,
    weight_kg: profileData.weightKg,
    profile_image_url: profileData.profilePhotoUrl,
    updated_at: new Date().toISOString()
  };

  // Only update name fields if fullName was provided
  if (firstName !== undefined) {
    updateData.first_name = firstName;
    updateData.last_name = lastName;
  }

  const { data, error } = await supabase
    .from('doc_patients')
    .update(updateData)
    .eq('id', patientId)
    .select()
    .single();

  if (error) throw error;
  return data;
};

export const updateRegistrationStep = async (patientId, step, completed = false) => {
  const { data, error } = await supabase
    .from('doc_patients')
    .update({
      registration_step: step,
      registration_completed: completed,
      updated_at: new Date().toISOString()
    })
    .eq('id', patientId)
    .select()
    .single();

  if (error) throw error;
  return data;
};

// ============================================
// Patient Address Operations
// ============================================

export const addPatientAddress = async (patientId, addressData) => {
  // If this is primary, unset other primaries first
  if (addressData.isPrimary) {
    await supabase
      .from('doc_patient_addresses')
      .update({ is_primary: false })
      .eq('patient_id', patientId);
  }

  const { data, error } = await supabase
    .from('doc_patient_addresses')
    .insert({
      patient_id: patientId,
      address_type: addressData.addressType || 'home',
      address_line_1: addressData.streetAddress,
      address_line_2: addressData.apartmentUnit || null,
      city: addressData.city,
      state: addressData.state,
      postal_code: addressData.postalCode,
      country: addressData.country || 'India',
      is_primary: addressData.isPrimary !== false
    })
    .select()
    .single();

  if (error) throw error;
  return data;
};

export const getPatientAddresses = async (patientId) => {
  const { data, error } = await supabase
    .from('doc_patient_addresses')
    .select('*')
    .eq('patient_id', patientId)
    .order('is_primary', { ascending: false });

  if (error) throw error;
  return data || [];
};

export const updatePatientAddress = async (addressId, addressData) => {
  const { data, error } = await supabase
    .from('doc_patient_addresses')
    .update({
      address_type: addressData.addressType,
      address_line_1: addressData.streetAddress,
      address_line_2: addressData.apartmentUnit || null,
      city: addressData.city,
      state: addressData.state,
      postal_code: addressData.postalCode,
      is_primary: addressData.isPrimary
    })
    .eq('id', addressId)
    .select()
    .single();

  if (error) throw error;
  return data;
};

export const deletePatientAddress = async (addressId) => {
  const { error } = await supabase
    .from('doc_patient_addresses')
    .delete()
    .eq('id', addressId);

  if (error) throw error;
  return true;
};

// ============================================
// Emergency Contact Operations
// ============================================

export const addEmergencyContact = async (patientId, contactData) => {
  if (contactData.isPrimary) {
    await supabase
      .from('doc_patient_emergency_contacts')
      .update({ is_primary: false })
      .eq('patient_id', patientId);
  }

  const { data, error } = await supabase
    .from('doc_patient_emergency_contacts')
    .insert({
      patient_id: patientId,
      contact_name: contactData.contactName,
      relationship: contactData.relationship,
      phone_number: contactData.phone,
      email: contactData.email,
      is_primary: contactData.isPrimary !== false
    })
    .select()
    .single();

  if (error) throw error;
  return data;
};

export const getEmergencyContacts = async (patientId) => {
  const { data, error } = await supabase
    .from('doc_patient_emergency_contacts')
    .select('*')
    .eq('patient_id', patientId)
    .order('is_primary', { ascending: false });

  if (error) throw error;
  return data || [];
};

export const updateEmergencyContact = async (contactId, contactData) => {
  const { data, error } = await supabase
    .from('doc_patient_emergency_contacts')
    .update({
      contact_name: contactData.contactName,
      relationship: contactData.relationship,
      phone_number: contactData.phone,
      email: contactData.email,
      is_primary: contactData.isPrimary
    })
    .eq('id', contactId)
    .select()
    .single();

  if (error) throw error;
  return data;
};

export const deleteEmergencyContact = async (contactId) => {
  const { error } = await supabase
    .from('doc_patient_emergency_contacts')
    .delete()
    .eq('id', contactId);

  if (error) throw error;
  return true;
};

// ============================================
// Medical History Operations
// ============================================

export const addMedicalCondition = async (patientId, conditionData) => {
  const { data, error } = await supabase
    .from('doc_patient_medical_history')
    .insert({
      patient_id: patientId,
      condition_name: conditionData.conditionName,
      condition_type: conditionData.conditionType || 'chronic',
      diagnosed_date: conditionData.diagnosedDate || null,
      notes: conditionData.notes || null,
      is_current: conditionData.isCurrent !== false
    })
    .select()
    .single();

  if (error) throw error;
  return data;
};

export const getMedicalHistory = async (patientId) => {
  const { data, error } = await supabase
    .from('doc_patient_medical_history')
    .select('*')
    .eq('patient_id', patientId)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data || [];
};

export const updateMedicalCondition = async (conditionId, conditionData) => {
  const { data, error } = await supabase
    .from('doc_patient_medical_history')
    .update({
      condition_name: conditionData.conditionName,
      condition_type: conditionData.conditionType,
      diagnosed_date: conditionData.diagnosedDate,
      notes: conditionData.notes,
      is_current: conditionData.isCurrent
    })
    .eq('id', conditionId)
    .select()
    .single();

  if (error) throw error;
  return data;
};

export const deleteMedicalCondition = async (conditionId) => {
  const { error } = await supabase
    .from('doc_patient_medical_history')
    .delete()
    .eq('id', conditionId);

  if (error) throw error;
  return true;
};

// ============================================
// Allergy Operations
// ============================================

export const addAllergy = async (patientId, allergyData) => {
  const { data, error } = await supabase
    .from('doc_patient_allergies')
    .insert({
      patient_id: patientId,
      allergy_name: allergyData.allergyName,
      allergy_type: allergyData.allergyType || 'other',
      severity: allergyData.severity || null,
      reaction_description: allergyData.reactionDescription || null
    })
    .select()
    .single();

  if (error) throw error;
  return data;
};

export const getAllergies = async (patientId) => {
  const { data, error } = await supabase
    .from('doc_patient_allergies')
    .select('*')
    .eq('patient_id', patientId);

  if (error) throw error;
  return data || [];
};

export const updateAllergy = async (allergyId, allergyData) => {
  const { data, error } = await supabase
    .from('doc_patient_allergies')
    .update({
      allergy_name: allergyData.allergyName,
      allergy_type: allergyData.allergyType,
      severity: allergyData.severity,
      reaction_description: allergyData.reactionDescription
    })
    .eq('id', allergyId)
    .select()
    .single();

  if (error) throw error;
  return data;
};

export const deleteAllergy = async (allergyId) => {
  const { error } = await supabase
    .from('doc_patient_allergies')
    .delete()
    .eq('id', allergyId);

  if (error) throw error;
  return true;
};

// ============================================
// Medication Operations
// ============================================

export const addMedication = async (patientId, medicationData) => {
  const { data, error } = await supabase
    .from('doc_patient_medications')
    .insert({
      patient_id: patientId,
      medication_name: medicationData.medicationName,
      dosage: medicationData.dosage,
      frequency: medicationData.frequency,
      prescribed_by: medicationData.prescribedBy,
      start_date: medicationData.startDate,
      end_date: medicationData.endDate,
      is_current: medicationData.isCurrent !== false,
      notes: medicationData.notes
    })
    .select()
    .single();

  if (error) throw error;
  return data;
};

export const getMedications = async (patientId, currentOnly = true) => {
  let query = supabase
    .from('doc_patient_medications')
    .select('*')
    .eq('patient_id', patientId);

  if (currentOnly) {
    query = query.eq('is_current', true);
  }

  const { data, error } = await query.order('created_at', { ascending: false });

  if (error) throw error;
  return data || [];
};

export const updateMedication = async (medicationId, medicationData) => {
  const { data, error } = await supabase
    .from('doc_patient_medications')
    .update({
      medication_name: medicationData.medicationName,
      dosage: medicationData.dosage,
      frequency: medicationData.frequency,
      prescribed_by: medicationData.prescribedBy,
      start_date: medicationData.startDate,
      end_date: medicationData.endDate,
      is_current: medicationData.isCurrent,
      notes: medicationData.notes,
      updated_at: new Date().toISOString()
    })
    .eq('id', medicationId)
    .select()
    .single();

  if (error) throw error;
  return data;
};

export const deleteMedication = async (medicationId) => {
  const { error } = await supabase
    .from('doc_patient_medications')
    .delete()
    .eq('id', medicationId);

  if (error) throw error;
  return true;
};

// ============================================
// Insurance Operations
// ============================================

export const addInsurance = async (patientId, insuranceData) => {
  if (insuranceData.isPrimary) {
    await supabase
      .from('doc_patient_insurance')
      .update({ is_primary: false })
      .eq('patient_id', patientId);
  }

  const { data, error } = await supabase
    .from('doc_patient_insurance')
    .insert({
      patient_id: patientId,
      provider_name: insuranceData.providerName,
      policy_number: insuranceData.policyNumber,
      group_number: insuranceData.groupNumber,
      member_id: insuranceData.memberId,
      coverage_type: insuranceData.coverageType || 'individual',
      valid_from: insuranceData.validFrom,
      valid_until: insuranceData.validUntil,
      is_primary: insuranceData.isPrimary || false,
      is_active: true
    })
    .select()
    .single();

  if (error) throw error;
  return data;
};

export const getInsurance = async (patientId) => {
  const { data, error } = await supabase
    .from('doc_patient_insurance')
    .select('*')
    .eq('patient_id', patientId)
    .eq('is_active', true)
    .order('is_primary', { ascending: false });

  if (error) throw error;
  return data || [];
};

// ============================================
// Doctor Selection Operations
// ============================================

export const selectDoctor = async (patientId, doctorId, isFavorite = false) => {
  const { data, error } = await supabase
    .from('doc_patient_doctor_selections')
    .upsert({
      patient_id: patientId,
      doctor_id: doctorId,
      is_favorite: isFavorite
    }, {
      onConflict: 'patient_id,doctor_id'
    })
    .select()
    .single();

  if (error) throw error;
  return data;
};

export const getSelectedDoctors = async (patientId) => {
  const { data, error } = await supabase
    .from('doc_patient_doctor_selections')
    .select(`
      *,
      doctor:doctor_id (
        id,
        full_name,
        specialization,
        clinic_name,
        clinic_address,
        experience_years,
        consultation_fee,
        online_fee,
        is_verified
      )
    `)
    .eq('patient_id', patientId)
    .order('is_favorite', { ascending: false });

  if (error) throw error;
  return data || [];
};

export const toggleFavoriteDoctor = async (selectionId, isFavorite) => {
  const { data, error } = await supabase
    .from('doc_patient_doctor_selections')
    .update({ is_favorite: isFavorite })
    .eq('id', selectionId)
    .select()
    .single();

  if (error) throw error;
  return data;
};

export const removeSelectedDoctor = async (patientId, doctorId) => {
  const { error } = await supabase
    .from('doc_patient_doctor_selections')
    .delete()
    .eq('patient_id', patientId)
    .eq('doctor_id', doctorId);

  if (error) throw error;
  return true;
};

// ============================================
// Appointment Operations
// Uses doc_appointments from Doctor Portal
// ============================================

export const createAppointment = async (patientId, appointmentData) => {
  // First, select the doctor to create patient-doctor relationship
  await selectDoctor(patientId, appointmentData.doctorId);

  const { data, error } = await supabase
    .from('doc_appointments')
    .insert({
      doc_patient_id: patientId,
      doctor_id: appointmentData.doctorId,
      patient_name: appointmentData.patientName,
      patient_email: appointmentData.patientEmail,
      patient_phone: appointmentData.patientPhone,
      appointment_date: appointmentData.appointmentDate,
      start_time: appointmentData.appointmentTime,
      end_time: (() => {
        const [hours, mins] = appointmentData.appointmentTime.split(':').map(Number);
        const endMins = mins + 30;
        const endHours = hours + Math.floor(endMins / 60);
        return `${String(endHours).padStart(2, '0')}:${String(endMins % 60).padStart(2, '0')}`;
      })(),
      visit_type: appointmentData.visitType || 'online',
      status: 'pending',
      amount: appointmentData.consultationFee,
      payment_status: 'pending'
    })
    .select(`
      *,
      doctor:doctor_id (
        full_name,
        specialization,
        clinic_name,
        clinic_address
      )
    `)
    .single();

  if (error) throw error;
  return data;
};

export const confirmPayment = async (appointmentId, paymentData) => {
  // Only update columns that exist in doc_appointments table
  const { data, error } = await supabase
    .from('doc_appointments')
    .update({
      payment_status: 'paid',
      status: 'confirmed'
    })
    .eq('id', appointmentId)
    .select()
    .single();

  if (error) throw error;
  return data;
};

export const getAppointments = async (patientId, status = null) => {
  let query = supabase
    .from('doc_appointments')
    .select(`
      *,
      doctor:doctor_id (
        id,
        full_name,
        specialization,
        clinic_name,
        clinic_address,
        consultation_fee
      )
    `)
    .eq('doc_patient_id', patientId);

  if (status) {
    query = query.eq('status', status);
  }

  const { data, error } = await query.order('appointment_date', { ascending: false });

  if (error) throw error;
  return data || [];
};

export const getUpcomingAppointments = async (patientId) => {
  const today = new Date().toISOString().split('T')[0];

  const { data, error } = await supabase
    .from('doc_appointments')
    .select(`
      *,
      doctor:doctor_id (
        id,
        full_name,
        specialization,
        clinic_name,
        clinic_address
      )
    `)
    .eq('doc_patient_id', patientId)
    .gte('appointment_date', today)
    .in('status', ['pending', 'confirmed'])
    .order('appointment_date', { ascending: true })
    .order('start_time', { ascending: true });

  if (error) throw error;
  return data || [];
};

export const cancelAppointment = async (appointmentId, reason) => {
  const { data, error } = await supabase
    .from('doc_appointments')
    .update({
      status: 'cancelled',
      cancellation_reason: reason,
      cancelled_by: 'patient',
      updated_at: new Date().toISOString()
    })
    .eq('id', appointmentId)
    .select()
    .single();

  if (error) throw error;
  return data;
};

// ============================================
// Document Operations
// Uses doc_patient_reports from Doctor Portal
// Storage: patient-documents bucket
// ============================================

export const uploadDocument = async (patientId, file, documentData) => {
  // Upload file to Supabase Storage (patient-documents bucket)
  // Sanitize file name - replace spaces and special chars
  const sanitizedName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
  const fileName = `${patientId}/${Date.now()}_${sanitizedName}`;

  const { data: uploadData, error: uploadError } = await supabase.storage
    .from('patient-documents')
    .upload(fileName, file);

  if (uploadError) throw uploadError;

  // Create document record in doc_patient_reports
  const { data, error } = await supabase
    .from('doc_patient_reports')
    .insert({
      doc_patient_id: patientId,
      doctor_id: documentData.doctorId,
      appointment_id: documentData.appointmentId,
      file_type: documentData.documentType,
      file_name: file.name,
      file_url: uploadData.path,
      uploaded_by: 'patient',
      description: documentData.description || null
    })
    .select()
    .single();

  if (error) throw error;
  return data;
};

export const getDocuments = async (patientId, documentType = null) => {
  let query = supabase
    .from('doc_patient_reports')
    .select('*')
    .eq('doc_patient_id', patientId);

  if (documentType) {
    query = query.eq('file_type', documentType);
  }

  const { data, error } = await query.order('created_at', { ascending: false });

  if (error) throw error;
  return data || [];
};

export const getDocumentUrl = async (filePath) => {
  const { data, error } = await supabase.storage
    .from('patient-documents')
    .createSignedUrl(filePath, 3600); // 1 hour expiry

  if (error) throw error;
  return data.signedUrl;
};

export const deleteDocument = async (documentId, filePath) => {
  // Delete from storage
  await supabase.storage
    .from('patient-documents')
    .remove([filePath]);

  // Delete record
  const { error } = await supabase
    .from('doc_patient_reports')
    .delete()
    .eq('id', documentId);

  if (error) throw error;
  return true;
};

// ============================================
// Doctor Search Operations
// Uses doc_doctors table from Doctor Portal
// ============================================

export const searchDoctors = async (filters = {}) => {
  let query = supabase
    .from('doc_doctors')
    .select('*');

  if (filters.specialization) {
    query = query.ilike('specialization', `%${filters.specialization}%`);
  }

  if (filters.maxFee) {
    query = query.lte('consultation_fee', filters.maxFee);
  }

  if (filters.verifiedOnly) {
    query = query.eq('is_verified', true);
  }

  const { data, error } = await query.order('full_name', { ascending: true });

  if (error) throw error;
  return data || [];
};

export const getDoctorById = async (doctorId) => {
  const { data, error } = await supabase
    .from('doc_doctors')
    .select('*')
    .eq('id', doctorId)
    .single();

  if (error) throw error;
  return data;
};

export const getDoctorAvailability = async (doctorId, date) => {
  // doc_availability uses day_of_week (0-6, Sunday-Saturday) for recurring slots
  const dayOfWeek = new Date(date).getDay();

  const { data, error } = await supabase
    .from('doc_availability')
    .select('*')
    .eq('doctor_id', doctorId)
    .eq('day_of_week', dayOfWeek)
    .eq('is_active', true)
    .order('start_time', { ascending: true });

  if (error) throw error;
  return data || [];
};

// ============================================
// Complete Patient Data Fetch
// ============================================

export const getCompletePatientData = async (authUserId) => {
  const patient = await getPatientProfile(authUserId);

  if (!patient) return null;

  const [addresses, emergencyContacts, medicalHistory, allergies, medications, insurance, selectedDoctors, upcomingAppointments] = await Promise.all([
    getPatientAddresses(patient.id),
    getEmergencyContacts(patient.id),
    getMedicalHistory(patient.id),
    getAllergies(patient.id),
    getMedications(patient.id),
    getInsurance(patient.id),
    getSelectedDoctors(patient.id),
    getUpcomingAppointments(patient.id)
  ]);

  return {
    ...patient,
    addresses,
    emergencyContacts,
    medicalHistory,
    allergies,
    medications,
    insurance,
    selectedDoctors,
    upcomingAppointments
  };
};

export default {
  createPatientProfile,
  getPatientProfile,
  updatePatientProfile,
  updateRegistrationStep,
  addPatientAddress,
  getPatientAddresses,
  updatePatientAddress,
  deletePatientAddress,
  addEmergencyContact,
  getEmergencyContacts,
  updateEmergencyContact,
  deleteEmergencyContact,
  addMedicalCondition,
  getMedicalHistory,
  updateMedicalCondition,
  deleteMedicalCondition,
  addAllergy,
  getAllergies,
  updateAllergy,
  deleteAllergy,
  addMedication,
  getMedications,
  updateMedication,
  deleteMedication,
  addInsurance,
  getInsurance,
  selectDoctor,
  getSelectedDoctors,
  toggleFavoriteDoctor,
  removeSelectedDoctor,
  createAppointment,
  confirmPayment,
  getAppointments,
  getUpcomingAppointments,
  cancelAppointment,
  uploadDocument,
  getDocuments,
  getDocumentUrl,
  deleteDocument,
  searchDoctors,
  getDoctorById,
  getDoctorAvailability,
  getCompletePatientData
};
