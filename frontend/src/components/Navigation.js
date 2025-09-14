import React from 'react';
import { NavLink } from 'react-router-dom';
import { Button } from './ui/button';
import { Card } from './ui/card';
import { Home, Settings, Dumbbell, Download, Shield } from 'lucide-react';

const Navigation = ({ isInstalled, onInstall }) => {
  const navItems = [
    {
      to: '/',
      icon: Home,
      label: 'Dashboard',
      description: 'Overview & Controls'
    },
    {
      to: '/exercises',
      icon: Dumbbell,
      label: 'Exercises',
      description: 'Guided Activities'
    },
    {
      to: '/settings',
      icon: Settings,
      label: 'Settings',
      description: 'Customize Timers'
    }
  ];

  return (
    <aside className="w-64 bg-white/80 backdrop-blur-sm border-r border-gray-200 p-4">
      <div className="flex flex-col h-full">
        {/* App Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center">
              <Shield className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="font-bold text-xl text-gray-900">HealthGuard</h1>
              <p className="text-sm text-gray-600">Productivity & Wellness</p>
            </div>
          </div>
          
          {/* Install Button */}
          {!isInstalled && onInstall && (
            <Button 
              onClick={onInstall}
              size="sm" 
              className="w-full mt-3 bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700"
            >
              <Download className="w-4 h-4 mr-2" />
              Install App
            </Button>
          )}
        </div>

        {/* Navigation */}
        <nav className="flex-1">
          <div className="space-y-2">
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  className={({ isActive }) =>
                    `block w-full text-left transition-all duration-200 ${
                      isActive ? 'scale-105' : 'hover:scale-105'
                    }`
                  }
                >
                  {({ isActive }) => (
                    <Card className={`p-4 cursor-pointer transition-all duration-200 ${
                      isActive 
                        ? 'bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200 shadow-md' 
                        : 'hover:bg-gray-50 hover:shadow-sm'
                    }`}>
                      <div className="flex items-center gap-3">
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                          isActive 
                            ? 'bg-gradient-to-br from-blue-500 to-indigo-600 text-white' 
                            : 'bg-gray-100 text-gray-600'
                        }`}>
                          <Icon className="w-4 h-4" />
                        </div>
                        <div>
                          <div className={`font-medium ${
                            isActive ? 'text-blue-900' : 'text-gray-900'
                          }`}>
                            {item.label}
                          </div>
                          <div className={`text-xs ${
                            isActive ? 'text-blue-700' : 'text-gray-500'
                          }`}>
                            {item.description}
                          </div>
                        </div>
                      </div>
                    </Card>
                  )}
                </NavLink>
              );
            })}
          </div>
        </nav>

        {/* Footer */}
        <div className="mt-8 pt-4 border-t border-gray-200">
          <p className="text-xs text-gray-500 text-center">
            Stay healthy, stay productive!
          </p>
        </div>
      </div>
    </aside>
  );
};

export default Navigation;