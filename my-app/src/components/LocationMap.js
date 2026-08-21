import { useEffect,useMemo } from "react";
import { MapContainer, Marker, Popup, TileLayer, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

import marker2x from "leaflet/dist/images/marker-icon-2x.png";
import marker1x from "leaflet/dist/images/marker-icon.png";
import markerShadow from "leaflet/dist/images/marker-shadow.png";

const DEFAULT_CENTER = [24.242, 90.404];

// 🐛 FIX: SearchMap.js already does `import { IUT_GATE_LATLNG } from
// "./LocationMap"` — it was never exported here, so that import silently
// resolved to `undefined`, which meant SearchMap's `center` fallback and
// gate marker position were both broken. This must stay in sync with the
// backend's IUT_GATE in constants.js (23.94862, 90.37935) — the previous
// DEFAULT_CENTER above ([24.242, 90.404]) was a different, unrelated point
// and should NOT be reused for the gate.
export const IUT_GATE_LATLNG = [23.94862, 90.37935];

const DefaultIcon = L.icon({
  iconRetinaUrl: marker2x,
  iconUrl: marker1x,
  shadowUrl: markerShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

L.Marker.prototype.options.icon = DefaultIcon;

// Added by nadid
function RecenterMap({ position, zoom }) {
  const map = useMap();
 
  useEffect(() => {
    if (position && Array.isArray(position) && position.length === 2) {
      map.setView(position, zoom);
    }
  }, [position, zoom, map]);
 
  return null;
}
// till this
export default function LocationMap({
  title = "Select Location",
  description = "Zoom in, zoom out, and drag the pin to pinpoint the property.",
  center = DEFAULT_CENTER,
  markerPosition,
  draggable = false,
  zoom = 16,
  height = 320,
  onPositionChange,
}) {
  const position = useMemo(() => markerPosition || center, [markerPosition, center]);

  return (
    <div className="map-shell" style={{ height }}>
      <div className="map-header">
        <div>
          <div className="map-title">{title}</div>
          <div className="map-description">{description}</div>
        </div>
        <div className="map-zoom-hint">+ / -</div>
      </div>

      <MapContainer center={center} zoom={zoom} scrollWheelZoom className="map-container">
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {/* FIX: RecenterMap was defined but never rendered, so once the map
            mounted it never moved again even if a real house position
            arrived after the initial render (e.g. loaded asynchronously).
            react-leaflet's MapContainer `center` prop is only used on the
            very first mount, so anything that renders LocationMap before
            its data has loaded got stuck on the initial center forever. */}
         <RecenterMap position={position} zoom={zoom} />
         
        <Marker
          position={position}
          draggable={draggable}
          eventHandlers={{
            dragend: event => {
              if (!onPositionChange) return;
              const marker = event.target;
              const nextPosition = marker.getLatLng();
              onPositionChange([nextPosition.lat, nextPosition.lng]);
            },
          }}
        >
          <Popup>{title}</Popup>
        </Marker>
      </MapContainer>
    </div>
  );
}