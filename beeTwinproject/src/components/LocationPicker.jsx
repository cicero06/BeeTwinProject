import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';
import L from 'leaflet';

// Fix for default markers in React-Leaflet
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
    iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Custom beehive icon
const beehiveIcon = new L.Icon({
    iconUrl: '/beehive-marker.svg',
    iconSize: [32, 32],
    iconAnchor: [16, 32],
    popupAnchor: [0, -32],
});

// Component to handle map clicks
function LocationMarker({ position, setPosition }) {
    const map = useMapEvents({
        click(e) {
            setPosition(e.latlng);
        },
    });

    return position === null ? null : (
        <Marker position={position} icon={beehiveIcon} />
    );
}

const LocationPicker = ({
    latitude,
    longitude,
    onLocationChange,
    locationName,
    onLocationNameChange,
    isOpen,
    onClose
}) => {
    const [position, setPosition] = useState(null);
    const [currentLocationName, setCurrentLocationName] = useState(locationName || '');
    const [loading, setLoading] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState([]);

    // Set initial position if lat/lng provided
    useEffect(() => {
        if (latitude && longitude) {
            setPosition({ lat: latitude, lng: longitude });
        }
    }, [latitude, longitude]);

    // Get current location
    const getCurrentLocation = () => {
        setLoading(true);
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                (position) => {
                    const newPos = {
                        lat: position.coords.latitude,
                        lng: position.coords.longitude
                    };
                    setPosition(newPos);
                    reverseGeocode(newPos.lat, newPos.lng);
                    setLoading(false);
                },
                (error) => {
                    console.error('Geolocation error:', error);
                    setLoading(false);
                    alert('Konum alınamadı. Lütfen manuel olarak seçin.');
                }
            );
        } else {
            setLoading(false);
            alert('Tarayıcınız konum hizmetlerini desteklemiyor.');
        }
    };

    // Reverse geocoding to get location name
    const reverseGeocode = async (lat, lng) => {
        try {
            const response = await fetch(
                `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&addressdetails=1`
            );
            const data = await response.json();
            if (data && data.display_name) {
                const locationParts = data.display_name.split(',');
                const cityProvince = locationParts.slice(2, 4).join(', ').trim();
                setCurrentLocationName(cityProvince || data.display_name);
            }
        } catch (error) {
            console.error('Reverse geocoding error:', error);
        }
    };

    // Search for locations
    const searchLocation = async (query) => {
        if (query.length < 3) {
            setSearchResults([]);
            return;
        }

        try {
            const response = await fetch(
                `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&countrycodes=tr&limit=5`
            );
            const data = await response.json();
            setSearchResults(data);
        } catch (error) {
            console.error('Search error:', error);
            setSearchResults([]);
        }
    };

    const handleSearchSelect = (result) => {
        const newPos = {
            lat: parseFloat(result.lat),
            lng: parseFloat(result.lon)
        };
        setPosition(newPos);
        setCurrentLocationName(result.display_name.split(',').slice(0, 3).join(', '));
        setSearchQuery('');
        setSearchResults([]);
    };

    const handleSave = () => {
        if (position) {
            onLocationChange(position.lat, position.lng);
            if (onLocationNameChange) {
                onLocationNameChange(currentLocationName);
            }
            onClose();
        } else {
            alert('Lütfen bir konum seçin.');
        }
    };

    const handlePositionChange = (newPosition) => {
        setPosition(newPosition);
        reverseGeocode(newPosition.lat, newPosition.lng);
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-2">
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full h-full max-w-7xl max-h-[95vh] flex flex-col">
                {/* Header */}
                <div className="p-4 border-b border-gray-200 dark:border-gray-600 flex-shrink-0">
                    <div className="flex items-center justify-between">
                        <div>
                            <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                                📍 Arılık Konumu Seçin
                            </h3>
                            <p className="text-gray-600 dark:text-gray-400 mt-1">
                                Haritadan arılığınızın konumunu seçin
                            </p>
                        </div>
                        <button
                            onClick={onClose}
                            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                        >
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>

                    {/* Search and Controls */}
                    <div className="mt-4 flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-4">
                        <div className="flex-1 relative">
                            <input
                                type="text"
                                value={searchQuery}
                                onChange={(e) => {
                                    setSearchQuery(e.target.value);
                                    searchLocation(e.target.value);
                                }}
                                placeholder="Konum ara... (örn: Ankara, Çankaya)"
                                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-amber-500 dark:bg-gray-700 dark:text-white"
                            />

                            {/* Search Results */}
                            {searchResults.length > 0 && (
                                <div className="absolute top-full left-0 right-0 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg mt-1 shadow-lg z-20 max-h-48 overflow-y-auto">
                                    {searchResults.map((result, index) => (
                                        <button
                                            key={index}
                                            onClick={() => handleSearchSelect(result)}
                                            className="w-full px-4 py-2 text-left hover:bg-gray-100 dark:hover:bg-gray-600 text-sm border-b border-gray-200 dark:border-gray-600 last:border-b-0"
                                        >
                                            {result.display_name}
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>

                        <button
                            onClick={getCurrentLocation}
                            disabled={loading}
                            className="px-4 py-2 bg-blue-500 hover:bg-blue-600 disabled:bg-gray-400 text-white rounded-lg transition-colors whitespace-nowrap"
                        >
                            {loading ? 'Alınıyor...' : '🎯 Mevcut Konum'}
                        </button>
                    </div>

                    {/* Selected Location Info */}
                    {position && (
                        <div className="mt-3 p-3 bg-amber-50 dark:bg-amber-900/20 rounded-lg border border-amber-200 dark:border-amber-600">
                            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
                                <div className="flex-1">
                                    <p className="text-sm font-medium text-amber-800 dark:text-amber-200">
                                        📍 Seçili Konum
                                    </p>
                                    <p className="text-sm text-amber-700 dark:text-amber-300 break-all">
                                        {currentLocationName || `${position.lat.toFixed(6)}, ${position.lng.toFixed(6)}`}
                                    </p>
                                </div>
                                <div className="text-xs text-amber-600 dark:text-amber-400 mt-1 sm:mt-0">
                                    {position.lat.toFixed(6)}, {position.lng.toFixed(6)}
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Map Container - Tam ekran için flex-1 kullanıyoruz */}
                <div className="flex-1 relative min-h-0">
                    <MapContainer
                        center={position || [39.9334, 32.8597]} // Default to Ankara
                        zoom={position ? 15 : 6}
                        style={{ height: '100%', width: '100%' }}
                        key={position ? `${position.lat}-${position.lng}` : 'default'}
                    >
                        <TileLayer
                            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                        />
                        <LocationMarker
                            position={position}
                            setPosition={handlePositionChange}
                        />
                    </MapContainer>

                    {/* Map Instructions */}
                    <div className="absolute top-4 left-4 bg-white dark:bg-gray-800 p-3 rounded-lg shadow-lg z-10">
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                            🖱️ Haritaya tıklayarak konum seçin
                        </p>
                    </div>
                </div>

                {/* Footer */}
                <div className="p-4 border-t border-gray-200 dark:border-gray-600 flex-shrink-0">
                    <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-4">
                        <button
                            onClick={onClose}
                            className="flex-1 px-4 py-3 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                        >
                            İptal
                        </button>
                        <button
                            onClick={handleSave}
                            disabled={!position}
                            className="flex-1 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 disabled:from-gray-400 disabled:to-gray-500 disabled:cursor-not-allowed text-white font-medium py-3 px-4 rounded-xl transition-all duration-200"
                        >
                            Konumu Kaydet
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default LocationPicker;
