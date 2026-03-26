import { useState, useRef, useEffect } from 'react';
import { MapPin, Search, X, Loader } from 'lucide-react';
import './AddressInput.css';

export default function AddressInput({
  label,
  placeholder,
  value,
  onChange,
  onSelect,
  dotColor = 'green',
  icon: Icon = MapPin,
  userPosition = null,
}) {
  const [query, setQuery] = useState(value || '');
  const [suggestions, setSuggestions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const debounceRef = useRef(null);
  const wrapperRef = useRef(null);

  // Update internal query when value prop changes externally
  useEffect(() => {
    if (value !== undefined && value !== query) {
      setQuery(value);
    }
  }, [value]);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const searchAddress = async (searchQuery) => {
    if (searchQuery.length < 3) {
      setSuggestions([]);
      return;
    }

    setLoading(true);
    try {
      // Soft-bias results to a ~40-mile radius around the driver's GPS using Mapbox bbox
      let bboxParam = '';
      if (userPosition && userPosition.lat && userPosition.lng) {
        const offset = 0.6; // Roughly ~40 miles
        const minX = userPosition.lng - offset;
        const minY = userPosition.lat - offset;
        const maxX = userPosition.lng + offset;
        const maxY = userPosition.lat + offset;
        bboxParam = `&bbox=${minX},${minY},${maxX},${maxY}`;
      }

      const MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_TOKEN;
      const response = await fetch(
        `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(searchQuery)}.json?access_token=${MAPBOX_TOKEN}&country=us&types=address,poi${bboxParam}`
      );
      const data = await response.json();

      const results = (data.features || []).map((item) => ({
        displayName: item.place_name,
        shortName: item.place_name.split(',')[0],
        lat: item.center[1],
        lng: item.center[0],
        type: item.place_type ? item.place_type[0] : 'address',
      }));

      // Remove exact duplicates
      const uniqueResults = Array.from(new Map(results.map(item => [item.shortName, item])).values());

      setSuggestions(uniqueResults);
      setShowSuggestions(uniqueResults.length > 0);
    } catch (error) {
      console.error('Address search failed:', error);
      setSuggestions([]);
    }
    setLoading(false);
  };

  // The `formatShortAddress` method has been deprecated as Mapbox inherently formats `shortName` flawlessly.
  const handleInputChange = (e) => {
    const val = e.target.value;
    setQuery(val);
    onChange?.(val);

    if (val.trim() === '') {
      if (userPosition && userPosition.lat) {
        setSuggestions([{
          shortName: 'Current Location',
          displayName: 'Use my exact GPS coordinates',
          lat: userPosition.lat,
          lng: userPosition.lng,
          isCurrentLocation: true
        }]);
        setShowSuggestions(true);
      } else {
        setSuggestions([]);
        setShowSuggestions(false);
      }
      return;
    }

    // Debounce the API call
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => searchAddress(val), 400);
  };

  const handleFocus = () => {
    if (query.trim() === '' && userPosition && userPosition.lat) {
      setSuggestions([{
        shortName: 'Current Location',
        displayName: 'Use my exact GPS coordinates',
        lat: userPosition.lat,
        lng: userPosition.lng,
        isCurrentLocation: true
      }]);
      setShowSuggestions(true);
    } else if (suggestions.length > 0) {
      setShowSuggestions(true);
    }
  };

  const handleSelect = (suggestion) => {
    setQuery(suggestion.shortName);
    setSuggestions([]);
    setShowSuggestions(false);
    onChange?.(suggestion.shortName);
    onSelect?.(suggestion);
  };

  const handleClear = () => {
    setQuery('');
    setSuggestions([]);
    onChange?.('');
    onSelect?.(null);
  };

  return (
    <div className="address-input-wrapper" ref={wrapperRef}>
      <div className="ride-input-group">
        <div className={`ride-input-dot dot-${dotColor}`} />
        <div className="input-group" style={{ flex: 1 }}>
          <label>{label}</label>
          <div className="address-input-container">
            <Search size={14} className="address-search-icon" />
            <input
              type="text"
              className="input-field address-input"
              placeholder={placeholder}
              value={query}
              onChange={handleInputChange}
              onFocus={handleFocus}
            />
            {loading && <Loader size={14} className="address-loading" />}
            {query && !loading && (
              <button className="address-clear" onClick={handleClear}>
                <X size={14} />
              </button>
            )}
          </div>
        </div>
      </div>

      {showSuggestions && (
        <div className="address-suggestions">
          {suggestions.map((suggestion, i) => (
            <button
              key={i}
              className={`address-suggestion ${suggestion.isCurrentLocation ? 'current-location-btn' : ''}`}
              onClick={() => handleSelect(suggestion)}
            >
              {suggestion.isCurrentLocation ? (
                <div style={{ background: 'var(--blue-glow)', color: '#4285f4', padding: '6px', borderRadius: '50%', marginRight: '12px' }}>
                  <MapPin size={16} />
                </div>
              ) : (
                <MapPin size={14} className="suggestion-icon" />
              )}
              <div className="suggestion-text">
                <span className={`suggestion-main ${suggestion.isCurrentLocation ? 'text-blue' : ''}`} style={{ color: suggestion.isCurrentLocation ? '#4285f4' : 'inherit' }}>
                  {suggestion.shortName}
                </span>
                <span className="suggestion-full">
                  {suggestion.displayName.length > 80
                    ? suggestion.displayName.substring(0, 80) + '...'
                    : suggestion.displayName}
                </span>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
