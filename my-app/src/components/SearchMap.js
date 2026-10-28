import { useEffect, useMemo, useRef } from "react";
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

// Bubble for several listings sharing one spot: lowest price + an asterisk.
function groupIcon(minRent, active) {
  return L.divIcon({
    className: "price-pin-wrap",
    html: `<div class="price-pin${active ? " active" : ""}" title="Multiple listings here">${priceLabel(minRent)}*</div>`,
    iconSize: [62, 30],
    iconAnchor: [31, 15],
    popupAnchor: [0, -16],
  });
}

// Pins whose coordinates match (to ~1 m) are merged into one group so
// overlapping price bubbles don't hide each other.
function groupPins(pins) {
  const map = new Map();
  pins.forEach((p) => {
    const key = `${Number(p.lat).toFixed(5)},${Number(p.lng).toFixed(5)}`;
    if (!map.has(key)) map.set(key, { key, lat: p.lat, lng: p.lng, items: [] });
    map.get(key).items.push(p);
  });
  return [...map.values()];
}

function formatDistance(m) {
  if (m == null) return "";
  return m < 1000 ? `${Math.round(m / 10) * 10} m` : `${(m / 1000).toFixed(1)} km`;
}

// One map marker = one location. A single listing keeps the original click
// popup. Several listings at the same spot show "৳8k*" and, on hover, a list
// of every house there; clicking a row opens that house's details.
function PinMarker({ group, activeId, onActive, go }) {
  const markerRef = useRef(null);
  const timer = useRef(null);
  const multi = group.items.length > 1;
  const active = group.items.some((p) => p.id === activeId);

  useEffect(() => () => clearTimeout(timer.current), []);

  // Small delay so the cursor can travel from the pin into the popup
  const cancelClose = () => clearTimeout(timer.current);
  const scheduleClose = () => {
    clearTimeout(timer.current);
    timer.current = setTimeout(() => markerRef.current?.closePopup(), 250);
  };

  if (!multi) {
    const pin = group.items[0];
    return (
      <Marker
        position={[pin.lat, pin.lng]}
        icon={priceIcon(pin.rent, active)}
        zIndexOffset={active ? 1000 : 0}
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
                  ? ` · ${formatDistance(pin.distanceFromGateMeters)} from IUT`
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
    );
  }

  const minRent = Math.min(...group.items.map((p) => Number(p.rent)).filter((n) => !Number.isNaN(n)));

  return (
    <Marker
      ref={markerRef}
      position={[group.lat, group.lng]}
      icon={groupIcon(Number.isFinite(minRent) ? minRent : null, active)}
      zIndexOffset={active ? 1000 : 500}
      eventHandlers={{
        mouseover: (e) => { cancelClose(); e.target.openPopup(); },
        mouseout: scheduleClose,
        popupclose: () => onActive && onActive(null),
      }}
    >
      <Popup className="map-popup" minWidth={250} maxWidth={290} closeButton={false}>
        <div onMouseEnter={cancelClose} onMouseLeave={scheduleClose} style={{ minWidth: 240 }}>
          <div style={{ fontWeight: 700, marginBottom: 8 }}>
            {group.items.length} listings at this location
          </div>
          <div style={{ maxHeight: 230, overflowY: "auto", display: "flex", flexDirection: "column", gap: 6 }}>
            {group.items.map((p) => (
              <button
                type="button"
                key={p.id}
                onClick={() => go("detail", p.id)}
                style={{
                  display: "flex", alignItems: "center", gap: 10, width: "100%",
                  padding: 6, textAlign: "left", cursor: "pointer",
                  border: "1px solid #e5e5e5", borderRadius: 8, background: "#fff", color: "inherit",
                }}
              >
                {p.thumb ? (
                  <img src={p.thumb} alt={p.title} style={{ width: 48, height: 48, objectFit: "cover", borderRadius: 6, flexShrink: 0 }} />
                ) : (
                  <div style={{ width: 48, height: 48, display: "flex", alignItems: "center", justifyContent: "center", background: "#f3f3f3", borderRadius: 6, flexShrink: 0 }}>🏠</div>
                )}
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontWeight: 700, fontSize: ".85rem", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{p.title}</div>
                  <div style={{ fontSize: ".8rem" }}>৳{Number(p.rent).toLocaleString()} /mo</div>
                  <div style={{ fontSize: ".75rem", opacity: 0.7 }}>View details →</div>
                </div>
              </button>
            ))}
          </div>
        </div>
      </Popup>
    </Marker>
  );
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
  // useMemo keeps the array identity stable; otherwise FitBounds would re-fit
  // the map on every re-render (e.g. each time a card is hovered).
  const gatePosition = useMemo(
    () => (gate ? [gate.lat, gate.lng] : IUT_GATE_LATLNG),
    [gate?.lat, gate?.lng] // eslint-disable-line react-hooks/exhaustive-deps
  );
  const groups = useMemo(() => groupPins(pins), [pins]);

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

        {groups.map((group) => (
          <PinMarker key={group.key} group={group} activeId={activeId} onActive={onActive} go={go} />
        ))}

        <FitBounds points={fitPoints} />
      </MapContainer>
    </div>
  );
}