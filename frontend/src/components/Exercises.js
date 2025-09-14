import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Progress } from './ui/progress';
import axios from 'axios';
import {
  Play,
  Pause,
  RotateCcw,
  CheckCircle,
  Clock,
  Eye,
  Users,
  Activity,
  ChevronRight
} from 'lucide-react';

// CRA: only REACT_APP_* vars are exposed to client code
const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || '';
const http = axios.create({ baseURL: `${BACKEND_URL}/api` });

const Exercises = () => {
  const [activeExercise, setActiveExercise] = useState(null);
  const [currentStep, setCurrentStep] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState(0);
  const [exercises, setExercises] = useState({ posture: [], eye: [], stretch: [] });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const { data } = await http.get('/exercises');
        setExercises(data?.data ?? { posture: [], eye: [], stretch: [] });
      } catch (e) {
        console.error('Failed to load exercises:', e);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  // Countdown effect with proper cleanup
  useEffect(() => {
    if (!activeExercise || !isPlaying || timeRemaining <= 0) return;
    const id = setInterval(() => {
      setTimeRemaining(prev => {
        if (prev <= 1) {
          clearInterval(id);
          completeExercise();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(id);
  }, [activeExercise, isPlaying, timeRemaining]);

  const startExercise = (exercise) => {
    setActiveExercise(exercise);
    setCurrentStep(0);
    setTimeRemaining(exercise?.duration || 0);
    setIsPlaying(false);
  };

  const togglePlay = () => {
    if (!activeExercise) return;
    setIsPlaying(p => !p);
  };

  const nextStep = () => {
    if (!activeExercise) return;
    const total = activeExercise.instructions?.length || 0;
    if (currentStep < total - 1) setCurrentStep(s => s + 1);
  };

  const prevStep = () => {
    if (currentStep > 0) setCurrentStep(s => s - 1);
  };

  const resetExercise = () => {
    setCurrentStep(0);
    setTimeRemaining(activeExercise?.duration || 0);
    setIsPlaying(false);
  };

  const completeExercise = () => {
    setActiveExercise(null);
    setCurrentStep(0);
    setIsPlaying(false);
    setTimeRemaining(0);
  };

  const categories = [
    {
      id: 'posture',
      title: 'Posture Exercises',
      description: 'Improve your sitting posture and reduce back strain',
      icon: Users,
      color: 'from-emerald-500 to-teal-600',
      bgColor: 'from-emerald-50 to-teal-50',
      exercises: exercises.posture || []
    },
    {
      id: 'eye',
      title: 'Eye Exercises',
      description: 'Reduce eye strain and maintain healthy vision',
      icon: Eye,
      color: 'from-blue-500 to-cyan-600',
      bgColor: 'from-blue-50 to-cyan-50',
      exercises: exercises.eye || []
    },
    {
      id: 'stretch',
      title: 'Stretching Exercises',
      description: 'Full body stretches to stay flexible and energized',
      icon: Activity,
      color: 'from-purple-500 to-pink-600',
      bgColor: 'from-purple-50 to-pink-50',
      exercises: exercises.stretch || []
    }
  ];

  // Player view
  if (activeExercise) {
    const totalSteps = activeExercise.instructions?.length || 0;
    const progress = totalSteps > 0 ? ((currentStep + 1) / totalSteps) * 100 : 0;

    return (
      <div className="p-6 max-w-4xl mx-auto">
        <div className="mb-6">
          <Button onClick={() => setActiveExercise(null)} variant="outline" size="sm">
            ← Back to Exercises
          </Button>
        </div>

        <Card className="bg-gradient-to-br from-blue-50 to-indigo-100">
          <CardHeader>
            <CardTitle className="text-2xl text-blue-900">{activeExercise.name}</CardTitle>
            <CardDescription className="text-blue-700">
              {activeExercise.description}
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-6">
            {/* Progress */}
            <div>
              <div className="flex justify-between text-sm text-blue-700 mb-2">
                <span>Step {Math.min(currentStep + 1, totalSteps)} of {totalSteps}</span>
                <span>{timeRemaining}s remaining</span>
              </div>
              <Progress value={progress} className="h-3" />
            </div>

            {/* Current Instruction */}
            <Card className="bg-white/80 backdrop-blur-sm">
              <CardContent className="p-6">
                <div className="text-center">
                  <div className="text-6xl mb-4">
                    {currentStep === 0 && '🧘‍♀️'}
                    {currentStep === 1 && '💪'}
                    {currentStep === 2 && '🤸‍♀️'}
                    {currentStep >= 3 && '✨'}
                  </div>
                  <h3 className="text-xl font-semibold mb-4 text-gray-900">
                    {activeExercise.instructions?.[currentStep] || 'Follow the next step'}
                  </h3>
                </div>
              </CardContent>
            </Card>

            {/* Controls */}
            <div className="flex justify-center gap-4">
              <Button onClick={prevStep} disabled={currentStep === 0} variant="outline">
                Previous
              </Button>

              <Button
                onClick={togglePlay}
                className="bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700"
              >
                {isPlaying ? (
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

              <Button onClick={resetExercise} variant="outline">
                <RotateCcw className="w-4 h-4 mr-2" />
                Reset
              </Button>

              {currentStep === totalSteps - 1 ? (
                <Button
                  onClick={completeExercise}
                  className="bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700"
                >
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Complete
                </Button>
              ) : (
                <Button onClick={nextStep} variant="outline">
                  Next
                </Button>
              )}
            </div>

            {/* All Steps Preview */}
            <Card className="bg-white/60 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="text-lg">Exercise Steps</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {(activeExercise.instructions || []).map((instruction, index) => (
                    <div
                      key={index}
                      className={`flex items-center gap-3 p-3 rounded-lg transition-all ${
                        index === currentStep
                          ? 'bg-blue-100 border-2 border-blue-300'
                          : index < currentStep
                            ? 'bg-green-50 border border-green-200'
                            : 'bg-gray-50 border border-gray-200'
                      }`}
                    >
                      <div
                        className={`w-6 h-6 rounded-full flex items-center justify-center text-sm font-medium ${
                          index === currentStep
                            ? 'bg-blue-500 text-white'
                            : index < currentStep
                              ? 'bg-green-500 text-white'
                              : 'bg-gray-300 text-gray-600'
                        }`}
                      >
                        {index < currentStep ? <CheckCircle className="w-4 h-4" /> : index + 1}
                      </div>
                      <span className={`flex-1 ${index === currentStep ? 'font-medium text-blue-900' : 'text-gray-700'}`}>
                        {instruction}
                      </span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Main grid
  return (
    <div className="p-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Exercise Library</h1>
        <p className="text-gray-600">Guided exercises to keep healthy and productive</p>
      </div>

      {loading ? (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading exercises...</p>
        </div>
      ) : (
        <>
          {/* Categories */}
          <div className="space-y-8">
            {categories.map((category) => {
              const Icon = category.icon;

              return (
                <Card key={category.id} className={`bg-gradient-to-br ${category.bgColor}`}>
                  <CardHeader>
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${category.color} flex items-center justify-center`}>
                        <Icon className="w-6 h-6 text-white" />
                      </div>
                      <div>
                        <CardTitle className="text-xl">{category.title}</CardTitle>
                        <CardDescription>{category.description}</CardDescription>
                      </div>
                    </div>
                  </CardHeader>

                  <CardContent>
                    {category.exercises.length === 0 ? (
                      <div className="text-center py-8 text-gray-500">
                        No exercises available in this category
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {category.exercises.map((exercise) => (
                          <Card
                            key={exercise.id}
                            className="bg-white/80 backdrop-blur-sm hover:bg-white/90 transition-all cursor-pointer"
                          >
                            <CardContent className="p-4">
                              <div className="flex items-start justify-between mb-3">
                                <div className="flex-1">
                                  <h3 className="font-semibold text-gray-900 mb-1">{exercise.name}</h3>
                                  <p className="text-sm text-gray-600 mb-2">{exercise.description}</p>
                                  <div className="flex items-center gap-4 text-xs text-gray-500">
                                    <div className="flex items-center gap-1">
                                      <Clock className="w-3 h-3" />
                                      {exercise.duration}s
                                    </div>
                                    <div className="flex items-center gap-1">
                                      <Users className="w-3 h-3" />
                                      {(exercise.instructions || []).length} steps
                                    </div>
                                  </div>
                                </div>
                                <Badge variant="secondary" className="ml-2">{category.id}</Badge>
                              </div>

                              <Button
                                onClick={() => startExercise(exercise)}
                                size="sm"
                                className={`w-full bg-gradient-to-r ${category.color} hover:shadow-md`}
                              >
                                <Play className="w-4 h-4 mr-2" />
                                Start Exercise
                                <ChevronRight className="w-4 h-4 ml-2" />
                              </Button>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {/* Quick Tips */}
          <Card className="mt-8 bg-gradient-to-r from-amber-50 to-orange-50 border-amber-200">
            <CardHeader>
              <CardTitle className="text-amber-800">💡 Exercise Tips</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm text-amber-700">
                <li>• Take breaks every 20-30 minutes to prevent strain</li>
                <li>• Follow the 20-20-20 rule: Every 20 minutes, look at something 20 feet away for 20 seconds</li>
                <li>• Maintain good posture: Keep feet flat on the floor and shoulders relaxed</li>
                <li>• Stay hydrated and do gentle stretches throughout the day</li>
              </ul>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
};

export default Exercises;
