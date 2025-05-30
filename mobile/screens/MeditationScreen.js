import React, { useState, useEffect, useRef, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, SafeAreaView, AppState, Image } from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import Slider from '@react-native-community/slider';
import { Audio } from 'expo-av';
// import { useTheme } from '@react-navigation/native'; // If using theme

// Static colors for now, replace with theme if available
const STATIC_COLORS = {
  primary: '#6E3BFF', // A vibrant purple
  background: '#F0F2F5', // Light grey background
  card: '#FFFFFF', // White cards
  text: '#1A1A1A', // Dark grey for text
  subtext: '#595959', // Lighter grey for subtext
  accent: '#4CAF50', // Green for positive actions
  white: '#FFFFFF',
  lightBlue: '#E3F2FD',
  darkText: '#333333',
  grey: '#D3D3D3'
};

const getStyles = (colors) => StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
  },
  container: {
    flex: 1,
    paddingTop: 20, // Adjusted for back button
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 15,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: colors.grey,
  },
  backButton: {
    padding: 10,
    marginRight: 10,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: colors.primary,
  },
  scrollContainer: {
    padding: 20,
  },
  sessionCard: {
    backgroundColor: colors.card,
    borderRadius: 15,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 3,
  },
  sessionImage: {
    width: '100%',
    height: 180,
    borderRadius: 10,
    marginBottom: 15,
  },
  sessionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.darkText,
    marginBottom: 5,
  },
  sessionDescription: {
    fontSize: 15,
    color: colors.subtext,
    marginBottom: 15,
    lineHeight: 22,
  },
  playButton: {
    backgroundColor: colors.primary,
    paddingVertical: 12,
    borderRadius: 25,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
  },
  playButtonText: {
    color: colors.white,
    fontSize: 17,
    fontWeight: 'bold',
    marginLeft: 10,
  },
  playerContainer: {
    backgroundColor: colors.card,
    padding: 20,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 5,
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
  },
  playerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.darkText,
    textAlign: 'center',
    marginBottom: 10,
  },
  slider: {
    width: '100%',
    height: 40,
    marginBottom: 5,
  },
  timeContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 15,
  },
  timeText: {
    fontSize: 13,
    color: colors.subtext,
  },
  controls: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
  },
  controlButton: {
    padding: 10,
  },
});

const MEDITATION_SESSIONS = [
  {
    id: '1',
    title: 'Mindful Start (5 min)',
    description: 'Begin your day with calm and focus. This short meditation helps set a positive tone.',
    duration: 5 * 60, // seconds
    audioUrl: 'https://example.com/royalty-free-music/mindful-start-5min.mp3', // Replace with actual URL
    image: { uri: 'https://images.pexels.com/photos/3861958/pexels-photo-3861958.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=750&w=1260' }, // Replace with actual image URI
  },
  {
    id: '2',
    title: 'Stress Relief (10 min)',
    description: 'Release tension and find peace with this guided session for stress reduction.',
    duration: 10 * 60,
    audioUrl: 'https://example.com/royalty-free-music/stress-relief-10min.mp3', // Replace with actual URL
    image: { uri: 'https://images.pexels.com/photos/40568/meditation-lotus-yoga-relax-40568.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=750&w=1260' }, // Replace with actual image URI
  },
  {
    id: '3',
    title: 'Deep Sleep (15 min)',
    description: 'Prepare for a restful night with this calming meditation designed to promote deep sleep.',
    duration: 15 * 60,
    audioUrl: 'https://example.com/royalty-free-music/deep-sleep-15min.mp3', // Replace with actual URL
    image: { uri: 'https://images.pexels.com/photos/2247179/pexels-photo-2247179.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=750&w=1260' }, // Replace with actual image URI
  },
  {
    id: '4',
    title: 'Focus Boost (7 min)',
    description: 'Enhance your concentration for study or work with this guided meditation.',
    duration: 7 * 60,
    audioUrl: 'https://example.com/royalty-free-music/focus-boost-7min.mp3', // Replace with actual URL
    image: { uri: 'https://images.pexels.com/photos/3771089/pexels-photo-3771089.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=750&w=1260' }, // Replace with actual image URI
  },
  {
    id: '5',
    title: 'Walking Meditation (12 min)',
    description: 'Connect with your surroundings and find calm while walking.',
    duration: 12 * 60,
    audioUrl: 'https://example.com/royalty-free-music/walking-meditation-12min.mp3', // Replace with actual URL
    image: { uri: 'https://images.pexels.com/photos/1556706/pexels-photo-1556706.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=750&w=1260' }, // Replace with actual image URI
  },
];

