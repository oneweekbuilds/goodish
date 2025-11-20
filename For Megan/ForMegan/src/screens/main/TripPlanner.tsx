import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Alert,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import DateTimePicker from '@react-native-community/datetimepicker';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { Ionicons } from '@expo/vector-icons';
import { Card } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { useAppStore } from '../../stores/appStore';
import { Trip, ThemeName } from '../../types';
import { COLORS, SPACING, TYPOGRAPHY, BORDER_RADIUS } from '../../constants/theme';

interface PlaceResult {
  place_id: string;
  description: string;
  structured_formatting: {
    main_text: string;
    secondary_text: string;
  };
}

interface TravelTimeResult {
  duration: number; // in minutes
  distance: string;
  confidence: 'high' | 'medium' | 'low';
  trafficCondition: 'light' | 'moderate' | 'heavy';
}

export const TripPlanner: React.FC = () => {
  const { user, routines, addTrip, setCurrentTrip } = useAppStore();
  const [destination, setDestination] = useState('');
  const [arrivalTime, setArrivalTime] = useState(new Date());
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [travelMode, setTravelMode] = useState<'driving' | 'transit' | 'walking'>('driving');
  const [bufferTime, setBufferTime] = useState(10);
  const [placeSuggestions, setPlaceSuggestions] = useState<PlaceResult[]>([]);
  const [selectedPlace, setSelectedPlace] = useState<PlaceResult | null>(null);
  const [travelTime, setTravelTime] = useState<TravelTimeResult | null>(null);
  const [loading, setLoading] = useState(false);

  const theme: ThemeName = user?.preferences?.theme || 'sunrise-vibes';
  const colors = COLORS[theme];
  
  const activeRoutine = routines.find(r => r.isDefault) || routines[0];

  // Mock place suggestions (in real app, would use Google Places API)
  const mockPlaceSearch = (query: string): PlaceResult[] => {
    if (query.length < 3) return [];
    
    return [
      {
        place_id: '1',
        description: `${query} Office Building, Downtown`,
        structured_formatting: {
          main_text: `${query} Office Building`,
          secondary_text: 'Downtown, Business District',
        },
      },
      {
        place_id: '2', 
        description: `${query} Shopping Center, Mall Area`,
        structured_formatting: {
          main_text: `${query} Shopping Center`,
          secondary_text: 'Mall Area, Shopping District',
        },
      },
      {
        place_id: '3',
        description: `${query} Cafe, City Center`,
        structured_formatting: {
          main_text: `${query} Cafe`,
          secondary_text: 'City Center, Coffee District',
        },
      },
    ];
  };

  // Mock travel time calculation
  const calculateTravelTime = async (place: PlaceResult): Promise<TravelTimeResult> => {
    setLoading(true);
    
    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    const baseDuration = travelMode === 'driving' ? 25 : travelMode === 'transit' ? 35 : 45;
    const randomVariation = Math.random() * 10 - 5; // -5 to +5 minutes
    const duration = Math.max(5, Math.round(baseDuration + randomVariation));
    
    setLoading(false);
    
    return {
      duration,
      distance: travelMode === 'walking' ? '1.2 mi' : '8.5 mi',
      confidence: Math.random() > 0.3 ? 'high' : 'medium',
      trafficCondition: Math.random() > 0.5 ? 'light' : 'moderate',
    };
  };

  const handleDestinationChange = (text: string) => {
    setDestination(text);
    setSelectedPlace(null);
    setTravelTime(null);
    
    if (text.length >= 3) {
      const suggestions = mockPlaceSearch(text);
      setPlaceSuggestions(suggestions);
    } else {
      setPlaceSuggestions([]);
    }
  };

  const selectPlace = async (place: PlaceResult) => {
    setSelectedPlace(place);
    setDestination(place.description);
    setPlaceSuggestions([]);
    
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    
    const result = await calculateTravelTime(place);
    setTravelTime(result);
  };

  const calculateDepartureTime = (): Date => {
    if (!travelTime || !activeRoutine) return arrivalTime;
    
    const totalTimeNeeded = activeRoutine.estimatedDuration + travelTime.duration + bufferTime;
    const departureTime = new Date(arrivalTime.getTime() - totalTimeNeeded * 60000);
    
    return departureTime;
  };

  const saveTripPlan = () => {
    if (!selectedPlace || !travelTime || !activeRoutine) {
      Alert.alert('Incomplete Information', 'Please select a destination and wait for travel time calculation');
      return;
    }

    const departureTime = calculateDepartureTime();
    
    const newTrip: Trip = {
      id: `trip-${Date.now()}`,
      destination: {
        name: selectedPlace.structured_formatting.main_text,
        address: selectedPlace.description,
        placeId: selectedPlace.place_id,
        coordinates: {
          latitude: 37.7749, // Mock coordinates
          longitude: -122.4194,
        },
      },
      arrivalTime,
      departureTime,
      routineId: activeRoutine.id,
      travelMode,
      bufferTime,
      createdAt: new Date(),
    };

    addTrip(newTrip);
    setCurrentTrip(newTrip);
    
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    Alert.alert(
      'Trip Planned! ✈️',
      `Your morning routine is set! Wake up by ${departureTime.toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit'
      })} to arrive on time.`,
      [{ text: 'Perfect!', onPress: () => {
        setDestination('');
        setSelectedPlace(null);
        setTravelTime(null);
      }}]
    );
  };

  const getTravelModeIcon = (mode: typeof travelMode) => {
    switch (mode) {
      case 'driving': return 'car';
      case 'transit': return 'bus';
      case 'walking': return 'walk';
      default: return 'car';
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <LinearGradient
        colors={[colors.background, `${colors.primary}10`]}
        style={styles.gradientBackground}
      >
        <View style={styles.header}>
          <Text style={[styles.title, { color: colors.text }]}>
            Plan Your Trip
          </Text>
          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
            Never be late again with smart departure timing
          </Text>
        </View>

        <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
          {/* Destination Input */}
          <Card theme={theme} variant="glass" style={styles.inputCard}>
            <Text style={[styles.inputLabel, { color: colors.text }]}>
              Where are you going?
            </Text>
            <View style={styles.searchContainer}>
              <Ionicons name="search" size={20} color={colors.textSecondary} />
              <TextInput
                style={[styles.searchInput, { color: colors.text }]}
                value={destination}
                onChangeText={handleDestinationChange}
                placeholder="Search for a place..."
                placeholderTextColor={colors.textSecondary}
              />
            </View>
            
            {placeSuggestions.length > 0 && (
              <View style={styles.suggestions}>
                {placeSuggestions.map((place) => (
                  <TouchableOpacity
                    key={place.place_id}
                    style={[styles.suggestion, { borderColor: `${colors.primary}20` }]}
                    onPress={() => selectPlace(place)}
                  >
                    <Ionicons name="location" size={16} color={colors.primary} />
                    <View style={styles.suggestionText}>
                      <Text style={[styles.suggestionMain, { color: colors.text }]}>
                        {place.structured_formatting.main_text}
                      </Text>
                      <Text style={[styles.suggestionSecondary, { color: colors.textSecondary }]}>
                        {place.structured_formatting.secondary_text}
                      </Text>
                    </View>
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </Card>

          {/* Arrival Time */}
          <Card theme={theme} variant="glass" style={styles.inputCard}>
            <Text style={[styles.inputLabel, { color: colors.text }]}>
              What time do you need to arrive?
            </Text>
            <TouchableOpacity
              style={[styles.timeButton, { borderColor: colors.primary }]}
              onPress={() => setShowTimePicker(true)}
            >
              <Ionicons name="time" size={20} color={colors.primary} />
              <Text style={[styles.timeText, { color: colors.text }]}>
                {arrivalTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </Text>
            </TouchableOpacity>

            {showTimePicker && (
              <DateTimePicker
                value={arrivalTime}
                mode="time"
                is24Hour={false}
                display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                onChange={(event, selectedTime) => {
                  setShowTimePicker(Platform.OS === 'ios');
                  if (selectedTime) setArrivalTime(selectedTime);
                }}
              />
            )}
          </Card>

          {/* Travel Mode */}
          <Card theme={theme} variant="glass" style={styles.inputCard}>
            <Text style={[styles.inputLabel, { color: colors.text }]}>
              How are you traveling?
            </Text>
            <View style={styles.travelModes}>
              {(['driving', 'transit', 'walking'] as const).map((mode) => (
                <TouchableOpacity
                  key={mode}
                  style={[
                    styles.travelModeButton,
                    {
                      backgroundColor: travelMode === mode ? colors.primary : 'transparent',
                      borderColor: colors.primary,
                    },
                  ]}
                  onPress={() => {
                    setTravelMode(mode);
                    if (selectedPlace) {
                      calculateTravelTime(selectedPlace).then(setTravelTime);
                    }
                  }}
                >
                  <Ionicons
                    name={getTravelModeIcon(mode)}
                    size={20}
                    color={travelMode === mode ? '#FFFFFF' : colors.primary}
                  />
                  <Text
                    style={[
                      styles.travelModeText,
                      {
                        color: travelMode === mode ? '#FFFFFF' : colors.primary,
                      },
                    ]}
                  >
                    {mode.charAt(0).toUpperCase() + mode.slice(1)}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </Card>

          {/* Travel Time Results */}
          {travelTime && (
            <Card theme={theme} variant="glass" style={styles.resultsCard}>
              <View style={styles.resultsHeader}>
                <Text style={[styles.inputLabel, { color: colors.text }]}>
                  Trip Overview
                </Text>
                {loading && (
                  <Text style={[styles.loadingText, { color: colors.textSecondary }]}>
                    Calculating...
                  </Text>
                )}
              </View>

              <View style={styles.timelineContainer}>
                <View style={styles.timelineItem}>
                  <View style={[styles.timelineDot, { backgroundColor: colors.success }]} />
                  <Text style={[styles.timelineLabel, { color: colors.textSecondary }]}>
                    Start routine
                  </Text>
                  <Text style={[styles.timelineTime, { color: colors.text }]}>
                    {calculateDepartureTime().toLocaleTimeString([], {
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </Text>
                </View>

                <View style={styles.timelineItem}>
                  <View style={[styles.timelineDot, { backgroundColor: colors.primary }]} />
                  <Text style={[styles.timelineLabel, { color: colors.textSecondary }]}>
                    Leave home
                  </Text>
                  <Text style={[styles.timelineTime, { color: colors.text }]}>
                    {new Date(calculateDepartureTime().getTime() + (activeRoutine?.estimatedDuration || 0) * 60000)
                      .toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </Text>
                </View>

                <View style={styles.timelineItem}>
                  <View style={[styles.timelineDot, { backgroundColor: colors.warning }]} />
                  <Text style={[styles.timelineLabel, { color: colors.textSecondary }]}>
                    Arrive
                  </Text>
                  <Text style={[styles.timelineTime, { color: colors.text }]}>
                    {arrivalTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </Text>
                </View>
              </View>

              <View style={styles.tripStats}>
                <View style={styles.statItem}>
                  <Text style={[styles.statLabel, { color: colors.textSecondary }]}>
                    Travel Time
                  </Text>
                  <Text style={[styles.statValue, { color: colors.text }]}>
                    {travelTime.duration} min
                  </Text>
                </View>
                <View style={styles.statItem}>
                  <Text style={[styles.statLabel, { color: colors.textSecondary }]}>
                    Distance
                  </Text>
                  <Text style={[styles.statValue, { color: colors.text }]}>
                    {travelTime.distance}
                  </Text>
                </View>
                <View style={styles.statItem}>
                  <Text style={[styles.statLabel, { color: colors.textSecondary }]}>
                    Buffer Time
                  </Text>
                  <Text style={[styles.statValue, { color: colors.text }]}>
                    {bufferTime} min
                  </Text>
                </View>
              </View>
            </Card>
          )}

          <View style={styles.bottomPadding} />
        </ScrollView>

        {/* Save Button */}
        {travelTime && (
          <View style={styles.footer}>
            <Button
              title="Save Trip Plan"
              onPress={saveTripPlan}
              theme={theme}
              style={styles.saveButton}
            />
          </View>
        )}
      </LinearGradient>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  gradientBackground: {
    flex: 1,
  },
  header: {
    padding: SPACING.md,
    paddingBottom: SPACING.sm,
  },
  title: {
    ...TYPOGRAPHY.h1,
  },
  subtitle: {
    ...TYPOGRAPHY.body2,
    marginTop: SPACING.xs,
  },
  scrollView: {
    flex: 1,
  },
  inputCard: {
    margin: SPACING.md,
    marginBottom: SPACING.sm,
  },
  inputLabel: {
    ...TYPOGRAPHY.body1,
    fontWeight: '600',
    marginBottom: SPACING.sm,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: BORDER_RADIUS.sm,
    padding: SPACING.sm,
  },
  searchInput: {
    ...TYPOGRAPHY.body1,
    flex: 1,
    marginLeft: SPACING.sm,
  },
  suggestions: {
    marginTop: SPACING.sm,
  },
  suggestion: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: SPACING.sm,
    borderBottomWidth: 1,
  },
  suggestionText: {
    marginLeft: SPACING.sm,
    flex: 1,
  },
  suggestionMain: {
    ...TYPOGRAPHY.body2,
    fontWeight: '600',
  },
  suggestionSecondary: {
    ...TYPOGRAPHY.caption,
  },
  timeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: BORDER_RADIUS.sm,
    padding: SPACING.md,
  },
  timeText: {
    ...TYPOGRAPHY.body1,
    marginLeft: SPACING.sm,
  },
  travelModes: {
    flexDirection: 'row',
    gap: SPACING.sm,
  },
  travelModeButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderRadius: BORDER_RADIUS.sm,
    padding: SPACING.md,
    gap: SPACING.xs,
  },
  travelModeText: {
    ...TYPOGRAPHY.caption,
    fontWeight: '600',
  },
  resultsCard: {
    margin: SPACING.md,
  },
  resultsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  loadingText: {
    ...TYPOGRAPHY.caption,
    fontStyle: 'italic',
  },
  timelineContainer: {
    marginBottom: SPACING.lg,
  },
  timelineItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  timelineDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: SPACING.md,
  },
  timelineLabel: {
    ...TYPOGRAPHY.body2,
    flex: 1,
  },
  timelineTime: {
    ...TYPOGRAPHY.body2,
    fontWeight: '600',
  },
  tripStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
    paddingTop: SPACING.md,
  },
  statItem: {
    alignItems: 'center',
  },
  statLabel: {
    ...TYPOGRAPHY.caption,
    marginBottom: SPACING.xs,
  },
  statValue: {
    ...TYPOGRAPHY.body1,
    fontWeight: '600',
  },
  bottomPadding: {
    height: 100,
  },
  footer: {
    padding: SPACING.md,
    paddingTop: SPACING.sm,
  },
  saveButton: {
    width: '100%',
  },
});