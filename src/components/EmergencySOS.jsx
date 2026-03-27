import { useState } from 'react';
import { useLocation } from '../context/LocationContext';
import { motion, AnimatePresence } from 'framer-motion';
import { Phone, MapPin, Share2, X, Shield } from 'lucide-react';
import './EmergencySOS.css';

export default function EmergencySOS() {
  const { position } = useLocation();
  const [isOpen, setIsOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  const lat = position?.lat?.toFixed(6) || 'Unavailable';
  const lng = position?.lng?.toFixed(6) || 'Unavailable';
  const hasCoords = position?.lat && position?.lng;

  const mapsUrl = hasCoords
    ? `https://www.google.com/maps?q=${position.lat},${position.lng}`
    : null;

  const shareText = hasCoords
    ? `🚨 EMERGENCY — I need help!\nMy location: ${lat}, ${lng}\nMap: ${mapsUrl}`
    : `🚨 EMERGENCY — I need help! (GPS unavailable)`;

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Emergency — My Location',
          text: shareText,
          url: mapsUrl || undefined,
        });
      } catch (e) {
        // User cancelled share or share failed — fall through to clipboard
        if (e.name !== 'AbortError') {
          await copyToClipboard();
        }
      }
    } else {
      await copyToClipboard();
    }
  };

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(shareText);
      setCopied(true);
      setTimeout(() => setCopied(false), 3000);
    } catch {
      // Fallback for older browsers
      const ta = document.createElement('textarea');
      ta.value = shareText;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
      setCopied(true);
      setTimeout(() => setCopied(false), 3000);
    }
  };

  return (
    <>
      {/* Floating SOS Button */}
      <motion.button
        className="sos-fab"
        onClick={() => setIsOpen(true)}
        whileTap={{ scale: 0.9 }}
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: 'spring', bounce: 0.4, delay: 0.5 }}
        aria-label="Emergency SOS"
      >
        <Shield size={22} />
        <span className="sos-fab-label">SOS</span>
        <div className="sos-pulse-ring" />
        <div className="sos-pulse-ring sos-pulse-ring-2" />
      </motion.button>

      {/* Emergency Modal */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            className="sos-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsOpen(false)}
          >
            <motion.div
              className="sos-modal"
              initial={{ opacity: 0, scale: 0.85, y: 40 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.85, y: 40 }}
              transition={{ type: 'spring', bounce: 0.3, duration: 0.5 }}
              onClick={(e) => e.stopPropagation()}
            >
              {/* Close */}
              <button className="sos-close" onClick={() => setIsOpen(false)}>
                <X size={20} />
              </button>

              {/* Header */}
              <div className="sos-header">
                <div className="sos-header-icon">🚨</div>
                <h2>Emergency</h2>
                <p>Your safety comes first. Use the options below.</p>
              </div>

              {/* Call 911 */}
              <a href="tel:911" className="sos-action sos-action-911">
                <Phone size={24} />
                <div>
                  <strong>Call 911</strong>
                  <span>Connect to emergency services</span>
                </div>
              </a>

              {/* GPS Coordinates */}
              <div className="sos-coords">
                <MapPin size={16} />
                <div className="sos-coords-info">
                  <span className="sos-coords-label">Your GPS Location</span>
                  <span className="sos-coords-value">
                    {hasCoords ? `${lat}, ${lng}` : 'Acquiring location...'}
                  </span>
                  {position?.accuracy && (
                    <span className="sos-coords-accuracy">
                      Accuracy: ~{Math.round(position.accuracy)}m
                    </span>
                  )}
                </div>
              </div>

              {/* Share Location */}
              <button className="sos-action sos-action-share" onClick={handleShare}>
                <Share2 size={20} />
                <div>
                  <strong>{copied ? '✓ Copied to clipboard!' : 'Share My Location'}</strong>
                  <span>Send coordinates to someone you trust</span>
                </div>
              </button>

              {/* Google Maps Link */}
              {mapsUrl && (
                <a
                  href={mapsUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="sos-maps-link"
                >
                  📍 View on Google Maps
                </a>
              )}

              <p className="sos-disclaimer">
                When you call 911, your carrier provides approximate location to dispatchers.
                Read your coordinates above to give them a precise location.
              </p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
