import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.braveforms.construction',
  appName: 'BrAve Forms',
  webDir: 'dist',
  bundledWebRuntime: false,
  server: {
    androidScheme: 'https',
    iosScheme: 'capacitor',
    // Enable for PWA support
    url: process.env.NODE_ENV === 'development' ? 'http://localhost:5173' : undefined,
    cleartext: false
  },
  plugins: {
    // Splash screen optimized for construction branding
    SplashScreen: {
      launchShowDuration: 2500,
      launchAutoHide: true,
      backgroundColor: '#0ea5e9', // Updated brand color
      androidSplashResourceName: 'splash',
      androidScaleType: 'CENTER_CROP',
      showSpinner: true,
      spinnerColor: '#ffffff',
      splashFullScreen: true,
      splashImmersive: true
    },
    
    // Camera optimized for construction documentation
    Camera: {
      quality: 85, // Balance quality vs file size
      allowEditing: false,
      resultType: 'uri',
      saveToGallery: true, // Keep copies for backup
      correctOrientation: true,
      presentationStyle: 'fullscreen',
      promptLabelHeader: 'Construction Documentation',
      promptLabelCancel: 'Cancel',
      promptLabelPhoto: 'From Gallery',
      promptLabelPicture: 'Take Photo'
    },
    
    // GPS with high accuracy for construction sites
    Geolocation: {
      enableHighAccuracy: true,
      timeout: 30000, // 30 seconds for construction site GPS
      maximumAge: 300000, // 5 minutes cache
      permissions: {
        location: 'always'
      }
    },
    
    // Push notifications for EPA compliance alerts
    PushNotifications: {
      presentationOptions: ['badge', 'sound', 'alert'],
      iconColor: '#0ea5e9'
    },
    
    // Local notifications for weather alerts
    LocalNotifications: {
      smallIcon: 'ic_notification',
      iconColor: '#0ea5e9',
      sound: 'weather_alert.wav',
      vibration: true
    },
    
    // Network monitoring for construction sites
    Network: {
      // No specific config needed - uses defaults
    },
    
    // File system for offline capability
    Filesystem: {
      // No specific config needed - uses defaults
    },
    
    // Device info for construction optimization
    Device: {
      // No specific config needed - uses defaults
    },
    
    // App state for battery optimization
    App: {
      // No specific config needed - uses defaults
    },
    
    // Keyboard handling for forms
    Keyboard: {
      resize: 'ionic', // Better form handling
      style: 'light',
      resizeOnFullScreen: true
    },
    
    // Haptic feedback for construction gloves
    Haptics: {
      // No specific config needed - uses defaults
    },
    
    // Status bar for construction visibility
    StatusBar: {
      style: 'dark',
      backgroundColor: '#0ea5e9'
    }
  },
  
  // iOS specific optimizations
  ios: {
    contentInset: 'automatic',
    backgroundColor: '#0ea5e9',
    // Handle iPhone notches properly
    limitsNavigationsChanges: true,
    // Optimize for construction site use
    allowsLinkPreview: false,
    handleApplicationNotifications: true,
    // Privacy settings for construction data
    privacyDescriptions: {
      NSLocationAlwaysAndWhenInUseUsageDescription: 'BrAve Forms needs location access to tag inspection photos with GPS coordinates for EPA compliance.',
      NSLocationWhenInUseUsageDescription: 'BrAve Forms needs location access to tag inspection photos with GPS coordinates.',
      NSCameraUsageDescription: 'BrAve Forms needs camera access to document construction site conditions for compliance inspections.',
      NSPhotoLibraryUsageDescription: 'BrAve Forms needs photo library access to attach existing photos to inspection reports.',
      NSMicrophoneUsageDescription: 'BrAve Forms needs microphone access for voice notes during inspections.'
    }
  },
  
  // Android specific optimizations
  android: {
    minWebViewVersion: 70, // Minimum for modern features
    allowMixedContent: false,
    backgroundColor: '#0ea5e9',
    // Handle keyboard properly for forms
    windowSoftInputMode: 'adjustResize',
    // Optimize for construction tablets
    screenOrientation: 'portrait',
    // Network security for construction site WiFi
    usesCleartextTraffic: false,
    // Permissions for construction features
    permissions: [
      'android.permission.CAMERA',
      'android.permission.ACCESS_FINE_LOCATION',
      'android.permission.ACCESS_COARSE_LOCATION',
      'android.permission.WRITE_EXTERNAL_STORAGE',
      'android.permission.READ_EXTERNAL_STORAGE',
      'android.permission.ACCESS_NETWORK_STATE',
      'android.permission.ACCESS_WIFI_STATE',
      'android.permission.VIBRATE',
      'android.permission.WAKE_LOCK'
    ]
  }
};

export default config;