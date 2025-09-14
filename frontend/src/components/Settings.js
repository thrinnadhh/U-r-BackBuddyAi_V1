import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Switch } from './ui/switch';
import { Slider } from './ui/slider';
import { useTimer } from '../contexts/TimerContext';
import { useNotifications } from '../contexts/NotificationContext';
import { useToast } from '../hooks/use-toast';
import { 
  Settings2, 
  Clock, 
  Bell, 
  Volume2, 
  Save,
  Eye,
  Users,
  Activity
} from 'lucide-react';

const Settings = () => {
  const { settings, updateSettings } = useTimer();
  const { permissionStatus, requestNotificationPermission } = useNotifications();
  const { toast } = useToast();
  
  const [localSettings, setLocalSettings] = useState(settings);

  const handleSave = () => {
    updateSettings(localSettings);
    toast({
      title: "Settings saved!",
      description: "Your preferences have been updated successfully.",
    });
  };

  const handleReset = () => {
    const defaultSettings = {
      postureReminderInterval: 3,
      eyeExerciseInterval: 20,
      stretchReminderInterval: 60,
      workSessionLength: 25,
      notificationsEnabled: true,
      soundEnabled: true,
      workHours: {
        start: "09:00",
        end: "17:00"
      }
    };
    setLocalSettings(defaultSettings);
    updateSettings(defaultSettings);
    toast({
      title: "Settings reset!",
      description: "All settings have been restored to defaults.",
    });
  };

  const settingsSections = [
    {
      title: "Timer Intervals",
      description: "Customize how often you receive different types of reminders",
      icon: Clock,
      items: [
        {
          key: 'postureReminderInterval',
          label: 'Posture Check Interval',
          description: 'How often to remind you to check your posture',
          min: 1,
          max: 15,
          unit: 'minutes',
          icon: Users,
          color: 'text-emerald-600'
        },
        {
          key: 'eyeExerciseInterval',
          label: 'Eye Exercise Interval',
          description: 'Frequency of eye exercise reminders (20-20-20 rule)',
          min: 10,
          max: 60,
          unit: 'minutes',
          icon: Eye,
          color: 'text-blue-600'
        },
        {
          key: 'stretchReminderInterval',
          label: 'Stretch Break Interval',
          description: 'How often to remind you to stretch and move',
          min: 30,
          max: 120,
          unit: 'minutes',
          icon: Activity,
          color: 'text-purple-600'
        },
        {
          key: 'workSessionLength',
          label: 'Work Session Length',
          description: 'Duration of focused work periods',
          min: 15,
          max: 60,
          unit: 'minutes',
          icon: Clock,
          color: 'text-orange-600'
        }
      ]
    }
  ];

  return (
    <div className="p-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 bg-gradient-to-br from-gray-600 to-gray-800 rounded-xl flex items-center justify-center">
            <Settings2 className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Settings</h1>
            <p className="text-gray-600">Customize your health and productivity preferences</p>
          </div>
        </div>
      </div>

      <div className="space-y-8">
        {/* Notifications Section */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <Bell className="w-5 h-5 text-blue-600" />
              <div>
                <CardTitle>Notifications</CardTitle>
                <CardDescription>Manage how you receive health reminders</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Browser Notifications */}
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <Label className="text-base font-medium">Browser Notifications</Label>
                <p className="text-sm text-gray-600">
                  {permissionStatus === 'granted' 
                    ? 'Notifications are enabled' 
                    : 'Enable to receive desktop notifications'}
                </p>
              </div>
              <div className="flex items-center gap-2">
                {permissionStatus !== 'granted' && (
                  <Button 
                    onClick={requestNotificationPermission}
                    size="sm"
                    variant="outline"
                  >
                    Enable
                  </Button>
                )}
                <Switch 
                  checked={localSettings.notificationsEnabled && permissionStatus === 'granted'}
                  onCheckedChange={(checked) => 
                    setLocalSettings(prev => ({ ...prev, notificationsEnabled: checked }))
                  }
                  disabled={permissionStatus !== 'granted'}
                />
              </div>
            </div>

            {/* Sound Alerts */}
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <Label className="text-base font-medium">Sound Alerts</Label>
                <p className="text-sm text-gray-600">Play sound with notifications</p>
              </div>
              <div className="flex items-center gap-2">
                <Volume2 className="w-4 h-4 text-gray-400" />
                <Switch 
                  checked={localSettings.soundEnabled}
                  onCheckedChange={(checked) => 
                    setLocalSettings(prev => ({ ...prev, soundEnabled: checked }))
                  }
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Timer Settings */}
        {settingsSections.map((section) => {
          const SectionIcon = section.icon;
          return (
            <Card key={section.title}>
              <CardHeader>
                <div className="flex items-center gap-3">
                  <SectionIcon className="w-5 h-5 text-blue-600" />
                  <div>
                    <CardTitle>{section.title}</CardTitle>
                    <CardDescription>{section.description}</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-8">
                {section.items.map((item) => {
                  const ItemIcon = item.icon;
                  return (
                    <div key={item.key} className="space-y-4">
                      <div className="flex items-center gap-3">
                        <ItemIcon className={`w-5 h-5 ${item.color}`} />
                        <div className="flex-1">
                          <Label className="text-base font-medium">{item.label}</Label>
                          <p className="text-sm text-gray-600 mt-1">{item.description}</p>
                        </div>
                        <div className="text-right">
                          <span className="text-lg font-semibold">{localSettings[item.key]}</span>
                          <span className="text-sm text-gray-500 ml-1">{item.unit}</span>
                        </div>
                      </div>
                      
                      <div className="px-6">
                        <Slider
                          value={[localSettings[item.key]]}
                          onValueChange={(value) => 
                            setLocalSettings(prev => ({ ...prev, [item.key]: value[0] }))
                          }
                          min={item.min}
                          max={item.max}
                          step={1}
                          className="w-full"
                        />
                        <div className="flex justify-between text-xs text-gray-400 mt-2">
                          <span>{item.min} {item.unit}</span>
                          <span>{item.max} {item.unit}</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </CardContent>
            </Card>
          );
        })}

        {/* Work Hours */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <Clock className="w-5 h-5 text-blue-600" />
              <div>
                <CardTitle>Work Hours</CardTitle>
                <CardDescription>Set your typical work schedule for better tracking</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="start-time">Start Time</Label>
                <Input
                  id="start-time"
                  type="time"
                  value={localSettings.workHours.start}
                  onChange={(e) => 
                    setLocalSettings(prev => ({
                      ...prev,
                      workHours: { ...prev.workHours, start: e.target.value }
                    }))
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="end-time">End Time</Label>
                <Input
                  id="end-time"
                  type="time"
                  value={localSettings.workHours.end}
                  onChange={(e) => 
                    setLocalSettings(prev => ({
                      ...prev,
                      workHours: { ...prev.workHours, end: e.target.value }
                    }))
                  }
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Action Buttons */}
        <div className="flex justify-between">
          <Button 
            onClick={handleReset}
            variant="outline"
            className="px-6"
          >
            Reset to Defaults
          </Button>
          
          <Button 
            onClick={handleSave}
            className="px-8 bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700"
          >
            <Save className="w-4 h-4 mr-2" />
            Save Settings
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Settings;