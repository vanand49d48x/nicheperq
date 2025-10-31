import { useEffect, useRef } from "react";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";

interface Lead {
  id: string;
  business_name: string;
  address: string | null;
  latitude?: number | null;
  longitude?: number | null;
  rating?: number | null;
  review_count?: number | null;
}

interface LeadsMapProps {
  leads: Lead[];
  onBoundsChange?: (bounds: mapboxgl.LngLatBounds) => void;
  mapboxToken?: string;
  locationQuery?: string;
  hoveredLeadId?: string | null;
  onLeadHover?: (id: string | null) => void;
  searchRadius?: number;
}

export const LeadsMap = ({ leads, onBoundsChange, mapboxToken, locationQuery, hoveredLeadId, onLeadHover, searchRadius = 10 }: LeadsMapProps) => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const markers = useRef<Map<string, { marker: mapboxgl.Marker; element: HTMLDivElement; lead: Lead }>>(new Map());
  const locationMarker = useRef<mapboxgl.Marker | null>(null);

  useEffect(() => {
    if (!mapContainer.current) return;
    if (map.current) return; // Initialize map only once

    // Resolve token: props -> env -> localStorage
    const tokenFromStorage = typeof window !== 'undefined' ? localStorage.getItem('mapbox_public_token') : null;
    const token = mapboxToken || import.meta.env.VITE_MAPBOX_TOKEN || tokenFromStorage || "";

    console.log("Checking for Mapbox token...");
    console.log("Token from props:", mapboxToken ? "exists" : "none");
    console.log("Token from env (VITE_MAPBOX_TOKEN):", import.meta.env.VITE_MAPBOX_TOKEN ? "exists" : "none");
    console.log("Token from localStorage:", tokenFromStorage ? "exists" : "none");
    console.log("Final token used:", token ? "exists" : "MISSING");

    if (!token) {
      console.error("No Mapbox token available. Map cannot be initialized.");
      if (mapContainer.current) {
        mapContainer.current.innerHTML = `
          <div style="display: flex; align-items: center; justify-content: center; height: 100%; background: #f5f5f5; color: #666; font-family: system-ui, sans-serif; padding: 20px; text-align: center;">
            <div>
              <p style="margin-bottom: 8px; font-weight: 600;">Mapbox token required</p>
              <p style="font-size: 14px;">Please enter your Mapbox public token above and click "Save".</p>
              <p style="font-size: 12px; margin-top: 8px; color: #999;">Get your token at <a href="https://mapbox.com" target="_blank" style="color: #0066cc;">mapbox.com</a></p>
            </div>
          </div>
        `;
      }
      return;
    }

    console.log("Initializing Mapbox map with valid token");
    mapboxgl.accessToken = token;

    // Ensure container is empty to avoid Mapbox warning
    if (mapContainer.current) {
      mapContainer.current.innerHTML = "";
    }

    // Initialize map
    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: "mapbox://styles/mapbox/streets-v12",
      center: [-98.5795, 39.8283], // Center of US
      zoom: 3,
    });

    map.current.addControl(new mapboxgl.NavigationControl(), "top-right");

    // Track bounds changes
    if (onBoundsChange) {
      map.current.on("moveend", () => {
        if (map.current) {
          onBoundsChange(map.current.getBounds());
        }
      });
    }

    return () => {
      locationMarker.current?.remove();
      markers.current.forEach(({ marker }) => marker.remove());
      markers.current.clear();
      map.current?.remove();
    };
  }, [mapboxToken]);

  useEffect(() => {
    if (!map.current) return;

    // Clear existing markers
    markers.current.forEach(({ marker }) => marker.remove());
    markers.current.clear();

    const validLeads = leads.filter((l) => {
      const lat = Number(l.latitude);
      const lng = Number(l.longitude);
      return isFinite(lat) && isFinite(lng);
    });

    console.log(`Rendering ${validLeads.length} valid markers on map`);

    // Add markers for each valid lead
    validLeads.forEach((lead) => {
      const el = document.createElement("div");
      el.style.width = "32px";
      el.style.height = "32px";
      el.style.borderRadius = "50%";
      el.style.backgroundColor = "hsl(var(--destructive))";
      el.style.border = "3px solid white";
      el.style.boxShadow = "0 2px 6px rgba(0,0,0,0.3)";
      el.style.cursor = "pointer";
      el.style.transition = "background-color 0.2s ease, box-shadow 0.2s ease, border 0.2s ease, width 0.2s ease, height 0.2s ease";
      el.style.willChange = "background-color, box-shadow, border, width, height";
      el.style.pointerEvents = "auto";

      const lat = Number(lead.latitude);
      const lng = Number(lead.longitude);

      const marker = new mapboxgl.Marker(el)
        .setLngLat([lng, lat])
        .setPopup(
          new mapboxgl.Popup({ offset: 25, closeButton: false }).setHTML(`
            <div style="font-family: system-ui, sans-serif;">
              <strong style="display: block; margin-bottom: 4px;">${lead.business_name}</strong>
              <div style="font-size: 12px; color: #666; margin-bottom: 4px;">${lead.address || "N/A"}</div>
              ${lead.rating ? `<div style="font-size: 12px;">⭐ ${lead.rating} ${lead.review_count ? `(${lead.review_count} reviews)` : ""}</div>` : ""}
            </div>
          `)
        )
        .addTo(map.current!);

      // Add hover event listeners to marker with better detection
      el.addEventListener('mouseenter', (e) => {
        e.stopPropagation();
        onLeadHover?.(lead.id);
        marker.getPopup().addTo(map.current!);
      });

      el.addEventListener('mouseleave', (e) => {
        e.stopPropagation();
        onLeadHover?.(null);
        marker.getPopup().remove();
      });

      markers.current.set(lead.id, { marker, element: el, lead });
    });

    // Fit map to show all markers
    if (validLeads.length === 1) {
      const only = validLeads[0];
      const lat = Number(only.latitude);
      const lng = Number(only.longitude);
      if (isFinite(lat) && isFinite(lng)) {
        map.current.easeTo({ center: [lng, lat], zoom: 13 });
      }
    } else if (validLeads.length > 1) {
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
      map.current.fitBounds(bounds, { padding: 50 });
    }
  }, [leads]);

  // Update marker appearance when hoveredLeadId changes
  useEffect(() => {
    markers.current.forEach(({ element, lead, marker }) => {
      if (hoveredLeadId === lead.id) {
        // Highlight this marker
        element.style.width = "40px";
        element.style.height = "40px";
        element.style.backgroundColor = "hsl(var(--primary))";
        element.style.border = "4px solid white";
        element.style.boxShadow = "0 4px 12px rgba(0,0,0,0.4)";
        element.style.zIndex = "1000";
        marker.getPopup().addTo(map.current!);
      } else {
        // Reset to normal
        element.style.width = "32px";
        element.style.height = "32px";
        element.style.backgroundColor = "hsl(var(--destructive))";
        element.style.border = "3px solid white";
        element.style.boxShadow = "0 2px 6px rgba(0,0,0,0.3)";
        element.style.zIndex = "";
        marker.getPopup().remove();
      }
    });
  }, [hoveredLeadId]);

  // Geocode the requested location and focus map when there are no markers
  useEffect(() => {
    if (!map.current) return;
    if (!locationQuery) return;

    // Resolve token again (props -> env -> localStorage)
    const tokenFromStorage = typeof window !== 'undefined' ? localStorage.getItem('mapbox_public_token') : null;
    const token = mapboxToken || import.meta.env.VITE_MAPBOX_TOKEN || tokenFromStorage || "";

    if (!token) return;

    const controller = new AbortController();

    const fetchGeocode = async () => {
      try {
        const resp = await fetch(`https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(locationQuery)}.json?limit=1&access_token=${token}`, { signal: controller.signal });
        const json = await resp.json();
        const feature = json?.features?.[0];
        if (!feature?.center) return;
        const [lng, lat] = feature.center;
        
        // Add or update a distinct marker for the searched location
        const el = document.createElement("div");
        el.style.width = "18px";
        el.style.height = "18px";
        el.style.borderRadius = "50%";
        el.style.backgroundColor = "hsl(var(--primary))";
        el.style.border = "3px solid white";
        el.style.boxShadow = "0 2px 6px rgba(0,0,0,0.35)";

        locationMarker.current?.remove();
        locationMarker.current = new mapboxgl.Marker(el).setLngLat([lng, lat]).addTo(map.current!);

        // Add circle layer to show search radius
        const sourceId = 'search-radius';
        const layerId = 'search-radius-layer';
        const outlineLayerId = `${layerId}-outline`;
        
        // Remove existing circle if present and (re)add once style is ready
        // Create circle using turf-like calculation
        const radiusInKm = searchRadius * 1.60934; // Convert miles to km
        const points = 64;
        const coords: [number, number][] = [];
        for (let i = 0; i < points; i++) {
          const angle = (i / points) * 2 * Math.PI;
          const dx = radiusInKm * Math.cos(angle);
          const dy = radiusInKm * Math.sin(angle);
          const pointLng = lng + (dx / (111.32 * Math.cos(lat * Math.PI / 180)));
          const pointLat = lat + (dy / 110.574);
          coords.push([pointLng, pointLat]);
        }
        coords.push(coords[0]); // Close the polygon

        // Resolve a real CSS color from our design token
        const root = document.documentElement;
        const hslPrimary = getComputedStyle(root).getPropertyValue('--primary').trim();
        const fillColor = `hsl(${hslPrimary})`;

        const addCircleLayers = () => {
          if (map.current!.getLayer(outlineLayerId)) {
            map.current!.removeLayer(outlineLayerId);
          }
          if (map.current!.getLayer(layerId)) {
            map.current!.removeLayer(layerId);
          }
          if (map.current!.getSource(sourceId)) {
            map.current!.removeSource(sourceId);
          }

          map.current!.addSource(sourceId, {
            type: 'geojson',
            data: {
              type: 'Feature',
              geometry: {
                type: 'Polygon',
                coordinates: [coords]
              },
              properties: {}
            }
          });

          map.current!.addLayer({
            id: layerId,
            type: 'fill',
            source: sourceId,
            paint: {
              'fill-color': fillColor,
              'fill-opacity': 0.12
            }
          });

          map.current!.addLayer({
            id: outlineLayerId,
            type: 'line',
            source: sourceId,
            paint: {
              'line-color': fillColor,
              'line-width': 2,
              'line-opacity': 0.5
            }
          });
        };

        if (map.current!.isStyleLoaded()) {
          addCircleLayers();
        } else {
          map.current!.once('style.load', addCircleLayers);
        }

        // Calculate bounds based on search radius
        const radiusInDegrees = searchRadius * 0.0145;
        const bounds = new mapboxgl.LngLatBounds(
          [lng - radiusInDegrees, lat - radiusInDegrees],
          [lng + radiusInDegrees, lat + radiusInDegrees]
        );
        
        map.current!.fitBounds(bounds, { padding: 50 });
      } catch (e) {
        // ignore aborts
      }
    };

    fetchGeocode();
    return () => controller.abort();
  }, [locationQuery, mapboxToken, searchRadius]);

  return (
    <div className="relative w-full h-full">
      <div ref={mapContainer} className="absolute inset-0" />
    </div>
  );
};
