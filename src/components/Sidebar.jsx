import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

const Sidebar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [activeMenu, setActiveMenu] = useState('dashboard');

  const menuItems = [
    { id: 'telecallers', label: 'Telecallers', icon: '📞', path: '/dashboard/telecallers' },
    { id: 'performance', label: 'Performance', icon: '📊', path: '/dashboard/performance' },
    { id: 'call-logs', label: 'Call Logs', icon: '📋', path: '/dashboard/call-logs' },
    { id: 'schedules', label: 'Schedules', icon: '📅', path: '/dashboard/schedules' },
    { id: 'reports', label: 'Reports', icon: '📈', path: '/dashboard/reports' },
  ];

  const handleMenuClick = (item) => {
    setActiveMenu(item.id);
    navigate(item.path);
  };

  return (
    <div className="w-64 bg-white h-screen shadow-lg flex flex-col fixed left-0 top-0">
      {/* Logo */}
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-green-600 rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-xl">AC</span>
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-800">AidocCall</h1>
            <p className="text-xs text-gray-500">Medical Platform</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <div className="flex-1 overflow-y-auto py-4">
        {/* Home Section */}
        <div className="px-4 mb-6">
          <button
            onClick={() => handleMenuClick({ id: 'home', path: '/dashboard' })}
            className="w-full bg-blue-600 text-white px-4 py-3 rounded-lg flex items-center gap-3 hover:bg-blue-700 transition"
          >
            <span className="text-xl">🏠</span>
            <span className="font-semibold">Home</span>
          </button>
        </div>

        {/* Pages Section */}
        <div className="px-4 mb-6">
          <h3 className="text-xs font-semibold text-gray-500 uppercase mb-3 px-2">Pages</h3>
          <div className="space-y-1">
            {menuItems.map((item) => (
              <button
                key={item.id}
                onClick={() => handleMenuClick(item)}
                className={`w-full px-4 py-2.5 rounded-lg flex items-center justify-between hover:bg-gray-100 transition ${
                  activeMenu === item.id ? 'bg-blue-50 text-blue-600' : 'text-gray-700'
                }`}
              >
                <div className="flex items-center gap-3">
                  <span className="text-lg">{item.icon}</span>
                  <span className="font-medium text-sm">{item.label}</span>
                </div>
                <div className="flex items-center gap-2">
                  {item.badge && (
                    <span className="bg-red-500 text-white text-xs px-2 py-0.5 rounded-full font-semibold">
                      {item.badge}
                    </span>
                  )}
                  <span className="text-gray-400">›</span>
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Sidebar;
