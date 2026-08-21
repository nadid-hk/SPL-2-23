import { useEffect, useMemo } from "react";
import { MapContainer, Marker, Popup, TileLayer, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

import { IUT_GATE_LATLNG } from "./LocationMap";

// 🐛 FIX: this used to import `mediaUrl` from a non-existent "../api/client"
// module. It's not needed — post.service.js uploads photos straight to
// Cloudinary and stores `result.secure_url`, which is already a full,
// absolute URL (https://res.cloudinary.com/...). There's no local/relative
// path to resolve, so `pin.thumb` can be used directly as an <img src>.

// 🎓 pin for the IUT gate, matching LocationMap so the two feel consistent.
const iutIcon = L.divIcon({
  className: "iut-gate-pin",
  html: "🎓",
  iconSize: [28, 28],
  iconAnchor: [14, 14],
});

// Compact "৳9k" / "৳8.5k" label so the bubble stays small (Airbnb-style).
function priceLabel(rent) {
  if (rent == null) return "৳—";
  const k = rent / 1000;
  return `৳${Number.isInteger(k) ? k : k.toFixed(1)}k`;
}

// Airbnb-style oval price bubble. `active` lifts + inverts it so the hovered /
// selected pin stands out from the rest.
function priceIcon(rent, active) {
  return L.divIcon({
    className: "price-pin-wrap",
    html: `<div class="price-pin${active ? " active" : ""}">${priceLabel(rent)}</div>`,
    iconSize: [56, 30],
    iconAnchor: [28, 15],
    popupAnchor: [0, -16],
  });
}

// Fit the viewport to all result pins (plus the gate) whenever the set changes.
function FitBounds({ points }) {
  const map = useMap();
  useEffect(() => {
    if (!points.length) return;
    const bounds = L.latLngBounds(points);
    map.fitBounds(bounds.pad(0.25), { animate: true, maxZoom: 17 });
  }, [points, map]);
  return null;
}

/**
 * The split-view search map: one price bubble per result. Clicking a bubble
 * opens a "card kicker" popup (photo, title, rating, price) that links through
 * to the listing. Hovering a card in the list highlights its pin via `activeId`.
 */
export default function SearchMap({ pins = [], go, activeId, onActive, gate }) {
  // `gate` is the { lat, lng, label } object now returned alongside
  // /api/posts/approved (see post.controller.js) — falls back to the
  // hardcoded constant if the API hasn't been updated yet or the fetch
  // hasn't resolved.
  const gatePosition = gate ? [gate.lat, gate.lng] : IUT_GATE_LATLNG;

  const fitPoints = useMemo(
    () => (pins.length ? [...pins.map((p) => [p.lat, p.lng]), gatePosition] : []),
    [pins, gatePosition]
  );
  const center = pins.length ? [pins[0].lat, pins[0].lng] : gatePosition;

  return (
    <div className="search-map">
      <MapContainer center={center} zoom={15} scrollWheelZoom className="search-map-container">
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        <Marker position={gatePosition} icon={iutIcon}>
          <Popup>{gate?.label || "IUT Main Gate"}</Popup>
        </Marker>

        {pins.map((pin) => (
          <Marker
            key={pin.id}
            position={[pin.lat, pin.lng]}
            icon={priceIcon(pin.rent, pin.id === activeId)}
            zIndexOffset={pin.id === activeId ? 1000 : 0}
            eventHandlers={{
              click: () => onActive && onActive(pin.id),
              popupclose: () => onActive && onActive(null),
            }}
          >
            <Popup className="map-popup">
              <div className="map-popup-card">
                {pin.thumb ? (
                  <img className="map-popup-img" src={pin.thumb} alt={pin.title} />
                ) : (
                  <div className="map-popup-noimg">🏠</div>
                )}
                <div className="map-popup-body">
                  <div className="map-popup-title">{pin.title}</div>
                  <div className="map-popup-meta">
                    ⭐ {pin.ratingAvg || "New"}
                    {pin.reviewCount ? ` (${pin.reviewCount})` : ""}
                    {pin.distanceFromGateMeters != null
                      ? ` · ${
                          pin.distanceFromGateMeters < 1000
                            ? `${Math.round(pin.distanceFromGateMeters / 10) * 10} m`
                            : `${(pin.distanceFromGateMeters / 1000).toFixed(1)} km`
                        } from IUT`
                      : ""}
                  </div>
                  <div className="map-popup-price">
                    ৳{Number(pin.rent).toLocaleString()} <span>/mo</span>
                  </div>
                  <button className="map-popup-btn" onClick={() => go("detail", pin.id)}>
                    View room →
                  </button>
                </div>
              </div>
            </Popup>
          </Marker>
        ))}

        <FitBounds points={fitPoints} />
      </MapContainer>
    </div>
  );
}