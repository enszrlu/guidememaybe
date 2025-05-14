import React, { useState, useEffect } from "react";
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    Image,
    Dimensions,
    ActivityIndicator,
    TouchableOpacity,
} from "react-native";
import { useLocalSearchParams, Stack } from "expo-router";
import { Audio } from "expo-av";
import { Button } from "~/components/ui/button";
import { Play, Pause, ArrowLeft } from "lucide-react-native";
import { useRouter } from "expo-router";

interface LocationData {
    id: string;
    name: string;
    coordinate: [number, number];
    categories: string[];
    address?: string;
    imageUrls?: string[];
    openingHours?: string;
    description?: string;
    shortDescription?: string;
    contact?: {
        phone?: string;
        website?: string;
        email?: string;
    };
}

export default function LocationDetails() {
    const params = useLocalSearchParams();
    const [sound, setSound] = useState<Audio.Sound | null>(null);
    const [isPlaying, setIsPlaying] = useState(false);
    const [activeTab, setActiveTab] = useState("about");
    const router = useRouter();
    const [currentImageIndex, setCurrentImageIndex] = useState(0);

    // Parse the location data from params
    const locationData: LocationData = {
        id: params.id as string,
        name: params.name as string,
        coordinate: JSON.parse(
            (params.coordinate as string) || "[-0.08, 51.507]"
        ),
        categories: JSON.parse((params.categories as string) || "[]"),
        address: params.address as string,
        imageUrls: JSON.parse((params.imageUrls as string) || "[]"),
        openingHours: params.openingHours as string,
        description: params.description as string,
        shortDescription: params.shortDescription as string,
        contact: {
            phone: params.phone as string,
            website: params.website as string,
            email: params.email as string,
        },
    };

    useEffect(() => {
        return sound
            ? () => {
                  sound.unloadAsync();
              }
            : undefined;
    }, [sound]);

    const playAudioGuide = async () => {
        // This will be implemented when we have audio guides
        console.log("Audio guide functionality coming soon");
    };

    const getCategoryEmoji = (categories: string[] = []): string => {
        const categoryString = categories.join(" ").toLowerCase();
        if (
            categoryString.includes("museum") ||
            categoryString.includes("gallery")
        )
            return "🏛️";
        if (
            categoryString.includes("church") ||
            categoryString.includes("worship") ||
            categoryString.includes("cathedral")
        )
            return "⛪";
        if (
            categoryString.includes("park") ||
            categoryString.includes("garden")
        )
            return "🌳";
        if (
            categoryString.includes("theatre") ||
            categoryString.includes("theater") ||
            categoryString.includes("cinema")
        )
            return "🎭";
        if (
            categoryString.includes("castle") ||
            categoryString.includes("palace")
        )
            return "🏰";
        if (
            categoryString.includes("monument") ||
            categoryString.includes("memorial")
        )
            return "🗿";
        if (
            categoryString.includes("viewpoint") ||
            categoryString.includes("lookout")
        )
            return "🔭";
        if (categoryString.includes("bridge")) return "🌉";
        if (
            categoryString.includes("zoo") ||
            categoryString.includes("aquarium")
        )
            return "🦁";
        if (
            categoryString.includes("stadium") ||
            categoryString.includes("arena")
        )
            return "🏟️";
        if (
            categoryString.includes("beach") ||
            categoryString.includes("coast")
        )
            return "🏖️";
        if (
            categoryString.includes("mountain") ||
            categoryString.includes("hill")
        )
            return "⛰️";
        if (categoryString.includes("lake") || categoryString.includes("river"))
            return "💧";
        if (
            categoryString.includes("restaurant") ||
            categoryString.includes("cafe")
        )
            return "🍽️";
        if (
            categoryString.includes("hotel") ||
            categoryString.includes("hostel")
        )
            return "🏨";
        if (categoryString.includes("shop") || categoryString.includes("store"))
            return "🛍️";
        if (
            categoryString.includes("historic") ||
            categoryString.includes("heritage")
        )
            return "🏛️";
        return "🧭";
    };

    const renderTabContent = () => {
        switch (activeTab) {
            case "about":
                return (
                    <ScrollView style={styles.tabContent}>
                        <View style={styles.categoryContainer}>
                            <Text style={styles.categoryEmoji}>
                                {getCategoryEmoji(locationData.categories)}
                            </Text>
                            <Text style={styles.categories}>
                                {locationData.categories.join(", ")}
                            </Text>
                        </View>
                        {locationData.shortDescription && (
                            <Text style={styles.shortDescription}>
                                {locationData.shortDescription}
                            </Text>
                        )}
                        <Text style={styles.description}>
                            {locationData.description ||
                                locationData.address ||
                                "No description available"}
                        </Text>
                    </ScrollView>
                );
            case "ai":
                return (
                    <View style={styles.tabContent}>
                        <Text style={styles.comingSoon}>
                            AI Guide coming soon...
                        </Text>
                    </View>
                );
            case "practical":
                return (
                    <ScrollView style={styles.tabContent}>
                        {locationData.openingHours && (
                            <View style={styles.infoSection}>
                                <Text style={styles.sectionTitle}>
                                    Opening Hours
                                </Text>
                                <Text style={styles.infoText}>
                                    {locationData.openingHours}
                                </Text>
                            </View>
                        )}

                        <View style={styles.infoSection}>
                            <Text style={styles.sectionTitle}>Location</Text>
                            <Text style={styles.infoText}>
                                {locationData.address ||
                                    "Address not available"}
                            </Text>
                            <Text style={styles.infoText}>
                                Coordinates:{" "}
                                {locationData.coordinate[1].toFixed(6)},{" "}
                                {locationData.coordinate[0].toFixed(6)}
                            </Text>
                        </View>

                        {locationData.contact && (
                            <View style={styles.infoSection}>
                                <Text style={styles.sectionTitle}>
                                    Contact Information
                                </Text>
                                {locationData.contact.phone && (
                                    <Text style={styles.infoText}>
                                        Phone: {locationData.contact.phone}
                                    </Text>
                                )}
                                {locationData.contact.website && (
                                    <Text style={styles.infoText}>
                                        Website: {locationData.contact.website}
                                    </Text>
                                )}
                                {locationData.contact.email && (
                                    <Text style={styles.infoText}>
                                        Email: {locationData.contact.email}
                                    </Text>
                                )}
                            </View>
                        )}

                        <View style={styles.infoSection}>
                            <Text style={styles.sectionTitle}>Categories</Text>
                            {locationData.categories.map((category, index) => (
                                <Text key={index} style={styles.infoText}>
                                    • {category}
                                </Text>
                            ))}
                        </View>
                    </ScrollView>
                );
        }
    };

    return (
        <View style={styles.container}>
            <Stack.Screen
                options={{
                    headerLeft: () => (
                        <Button
                            variant="ghost"
                            onPress={() => router.back()}
                            style={styles.backButton}
                        >
                            <ArrowLeft size={24} color="black" />
                        </Button>
                    ),
                    title: locationData.name,
                }}
            />

            <ScrollView style={styles.scrollView}>
                <View style={styles.imageContainer}>
                    {locationData.imageUrls &&
                    locationData.imageUrls.length > 0 ? (
                        <>
                            <ScrollView
                                horizontal
                                pagingEnabled
                                showsHorizontalScrollIndicator={false}
                                style={styles.imageCarousel}
                                onMomentumScrollEnd={(e) => {
                                    const newIndex = Math.round(
                                        e.nativeEvent.contentOffset.x / 350
                                    );
                                    setCurrentImageIndex(newIndex);
                                }}
                            >
                                {locationData.imageUrls.map((url, index) => (
                                    <Image
                                        key={index}
                                        source={{ uri: url }}
                                        style={styles.locationImage}
                                        resizeMode="cover"
                                    />
                                ))}
                            </ScrollView>
                            {locationData.imageUrls.length > 1 && (
                                <View style={styles.pagination}>
                                    {locationData.imageUrls.map((_, index) => (
                                        <View
                                            key={index}
                                            style={[
                                                styles.paginationDot,
                                                index === currentImageIndex &&
                                                    styles.paginationDotActive,
                                            ]}
                                        />
                                    ))}
                                </View>
                            )}
                        </>
                    ) : (
                        <View style={styles.imagePlaceholder}>
                            <Text style={styles.imagePlaceholderText}>
                                No images available
                            </Text>
                        </View>
                    )}
                </View>

                <View style={styles.audioGuideContainer}>
                    <Button onPress={playAudioGuide} style={styles.audioButton}>
                        {isPlaying ? (
                            <Pause size={24} color="white" />
                        ) : (
                            <Play size={24} color="white" />
                        )}
                        <Text style={styles.audioButtonText}>
                            {isPlaying
                                ? "Pause Audio Guide"
                                : "Play Audio Guide"}
                        </Text>
                    </Button>
                </View>

                <View style={styles.tabsContainer}>
                    <Button
                        variant={activeTab === "about" ? "default" : "outline"}
                        onPress={() => setActiveTab("about")}
                        style={styles.tabButton}
                    >
                        <Text
                            style={[
                                styles.tabButtonText,
                                activeTab === "about"
                                    ? styles.tabButtonTextActive
                                    : styles.tabButtonTextInactive,
                            ]}
                        >
                            About
                        </Text>
                    </Button>
                    <Button
                        variant={activeTab === "ai" ? "default" : "outline"}
                        onPress={() => setActiveTab("ai")}
                        style={styles.tabButton}
                    >
                        <Text
                            style={[
                                styles.tabButtonText,
                                activeTab === "ai"
                                    ? styles.tabButtonTextActive
                                    : styles.tabButtonTextInactive,
                            ]}
                        >
                            AI Guide
                        </Text>
                    </Button>
                    <Button
                        variant={
                            activeTab === "practical" ? "default" : "outline"
                        }
                        onPress={() => setActiveTab("practical")}
                        style={styles.tabButton}
                    >
                        <Text
                            style={[
                                styles.tabButtonText,
                                activeTab === "practical"
                                    ? styles.tabButtonTextActive
                                    : styles.tabButtonTextInactive,
                            ]}
                        >
                            Practical Info
                        </Text>
                    </Button>
                </View>

                {renderTabContent()}
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "white",
    },
    scrollView: {
        flex: 1,
    },
    imageContainer: {
        width: "100%",
        height: 300,
        position: "relative",
    },
    imageCarousel: {
        width: "100%",
        height: "100%",
    },
    locationImage: {
        width: 350,
        height: 300,
    },
    imagePlaceholder: {
        width: "100%",
        height: "100%",
        backgroundColor: "#f0f0f0",
        justifyContent: "center",
        alignItems: "center",
    },
    imagePlaceholderText: {
        color: "#666",
        fontSize: 16,
    },
    pagination: {
        position: "absolute",
        bottom: 16,
        left: 0,
        right: 0,
        flexDirection: "row",
        justifyContent: "center",
        alignItems: "center",
    },
    paginationDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: "rgba(255, 255, 255, 0.5)",
        marginHorizontal: 4,
    },
    paginationDotActive: {
        backgroundColor: "#fff",
        width: 12,
        height: 12,
        borderRadius: 6,
    },
    audioGuideContainer: {
        padding: 16,
        backgroundColor: "#f8f9fa",
    },
    audioButton: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        gap: 8,
    },
    audioButtonText: {
        color: "white",
        fontSize: 16,
        fontWeight: "500",
    },
    tabsContainer: {
        flexDirection: "row",
        padding: 16,
        gap: 8,
    },
    tabButton: {
        flex: 1,
    },
    tabButtonText: {
        fontSize: 14,
        fontWeight: "500",
    },
    tabButtonTextActive: {
        color: "white",
    },
    tabButtonTextInactive: {
        color: "#3b82f6", // Blue color to match the outline variant
    },
    tabContent: {
        padding: 16,
    },
    categoryContainer: {
        flexDirection: "row",
        alignItems: "center",
        marginBottom: 16,
        gap: 8,
    },
    categoryEmoji: {
        fontSize: 24,
    },
    categories: {
        fontSize: 16,
        color: "#666",
        flex: 1,
    },
    shortDescription: {
        fontSize: 18,
        fontWeight: "500",
        color: "#333",
        marginBottom: 16,
        fontStyle: "italic",
        lineHeight: 24,
    },
    description: {
        fontSize: 16,
        lineHeight: 24,
        color: "#333",
    },
    comingSoon: {
        fontSize: 16,
        textAlign: "center",
        color: "#666",
        marginTop: 20,
    },
    infoSection: {
        marginBottom: 24,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: "bold",
        marginBottom: 12,
        color: "#333",
    },
    infoText: {
        fontSize: 16,
        lineHeight: 24,
        color: "#666",
        marginBottom: 8,
    },
    backButton: {
        marginLeft: 8,
    },
});
