"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const config = {
    appId: 'com.braveforms.app',
    appName: 'BrAve Forms',
    webDir: 'dist',
    bundledWebRuntime: false,
    server: {
        androidScheme: 'https',
        iosScheme: 'https',
        hostname: 'braveforms.app'
    },
    plugins: {
        SplashScreen: {
            launchShowDuration: 2000,
            launchAutoHide: true,
            backgroundColor: '#228BE6',
            androidSplashResourceName: 'splash',
            androidScaleType: 'CENTER_CROP',
            showSpinner: false,
            splashFullScreen: true,
            splashImmersive: true
        },
        PushNotifications: {
            presentationOptions: ['badge', 'sound', 'alert']
        },
        Camera: {
            saveToGallery: true
        },
        Geolocation: {
            permissions: {
                location: 'always'
            }
        },
        LocalNotifications: {
            smallIcon: 'ic_stat_icon_config_sample',
            iconColor: '#228BE6',
            sound: 'beep.wav'
        }
    },
    ios: {
        contentInset: 'automatic'
    },
    android: {
        minWebViewVersion: 60,
        allowMixedContent: false
    }
};
exports.default = config;
//# sourceMappingURL=capacitor.config.js.map