const MeditationScreen = ({ navigation }) => {
  const colors = STATIC_COLORS;
  const styles = getStyles(colors);
  const [sound, setSound] = useState(null);
  const [currentSession, setCurrentSession] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackStatus, setPlaybackStatus] = useState(null);
  const soundRef = useRef(new Audio.Sound());

  useEffect(() => {
    Audio.setAudioModeAsync({
      allowsRecordingIOS: false,
      staysActiveInBackground: true,
      playsInSilentModeIOS: true,
      shouldDuckAndroid: true,
      playThroughEarpieceAndroid: false,
    });
    return () => {
      soundRef.current.unloadAsync();
    };
  }, []);

  // Handle AppState changes to pause/resume audio
  useEffect(() => {
    const handleAppStateChange = (nextAppState) => {
      if (nextAppState.match(/inactive|background/) && isPlaying && sound) {
         // Optionally pause, or let it play if staysActiveInBackground is true
      }
    };
    const subscription = AppState.addEventListener('change', handleAppStateChange);
    return () => {
      subscription.remove();
    };
  }, [isPlaying, sound]);

  const onPlaybackStatusUpdate = (status) => {
    if (status.isLoaded) {
      setPlaybackStatus(status);
      setIsPlaying(status.isPlaying);
      if (status.didJustFinish) {
        soundRef.current.setPositionAsync(0);
        setIsPlaying(false);
        // Optionally: play next, or reset UI
      }
    } else {
      if (status.error) {
        console.error(`FATAL PLAYER ERROR: ${status.error}`);
      }
    }
  };

  const playSession = async (session) => {
    if (currentSession && currentSession.id === session.id && sound) {
      // If same session is tapped, toggle play/pause
      if (isPlaying) {
        await soundRef.current.pauseAsync();
      } else {
        await soundRef.current.playAsync();
      }
      setIsPlaying(!isPlaying);
      return;
    }

    // New session or different session
    if (sound) {
      await soundRef.current.unloadAsync();
    }
    
    setCurrentSession(session);
    try {
      await soundRef.current.loadAsync(
        { uri: session.audioUrl }, 
        { shouldPlay: true }, 
        true
      );
      soundRef.current.setOnPlaybackStatusUpdate(onPlaybackStatusUpdate);
      setIsPlaying(true);
    } catch (e) {
      console.error('Error loading or playing audio: ', e);
      alert('Could not play audio. Please check the URL or network.')
      setCurrentSession(null);
    }
  };

  const handlePlayPause = async () => {
    if (!sound || !playbackStatus?.isLoaded) return;
    if (isPlaying) {
      await soundRef.current.pauseAsync();
    } else {
      await soundRef.current.playAsync();
    }
    setIsPlaying(!isPlaying);
  };

  const handleSeek = async (value) => {
    if (!sound || !playbackStatus?.isLoaded) return;
    try {
        await soundRef.current.setPositionAsync(value * playbackStatus.durationMillis);
    } catch (e) {
        console.error('Seek error', e);
    }
  };

  const formatMillis = (millis) => {
    if (!millis) return '0:00';
    const totalSeconds = Math.floor(millis / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back-outline" size={30} color={colors.primary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Meditation Sessions</Text>
      </View>
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        {MEDITATION_SESSIONS.map((session) => (
          <View key={session.id} style={styles.sessionCard}>
            <Image source={session.image} style={styles.sessionImage} />
            <Text style={styles.sessionTitle}>{session.title}</Text>
            <Text style={styles.sessionDescription}>{session.description}</Text>
            <TouchableOpacity style={styles.playButton} onPress={() => playSession(session)}>
              <Ionicons name={currentSession?.id === session.id && isPlaying ? "pause-circle-outline" : "play-circle-outline"} size={24} color={colors.white} />
              <Text style={styles.playButtonText}>
                {currentSession?.id === session.id && isPlaying ? 'Pause' : currentSession?.id === session.id ? 'Resume' : 'Play Session'}
              </Text>
            </TouchableOpacity>
          </View>
        ))}
      </ScrollView>

      {currentSession && playbackStatus && (
        <View style={styles.playerContainer}>
          <Text style={styles.playerTitle}>{currentSession.title}</Text>
          <Slider
            style={styles.slider}
            minimumValue={0}
            maximumValue={1}
            value={playbackStatus.durationMillis ? playbackStatus.positionMillis / playbackStatus.durationMillis : 0}
            minimumTrackTintColor={colors.primary}
            maximumTrackTintColor={colors.grey}
            thumbTintColor={colors.primary}
            onSlidingComplete={handleSeek}
            disabled={!playbackStatus.isLoaded}
          />
          <View style={styles.timeContainer}>
            <Text style={styles.timeText}>{formatMillis(playbackStatus.positionMillis)}</Text>
            <Text style={styles.timeText}>{formatMillis(playbackStatus.durationMillis)}</Text>
          </View>
          <View style={styles.controls}>
            <TouchableOpacity style={styles.controlButton} onPress={() => soundRef.current.replayAsync({shouldPlay: true})} disabled={!playbackStatus.isLoaded}> {/* Example: Replay from start */} 
                 <Ionicons name="play-skip-back-outline" size={30} color={!playbackStatus.isLoaded ? colors.grey : colors.primary} />
            </TouchableOpacity>
            <TouchableOpacity style={styles.controlButton} onPress={handlePlayPause} disabled={!playbackStatus.isLoaded}>
              <Ionicons name={isPlaying ? "pause-outline" : "play-outline"} size={40} color={!playbackStatus.isLoaded ? colors.grey : colors.primary} />
            </TouchableOpacity>
            <TouchableOpacity style={styles.controlButton} onPress={() => { /* TODO: Skip forward */}} disabled={!playbackStatus.isLoaded}>
                 <Ionicons name="play-skip-forward-outline" size={30} color={!playbackStatus.isLoaded ? colors.grey : colors.primary} />
            </TouchableOpacity>
          </View>
        </View>
      )}
    </SafeAreaView>
  );
};

export default MeditationScreen;
