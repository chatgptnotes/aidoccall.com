import React from 'react';
import { Link } from 'react-router-dom';

const LandingPage = () => {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navigation Bar */}
      <nav className="bg-white shadow-md sticky top-0 z-50">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <div className="flex items-center gap-2">
              <span className="material-icons text-blue-600 text-3xl">local_hospital</span>
              <span className="text-xl font-bold text-gray-900">AidocCall</span>
            </div>

            {/* Navigation Links - Desktop */}
            <div className="hidden md:flex items-center gap-8">
              <a href="#features" className="text-gray-600 hover:text-blue-600 transition font-medium">Features</a>
              <a href="#how-it-works" className="text-gray-600 hover:text-blue-600 transition font-medium">How It Works</a>
              <a href="#for-doctors" className="text-gray-600 hover:text-blue-600 transition font-medium">For Doctors</a>
              <a href="#for-patients" className="text-gray-600 hover:text-blue-600 transition font-medium">For Patients</a>
            </div>

            {/* CTA Buttons */}
            <div className="flex items-center gap-3">
              <Link
                to="/login"
                className="text-blue-600 hover:text-blue-700 font-medium px-4 py-2 transition"
              >
                Login
              </Link>
              <Link
                to="/patient/register"
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition font-medium"
              >
                Register
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="bg-gradient-to-br from-blue-600 to-green-600 text-white py-20 lg:py-28">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="text-center lg:text-left">
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6 leading-tight">
                Healthcare at Your Fingertips
              </h1>
              <p className="text-xl md:text-2xl text-blue-100 mb-8 leading-relaxed">
                Connect with doctors, manage appointments, and access your health records seamlessly
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
                <Link
                  to="/patient/register"
                  className="bg-white text-blue-600 px-8 py-3 rounded-lg font-bold text-lg hover:bg-gray-100 transition shadow-lg flex items-center justify-center gap-2"
                >
                  <span className="material-icons">person_add</span>
                  Get Started
                </Link>
                <Link
                  to="/login"
                  className="bg-transparent border-2 border-white text-white px-8 py-3 rounded-lg font-bold text-lg hover:bg-white/10 transition flex items-center justify-center gap-2"
                >
                  <span className="material-icons">login</span>
                  Sign In
                </Link>
              </div>
            </div>
            <div className="hidden lg:flex justify-center">
              <div className="bg-white/20 backdrop-blur-md rounded-3xl p-8 border border-white/30">
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-white/20 rounded-xl p-6 text-center">
                    <span className="material-icons text-5xl mb-2">videocam</span>
                    <p className="font-medium">Video Consult</p>
                  </div>
                  <div className="bg-white/20 rounded-xl p-6 text-center">
                    <span className="material-icons text-5xl mb-2">calendar_today</span>
                    <p className="font-medium">Book Appointments</p>
                  </div>
                  <div className="bg-white/20 rounded-xl p-6 text-center">
                    <span className="material-icons text-5xl mb-2">folder_shared</span>
                    <p className="font-medium">Health Records</p>
                  </div>
                  <div className="bg-white/20 rounded-xl p-6 text-center">
                    <span className="material-icons text-5xl mb-2">emergency</span>
                    <p className="font-medium">Emergency Care</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 bg-white">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Comprehensive Healthcare Solutions
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Everything you need to manage your health, all in one place
            </p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {/* Feature Card 1 */}
            <div className="bg-white rounded-xl shadow-md p-6 hover:shadow-lg transition border border-gray-100">
              <div className="bg-blue-100 w-16 h-16 rounded-xl flex items-center justify-center mb-4">
                <span className="material-icons text-blue-600 text-3xl">videocam</span>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Video Consultations</h3>
              <p className="text-gray-600">
                Connect with certified doctors through secure video calls from the comfort of your home
              </p>
            </div>

            {/* Feature Card 2 */}
            <div className="bg-white rounded-xl shadow-md p-6 hover:shadow-lg transition border border-gray-100">
              <div className="bg-green-100 w-16 h-16 rounded-xl flex items-center justify-center mb-4">
                <span className="material-icons text-green-600 text-3xl">calendar_today</span>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Appointment Booking</h3>
              <p className="text-gray-600">
                Schedule appointments with specialists at your convenience with instant confirmation
              </p>
            </div>

            {/* Feature Card 3 */}
            <div className="bg-white rounded-xl shadow-md p-6 hover:shadow-lg transition border border-gray-100">
              <div className="bg-purple-100 w-16 h-16 rounded-xl flex items-center justify-center mb-4">
                <span className="material-icons text-purple-600 text-3xl">folder_shared</span>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Health Records</h3>
              <p className="text-gray-600">
                Access and share your medical history, prescriptions, and test results securely
              </p>
            </div>

            {/* Feature Card 4 */}
            <div className="bg-white rounded-xl shadow-md p-6 hover:shadow-lg transition border border-gray-100">
              <div className="bg-red-100 w-16 h-16 rounded-xl flex items-center justify-center mb-4">
                <span className="material-icons text-red-600 text-3xl">emergency</span>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Emergency Services</h3>
              <p className="text-gray-600">
                Get immediate medical assistance with our 24/7 emergency response system
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section id="how-it-works" className="py-20 bg-gray-50">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              How It Works
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Get started in three simple steps
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            {/* Step 1 */}
            <div className="text-center">
              <div className="relative inline-block mb-6">
                <div className="bg-blue-600 w-20 h-20 rounded-full flex items-center justify-center mx-auto">
                  <span className="material-icons text-white text-4xl">person_add</span>
                </div>
                <div className="absolute -top-2 -right-2 bg-green-500 text-white w-8 h-8 rounded-full flex items-center justify-center font-bold text-lg">
                  1
                </div>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Create Account</h3>
              <p className="text-gray-600">
                Sign up with your basic information and verify your phone number to get started
              </p>
            </div>

            {/* Step 2 */}
            <div className="text-center">
              <div className="relative inline-block mb-6">
                <div className="bg-blue-600 w-20 h-20 rounded-full flex items-center justify-center mx-auto">
                  <span className="material-icons text-white text-4xl">event_available</span>
                </div>
                <div className="absolute -top-2 -right-2 bg-green-500 text-white w-8 h-8 rounded-full flex items-center justify-center font-bold text-lg">
                  2
                </div>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Book Appointment</h3>
              <p className="text-gray-600">
                Browse doctors by specialty and book an appointment at your preferred time
              </p>
            </div>

            {/* Step 3 */}
            <div className="text-center">
              <div className="relative inline-block mb-6">
                <div className="bg-blue-600 w-20 h-20 rounded-full flex items-center justify-center mx-auto">
                  <span className="material-icons text-white text-4xl">medical_services</span>
                </div>
                <div className="absolute -top-2 -right-2 bg-green-500 text-white w-8 h-8 rounded-full flex items-center justify-center font-bold text-lg">
                  3
                </div>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Consult Doctor</h3>
              <p className="text-gray-600">
                Connect via video call or in-person visit and receive personalized care
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* For Doctors Section */}
      <section id="for-doctors" className="py-20 bg-white">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-6">
                For Healthcare Providers
              </h2>
              <p className="text-xl text-gray-600 mb-8">
                Join our network of healthcare professionals and expand your practice digitally
              </p>
              <ul className="space-y-4">
                <li className="flex items-start gap-3">
                  <span className="material-icons text-green-600 mt-1">check_circle</span>
                  <span className="text-gray-700">Manage appointments and patient records efficiently</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="material-icons text-green-600 mt-1">check_circle</span>
                  <span className="text-gray-700">Conduct secure video consultations</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="material-icons text-green-600 mt-1">check_circle</span>
                  <span className="text-gray-700">Access patient history and prescriptions</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="material-icons text-green-600 mt-1">check_circle</span>
                  <span className="text-gray-700">Grow your practice with our patient network</span>
                </li>
              </ul>
            </div>
            <div className="bg-gradient-to-br from-blue-600 to-green-600 rounded-2xl p-8 text-white">
              <div className="grid grid-cols-2 gap-6">
                <div className="text-center">
                  <span className="material-icons text-5xl mb-2">groups</span>
                  <p className="text-3xl font-bold">1000+</p>
                  <p className="text-blue-100">Doctors</p>
                </div>
                <div className="text-center">
                  <span className="material-icons text-5xl mb-2">verified</span>
                  <p className="text-3xl font-bold">100%</p>
                  <p className="text-blue-100">Verified</p>
                </div>
                <div className="text-center">
                  <span className="material-icons text-5xl mb-2">star</span>
                  <p className="text-3xl font-bold">4.8</p>
                  <p className="text-blue-100">Rating</p>
                </div>
                <div className="text-center">
                  <span className="material-icons text-5xl mb-2">schedule</span>
                  <p className="text-3xl font-bold">24/7</p>
                  <p className="text-blue-100">Support</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* For Patients Section */}
      <section id="for-patients" className="py-20 bg-gray-50">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="order-2 lg:order-1">
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-white rounded-xl shadow-md p-6 text-center hover:shadow-lg transition">
                  <span className="material-icons text-blue-600 text-4xl mb-2">schedule</span>
                  <p className="font-bold text-gray-900">Quick Booking</p>
                </div>
                <div className="bg-white rounded-xl shadow-md p-6 text-center hover:shadow-lg transition">
                  <span className="material-icons text-green-600 text-4xl mb-2">payments</span>
                  <p className="font-bold text-gray-900">Easy Payments</p>
                </div>
                <div className="bg-white rounded-xl shadow-md p-6 text-center hover:shadow-lg transition">
                  <span className="material-icons text-purple-600 text-4xl mb-2">notifications</span>
                  <p className="font-bold text-gray-900">Reminders</p>
                </div>
                <div className="bg-white rounded-xl shadow-md p-6 text-center hover:shadow-lg transition">
                  <span className="material-icons text-red-600 text-4xl mb-2">security</span>
                  <p className="font-bold text-gray-900">Data Privacy</p>
                </div>
              </div>
            </div>
            <div className="order-1 lg:order-2">
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-6">
                For Patients
              </h2>
              <p className="text-xl text-gray-600 mb-8">
                Take control of your health with our comprehensive patient portal
              </p>
              <ul className="space-y-4">
                <li className="flex items-start gap-3">
                  <span className="material-icons text-green-600 mt-1">check_circle</span>
                  <span className="text-gray-700">Book appointments with top specialists</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="material-icons text-green-600 mt-1">check_circle</span>
                  <span className="text-gray-700">Access your medical records anytime, anywhere</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="material-icons text-green-600 mt-1">check_circle</span>
                  <span className="text-gray-700">Get prescription refills and lab results online</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="material-icons text-green-600 mt-1">check_circle</span>
                  <span className="text-gray-700">24/7 emergency support when you need it</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Stats/Trust Section */}
      <section className="py-16 bg-gradient-to-r from-blue-600 to-green-600 text-white">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            <div>
              <p className="text-4xl md:text-5xl font-bold mb-2">1000+</p>
              <p className="text-blue-100 text-lg">Doctors</p>
            </div>
            <div>
              <p className="text-4xl md:text-5xl font-bold mb-2">50,000+</p>
              <p className="text-blue-100 text-lg">Consultations</p>
            </div>
            <div>
              <p className="text-4xl md:text-5xl font-bold mb-2">24/7</p>
              <p className="text-blue-100 text-lg">Support</p>
            </div>
            <div>
              <p className="text-4xl md:text-5xl font-bold mb-2">4.8</p>
              <p className="text-blue-100 text-lg">User Rating</p>
            </div>
          </div>
        </div>
      </section>

      {/* Call to Action Section */}
      <section className="py-20 bg-gray-900 text-white">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-6">
            Ready to Get Started?
          </h2>
          <p className="text-xl text-gray-300 mb-8 max-w-2xl mx-auto">
            Join thousands of patients and doctors who trust AidocCall for their healthcare needs
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              to="/patient/register"
              className="bg-blue-600 text-white px-8 py-4 rounded-lg font-bold text-lg hover:bg-blue-700 transition flex items-center justify-center gap-2"
            >
              <span className="material-icons">person_add</span>
              Create Free Account
            </Link>
            <Link
              to="/emergency"
              className="bg-red-600 text-white px-8 py-4 rounded-lg font-bold text-lg hover:bg-red-700 transition flex items-center justify-center gap-2"
            >
              <span className="material-icons">emergency</span>
              Emergency Services
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-400 pt-16 pb-8">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-4 gap-8 mb-12">
            {/* Company Info */}
            <div>
              <div className="flex items-center gap-2 mb-4">
                <span className="material-icons text-blue-500 text-2xl">local_hospital</span>
                <span className="text-xl font-bold text-white">AidocCall</span>
              </div>
              <p className="text-gray-400 mb-4">
                Your trusted partner in digital healthcare. Connect with doctors, manage appointments, and access your health records securely.
              </p>
            </div>

            {/* Quick Links */}
            <div>
              <h4 className="text-white font-bold mb-4">Quick Links</h4>
              <ul className="space-y-2">
                <li><a href="#features" className="hover:text-white transition">Features</a></li>
                <li><a href="#how-it-works" className="hover:text-white transition">How It Works</a></li>
                <li><a href="#for-doctors" className="hover:text-white transition">For Doctors</a></li>
                <li><a href="#for-patients" className="hover:text-white transition">For Patients</a></li>
              </ul>
            </div>

            {/* Services */}
            <div>
              <h4 className="text-white font-bold mb-4">Services</h4>
              <ul className="space-y-2">
                <li><Link to="/patient/register" className="hover:text-white transition">Patient Registration</Link></li>
                <li><Link to="/login" className="hover:text-white transition">Doctor Login</Link></li>
                <li><Link to="/emergency" className="hover:text-white transition">Emergency Services</Link></li>
                <li><a href="#" className="hover:text-white transition">Teleconsultation</a></li>
              </ul>
            </div>

            {/* Contact */}
            <div>
              <h4 className="text-white font-bold mb-4">Contact Us</h4>
              <ul className="space-y-2">
                <li className="flex items-center gap-2">
                  <span className="material-icons text-sm">email</span>
                  support@aidoccall.com
                </li>
                <li className="flex items-center gap-2">
                  <span className="material-icons text-sm">phone</span>
                  1800-XXX-XXXX
                </li>
                <li className="flex items-center gap-2">
                  <span className="material-icons text-sm">schedule</span>
                  24/7 Support Available
                </li>
              </ul>
            </div>
          </div>

          {/* Bottom Footer */}
          <div className="border-t border-gray-800 pt-8">
            <div className="flex flex-col md:flex-row justify-between items-center gap-4">
              <p className="text-gray-500 text-sm">
                &copy; 2026 AidocCall. All rights reserved.
              </p>
              <div className="flex gap-6 text-sm">
                <a href="#" className="hover:text-white transition">Privacy Policy</a>
                <a href="#" className="hover:text-white transition">Terms of Service</a>
                <a href="#" className="hover:text-white transition">Cookie Policy</a>
              </div>
            </div>
            {/* Version Footer */}
            <p className="text-center text-gray-600 text-xs mt-4">
              v1.3 - 2026-01-17
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
