import React, { useState, useEffect, useRef } from "react";
import { View, StyleSheet, Alert, Text, ActivityIndicator } from "react-native";
import * as Location from "expo-location";
import Mapbox from "@rnmapbox/maps";
import { Position } from "geojson";

const LONDON_LANDMARKS = [
    {
        id: "tower-of-london",
        title: "Tower of London",
        coordinate: [-0.0759, 51.5081] as Position,
    },
    {
        id: "tate-modern",
        title: "Tate Modern",
        coordinate: [-0.0995, 51.5076] as Position,
    },
    {
        id: "tower-bridge",
        title: "Tower Bridge",
        coordinate: [-0.0754, 51.5055] as Position,
    },
];

const INITIAL_CENTER_COORDINATE: Position = [-0.08, 51.507]; // Near center of landmarks

export default function Screen() {
    const [userLocation, setUserLocation] = useState<Position | null>(null);
    const [locationError, setLocationError] = useState<string | null>(null);
    const [isLoadingLocation, setIsLoadingLocation] = useState(true);
    const mapRef = useRef<Mapbox.MapView>(null);
    const cameraRef = useRef<Mapbox.Camera>(null);

    useEffect(() => {
        (async () => {
            console.log("Requesting location permissions...");
            const { status } =
                await Location.requestForegroundPermissionsAsync();
            console.log("Permission status:", status);

            if (status !== "granted") {
                setLocationError("Permission to access location was denied");
                setIsLoadingLocation(false);
                Alert.alert(
                    "Location Permission Denied",
                    "Please enable location services to see your current location on the map."
                );
                return;
            }

            try {
                console.log("Fetching current position...");
                const location = await Location.getCurrentPositionAsync({});
                const currentCoords: Position = [
                    location.coords.longitude,
                    location.coords.latitude,
                ];
                console.log("Location fetched:", currentCoords);
                setUserLocation(currentCoords);
                setLocationError(null);

                // Animate camera to user location
                if (cameraRef.current) {
                    cameraRef.current.setCamera({
                        centerCoordinate: currentCoords,
                        zoomLevel: 14,
                        animationDuration: 1500,
                    });
                }
            } catch (error) {
                console.error("Location fetching error:", error);
                setLocationError("Could not fetch location");
                Alert.alert(
                    "Location Error",
                    "Could not fetch your current location."
                );
            }
            setIsLoadingLocation(false);
        })();
    }, []);

    if (isLoadingLocation) {
        return (
            <View style={[styles.container, styles.centerContent]}>
                <ActivityIndicator size="large" />
                <Text style={styles.infoText}>Fetching your location...</Text>
            </View>
        );
    }

    if (locationError && !userLocation) {
        return (
            <View style={[styles.container, styles.centerContent]}>
                <Text style={styles.errorText}>Error: {locationError}</Text>
                <Text style={styles.infoText}>Showing default map view.</Text>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            {locationError && (
                <Text style={styles.errorOverlay}>{locationError}</Text>
            )}
            <Mapbox.MapView
                ref={mapRef}
                style={styles.map}
                styleURL={Mapbox.StyleURL.Street}
                logoEnabled={false}
                scaleBarEnabled={false}
            >
                <Mapbox.Camera
                    ref={cameraRef}
                    defaultSettings={{
                        centerCoordinate: INITIAL_CENTER_COORDINATE,
                        zoomLevel: 12,
                    }}
                />

                {userLocation && (
                    <Mapbox.PointAnnotation
                        id="userLocation"
                        coordinate={userLocation}
                        title="Your Location"
                    >
                        <View style={styles.userLocationDot} />
                    </Mapbox.PointAnnotation>
                )}

                {LONDON_LANDMARKS.map((landmark) => (
                    <Mapbox.PointAnnotation
                        key={landmark.id}
                        id={landmark.id}
                        coordinate={landmark.coordinate}
                        title={landmark.title}
                    >
                        <View style={styles.markerContainer}>
                            <View style={styles.markerPin} />
                        </View>
                    </Mapbox.PointAnnotation>
                ))}
            </Mapbox.MapView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    centerContent: {
        justifyContent: "center",
        alignItems: "center",
        padding: 20,
    },
    infoText: {
        marginTop: 10,
        fontSize: 16,
        color: "#666",
        textAlign: "center",
    },
    errorText: {
        color: "red",
        fontWeight: "bold",
        fontSize: 18,
        textAlign: "center",
        marginBottom: 10,
    },
    errorOverlay: {
        position: "absolute",
        top: 50,
        left: 10,
        right: 10,
        backgroundColor: "rgba(255, 0, 0, 0.7)",
        color: "white",
        padding: 10,
        borderRadius: 5,
        textAlign: "center",
        zIndex: 10,
        fontWeight: "bold",
    },
    map: {
        flex: 1,
    },
    userLocationDot: {
        width: 16,
        height: 16,
        borderRadius: 8,
        backgroundColor: "blue",
        borderWidth: 2,
        borderColor: "white",
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.3,
        shadowRadius: 1,
        elevation: 2,
    },
    markerContainer: {
        width: 30,
        height: 30,
        alignItems: "center",
        justifyContent: "center",
    },
    markerPin: {
        width: 10,
        height: 10,
        borderRadius: 5,
        backgroundColor: "red",
        borderWidth: 1,
        borderColor: "white",
    },
});
