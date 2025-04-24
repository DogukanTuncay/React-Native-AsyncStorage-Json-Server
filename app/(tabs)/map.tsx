import React, { useState, useEffect, useRef } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, Image, ScrollView, Dimensions, StatusBar, SafeAreaView, ActivityIndicator } from 'react-native';
import MapView, { Marker, PROVIDER_GOOGLE, Polyline, Callout, Region } from 'react-native-maps';
import * as Location from 'expo-location';
import { MaterialIcons, FontAwesome5, Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

const SCREEN_WIDTH = Dimensions.get('window').width;
const SCREEN_HEIGHT = Dimensions.get('window').height;

// TypeScript için tip tanımlamaları
interface POIType {
  id: number;
  title: string;
  coordinate: {
    latitude: number;
    longitude: number;
  };
  description: string;
  image: string;
}

interface RouteCoordinate {
  latitude: number;
  longitude: number;
}

// MapView kütüphanesinde kullanılacak doğru tip tanımlaması
type MapType = 'standard' | 'satellite' | 'hybrid' | 'terrain' | 'mutedStandard' | 'none';
type MapTypeOption = MapType | 'traffic';

interface MapTypesDict {
  [key: string]: string;
}

// Önemli turistik yerler (örnek olarak İstanbul)
const POI: POIType[] = [
  { 
    id: 1, 
    title: 'Ayasofya', 
    coordinate: { latitude: 41.008583, longitude: 28.980175 },
    description: 'Bizans İmparatorluğu zamanında inşa edilmiş dünyaca ünlü anıt ve müze.',
    image: 'https://www.meroddi.com/wp-content/uploads/2022/06/ayasofyanin-gizemi.png'
  },
  { 
    id: 2, 
    title: 'Kız Kulesi', 
    coordinate: { latitude: 41.021111, longitude: 29.003889 },
    description: 'İstanbul Boğazı\'nın girişinde küçük bir ada üzerinde yer alan tarihi yapı.',
    image: 'https://www.uskudar.bel.tr/userfiles/images/5.png'
  },
  { 
    id: 3, 
    title: 'Galata Kulesi', 
    coordinate: { latitude: 41.025643, longitude: 28.974169 },
    description: 'Orta Çağ\'dan kalma taş kule, İstanbul\'un en yüksek noktalarından biri.',
    image: 'https://blog.tatil.com/wp-content/uploads/2024/01/galata-kulesi-tarihi.webp'
  },
  { 
    id: 4, 
    title: 'Sultanahmet Camii', 
    coordinate: { latitude: 41.005316, longitude: 28.976826 },
    description: 'Mavi Cami olarak da bilinen, 17. yüzyılda inşa edilmiş ikonik cami.',
    image: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQx3Go3XTZiLOw-BNejycNe7BNEPXf5ZVBmAA&s'
  },
  { 
    id: 5, 
    title: 'Topkapı Sarayı', 
    coordinate: { latitude: 41.011667, longitude: 28.983333 },
    description: 'Osmanlı sultanlarının 400 yıl boyunca ikamet ettiği saray kompleksi.',
    image: 'https://www.eliteworldhotels.com.tr/Upload/images/topkapi-sarayinin-hikayesi.jpg'
  },
];

const MapTypes: MapTypesDict = {
  standard: 'Standart',
  satellite: 'Uydu',
  hybrid: 'Hibrit',
  terrain: 'Arazi',
  traffic: 'Trafik'
};

const MapsScreen: React.FC = () => {
  const [location, setLocation] = useState<Location.LocationObject | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [mapType, setMapType] = useState<MapType>('standard');
  const [showsTraffic, setShowsTraffic] = useState<boolean>(false);
  const [selectedPOI, setSelectedPOI] = useState<POIType | null>(null);
  const [route, setRoute] = useState<RouteCoordinate[] | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isNavigating, setIsNavigating] = useState<boolean>(false);
  
  const mapRef = useRef<MapView | null>(null);

  useEffect(() => {
    (async () => {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setErrorMsg('Konum izni verilmedi');
        setIsLoading(false);
        return;
      }

      let location = await Location.getCurrentPositionAsync({});
      console.log('Konum:', location);
      setLocation(location);
      setIsLoading(false);
    })();
  }, []);

  const changeMapType = (type: MapTypeOption): void => {
    if (type === 'traffic') {
      setShowsTraffic(!showsTraffic);
    } else {
      setMapType(type);
    }
  };

  const navigateToPOI = (poi: POIType): void => {
    setSelectedPOI(poi);
    
    // Simüle edilmiş rota - gerçek uygulamada bir yönlendirme API'si kullanılır (Google Directions API gibi)
    if (location) {
      // Basit doğrusal rota oluşturma
      setRoute([
        { latitude: location.coords.latitude, longitude: location.coords.longitude },
        { latitude: poi.coordinate.latitude, longitude: poi.coordinate.longitude }
      ]);
      
      // Haritayı her iki konumu da gösterecek şekilde ayarla
      mapRef.current?.fitToCoordinates(
        [
          { latitude: location.coords.latitude, longitude: location.coords.longitude },
          poi.coordinate
        ],
        {
          edgePadding: { top: 50, right: 50, bottom: 50, left: 50 },
          animated: true,
        }
      );
      
      setIsNavigating(true);
    }
  };

  const stopNavigation = (): void => {
    setSelectedPOI(null);
    setRoute(null);
    setIsNavigating(false);
    
    // Kullanıcının konumuna geri dön
    if (location) {
      mapRef.current?.animateToRegion({
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01
      }, 1000);
    }
  };

  const centerToUserLocation = (): void => {
    if (location) {
      mapRef.current?.animateToRegion({
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
        latitudeDelta: 0.005,
        longitudeDelta: 0.005
      }, 1000);
    }
  };

  if (isLoading) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <StatusBar barStyle="dark-content" />
        <ActivityIndicator size="large" color="#3498db" />
        <Text style={styles.loadingText}>Harita yükleniyor...</Text>
      </SafeAreaView>
    );
  }

  if (errorMsg) {
    return (
      <SafeAreaView style={styles.errorContainer}>
        <StatusBar barStyle="dark-content" />
        <MaterialIcons name="location-off" size={64} color="#e74c3c" />
        <Text style={styles.errorText}>{errorMsg}</Text>
        <TouchableOpacity 
          style={styles.retryButton}
          onPress={async () => {
            setIsLoading(true);
            let { status } = await Location.requestForegroundPermissionsAsync();
            if (status === 'granted') {
              let location = await Location.getCurrentPositionAsync({});
              setLocation(location);
              setErrorMsg(null);
            }
            setIsLoading(false);
          }}
        >
          <Text style={styles.retryButtonText}>Tekrar Dene</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  const initialRegion: Region | undefined = location ? {
    latitude: location.coords.latitude,
    longitude: location.coords.longitude,
    latitudeDelta: 0.01,
    longitudeDelta: 0.01,
  } : undefined;

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />
      
      {/* HARITA */}
      <MapView
        ref={mapRef}
        provider={PROVIDER_GOOGLE}
        style={styles.map}
        mapType={mapType}
        showsTraffic={showsTraffic}
        showsUserLocation={true}
        showsMyLocationButton={false}
        showsCompass={true}
        showsScale={true}
        initialRegion={initialRegion}
      >
        {/* İlgi çekici noktalar */}
        {POI.map((poi) => (
          <Marker
            key={poi.id}
            coordinate={poi.coordinate}
            title={poi.title}
            description={poi.description}
            pinColor={selectedPOI?.id === poi.id ? "#2ecc71" : "#e74c3c"}
          >
            <Callout tooltip>
              <View style={styles.calloutView}>
                <Text style={styles.calloutTitle}>{poi.title}</Text>
                <Text style={styles.calloutDescription}>{poi.description}</Text>
                <TouchableOpacity 
                  style={styles.calloutButton}
                  onPress={() => navigateToPOI(poi)}
                >
                  <Text style={styles.calloutButtonText}>Navigasyon Başlat</Text>
                </TouchableOpacity>
              </View>
            </Callout>
          </Marker>
        ))}

        {/* Navigasyon rotası */}
        {route && (
          <Polyline
            coordinates={route}
            strokeColor="#3498db"
            strokeWidth={4}
            lineDashPattern={[1]}
          />
        )}
      </MapView>

      {/* ÜST BAŞLIK */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Harita Gezgini</Text>
        {isNavigating && (
          <View style={styles.navigationInfo}>
            <Text style={styles.navigationText}>
              Hedef: {selectedPOI?.title}
            </Text>
          </View>
        )}
      </View>

      {/* HARİTA TİPLERİ KONTROL PANELİ */}
      <View style={styles.mapTypesContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {Object.entries(MapTypes).map(([typeKey, label]) => {
            // type değişkenini MapTypeOption tipine dönüştür
            const type = typeKey as MapTypeOption;
            
            return (
              <TouchableOpacity
                key={typeKey}
                style={[
                  styles.mapTypeButton,
                  ((type === 'standard' && mapType === 'standard') || 
                  (type === 'satellite' && mapType === 'satellite') || 
                  (type === 'hybrid' && mapType === 'hybrid') || 
                  (type === 'terrain' && mapType === 'terrain') ||
                  (type === 'traffic' && showsTraffic)) && styles.activeMapType
                ]}
                onPress={() => changeMapType(type)}
              >
                <Text style={[
                  styles.mapTypeText,
                  ((type === 'standard' && mapType === 'standard') || 
                  (type === 'satellite' && mapType === 'satellite') || 
                  (type === 'hybrid' && mapType === 'hybrid') || 
                  (type === 'terrain' && mapType === 'terrain') ||
                  (type === 'traffic' && showsTraffic)) && styles.activeMapTypeText
                ]}>
                  {label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* LOKASYON BUTONU */}
      <TouchableOpacity 
        style={styles.locationButton}
        onPress={centerToUserLocation}
      >
        <MaterialIcons name="my-location" size={24} color="#fff" />
      </TouchableOpacity>

      {/* İLGİ ÇEKİCİ YERLER LİSTESİ */}
      <View style={styles.poiListContainer}>
        <LinearGradient
          colors={['rgba(255,255,255,0.9)', 'rgba(255,255,255,0.8)']}
          style={styles.poiListGradient}
        >
          <Text style={styles.poiTitle}>İlgi Çekici Yerler</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {POI.map((poi) => (
              <TouchableOpacity
                key={poi.id}
                style={[
                  styles.poiCard,
                  selectedPOI?.id === poi.id && styles.selectedPoiCard
                ]}
                onPress={() => {
                  mapRef.current?.animateToRegion({
                    latitude: poi.coordinate.latitude,
                    longitude: poi.coordinate.longitude,
                    latitudeDelta: 0.01,
                    longitudeDelta: 0.01,
                  }, 1000);
                }}
              >
                <View style={styles.poiImageContainer}>
                  <Image
                    source={{ uri: poi.image }}
                    style={styles.poiImage}
                  />
                </View>
                <Text style={styles.poiName}>{poi.title}</Text>
                <TouchableOpacity
                  style={styles.poiNavigateButton}
                  onPress={() => navigateToPOI(poi)}
                >
                  <FontAwesome5 name="route" size={16} color="#fff" />
                  <Text style={styles.poiNavigateText}>Yol Tarifi</Text>
                </TouchableOpacity>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </LinearGradient>
      </View>

      {/* NAVİGASYON PANEL */}
      {isNavigating && (
        <View style={styles.navigationPanel}>
          <View style={styles.navigationDetails}>
            <Text style={styles.navigationTitle}>Navigasyon: {selectedPOI?.title}</Text>
            <Text style={styles.navigationDistance}>
              Tahmini mesafe: {location && selectedPOI ? 
                Math.round(getDistance(
                  location.coords.latitude,
                  location.coords.longitude,
                  selectedPOI.coordinate.latitude,
                  selectedPOI.coordinate.longitude
                ) * 10) / 10 + ' km'
                : '---'}
            </Text>
          </View>
          <TouchableOpacity 
            style={styles.stopNavButton}
            onPress={stopNavigation}
          >
            <Ionicons name="close-circle" size={24} color="#fff" />
            <Text style={styles.stopNavText}>İptal</Text>
          </TouchableOpacity>
        </View>
      )}
    </SafeAreaView>
  );
};

// İki konum arasındaki haversine uzaklık hesaplaması (km)
function getDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Dünya yarıçapı (km)
  const dLat = deg2rad(lat2 - lat1);
  const dLon = deg2rad(lon2 - lon1);
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) * 
    Math.sin(dLon/2) * Math.sin(dLon/2); 
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a)); 
  const d = R * c; // Mesafe (km)
  return d;
}

function deg2rad(deg: number): number {
  return deg * (Math.PI/180);
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9f9f9',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#333',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 20,
  },
  errorText: {
    marginTop: 10,
    fontSize: 16,
    color: '#e74c3c',
    textAlign: 'center',
  },
  retryButton: {
    marginTop: 20,
    paddingVertical: 10,
    paddingHorizontal: 20,
    backgroundColor: '#3498db',
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  map: {
    ...StyleSheet.absoluteFillObject,
  },
  header: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    paddingVertical: 15,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0, 0, 0, 0.1)',
    alignItems: 'center',
    zIndex: 1,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2c3e50',
  },
  navigationInfo: {
    marginTop: 5,
  },
  navigationText: {
    fontSize: 14,
    color: '#3498db',
    fontWeight: '500',
  },
  mapTypesContainer: {
    position: 'absolute',
    top: 70,
    left: 10,
    right: 10,
    zIndex: 2,
  },
  mapTypeButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    borderRadius: 20,
    marginHorizontal: 5,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.1)',
  },
  activeMapType: {
    backgroundColor: '#3498db',
  },
  mapTypeText: {
    color: '#333',
    fontWeight: '500',
    fontSize: 12,
  },
  activeMapTypeText: {
    color: '#fff',
  },
  locationButton: {
    position: 'absolute',
    right: 16,
    bottom: 240,
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#3498db',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  poiListContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    minHeight: 160,
  },
  poiListGradient: {
    paddingVertical: 15,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    borderTopWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.1)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -3 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 5,
  },
  poiTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginLeft: 20,
    marginBottom: 10,
  },
  poiCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 12,
    marginLeft: 15,
    marginRight: 5,
    width: 140,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  selectedPoiCard: {
    borderWidth: 2,
    borderColor: '#3498db',
  },
  poiImageContainer: {
    width: '100%',
    height: 70,
    borderRadius: 8,
    overflow: 'hidden',
    marginBottom: 8,
    backgroundColor: '#f1f1f1',
  },
  poiImage: {
    width: '100%',
    height: '100%',
  },
  poiName: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginBottom: 8,
  },
  poiNavigateButton: {
    backgroundColor: '#3498db',
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 6,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  poiNavigateText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '500',
    marginLeft: 5,
  },
  navigationPanel: {
    position: 'absolute',
    bottom: 170,
    left: 16,
    right: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 12,
    padding: 15,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.05)',
  },
  navigationDetails: {
    flex: 1,
  },
  navigationTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2c3e50',
  },
  navigationDistance: {
    fontSize: 14,
    color: '#7f8c8d',
    marginTop: 4,
  },
  stopNavButton: {
    backgroundColor: '#e74c3c',
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
  },
  stopNavText: {
    color: '#fff',
    fontWeight: 'bold',
    marginLeft: 5,
  },
  calloutView: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 10,
    width: 200,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 5,
  },
  calloutTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginBottom: 4,
  },
  calloutDescription: {
    fontSize: 12,
    color: '#7f8c8d',
    marginBottom: 8,
  },
  calloutButton: {
    backgroundColor: '#3498db',
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 6,
    alignItems: 'center',
  },
  calloutButtonText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '500',
  },
});

export default MapsScreen;