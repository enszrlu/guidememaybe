import "dotenv/config";

export default {
    expo: {
        name: "guidememaybe",
        slug: "guidememaybe",
        version: "1.0.0",
        orientation: "portrait",
        icon: "./assets/images/icon.png",
        scheme: "myapp",
        userInterfaceStyle: "automatic",
        splash: {
            image: "./assets/images/splash.png",
            resizeMode: "contain",
            backgroundColor: "#ffffff",
        },
        extra: {
            mapboxToken: process.env.MAPBOX_TOKEN,
            mapboxStyleUrl: process.env.MAPBOX_STYLE_URL,
        },
        ios: {
            supportsTablet: true,
            bundleIdentifier: "com.anonymous.guidememaybe",
            infoPlist: {
                NSLocationWhenInUseUsageDescription:
                    "We use your location to show nearby touristic places on the map.",
                NSLocationAlwaysUsageDescription:
                    "We use your location to show nearby touristic places on the map.",
            },
        },
        android: {
            adaptiveIcon: {
                foregroundImage: "./assets/images/adaptive-icon.png",
                backgroundColor: "#ffffff",
            },
            permissions: [
                "ACCESS_FINE_LOCATION",
                "ACCESS_COARSE_LOCATION",
                "INTERNET",
            ],
            manifestPlaceholders: {
                MAPBOX_ACCESS_TOKEN: process.env.MAPBOX_TOKEN,
            },
        },

        // ✅ Add this line to enable Mapbox native module injection
        plugins: [
            [
                "@rnmapbox/maps",
                {
                    RNMapboxMapsImpl: "mapbox",
                    installComponents: false,
                },
            ],
            "expo-router",
        ],

        experiments: {
            typedRoutes: true,
        },
    },
};
