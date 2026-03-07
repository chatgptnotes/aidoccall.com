import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';

const LandingPage = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Stats counter animation
  const stats = [
    { value: '10,000+', label: 'Happy Patients', icon: 'groups' },
    { value: '500+', label: 'Expert Doctors', icon: 'medical_services' },
    { value: '24/7', label: 'Support Available', icon: 'schedule' },
    { value: '4.9', label: 'Average Rating', icon: 'star' }
  ];

  const features = [
    {
      icon: 'videocam',
      title: 'Video Consultations',
      description: 'Connect with certified doctors from anywhere through secure, HD video calls.',
      color: 'from-[#2b7ab9] to-[#236394]',
      bgColor: 'bg-[#e8f4fc]'
    },
    {
      icon: 'calendar_month',
      title: 'Easy Scheduling',
      description: 'Book appointments in seconds with real-time availability and instant confirmation.',
      color: 'from-[#4caf50] to-[#388e3c]',
      bgColor: 'bg-[#e8f5e9]'
    },
    {
      icon: 'folder_shared',
      title: 'Digital Health Records',
      description: 'Access your complete medical history, prescriptions, and reports anytime.',
      color: 'from-[#2196f3] to-[#1976d2]',
      bgColor: 'bg-blue-50'
    },
    {
      icon: 'security',
      title: 'Secure & Private',
      description: 'Your health data is protected with enterprise-grade encryption and privacy controls.',
      color: 'from-[#2b7ab9] to-[#4caf50]',
      bgColor: 'bg-gradient-to-r from-[#e8f4fc] to-[#e8f5e9]'
    }
  ];

  const steps = [
    {
      step: '01',
      title: 'Create Your Account',
      description: 'Sign up in under a minute with just your email. Verify your identity for secure access.',
      icon: 'person_add'
    },
    {
      step: '02',
      title: 'Find Your Doctor',
      description: 'Browse verified specialists by expertise, ratings, and availability. Read patient reviews.',
      icon: 'search'
    },
    {
      step: '03',
      title: 'Book & Consult',
      description: 'Schedule your appointment, make secure payment, and connect via video or visit in-person.',
      icon: 'event_available'
    }
  ];

  const testimonials = [
    {
      name: 'Priya Sharma',
      role: 'Patient from Mumbai',
      content: 'AidocCall made it so easy to consult with a specialist from home. The video quality was excellent and the doctor was very thorough.',
      avatar: 'PS',
      rating: 5
    },
    {
      name: 'Dr. Rajesh Kumar',
      role: 'Cardiologist',
      content: 'As a doctor, this platform has transformed how I connect with patients. The scheduling and record management is seamless.',
      avatar: 'RK',
      rating: 5
    },
    {
      name: 'Anita Desai',
      role: 'Patient from Delhi',
      content: 'I was skeptical about online consultations, but the experience was professional and convenient. Highly recommend!',
      avatar: 'AD',
      rating: 5
    }
  ];

  return (
    <div className="min-h-screen bg-white">
      {/* Skip Link for Accessibility */}
      <a href="#main-content" className="skip-link">Skip to main content</a>

      {/* Navigation */}
      <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        isScrolled ? 'bg-white/95 backdrop-blur-lg shadow-soft' : 'bg-transparent'
      }`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 lg:h-20">
            {/* Logo */}
            <Link to="/" className="flex items-center gap-2 group">
              <img 
                src="/aidoccall-logo.png" 
                alt="AidocCall" 
                className="h-10 lg:h-12 w-auto object-contain group-hover:scale-105 transition-transform duration-300"
              />
            </Link>

            {/* Desktop Navigation */}
            <div className="hidden lg:flex items-center gap-8">
              <a href="#features" className="text-gray-600 hover:text-gray-900 font-medium transition-colors">Features</a>
              <a href="#how-it-works" className="text-gray-600 hover:text-gray-900 font-medium transition-colors">How It Works</a>
              <a href="#testimonials" className="text-gray-600 hover:text-gray-900 font-medium transition-colors">Reviews</a>
              <a href="#for-doctors" className="text-gray-600 hover:text-gray-900 font-medium transition-colors">For Doctors</a>
            </div>

            {/* CTA Buttons */}
            <div className="flex items-center gap-3">
              <Link
                to="/login"
                className="hidden sm:inline-flex items-center gap-2 px-4 py-2 text-gray-700 font-medium hover:text-blue-600 transition-colors"
              >
                Sign In
              </Link>
              <Link
                to="/patient/register"
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-blue-600 to-blue-700 text-white font-semibold rounded-xl shadow-lg shadow-blue-500/25 hover:shadow-xl hover:shadow-blue-500/30 hover:-translate-y-0.5 transition-all duration-300"
              >
                <span className="hidden sm:inline">Get Started</span>
                <span className="sm:hidden">Join</span>
                <span className="material-icons text-lg">arrow_forward</span>
              </Link>
              
              {/* Mobile Menu Button */}
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="lg:hidden p-2 text-gray-600 hover:text-gray-900"
                aria-label="Toggle menu"
              >
                <span className="material-icons text-2xl">{mobileMenuOpen ? 'close' : 'menu'}</span>
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="lg:hidden bg-white border-t border-gray-100 py-4 px-4 shadow-lg animate-fadeInDown">
            <div className="flex flex-col gap-2">
              <a href="#features" onClick={() => setMobileMenuOpen(false)} className="px-4 py-3 text-gray-700 font-medium hover:bg-gray-50 rounded-xl transition-colors">Features</a>
              <a href="#how-it-works" onClick={() => setMobileMenuOpen(false)} className="px-4 py-3 text-gray-700 font-medium hover:bg-gray-50 rounded-xl transition-colors">How It Works</a>
              <a href="#testimonials" onClick={() => setMobileMenuOpen(false)} className="px-4 py-3 text-gray-700 font-medium hover:bg-gray-50 rounded-xl transition-colors">Reviews</a>
              <a href="#for-doctors" onClick={() => setMobileMenuOpen(false)} className="px-4 py-3 text-gray-700 font-medium hover:bg-gray-50 rounded-xl transition-colors">For Doctors</a>
              <hr className="my-2 border-gray-100" />
              <Link to="/login" className="px-4 py-3 text-gray-700 font-medium hover:bg-gray-50 rounded-xl transition-colors">Sign In</Link>
            </div>
          </div>
        )}
      </nav>

      {/* Hero Section */}
      <section id="main-content" className="relative min-h-screen flex items-center pt-20 overflow-hidden bg-gradient-mesh">
        {/* Animated Background Blobs */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="hero-blob w-96 h-96 bg-blue-400/30 top-20 -left-48 animate-blob"></div>
          <div className="hero-blob w-80 h-80 bg-emerald-400/20 top-40 right-0 animate-blob animation-delay-200"></div>
          <div className="hero-blob w-72 h-72 bg-violet-400/20 bottom-20 left-1/4 animate-blob animation-delay-400"></div>
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 lg:py-24">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
            {/* Hero Content */}
            <div className="text-center lg:text-left">
              {/* Trust Badge */}
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/80 backdrop-blur-sm border border-gray-200 rounded-full shadow-sm mb-8 animate-fadeInUp">
                <span className="flex items-center justify-center w-5 h-5 bg-emerald-500 rounded-full">
                  <span className="material-icons text-white text-xs">check</span>
                </span>
                <span className="text-sm font-medium text-gray-700">Trusted by 10,000+ patients across India</span>
              </div>

              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-gray-900 leading-tight mb-6 animate-fadeInUp animation-delay-100">
                Healthcare at Your
                <span className="block text-gradient-hero">Fingertips</span>
              </h1>

              <p className="text-lg sm:text-xl text-gray-600 mb-8 max-w-xl mx-auto lg:mx-0 animate-fadeInUp animation-delay-200">
                Connect with verified doctors, book appointments instantly, and access your health records securely — all from your device.
              </p>

              {/* CTA Buttons */}
              <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start animate-fadeInUp animation-delay-300">
                <Link
                  to="/patient/register"
                  className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-gradient-to-r from-[#2b7ab9] to-[#236394] text-white font-bold rounded-2xl shadow-xl shadow-[#2b7ab9]/25 hover:shadow-2xl hover:shadow-[#2b7ab9]/30 hover:-translate-y-1 transition-all duration-300 text-lg"
                >
                  <span className="material-icons">person_add</span>
                  Start Free
                </Link>
                <a
                  href="#how-it-works"
                  className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-white text-gray-700 font-bold rounded-2xl border-2 border-gray-200 hover:border-[#4caf50] hover:text-[#4caf50] hover:bg-green-50 transition-all duration-300 text-lg"
                >
                  <span className="material-icons">play_circle</span>
                  See How It Works
                </a>
              </div>

              {/* Trust Indicators */}
              <div className="flex flex-wrap items-center justify-center lg:justify-start gap-6 mt-10 animate-fadeInUp animation-delay-400">
                <div className="flex items-center gap-2 text-gray-500">
                  <span className="material-icons text-emerald-500">verified_user</span>
                  <span className="text-sm font-medium">HIPAA Compliant</span>
                </div>
                <div className="flex items-center gap-2 text-gray-500">
                  <span className="material-icons text-emerald-500">lock</span>
                  <span className="text-sm font-medium">256-bit Encryption</span>
                </div>
                <div className="flex items-center gap-2 text-gray-500">
                  <span className="material-icons text-emerald-500">gpp_good</span>
                  <span className="text-sm font-medium">Verified Doctors</span>
                </div>
              </div>
            </div>

            {/* Hero Visual */}
            <div className="relative animate-fadeInUp animation-delay-200">
              <div className="relative bg-gradient-to-br from-[#2b7ab9] via-[#3498db] to-[#4caf50] rounded-3xl p-8 shadow-2xl">
                {/* Decorative Grid */}
                <div className="absolute inset-0 hero-grid rounded-3xl opacity-30"></div>
                
                {/* Floating Cards */}
                <div className="relative grid grid-cols-2 gap-4">
                  <div className="bg-white/95 backdrop-blur-sm rounded-2xl p-5 shadow-lg hover:-translate-y-1 transition-transform duration-300 animate-float">
                    <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center mb-3">
                      <span className="material-icons text-blue-600 text-2xl">videocam</span>
                    </div>
                    <p className="font-bold text-gray-900">Video Consult</p>
                    <p className="text-sm text-gray-500 mt-1">Talk to doctors instantly</p>
                  </div>
                  
                  <div className="bg-white/95 backdrop-blur-sm rounded-2xl p-5 shadow-lg hover:-translate-y-1 transition-transform duration-300 animate-float animation-delay-200">
                    <div className="w-12 h-12 bg-emerald-100 rounded-xl flex items-center justify-center mb-3">
                      <span className="material-icons text-emerald-600 text-2xl">calendar_today</span>
                    </div>
                    <p className="font-bold text-gray-900">Easy Booking</p>
                    <p className="text-sm text-gray-500 mt-1">Schedule in seconds</p>
                  </div>
                  
                  <div className="bg-white/95 backdrop-blur-sm rounded-2xl p-5 shadow-lg hover:-translate-y-1 transition-transform duration-300 animate-float animation-delay-300">
                    <div className="w-12 h-12 bg-violet-100 rounded-xl flex items-center justify-center mb-3">
                      <span className="material-icons text-violet-600 text-2xl">description</span>
                    </div>
                    <p className="font-bold text-gray-900">Health Records</p>
                    <p className="text-sm text-gray-500 mt-1">Access anytime</p>
                  </div>
                  
                  <div className="bg-white/95 backdrop-blur-sm rounded-2xl p-5 shadow-lg hover:-translate-y-1 transition-transform duration-300 animate-float animation-delay-400">
                    <div className="w-12 h-12 bg-rose-100 rounded-xl flex items-center justify-center mb-3">
                      <span className="material-icons text-rose-600 text-2xl">emergency</span>
                    </div>
                    <p className="font-bold text-gray-900">24/7 Care</p>
                    <p className="text-sm text-gray-500 mt-1">Always available</p>
                  </div>
                </div>
              </div>

              {/* Floating Badge */}
              <div className="absolute -bottom-4 -left-4 bg-white rounded-2xl p-4 shadow-xl flex items-center gap-3 animate-fadeInUp animation-delay-500">
                <div className="flex -space-x-2">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-bold text-sm border-2 border-white">A</div>
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-white font-bold text-sm border-2 border-white">R</div>
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center text-white font-bold text-sm border-2 border-white">P</div>
                </div>
                <div>
                  <p className="font-bold text-gray-900">500+ Doctors</p>
                  <p className="text-xs text-gray-500">Ready to help</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="relative py-16 bg-white border-y border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-8">
            {stats.map((stat, index) => (
              <div 
                key={index}
                className="text-center p-6 rounded-2xl hover:bg-gray-50 transition-colors duration-300"
              >
                <div className="w-14 h-14 bg-gradient-to-br from-[#2b7ab9] to-[#4caf50] rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-[#2b7ab9]/20">
                  <span className="material-icons text-white text-2xl">{stat.icon}</span>
                </div>
                <p className="text-3xl lg:text-4xl font-extrabold text-gray-900 mb-1">{stat.value}</p>
                <p className="text-gray-500 font-medium">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 lg:py-28 bg-gradient-mesh">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Section Header */}
          <div className="text-center max-w-3xl mx-auto mb-16">
            <span className="inline-block px-4 py-1.5 bg-blue-100 text-blue-700 font-semibold rounded-full text-sm mb-4">
              Why Choose Us
            </span>
            <h2 className="text-3xl lg:text-4xl font-extrabold text-gray-900 mb-4">
              Everything You Need for Better Health
            </h2>
            <p className="text-lg text-gray-600">
              From booking appointments to managing your health records, we've got you covered with modern healthcare solutions.
            </p>
          </div>

          {/* Features Grid */}
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((feature, index) => (
              <div
                key={index}
                className="feature-card group bg-white rounded-2xl p-6 shadow-soft hover:shadow-xl hover:-translate-y-2 transition-all duration-300 border border-gray-100"
              >
                <div className={`feature-icon ${feature.bgColor} mb-5`}>
                  <div className={`w-full h-full rounded-xl bg-gradient-to-br ${feature.color} flex items-center justify-center`}>
                    <span className="material-icons text-white text-2xl">{feature.icon}</span>
                  </div>
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">{feature.title}</h3>
                <p className="text-gray-600">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section id="how-it-works" className="py-20 lg:py-28 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Section Header */}
          <div className="text-center max-w-3xl mx-auto mb-16">
            <span className="inline-block px-4 py-1.5 bg-emerald-100 text-emerald-700 font-semibold rounded-full text-sm mb-4">
              Getting Started
            </span>
            <h2 className="text-3xl lg:text-4xl font-extrabold text-gray-900 mb-4">
              Start Your Health Journey in 3 Simple Steps
            </h2>
            <p className="text-lg text-gray-600">
              Getting the care you need has never been easier. Follow these simple steps to connect with healthcare professionals.
            </p>
          </div>

          {/* Steps */}
          <div className="grid lg:grid-cols-3 gap-8 lg:gap-12">
            {steps.map((step, index) => (
              <div key={index} className="relative group">
                {/* Connector Line */}
                {index < steps.length - 1 && (
                  <div className="hidden lg:block absolute top-16 left-1/2 w-full h-0.5 bg-gradient-to-r from-[#2b7ab9]/30 via-[#4caf50]/30 to-transparent"></div>
                )}
                
                <div className="relative bg-gradient-to-br from-gray-50 to-white rounded-2xl p-8 border border-gray-100 hover:shadow-xl hover:-translate-y-2 transition-all duration-300">
                  {/* Step Number */}
                  <div className="absolute -top-4 left-6 bg-gradient-to-r from-[#2b7ab9] to-[#4caf50] text-white font-bold px-4 py-1 rounded-full text-sm">
                    Step {step.step}
                  </div>
                  
                  {/* Icon */}
                  <div className="w-16 h-16 bg-gradient-to-br from-[#2b7ab9] to-[#4caf50] rounded-2xl flex items-center justify-center mb-6 shadow-lg shadow-[#2b7ab9]/20 group-hover:scale-110 transition-transform duration-300">
                    <span className="material-icons text-white text-3xl">{step.icon}</span>
                  </div>
                  
                  <h3 className="text-xl font-bold text-gray-900 mb-3">{step.title}</h3>
                  <p className="text-gray-600">{step.description}</p>
                </div>
              </div>
            ))}
          </div>

          {/* CTA */}
          <div className="text-center mt-12">
            <Link
              to="/patient/register"
              className="inline-flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-[#2b7ab9] to-[#236394] text-white font-bold rounded-2xl shadow-xl shadow-[#2b7ab9]/25 hover:shadow-2xl hover:shadow-[#2b7ab9]/30 hover:-translate-y-1 transition-all duration-300 text-lg"
            >
              Get Started Now
              <span className="material-icons">arrow_forward</span>
            </Link>
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section id="testimonials" className="py-20 lg:py-28 bg-gradient-mesh">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Section Header */}
          <div className="text-center max-w-3xl mx-auto mb-16">
            <span className="inline-block px-4 py-1.5 bg-violet-100 text-violet-700 font-semibold rounded-full text-sm mb-4">
              Testimonials
            </span>
            <h2 className="text-3xl lg:text-4xl font-extrabold text-gray-900 mb-4">
              What Our Users Say
            </h2>
            <p className="text-lg text-gray-600">
              Don't just take our word for it — hear from patients and doctors who use AidocCall every day.
            </p>
          </div>

          {/* Testimonials Grid */}
          <div className="grid md:grid-cols-3 gap-6">
            {testimonials.map((testimonial, index) => (
              <div
                key={index}
                className="bg-white rounded-2xl p-6 shadow-soft hover:shadow-xl hover:-translate-y-2 transition-all duration-300 border border-gray-100"
              >
                {/* Stars */}
                <div className="flex gap-1 mb-4">
                  {[...Array(testimonial.rating)].map((_, i) => (
                    <span key={i} className="material-icons text-amber-400 text-lg">star</span>
                  ))}
                </div>
                
                {/* Content */}
                <p className="text-gray-700 mb-6 leading-relaxed">"{testimonial.content}"</p>
                
                {/* Author */}
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-gradient-to-br from-[#2b7ab9] to-[#4caf50] rounded-full flex items-center justify-center text-white font-bold">
                    {testimonial.avatar}
                  </div>
                  <div>
                    <p className="font-bold text-gray-900">{testimonial.name}</p>
                    <p className="text-sm text-gray-500">{testimonial.role}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* For Doctors Section */}
      <section id="for-doctors" className="py-20 lg:py-28 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <span className="inline-block px-4 py-1.5 bg-blue-100 text-blue-700 font-semibold rounded-full text-sm mb-4">
                For Healthcare Providers
              </span>
              <h2 className="text-3xl lg:text-4xl font-extrabold text-gray-900 mb-6">
                Grow Your Practice with AidocCall
              </h2>
              <p className="text-lg text-gray-600 mb-8">
                Join our network of healthcare professionals and expand your reach while providing exceptional patient care.
              </p>
              
              <div className="space-y-4 mb-8">
                {[
                  'Manage appointments and patient records efficiently',
                  'Conduct secure video consultations',
                  'Access comprehensive patient history',
                  'Grow your practice with new patient referrals',
                  'Streamlined billing and payments'
                ].map((item, index) => (
                  <div key={index} className="flex items-start gap-3">
                    <span className="material-icons text-[#4caf50] mt-0.5">check_circle</span>
                    <span className="text-gray-700">{item}</span>
                  </div>
                ))}
              </div>
              
              <Link
                to="/login"
                className="inline-flex items-center gap-2 px-6 py-3 bg-gray-900 text-white font-semibold rounded-xl hover:bg-gray-800 transition-all duration-300"
              >
                Doctor Login
                <span className="material-icons">arrow_forward</span>
              </Link>
            </div>
            
            {/* Stats Card */}
            <div className="bg-gradient-to-br from-[#2b7ab9] via-[#3498db] to-[#4caf50] rounded-3xl p-8 text-white shadow-2xl">
              <div className="grid grid-cols-2 gap-6">
                <div className="text-center p-4 bg-white/10 backdrop-blur-sm rounded-2xl">
                  <span className="material-icons text-4xl mb-2">groups</span>
                  <p className="text-3xl font-bold">500+</p>
                  <p className="text-blue-100 text-sm">Active Doctors</p>
                </div>
                <div className="text-center p-4 bg-white/10 backdrop-blur-sm rounded-2xl">
                  <span className="material-icons text-4xl mb-2">verified</span>
                  <p className="text-3xl font-bold">100%</p>
                  <p className="text-blue-100 text-sm">Verified Profiles</p>
                </div>
                <div className="text-center p-4 bg-white/10 backdrop-blur-sm rounded-2xl">
                  <span className="material-icons text-4xl mb-2">trending_up</span>
                  <p className="text-3xl font-bold">40%</p>
                  <p className="text-blue-100 text-sm">Avg. Growth</p>
                </div>
                <div className="text-center p-4 bg-white/10 backdrop-blur-sm rounded-2xl">
                  <span className="material-icons text-4xl mb-2">support_agent</span>
                  <p className="text-3xl font-bold">24/7</p>
                  <p className="text-blue-100 text-sm">Support</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 lg:py-28 bg-gradient-to-br from-[#2b7ab9] via-[#3498db] to-[#4caf50] relative overflow-hidden">
        {/* Background Pattern */}
        <div className="absolute inset-0 hero-grid opacity-10"></div>
        
        <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl lg:text-5xl font-extrabold text-white mb-6">
            Ready to Take Control of Your Health?
          </h2>
          <p className="text-xl text-blue-100 mb-10 max-w-2xl mx-auto">
            Join thousands of patients who trust AidocCall for their healthcare needs. Start your journey today.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              to="/patient/register"
              className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-white text-[#2b7ab9] font-bold rounded-2xl shadow-xl hover:shadow-2xl hover:-translate-y-1 transition-all duration-300 text-lg"
            >
              <span className="material-icons">person_add</span>
              Create Free Account
            </Link>
            <Link
              to="/emergency"
              className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-red-500 text-white font-bold rounded-2xl shadow-xl hover:bg-red-600 hover:-translate-y-1 transition-all duration-300 text-lg"
            >
              <span className="material-icons">emergency</span>
              Emergency Services
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-400 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-4 gap-8 mb-12">
            {/* Brand */}
            <div className="md:col-span-1">
              <div className="mb-4">
                <img 
                  src="/aidoccall-logo.png" 
                  alt="AidocCall" 
                  className="h-10 w-auto object-contain brightness-0 invert"
                />
              </div>
              <p className="text-gray-400 text-sm">
                Your trusted partner in digital healthcare. Connect with doctors, manage appointments, and access health records securely.
              </p>
            </div>

            {/* Quick Links */}
            <div>
              <h4 className="text-white font-bold mb-4">Quick Links</h4>
              <ul className="space-y-2 text-sm">
                <li><a href="#features" className="hover:text-white transition-colors">Features</a></li>
                <li><a href="#how-it-works" className="hover:text-white transition-colors">How It Works</a></li>
                <li><a href="#testimonials" className="hover:text-white transition-colors">Reviews</a></li>
                <li><a href="#for-doctors" className="hover:text-white transition-colors">For Doctors</a></li>
              </ul>
            </div>

            {/* Services */}
            <div>
              <h4 className="text-white font-bold mb-4">Services</h4>
              <ul className="space-y-2 text-sm">
                <li><Link to="/patient/register" className="hover:text-white transition-colors">Patient Registration</Link></li>
                <li><Link to="/login" className="hover:text-white transition-colors">Doctor Portal</Link></li>
                <li><Link to="/emergency" className="hover:text-white transition-colors">Emergency Services</Link></li>
                <li><a href="#" className="hover:text-white transition-colors">Video Consultation</a></li>
              </ul>
            </div>

            {/* Contact */}
            <div>
              <h4 className="text-white font-bold mb-4">Contact Us</h4>
              <ul className="space-y-2 text-sm">
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
              <p className="text-sm text-gray-500">
                &copy; 2026 AidocCall. All rights reserved.
              </p>
              <div className="flex gap-6 text-sm">
                <a href="#" className="hover:text-white transition-colors">Privacy Policy</a>
                <a href="#" className="hover:text-white transition-colors">Terms of Service</a>
                <a href="#" className="hover:text-white transition-colors">Cookie Policy</a>
              </div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
