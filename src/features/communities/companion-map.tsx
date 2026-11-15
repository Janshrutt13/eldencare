"use client";
import { useEffect, useState } from "react";
import {
  MapContainer,
  TileLayer,
  Circle,
  Marker,
  Popup,
  useMap,
} from "react-leaflet";
import { divIcon, latLng } from "leaflet";
import "leaflet/dist/leaflet.css";
import { DEMO_CENTER } from "@/features/demo/catalog";
import type { DemoPerson } from "@/types/social";

const markerIcon = divIcon({
  className: "demo-map-marker",
  html: '<span aria-hidden="true"></span>',
  iconSize: [32, 32],
  iconAnchor: [16, 16],
});
function RadiusBounds({ radius }: { radius: number }) {
  const map = useMap();
  useEffect(() => {
    map.fitBounds(
      latLng(DEMO_CENTER.latitude, DEMO_CENTER.longitude).toBounds(
        radius * 2200,
      ),
      { animate: false, padding: [16, 16] },
    );
  }, [map, radius]);
  return null;
}
export default function CompanionMap({
  people,
  radius,
  onView,
}: {
  people: (DemoPerson & { distance_km: number })[];
  radius: number;
  onView: (key: string) => void;
}) {
  const [tileError, setTileError] = useState(false);
  return (
    <div className="stack">
      {tileError && (
        <p role="status" className="notice">
          Map tiles could not load. The companion cards and distance filtering
          still work.
        </p>
      )}
      <MapContainer
        center={[DEMO_CENTER.latitude, DEMO_CENTER.longitude]}
        zoom={12}
        scrollWheelZoom={false}
        className="demo-map"
        aria-label="Fictional Jaipur companion locations"
      >
        <TileLayer
          url="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          eventHandlers={{ tileerror: () => setTileError(true) }}
        />
        <RadiusBounds radius={radius} />
        <Circle
          center={[DEMO_CENTER.latitude, DEMO_CENTER.longitude]}
          radius={radius * 1000}
          pathOptions={{
            color: "#262626",
            weight: 2,
            fillColor: "#737373",
            fillOpacity: 0.08,
            dashArray: "6 6",
          }}
        />
        {people.map((person) => (
          <Marker
            key={person.demo_key}
            position={[person.latitude, person.longitude]}
            icon={markerIcon}
            title={`${person.display_name} — fictional demo profile`}
            eventHandlers={{ mouseover: (event) => event.target.openPopup() }}
          >
            <Popup minWidth={220}>
              <div className="stack !gap-2">
                <strong>
                  {person.display_name}, {person.age}
                </strong>
                <span>
                  Fictional profile · about {person.distance_km.toFixed(1)} km
                </span>
                <span>{person.interests.join(" · ")}</span>
                <span>Demo availability: {person.availability}</span>
                <button
                  className="button"
                  onClick={() => onView(person.demo_key)}
                >
                  View profile
                </button>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
}
