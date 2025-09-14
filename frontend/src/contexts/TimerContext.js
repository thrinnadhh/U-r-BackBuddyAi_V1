import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useNotifications } from './NotificationContext';
import axios from 'axios';

// Environment + API base (CRA exposes only REACT_APP_* to the browser)
const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || '';
const API = `${BACKEND_URL}/api`;

// Axios instance bound to API base
const http = axios.create({ baseURL: API });

const TimerContext = createContext(null);

export const useTimer = () => {
  const context = useContext(TimerContext);
  if (!context) {
    throw new Error('useTimer must be used within a TimerProvider');
  }
  return context;
};

export const TimerProvider = ({ children }) => {
  const [settings, setSettings] = useState({
    postureReminderInterval: 3,
    eyeExerciseInterval: 20,
    stretchReminderInterval: 60,
    workSessionLength: 25,
    notificationsEnabled: true,
    soundEnabled: true,
    workHours: { start: '09:00', end: '17:00' }
  });

  const [timers, setTimers] = useState({
    posture: { remaining: 3 * 60, isActive: false },
    eye: { remaining: 20 * 60, isActive: false },
    stretch: { remaining: 60 * 60, isActive: false },
    workSession: { remaining: 25 * 60, isActive: false }
  });

  const [stats, setStats] = useState({
    todayWorkTime: 0,
    todayBreaks: 0,
    todayPostureReminders: 0,
    todayEyeExercises: 0,
    todayStretches: 0,
    currentStreak: 0
  });

  const [currentSessionId, setCurrentSessionId] = useState(null);

  const { sendNotification } = useNotifications();

  // Load user settings and stats on mount
  useEffect(() => {
    loadUserSettings();
    loadDashboardStats();
    initializeOrGetTodaySession();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadUserSettings = async () => {
    try {
      const response = await http.get('/user/settings');
      if (response.data?.success) {
        const apiSettings = response.data.data;
        const formattedSettings = {
          postureReminderInterval: apiSettings.posture_reminder_interval,
          eyeExerciseInterval: apiSettings.eye_exercise_interval,
          stretchReminderInterval: apiSettings.stretch_reminder_interval,
          workSessionLength: apiSettings.work_session_length,
          notificationsEnabled: apiSettings.notifications_enabled,
          soundEnabled: apiSettings.sound_enabled,
          workHours: {
            start: apiSettings.work_hours_start,
            end: apiSettings.work_hours_end
          }
        };
        setSettings(formattedSettings);

        // Update timers with new intervals
        setTimers(prev => ({
          posture: { remaining: formattedSettings.postureReminderInterval * 60, isActive: prev.posture.isActive },
          eye: { remaining: formattedSettings.eyeExerciseInterval * 60, isActive: prev.eye.isActive },
          stretch: { remaining: formattedSettings.stretchReminderInterval * 60, isActive: prev.stretch.isActive },
          workSession: { remaining: formattedSettings.workSessionLength * 60, isActive: prev.workSession.isActive }
        }));
      }
    } catch (error) {
      console.error('Failed to load user settings:', error);
    }
  };

  const loadDashboardStats = async () => {
    try {
      const response = await http.get('/stats/dashboard');
      if (response.data?.success) {
        const apiStats = response.data.data;
        setStats({
          todayWorkTime: apiStats.today_work_time,
          todayBreaks: apiStats.today_breaks,
          todayPostureReminders: apiStats.today_posture_reminders,
          todayEyeExercises: apiStats.today_eye_exercises,
          todayStretches: apiStats.today_stretches,
          currentStreak: apiStats.current_streak
        });
        setCurrentSessionId(apiStats.active_session_id);
      }
    } catch (error) {
      console.error('Failed to load dashboard stats:', error);
    }
  };

  const initializeOrGetTodaySession = async () => {
    try {
      const response = await http.get('/sessions/today');
      if (response.data?.success) {
        setCurrentSessionId(response.data.data.id);
      }
    } catch (error) {
      console.error('Failed to get today session:', error);
    }
  };

  const logActivity = async (activityType) => {
    if (!currentSessionId) return;
    try {
      await http.post(`/sessions/${currentSessionId}/activity`, null, {
        params: { activity_type: activityType }
      });
      // Refresh stats after logging activity
      loadDashboardStats();
    } catch (error) {
      console.error(`Failed to log ${activityType}:`, error);
    }
  };

  // Handle timer completion
  const handleTimerComplete = useCallback(async (timerType) => {
    const messages = {
      posture: {
        title: 'Posture Check! 🚨',
        message: 'Time to check your posture. Sit up straight and align your shoulders!'
      },
      eye: {
        title: 'Eye Exercise Time! 👀',
        message: "You've been working for a while. Time for the 20-20-20 rule!"
      },
      stretch: {
        title: 'Stretch Break! 🤸‍♀️',
        message: 'Time to get up and stretch! Your body will thank you.'
      },
      workSession: {
        title: 'Work Session Complete! ✅',
        message: 'Great job! Take a well-deserved break.'
      }
    };

    if (messages[timerType]) {
      sendNotification(messages[timerType].title, messages[timerType].message, timerType);
      // Log the notification to backend
      try {
        await http.post('/notifications', {
          type: timerType,
          title: messages[timerType].title,
          message: messages[timerType].message
        });
      } catch (error) {
        console.error('Failed to log notification:', error);
      }

      // Log activity to session
      const activityMap = {
        posture: 'posture_reminder',
        eye: 'eye_exercise',
        stretch: 'stretch',
        workSession: 'break'
      };
      if (activityMap[timerType]) {
        await logActivity(activityMap[timerType]);
      }
    }
  }, [sendNotification, logActivity]);

  // Timer tick function
  const tick = useCallback(() => {
    setTimers(prevTimers => {
      const newTimers = { ...prevTimers };
      let shouldUpdate = false;

      Object.keys(newTimers).forEach(timerType => {
        const t = newTimers[timerType];
        if (t.isActive && t.remaining > 0) {
          t.remaining -= 1;
          shouldUpdate = true;

          // When a timer hits zero, notify and reset based on current settings
          if (t.remaining === 0) {
            // Fire and then reset interval according to fresh settings
            handleTimerComplete(timerType);
            switch (timerType) {
              case 'posture':
                t.remaining = settings.postureReminderInterval * 60;
                break;
              case 'eye':
                t.remaining = settings.eyeExerciseInterval * 60;
                break;
              case 'stretch':
                t.remaining = settings.stretchReminderInterval * 60;
                break;
              case 'workSession':
                t.remaining = settings.workSessionLength * 60;
                break;
              default:
                break;
            }
          }
        }
      });

      return shouldUpdate ? newTimers : prevTimers;
    });
  }, [settings, handleTimerComplete]);

  // Set up ticking
  useEffect(() => {
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, [tick]);

  // Timer controls
  const startTimer = (timerType) => {
    setTimers(prev => ({
      ...prev,
      [timerType]: { ...prev[timerType], isActive: true }
    }));
  };

  const pauseTimer = (timerType) => {
    setTimers(prev => ({
      ...prev,
      [timerType]: { ...prev[timerType], isActive: false }
    }));
  };

  const resetTimer = (timerType) => {
    const resetValues = {
      posture: settings.postureReminderInterval * 60,
      eye: settings.eyeExerciseInterval * 60,
      stretch: settings.stretchReminderInterval * 60,
      workSession: settings.workSessionLength * 60
    };

    setTimers(prev => ({
      ...prev,
      [timerType]: {
        remaining: resetValues[timerType],
        isActive: false
      }
    }));
  };

  const startAllTimers = () => {
    setTimers(prev => {
      const newTimers = { ...prev };
      Object.keys(newTimers).forEach(key => { newTimers[key].isActive = true; });
      return newTimers;
    });
  };

  const pauseAllTimers = () => {
    setTimers(prev => {
      const newTimers = { ...prev };
      Object.keys(newTimers).forEach(key => { newTimers[key].isActive = false; });
      return newTimers;
    });
  };

  const updateSettings = async (newSettings) => {
    try {
      // Convert frontend format to API format
      const apiSettings = {
        posture_reminder_interval: newSettings.postureReminderInterval,
        eye_exercise_interval: newSettings.eyeExerciseInterval,
        stretch_reminder_interval: newSettings.stretchReminderInterval,
        work_session_length: newSettings.workSessionLength,
        notifications_enabled: newSettings.notificationsEnabled,
        sound_enabled: newSettings.soundEnabled,
        work_hours_start: newSettings.workHours?.start,
        work_hours_end: newSettings.workHours?.end
      };

      const response = await http.put('/user/settings', apiSettings);

      if (response.data?.success) {
        setSettings(prev => ({ ...prev, ...newSettings }));

        // Update timer intervals if changed
        setTimers(prev => ({
          posture: {
            remaining: newSettings.postureReminderInterval ? newSettings.postureReminderInterval * 60 : prev.posture.remaining,
            isActive: prev.posture.isActive
          },
          eye: {
            remaining: newSettings.eyeExerciseInterval ? newSettings.eyeExerciseInterval * 60 : prev.eye.remaining,
            isActive: prev.eye.isActive
          },
          stretch: {
            remaining: newSettings.stretchReminderInterval ? newSettings.stretchReminderInterval * 60 : prev.stretch.remaining,
            isActive: prev.stretch.isActive
          },
          workSession: {
            remaining: newSettings.workSessionLength ? newSettings.workSessionLength * 60 : prev.workSession.remaining,
            isActive: prev.workSession.isActive
          }
        }));
      }
    } catch (error) {
      console.error('Failed to update settings:', error);
      // Still update local state as fallback
      setSettings(prev => ({ ...prev, ...newSettings }));
    }
  };

  // Format time display
  const formatTime = (seconds) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const value = {
    settings,
    timers,
    stats,
    startTimer,
    pauseTimer,
    resetTimer,
    startAllTimers,
    pauseAllTimers,
    updateSettings,
    formatTime
  };

  return (
    <TimerContext.Provider value={value}>
      {children}
    </TimerContext.Provider>
  );
};
