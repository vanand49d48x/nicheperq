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
  mapboxToken?: string;
}

export const LeadsMap = ({ leads, onBoundsChange, mapboxToken }: LeadsMapProps) => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const markers = useRef<mapboxgl.Marker[]>([]);

  useEffect(() => {
    if (!mapContainer.current) return;

    // Determine Mapbox token from props, env, or localStorage
    const tokenFromStorage = typeof window !== 'undefined' ? localStorage.getItem('mapbox_public_token') : null;
    const token = mapboxToken || import.meta.env.VITE_MAPBOX_TOKEN || tokenFromStorage || "";
    
    console.log("Checking Mapbox token availability...", {
      hasToken: !!token,
      tokenLength: token?.length || 0
    });
    
    if (!token) {
      console.error("Mapbox token not found in environment variables");
      // Show error message in the map container
      if (mapContainer.current) {
        mapContainer.current.innerHTML = `
          <div style="display: flex; align-items: center; justify-content: center; height: 100%; background: #f3f4f6; color: #374151; padding: 20px; text-align: center;">
            <div>
              <h3 style="margin: 0 0 8px 0; font-size: 18px; font-weight: 600;">Map Configuration Required</h3>
              <p style="margin: 0; font-size: 14px;">Please refresh the page after adding your Mapbox token.</p>
            </div>
          </div>
        `;
      }
      return;
    }

    console.log("Initializing Mapbox map with valid token");
    mapboxgl.accessToken = token;

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
  }, [onBoundsChange, mapboxToken]);

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

      const lat = Number(lead.latitude);
      const lng = Number(lead.longitude);
      if (!isFinite(lat) || !isFinite(lng)) return;

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
        .setLngLat([lng, lat])
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
          const lat = Number(lead.latitude);
          const lng = Number(lead.longitude);
          if (isFinite(lat) && isFinite(lng)) {
            bounds.extend([lng, lat]);
          }
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
