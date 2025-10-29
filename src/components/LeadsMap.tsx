import { useEffect, useRef } from "react";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";

interface Lead {
  id: string;
  business_name: string;
  address: string | null;
  city: string;
  state: string | null;
  latitude?: number | null;
  longitude?: number | null;
}

interface LeadsMapProps {
  leads: Lead[];
  onBoundsChange?: (bounds: mapboxgl.LngLatBounds) => void;
}

export const LeadsMap = ({ leads, onBoundsChange }: LeadsMapProps) => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const markers = useRef<mapboxgl.Marker[]>([]);

  useEffect(() => {
    if (!mapContainer.current) return;

    const mapboxToken = import.meta.env.VITE_MAPBOX_TOKEN;
    if (!mapboxToken) {
      console.error("Mapbox token not found");
      return;
    }

    mapboxgl.accessToken = mapboxToken;

    // Initialize map
    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: "mapbox://styles/mapbox/streets-v12",
      center: [-84.39, 33.95], // Default to Atlanta area
      zoom: 10,
    });

    map.current.addControl(new mapboxgl.NavigationControl(), "top-right");

    // Add bounds change listener
    if (onBoundsChange) {
      map.current.on("moveend", () => {
        if (map.current) {
          onBoundsChange(map.current.getBounds());
        }
      });
    }

    return () => {
      markers.current.forEach((marker) => marker.remove());
      map.current?.remove();
    };
  }, [onBoundsChange]);

  useEffect(() => {
    if (!map.current) return;

    // Remove existing markers
    markers.current.forEach((marker) => marker.remove());
    markers.current = [];

    // Filter leads with valid coordinates
    const validLeads = leads.filter(
      (lead) => lead.latitude != null && lead.longitude != null
    );

    if (validLeads.length === 0) return;

    // Add new markers
    validLeads.forEach((lead) => {
      if (lead.latitude == null || lead.longitude == null) return;

      const el = document.createElement("div");
      el.className = "marker";
      el.style.width = "24px";
      el.style.height = "24px";
      el.style.borderRadius = "50%";
      el.style.backgroundColor = "hsl(var(--primary))";
      el.style.border = "2px solid white";
      el.style.cursor = "pointer";
      el.style.boxShadow = "0 2px 4px rgba(0,0,0,0.3)";

      const marker = new mapboxgl.Marker(el)
        .setLngLat([lead.longitude, lead.latitude])
        .setPopup(
          new mapboxgl.Popup({ offset: 25 }).setHTML(
            `<div style="padding: 8px;">
              <h3 style="margin: 0 0 4px 0; font-weight: 600; font-size: 14px;">${lead.business_name}</h3>
              <p style="margin: 0; font-size: 12px; color: #666;">${lead.address || ""}</p>
              <p style="margin: 4px 0 0 0; font-size: 12px; color: #666;">${lead.city}${lead.state ? `, ${lead.state}` : ""}</p>
            </div>`
          )
        )
        .addTo(map.current!);

      markers.current.push(marker);
    });

    // Fit map to show all markers
    if (validLeads.length > 0) {
      const bounds = new mapboxgl.LngLatBounds();
      validLeads.forEach((lead) => {
        if (lead.latitude != null && lead.longitude != null) {
          bounds.extend([lead.longitude, lead.latitude]);
        }
      });
      map.current.fitBounds(bounds, { padding: 50, maxZoom: 14 });
    }
  }, [leads]);

  return (
    <div className="relative w-full h-[500px] rounded-lg overflow-hidden border">
      <div ref={mapContainer} className="absolute inset-0" />
    </div>
  );
};
