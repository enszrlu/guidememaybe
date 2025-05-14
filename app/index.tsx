import React, { useState, useEffect, useRef } from "react";
import {
    View,
    Text,
    StyleSheet,
    ActivityIndicator,
    Alert,
    Modal,
    TouchableOpacity,
    ScrollView,
    Image,
} from "react-native";
import * as Location from "expo-location";
import Mapbox from "@rnmapbox/maps";
import { Position } from "geojson";
import { Plus, Minus, LocateFixed, X, Info } from "lucide-react-native";
import { useRouter } from "expo-router";

const INITIAL_CENTER: Position = [-0.08, 51.507];
const imageCache = new Map<string, string[]>();
const detailsCache = new Map<
    string,
    { address: string; description: string }
>();

interface Poi {
    id: string;
    name: string;
    coordinate: Position;
    categories: string[];
}

interface SelectedPoi extends Poi {
    type: "poi" | "user";
    imageUrls: string[];
    address: string;
    description: string;
}

export default function Screen() {
    const [userLocation, setUserLocation] = useState<Position | null>(null);
    const [pois, setPois] = useState<Poi[]>([]);
    const [selectedPoi, setSelectedPoi] = useState<SelectedPoi | null>(null);
    const [modalVisible, setModalVisible] = useState(false);
    const [loadingDetails, setLoadingDetails] = useState(false);
    const [currentImageIndex, setCurrentImageIndex] = useState(0);
    const cameraRef = useRef<Mapbox.Camera>(null);
    const router = useRouter();

    useEffect(() => {
        (async () => {
            const { status } =
                await Location.requestForegroundPermissionsAsync();
            if (status !== "granted") {
                Alert.alert("Location Permission Denied");
                return;
            }
            const loc = await Location.getCurrentPositionAsync({});
            const coords: Position = [
                loc.coords.longitude,
                loc.coords.latitude,
            ];
            setUserLocation(coords);
            fetchPois(coords[1], coords[0]);
        })();
    }, []);

    const fetchPois = async (lat: number, lon: number) => {
        const query = `
        [out:json][timeout:20];
        (
            node["tourism"~"attraction|museum"](around:2000, ${lat}, ${lon});
            node["historic"](around:2000, ${lat}, ${lon});
            node["leisure"="park"](around:2000, ${lat}, ${lon});
            node["amenity"="place_of_worship"](around:2000, ${lat}, ${lon});
        );
        out body;
        `;

        try {
            const res = await fetch("https://overpass-api.de/api/interpreter", {
                method: "POST",
                headers: {
                    "Content-Type": "application/x-www-form-urlencoded",
                },
                body: query,
            });
            const data = await res.json();
            const results: Poi[] = data.elements
                .filter((e: any) => e.tags?.name && e.lat && e.lon)
                .map((e: any) => ({
                    id: e.id.toString(),
                    name: e.tags.name,
                    coordinate: [e.lon, e.lat] as Position,
                    categories: [
                        e.tags.tourism,
                        e.tags.historic,
                        e.tags.leisure,
                        e.tags.amenity,
                    ].filter(Boolean),
                }));
            setPois(results);
        } catch (err) {
            console.error(err);
            Alert.alert("Error", "Failed to load POIs.");
        }
    };

    const fetchDetails = async (poi: Poi): Promise<SelectedPoi> => {
        if (detailsCache.has(poi.id)) {
            const cached = detailsCache.get(poi.id)!;
            return {
                ...poi,
                type: "poi",
                imageUrls: await fetchImages(poi),
                ...cached,
            };
        }

        let address = "";
        let description = "";

        // Reverse Geocoding
        try {
            const res = await fetch(
                `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${poi.coordinate[1]}&lon=${poi.coordinate[0]}`
            );
            const data = await res.json();
            address = data.display_name || "";
        } catch (err) {
            console.warn("Reverse geocode failed", err);
        }

        // Wikipedia Summary
        try {
            const wikiRes = await fetch(
                `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(
                    poi.name
                )}`
            );
            if (wikiRes.ok) {
                const wikiData = await wikiRes.json();
                description = wikiData.extract || "";
            }
        } catch (err) {
            console.warn("Wikipedia summary failed", err);
        }

        detailsCache.set(poi.id, { address, description });

        return {
            ...poi,
            type: "poi",
            imageUrls: await fetchImages(poi),
            address: address || "No address available",
            description: description || "No description available",
        };
    };

    const fetchImages = async (poi: Poi): Promise<string[]> => {
        if (imageCache.has(poi.id)) return imageCache.get(poi.id)!;

        const images: string[] = [];

        try {
            // Try Wikimedia Commons first (faster than Wikipedia)
            const commonsResp = await fetch(
                `https://commons.wikimedia.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(
                    poi.name
                )}&srnamespace=6&srlimit=3&prop=imageinfo&iiprop=url&iiurlwidth=800&format=json&origin=*`
            ).then((res) => res.json());

            if (commonsResp.query?.search) {
                const imageTitles = commonsResp.query.search
                    .slice(0, 3) // Limit to 3 images
                    .map((s: any) => s.title);

                const imageInfoRequests = imageTitles.map(
                    async (title: string) => {
                        const imageInfoResp = await fetch(
                            `https://commons.wikimedia.org/w/api.php?action=query&titles=${encodeURIComponent(
                                title
                            )}&prop=imageinfo&iiprop=url&iiurlwidth=800&format=json&origin=*`
                        ).then((res) => res.json());

                        const page = Object.values(
                            imageInfoResp.query.pages
                        )[0] as any;
                        if (page?.imageinfo?.[0]?.url) {
                            const url = page.imageinfo[0].url;
                            if (!url.toLowerCase().endsWith(".svg")) {
                                return url;
                            }
                        }
                        return null;
                    }
                );

                const imageResults = (
                    await Promise.all(imageInfoRequests)
                ).filter(Boolean);
                images.push(...(imageResults as string[]));
            }

            // Wikidata P18 fallback (only if no images found)
            if (images.length === 0) {
                const wikidataResp = await fetch(
                    `https://www.wikidata.org/w/api.php?action=wbgetentities&sites=enwiki&titles=${encodeURIComponent(
                        poi.name
                    )}&props=claims&format=json&origin=*`
                ).then((res) => res.json());

                const entity = Object.values(
                    wikidataResp.entities || {}
                )[0] as any;
                if (entity?.claims?.P18) {
                    const wikidataImage =
                        entity.claims.P18[0]?.mainsnak?.datavalue?.value;
                    if (wikidataImage) {
                        const commonsUrl = `https://commons.wikimedia.org/wiki/Special:FilePath/${encodeURIComponent(
                            wikidataImage
                        )}?width=800`;
                        images.push(commonsUrl);
                    }
                }
            }

            // Fallback image if nothing found
            if (images.length === 0) {
                images.push(getCategoryFallback(poi.categories));
            }

            imageCache.set(poi.id, images);
            return images;
        } catch (err) {
            console.warn("Image fetch failed", err);
            const fallback = getCategoryFallback(poi.categories);
            imageCache.set(poi.id, [fallback]);
            return [fallback];
        }
    };

    const getCategoryFallback = (categories: string[]): string => {
        const c = categories.join(" ").toLowerCase();
        if (c.includes("museum"))
            return "https://upload.wikimedia.org/wikipedia/commons/4/4b/Museum_of_Modern_Art_2018.jpg";
        if (c.includes("church") || c.includes("worship"))
            return "https://upload.wikimedia.org/wikipedia/commons/8/8d/Notre_Dame_de_Paris_2013-07-24.jpg";
        if (c.includes("park"))
            return "https://upload.wikimedia.org/wikipedia/commons/2/2d/Central_Park_New_York_City_panorama.jpg";
        if (c.includes("castle") || c.includes("palace"))
            return "https://upload.wikimedia.org/wikipedia/commons/4/4b/Neuschwanstein_castle_IMG_2068.jpg";
        return "https://upload.wikimedia.org/wikipedia/commons/4/4b/Map_marker_icon_Landmark.png";
    };

    const selectPoi = async (poi: Poi) => {
        setLoadingDetails(true);
        const details = await fetchDetails(poi);
        setSelectedPoi(details);
        setModalVisible(true);
        setLoadingDetails(false);
    };

    const focusUser = () => {
        if (userLocation && cameraRef.current) {
            cameraRef.current.setCamera({
                centerCoordinate: userLocation,
                zoomLevel: 16,
                animationMode: "flyTo",
                animationDuration: 1000,
            });
        }
    };

    const navigateDetail = () => {
        if (!selectedPoi) return;
        router.push({
            pathname: "/location/[id]",
            params: {
                id: selectedPoi.name.toLowerCase().replace(/[^a-z0-9]+/g, "-"),
                name: selectedPoi.name,
                coordinate: JSON.stringify(selectedPoi.coordinate),
                categories: JSON.stringify(selectedPoi.categories),
                address: selectedPoi.address,
                imageUrls: JSON.stringify(selectedPoi.imageUrls),
                description: selectedPoi.description,
            },
        });
        setModalVisible(false);
    };

    const getEmoji = (categories: string[]): string => {
        const c = categories.join(" ").toLowerCase();
        if (c.includes("museum")) return "🏛️";
        if (c.includes("church") || c.includes("worship")) return "⛪";
        if (c.includes("park")) return "🌳";
        if (c.includes("castle") || c.includes("palace")) return "🏰";
        return "🧭";
    };

    return (
        <View style={styles.container}>
            <Mapbox.MapView
                style={styles.map}
                styleURL="mapbox://styles/mapbox/streets-v11"
            >
                <Mapbox.Camera
                    ref={cameraRef}
                    zoomLevel={14}
                    centerCoordinate={userLocation || INITIAL_CENTER}
                />

                {userLocation && (
                    <Mapbox.PointAnnotation id="user" coordinate={userLocation}>
                        <View style={styles.userDot}>
                            <Text>📍</Text>
                        </View>
                    </Mapbox.PointAnnotation>
                )}

                {pois.map((poi) => (
                    <Mapbox.PointAnnotation
                        key={poi.id}
                        id={poi.id}
                        coordinate={poi.coordinate}
                        onSelected={() => selectPoi(poi)}
                    >
                        <View style={styles.poiMarker}>
                            <Text style={styles.emoji}>
                                {getEmoji(poi.categories)}
                            </Text>
                        </View>
                    </Mapbox.PointAnnotation>
                ))}
            </Mapbox.MapView>

            <View style={styles.controls}>
                <TouchableOpacity onPress={focusUser} style={styles.button}>
                    <LocateFixed size={20} />
                </TouchableOpacity>
            </View>

            <Modal visible={modalVisible} transparent animationType="slide">
                <View style={styles.modalOverlay}>
                    <View style={styles.modal}>
                        {loadingDetails ? (
                            <ActivityIndicator size="large" />
                        ) : selectedPoi ? (
                            <>
                                <View style={styles.modalHeader}>
                                    <Text style={styles.modalTitle}>
                                        {selectedPoi.name}
                                    </Text>
                                    <TouchableOpacity
                                        onPress={() => setModalVisible(false)}
                                    >
                                        <X size={24} />
                                    </TouchableOpacity>
                                </View>
                                <View style={styles.imageContainer}>
                                    <ScrollView
                                        horizontal
                                        pagingEnabled
                                        showsHorizontalScrollIndicator={false}
                                        style={styles.imageScroll}
                                        onMomentumScrollEnd={(e) => {
                                            const newIndex = Math.round(
                                                e.nativeEvent.contentOffset.x /
                                                    350
                                            );
                                            setCurrentImageIndex(newIndex);
                                        }}
                                    >
                                        {selectedPoi.imageUrls.map((url, i) => (
                                            <Image
                                                key={i}
                                                source={{ uri: url }}
                                                style={styles.image}
                                                resizeMode="cover"
                                            />
                                        ))}
                                    </ScrollView>
                                    {selectedPoi.imageUrls.length > 1 && (
                                        <View style={styles.pagination}>
                                            {selectedPoi.imageUrls.map(
                                                (_, i) => (
                                                    <View
                                                        key={i}
                                                        style={[
                                                            styles.paginationDot,
                                                            i ===
                                                                currentImageIndex &&
                                                                styles.paginationDotActive,
                                                        ]}
                                                    />
                                                )
                                            )}
                                        </View>
                                    )}
                                </View>
                                <Text style={styles.description}>
                                    {selectedPoi.description}
                                </Text>
                                <Text style={styles.address}>
                                    {selectedPoi.address}
                                </Text>
                                <TouchableOpacity
                                    onPress={navigateDetail}
                                    style={styles.detailBtn}
                                >
                                    <Info size={16} color="white" />
                                    <Text style={styles.detailBtnText}>
                                        Read More
                                    </Text>
                                </TouchableOpacity>
                            </>
                        ) : null}
                    </View>
                </View>
            </Modal>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    map: { flex: 1 },
    userDot: {
        width: 30,
        height: 30,
        backgroundColor: "blue",
        borderRadius: 15,
        justifyContent: "center",
        alignItems: "center",
    },
    poiMarker: {
        width: 30,
        height: 30,
        borderRadius: 15,
        backgroundColor: "white",
        borderWidth: 2,
        borderColor: "#3b82f6",
        justifyContent: "center",
        alignItems: "center",
    },
    emoji: { fontSize: 20 },
    controls: { position: "absolute", bottom: 20, right: 15 },
    button: { backgroundColor: "white", padding: 10, borderRadius: 25 },
    modalOverlay: {
        flex: 1,
        backgroundColor: "rgba(0,0,0,0.5)",
        justifyContent: "flex-end",
    },
    modal: {
        backgroundColor: "white",
        padding: 20,
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
    },
    modalHeader: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
    },
    modalTitle: { fontSize: 20, fontWeight: "bold" },
    imageContainer: {
        position: "relative",
        height: 200,
        marginVertical: 15,
    },
    imageScroll: {
        height: "100%",
    },
    image: {
        width: 350,
        height: 200,
        borderRadius: 10,
        marginRight: 10,
    },
    pagination: {
        position: "absolute",
        bottom: 10,
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
    description: {
        fontSize: 16,
        lineHeight: 24,
        color: "#333",
        marginBottom: 8,
    },
    address: {
        fontSize: 14,
        color: "#666",
        marginBottom: 16,
    },
    detailBtn: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: "#3b82f6",
        padding: 12,
        borderRadius: 8,
        marginTop: 10,
    },
    detailBtnText: { color: "white", marginLeft: 8 },
});
