import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { GoogleMap, useLoadScript, Marker } from '@react-google-maps/api';

const libraries = ['places'];

const EmergencyLocation = () => {
  const navigate = useNavigate();
  const [showModal, setShowModal] = useState(true);
  const [locationGranted, setLocationGranted] = useState(false);
  const [userLocation, setUserLocation] = useState(null);
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');
  const [pincode, setPincode] = useState('');
  const [mobile, setMobile] = useState('');

  // Load Google Maps API
  const { isLoaded, loadError } = useLoadScript({
    googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY || '',
    libraries,
  });

  // Default center (India)
  const defaultCenter = {
    lat: 20.5937,
    lng: 78.9629
  };

  const mapContainerStyle = {
    width: '100%',
    height: '100%'
  };

  const handleAllowLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          setUserLocation({ lat: latitude, lng: longitude });
          setLocationGranted(true);
          setShowModal(false);

          // Reverse geocode using Google Geocoding API
          reverseGeocode(latitude, longitude);
        },
        (error) => {
          console.error('Error getting location:', error);
          alert('Unable to get your location. Please enter manually.');
          setShowModal(false);
        }
      );
    } else {
      alert('Geolocation is not supported by your browser');
      setShowModal(false);
    }
  };

  const reverseGeocode = async (lat, lng) => {
    const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
    if (!apiKey) {
      setAddress(`${lat.toFixed(4)}, ${lng.toFixed(4)}`);
      return;
    }

    try {
      const response = await fetch(
        `https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lng}&key=${apiKey}`
      );
      const data = await response.json();

      if (data.results && data.results[0]) {
        const result = data.results[0];
        setAddress(result.formatted_address);

        // Extract city and pincode from address components
        result.address_components.forEach(component => {
          if (component.types.includes('locality')) {
            setCity(component.long_name);
          }
          if (component.types.includes('postal_code')) {
            setPincode(component.long_name);
          }
        });
      }
    } catch (error) {
      console.error('Geocoding error:', error);
      setAddress(`${lat.toFixed(4)}, ${lng.toFixed(4)}`);
    }
  };

  // Handle marker drag
  const handleMarkerDragEnd = (e) => {
    const newLat = e.latLng.lat();
    const newLng = e.latLng.lng();

    setUserLocation({ lat: newLat, lng: newLng });
    reverseGeocode(newLat, newLng);
  };

  // Handle map click
  const handleMapClick = (e) => {
    const newLat = e.latLng.lat();
    const newLng = e.latLng.lng();

    setUserLocation({ lat: newLat, lng: newLng });
    setLocationGranted(true);
    reverseGeocode(newLat, newLng);
  };

  const handleDeny = () => {
    setShowModal(false);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    // Handle form submission
    console.log({ address, city, pincode, mobile, location: userLocation });
    alert('Emergency request submitted!');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50">
      {/* Header */}
      <header className="bg-gradient-to-r from-blue-700 via-blue-800 to-blue-900 shadow-2xl sticky top-0 z-40">
        <div className="container mx-auto px-6 py-5">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-white flex items-center gap-2">
                <span className="text-3xl">🚨</span>
                Raftaar Help Emergency Seva
              </h1>
              <p className="text-blue-200 text-sm mt-1">Real-Time Emergency Response System</p>
            </div>
            <div className="hidden md:flex items-center gap-4">
              <div className="text-white text-sm">
                <span className="font-semibold">Emergency Hotline:</span> 112
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Location Permission Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fadeIn">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-8 transform animate-scaleIn">
            <div className="text-center mb-6">
              <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-5xl">📍</span>
              </div>
              <h2 className="text-2xl font-bold text-gray-800 mb-3">
                Allow Location Access
              </h2>
              <p className="text-gray-600">
                We need your location to confirm the emergency. Please allow access for better assistance.
              </p>
            </div>
            <div className="space-y-3">
              <button
                onClick={handleAllowLocation}
                className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-semibold py-4 rounded-xl transition transform hover:scale-105 shadow-lg"
              >
                Allow Location
              </button>
              <button
                onClick={handleDeny}
                className="w-full bg-gray-200 hover:bg-gray-300 text-gray-700 font-semibold py-4 rounded-xl transition"
              >
                Deny
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Map Section */}
      <div className="relative h-96 md:h-[500px] shadow-2xl overflow-hidden">
        {loadError && (
          <div className="absolute inset-0 flex items-center justify-center bg-red-50">
            <div className="text-center">
              <div className="text-6xl mb-4">⚠️</div>
              <p className="text-red-600 font-semibold text-lg">Error loading maps</p>
              <p className="text-red-500 text-sm mt-2">Please check your internet connection</p>
            </div>
          </div>
        )}

        {!isLoaded && !loadError && (
          <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-blue-100 to-blue-200">
            <div className="text-center">
              <div className="animate-spin text-6xl mb-4">🗺️</div>
              <p className="text-blue-800 font-semibold text-lg">Loading maps...</p>
            </div>
          </div>
        )}

        {isLoaded && (
          <GoogleMap
            mapContainerStyle={mapContainerStyle}
            center={userLocation || defaultCenter}
            zoom={userLocation ? 15 : 5}
            onClick={handleMapClick}
            options={{
              zoomControl: true,
              streetViewControl: false,
              mapTypeControl: false,
              fullscreenControl: true,
              styles: [
                {
                  featureType: 'poi',
                  elementType: 'labels',
                  stylers: [{ visibility: 'on' }],
                },
              ],
            }}
          >
            {userLocation && (
              <Marker
                position={userLocation}
                draggable={true}
                onDragEnd={handleMarkerDragEnd}
                icon={{
                  url: 'http://maps.google.com/mapfiles/ms/icons/red-dot.png',
                  scaledSize: new window.google.maps.Size(50, 50),
                }}
                animation={window.google.maps.Animation.DROP}
                title="Drag to change location"
              />
            )}
          </GoogleMap>
        )}

        {locationGranted && userLocation && (
          <div className="absolute top-4 right-4 bg-white/95 backdrop-blur-md px-5 py-3 rounded-xl shadow-2xl z-10 border border-blue-100">
            <p className="text-xs text-blue-600 font-semibold mb-1">📍 Your Location</p>
            <p className="text-xs text-gray-500">
              {userLocation.lat.toFixed(4)}, {userLocation.lng.toFixed(4)}
            </p>
          </div>
        )}

        {!locationGranted && !showModal && (
          <div className="absolute top-4 left-1/2 transform -translate-x-1/2 bg-yellow-100 border border-yellow-300 px-5 py-3 rounded-xl shadow-lg z-10">
            <p className="text-sm text-yellow-800 font-semibold">⚠️ Location access required for better service</p>
          </div>
        )}

        {locationGranted && (
          <div className="absolute bottom-4 left-4 bg-blue-600 text-white px-4 py-3 rounded-xl shadow-lg z-10 text-sm max-w-xs">
            <p className="font-semibold mb-1">💡 Quick Tip:</p>
            <p className="text-xs">Drag the red marker or click anywhere on the map to adjust your location</p>
          </div>
        )}
      </div>

      {/* Form Section */}
      <div className="container mx-auto px-6 py-12">
        <div className="max-w-2xl mx-auto">
          {/* Info Cards */}
          <div className="grid md:grid-cols-3 gap-4 mb-8">
            <div className="bg-gradient-to-br from-red-500 to-red-600 text-white p-4 rounded-xl shadow-lg text-center">
              <div className="text-3xl mb-2">🚑</div>
              <p className="font-semibold">Medical</p>
              <p className="text-xs mt-1 opacity-90">Ambulance Services</p>
            </div>
            <div className="bg-gradient-to-br from-orange-500 to-orange-600 text-white p-4 rounded-xl shadow-lg text-center">
              <div className="text-3xl mb-2">🚒</div>
              <p className="font-semibold">Fire Brigade</p>
              <p className="text-xs mt-1 opacity-90">Fire Emergency</p>
            </div>
            <div className="bg-gradient-to-br from-blue-500 to-blue-600 text-white p-4 rounded-xl shadow-lg text-center">
              <div className="text-3xl mb-2">👮</div>
              <p className="font-semibold">Police</p>
              <p className="text-xs mt-1 opacity-90">Security Services</p>
            </div>
          </div>

          {/* Form Card */}
          <div className="bg-white rounded-2xl shadow-2xl p-8 md:p-10 border border-gray-100">
            <div className="flex items-center gap-3 mb-8">
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                <span className="text-2xl">📋</span>
              </div>
              <h2 className="text-3xl font-bold text-gray-800">
                Confirm Your Emergency Location
              </h2>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Address */}
              <div className="group">
                <label className="block text-gray-700 font-semibold mb-2 flex items-center gap-2">
                  <span className="text-lg">🏠</span>
                  Address
                </label>
                <input
                  type="text"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="Enter your full address"
                  className="w-full px-5 py-4 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition bg-gray-50 focus:bg-white"
                  required
                />
              </div>

              {/* City and Pincode Row */}
              <div className="grid md:grid-cols-2 gap-6">
                {/* City */}
                <div className="group">
                  <label className="block text-gray-700 font-semibold mb-2 flex items-center gap-2">
                    <span className="text-lg">🏙️</span>
                    City
                  </label>
                  <input
                    type="text"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    placeholder="Enter your city"
                    className="w-full px-5 py-4 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition bg-gray-50 focus:bg-white"
                    required
                  />
                </div>

                {/* Pincode */}
                <div className="group">
                  <label className="block text-gray-700 font-semibold mb-2 flex items-center gap-2">
                    <span className="text-lg">📮</span>
                    Pincode
                  </label>
                  <input
                    type="text"
                    value={pincode}
                    onChange={(e) => setPincode(e.target.value)}
                    placeholder="Enter pincode"
                    maxLength="6"
                    className="w-full px-5 py-4 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition bg-gray-50 focus:bg-white"
                    required
                  />
                </div>
              </div>

              {/* Mobile Number */}
              <div className="group">
                <label className="block text-gray-700 font-semibold mb-2 flex items-center gap-2">
                  <span className="text-lg">📱</span>
                  Mobile Number
                </label>
                <input
                  type="tel"
                  value={mobile}
                  onChange={(e) => setMobile(e.target.value)}
                  placeholder="Enter your mobile number"
                  maxLength="10"
                  className="w-full px-5 py-4 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition bg-gray-50 focus:bg-white"
                  required
                />
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-bold py-5 rounded-xl text-lg transition transform hover:scale-105 shadow-2xl hover:shadow-3xl flex items-center justify-center gap-3"
              >
                <span className="text-2xl">🚨</span>
                Submit Emergency Request
              </button>
            </form>

            {/* Trust Indicators */}
            <div className="mt-8 pt-6 border-t border-gray-200">
              <div className="flex items-center justify-center gap-8 text-sm text-gray-600">
                <div className="flex items-center gap-2">
                  <span className="text-green-500 text-xl">✓</span>
                  <span>Secure & Private</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-green-500 text-xl">✓</span>
                  <span>24/7 Available</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-green-500 text-xl">✓</span>
                  <span>Fast Response</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-gradient-to-r from-blue-800 via-blue-900 to-blue-950 py-8 mt-16 shadow-2xl">
        <div className="container mx-auto px-6 text-center">
          <div className="mb-4">
            <h3 className="text-white font-bold text-lg mb-2">Emergency Contacts</h3>
            <div className="flex justify-center gap-8 text-blue-200 text-sm">
              <span>Police: 100</span>
              <span>Fire: 101</span>
              <span>Ambulance: 102</span>
              <span>All: 112</span>
            </div>
          </div>
          <div className="border-t border-blue-700 pt-4">
            <p className="text-blue-300">&copy; Dmnhospadsahares. All rights reserved.</p>
            <p className="text-blue-400 text-sm mt-2">Your safety is our priority</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default EmergencyLocation;
