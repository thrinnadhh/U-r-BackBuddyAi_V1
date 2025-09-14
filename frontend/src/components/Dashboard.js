import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Progress } from './ui/progress';
import { useTimer } from '../contexts/TimerContext';
import { useNotifications } from '../contexts/NotificationContext';
import { 
  Play, 
  Pause, 
  RotateCcw, 
  Eye, 
  Users, 
  Clock, 
  Activity,
  Bell,
  CheckCircle,
  AlertTriangle
} from 'lucide-react';

const Dashboard = () => {
  const { timers, stats, startTimer, pauseTimer, resetTimer, startAllTimers, pauseAllTimers, formatTime } = useTimer();
  const { notifications, permissionStatus, requestNotificationPermission } = useNotifications();
  const [masterActive, setMasterActive] = useState(false);

  const handleMasterToggle = () => {
    if (masterActive) {
      pauseAllTimers();
      setMasterActive(false);
    } else {
      if (permissionStatus !== 'granted') {
        requestNotificationPermission();
      }
      startAllTimers();
      setMasterActive(true);
    }
  };

  const timerCards = [
    {
      id: 'posture',
      title: 'Posture Check',
      description: 'Maintain good posture',
      icon: Users,
      color: 'from-emerald-500 to-teal-600',
      bgColor: 'from-emerald-50 to-teal-50',
      textColor: 'text-emerald-700'
    },
    {
      id: 'eye',
      title: 'Eye Exercise',
      description: '20-20-20 rule reminder',
      icon: Eye,
      color: 'from-blue-500 to-cyan-600',
      bgColor: 'from-blue-50 to-cyan-50',
      textColor: 'text-blue-700'
    },
    {
      id: 'stretch',
      title: 'Stretch Break',
      description: 'Full body stretching',
      icon: Activity,
      color: 'from-purple-500 to-pink-600',
      bgColor: 'from-purple-50 to-pink-50',
      textColor: 'text-purple-700'
    },
    {
      id: 'workSession',
      title: 'Work Session',
      description: 'Focused work period',
      icon: Clock,
      color: 'from-orange-500 to-red-600',
      bgColor: 'from-orange-50 to-red-50',
      textColor: 'text-orange-700'
    }
  ];

  const getProgressPercentage = (timerId, timer) => {
    const maxTimes = {
      posture: 3 * 60, // 3 minutes default
      eye: 20 * 60, // 20 minutes default
      stretch: 60 * 60, // 60 minutes default
      workSession: 25 * 60 // 25 minutes default
    };
    return ((maxTimes[timerId] - timer.remaining) / maxTimes[timerId]) * 100;
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Health Dashboard</h1>
            <p className="text-gray-600">Monitor your productivity and wellness in real-time</p>
          </div>
          
          {/* Master Control */}
          <div className="flex items-center gap-4">
            {permissionStatus !== 'granted' && (
              <Button 
                onClick={requestNotificationPermission}
                variant="outline"
                size="sm"
                className="text-amber-600 border-amber-200 hover:bg-amber-50"
              >
                <Bell className="w-4 h-4 mr-2" />
                Enable Notifications
              </Button>
            )}
            
            <Button 
              onClick={handleMasterToggle}
              size="lg"
              className={`px-6 ${
                masterActive 
                  ? 'bg-gradient-to-r from-red-500 to-pink-600 hover:from-red-600 hover:to-pink-700' 
                  : 'bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700'
              }`}
            >
              {masterActive ? (
                <>
                  <Pause className="w-5 h-5 mr-2" />
                  Pause All
                </>
              ) : (
                <>
                  <Play className="w-5 h-5 mr-2" />
                  Start All
                </>
              )}
            </Button>
          </div>
        </div>

        {/* Notification Status */}
        {permissionStatus === 'granted' ? (
          <div className="flex items-center gap-2 text-sm text-green-700 bg-green-50 px-3 py-2 rounded-lg w-fit">
            <CheckCircle className="w-4 h-4" />
            Notifications enabled - You'll receive health reminders
          </div>
        ) : (
          <div className="flex items-center gap-2 text-sm text-amber-700 bg-amber-50 px-3 py-2 rounded-lg w-fit">
            <AlertTriangle className="w-4 h-4" />
            Enable notifications to receive health reminders
          </div>
        )}
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <Card className="bg-gradient-to-br from-blue-50 to-indigo-100 border-blue-200">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-blue-700">Today's Work Time</p>
                <p className="text-2xl font-bold text-blue-900">{stats.todayWorkTime}min</p>
              </div>
              <Clock className="w-8 h-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-50 to-emerald-100 border-green-200">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-green-700">Breaks Taken</p>
                <p className="text-2xl font-bold text-green-900">{stats.todayBreaks}</p>
              </div>
              <Activity className="w-8 h-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-50 to-pink-100 border-purple-200">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-purple-700">Posture Checks</p>
                <p className="text-2xl font-bold text-purple-900">{stats.todayPostureReminders}</p>
              </div>
              <Users className="w-8 h-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-orange-50 to-red-100 border-orange-200">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-orange-700">Current Streak</p>
                <p className="text-2xl font-bold text-orange-900">{stats.currentStreak} days</p>
              </div>
              <CheckCircle className="w-8 h-8 text-orange-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Timer Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        {timerCards.map((card) => {
          const timer = timers[card.id];
          const Icon = card.icon;
          const progress = getProgressPercentage(card.id, timer);
          
          return (
            <Card key={card.id} className={`bg-gradient-to-br ${card.bgColor} border-opacity-50 hover:shadow-lg transition-all duration-300`}>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${card.color} flex items-center justify-center`}>
                      <Icon className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <CardTitle className={`${card.textColor} text-lg`}>{card.title}</CardTitle>
                      <CardDescription className="text-sm">{card.description}</CardDescription>
                    </div>
                  </div>
                  <Badge variant={timer.isActive ? "default" : "secondary"}>
                    {timer.isActive ? "Active" : "Paused"}
                  </Badge>
                </div>
              </CardHeader>
              
              <CardContent>
                <div className="space-y-4">
                  <div className="text-center">
                    <div className={`text-3xl font-bold ${card.textColor} mb-2`}>
                      {formatTime(timer.remaining)}
                    </div>
                    <Progress value={progress} className="h-2 mb-4" />
                  </div>
                  
                  <div className="flex gap-2">
                    <Button
                      onClick={() => timer.isActive ? pauseTimer(card.id) : startTimer(card.id)}
                      size="sm"
                      className={`flex-1 ${timer.isActive ? 'bg-gray-500 hover:bg-gray-600' : `bg-gradient-to-r ${card.color} hover:shadow-md`}`}
                    >
                      {timer.isActive ? (
                        <>
                          <Pause className="w-4 h-4 mr-2" />
                          Pause
                        </>
                      ) : (
                        <>
                          <Play className="w-4 h-4 mr-2" />
                          Start
                        </>
                      )}
                    </Button>
                    
                    <Button
                      onClick={() => resetTimer(card.id)}
                      size="sm"
                      variant="outline"
                      className="px-3"
                    >
                      <RotateCcw className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Recent Notifications */}
      {notifications.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bell className="w-5 h-5" />
              Recent Notifications
            </CardTitle>
            <CardDescription>Your latest health and productivity reminders</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {notifications.slice(0, 3).map((notification) => (
                <div key={notification.id} className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                  <div className={`w-2 h-2 rounded-full mt-2 ${
                    notification.type === 'posture' ? 'bg-emerald-500' :
                    notification.type === 'eye' ? 'bg-blue-500' :
                    notification.type === 'stretch' ? 'bg-purple-500' : 'bg-orange-500'
                  }`} />
                  <div className="flex-1">
                    <p className="font-medium text-sm">{notification.title}</p>
                    <p className="text-gray-600 text-sm">{notification.message}</p>
                    <p className="text-xs text-gray-400 mt-1">
                      {notification.timestamp.toLocaleTimeString()}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default Dashboard;