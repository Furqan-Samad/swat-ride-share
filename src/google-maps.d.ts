// Global Google Maps type declarations
// These are loaded at runtime via script tag, so we declare them globally
declare namespace google.maps {
  class Map {
    constructor(mapDiv: Element, opts?: MapOptions);
    setCenter(latlng: LatLng | LatLngLiteral): void;
    setZoom(zoom: number): void;
    getZoom(): number | undefined;
    fitBounds(bounds: LatLngBounds): void;
    panTo(latLng: LatLng | LatLngLiteral): void;
  }

  class Marker {
    constructor(opts?: MarkerOptions);
    setPosition(latlng: LatLng | LatLngLiteral): void;
    setMap(map: Map | null): void;
    getPosition(): LatLng | null;
  }

  class LatLng {
    constructor(lat: number, lng: number);
    lat(): number;
    lng(): number;
  }

  class LatLngBounds {
    constructor(sw?: LatLng | LatLngLiteral, ne?: LatLng | LatLngLiteral);
    extend(point: LatLng | LatLngLiteral): LatLngBounds;
  }

  class DirectionsService {
    route(request: DirectionsRequest, callback: (result: DirectionsResult | null, status: DirectionsStatus) => void): void;
  }

  class DirectionsRenderer {
    constructor(opts?: any);
    setDirections(directions: DirectionsResult): void;
    setMap(map: Map | null): void;
  }

  class Geocoder {
    geocode(request: GeocoderRequest, callback: (results: GeocoderResult[] | null, status: GeocoderStatus) => void): void;
  }

  namespace places {
    class AutocompleteService {
      getPlacePredictions(request: AutocompletionRequest, callback: (predictions: AutocompletePrediction[] | null, status: PlacesServiceStatus) => void): void;
    }

    class PlacesService {
      constructor(attrContainer: Element | Map);
      getDetails(request: PlaceDetailsRequest, callback: (result: PlaceResult | null, status: PlacesServiceStatus) => void): void;
    }

    interface AutocompletePrediction {
      description: string;
      place_id: string;
      structured_formatting: {
        main_text: string;
        secondary_text: string;
      };
    }

    interface AutocompletionRequest {
      input: string;
      componentRestrictions?: { country: string | string[] };
    }

    interface PlaceDetailsRequest {
      placeId: string;
      fields?: string[];
    }

    interface PlaceResult {
      geometry?: {
        location?: LatLng;
      };
      formatted_address?: string;
      name?: string;
    }

    enum PlacesServiceStatus {
      OK = 'OK',
      ZERO_RESULTS = 'ZERO_RESULTS',
      ERROR = 'ERROR',
    }
  }

  namespace event {
    function addListenerOnce(instance: any, eventName: string, handler: (...args: any[]) => void): MapsEventListener;
  }

  interface MapsEventListener {
    remove(): void;
  }

  interface MapOptions {
    zoom?: number;
    center?: LatLng | LatLngLiteral;
    mapTypeControl?: boolean;
    streetViewControl?: boolean;
    fullscreenControl?: boolean;
    zoomControl?: boolean;
  }

  interface LatLngLiteral {
    lat: number;
    lng: number;
  }

  interface MarkerOptions {
    position?: LatLng | LatLngLiteral;
    map?: Map;
    title?: string;
    icon?: string | Icon | Symbol;
    label?: string;
  }

  interface Symbol {
    path: SymbolPath | string;
    scale?: number;
    fillColor?: string;
    fillOpacity?: number;
    strokeColor?: string;
    strokeWeight?: number;
    url?: string;
  }

  interface Icon {
    url: string;
    scaledSize?: Size;
    anchor?: Point;
  }

  class Size {
    constructor(width: number, height: number);
  }

  class Point {
    constructor(x: number, y: number);
  }

  enum SymbolPath {
    CIRCLE = 0,
    FORWARD_CLOSED_ARROW = 1,
    FORWARD_OPEN_ARROW = 2,
    BACKWARD_CLOSED_ARROW = 3,
    BACKWARD_OPEN_ARROW = 4,
  }

  enum TravelMode {
    DRIVING = 'DRIVING',
    WALKING = 'WALKING',
    BICYCLING = 'BICYCLING',
    TRANSIT = 'TRANSIT',
  }

  enum DirectionsStatus {
    OK = 'OK',
    NOT_FOUND = 'NOT_FOUND',
    ZERO_RESULTS = 'ZERO_RESULTS',
  }

  interface DirectionsRequest {
    origin: string | LatLng | LatLngLiteral;
    destination: string | LatLng | LatLngLiteral;
    travelMode: TravelMode;
  }

  interface DirectionsResult {
    routes: DirectionsRoute[];
  }

  interface DirectionsRoute {
    legs: DirectionsLeg[];
    overview_polyline: string;
  }

  interface DirectionsLeg {
    distance?: { text: string; value: number };
    duration?: { text: string; value: number };
    start_address?: string;
    end_address?: string;
  }

  interface GeocoderRequest {
    address?: string;
    location?: LatLng | LatLngLiteral;
    placeId?: string;
  }

  interface GeocoderResult {
    geometry: {
      location: LatLng;
    };
    formatted_address: string;
  }

  enum GeocoderStatus {
    OK = 'OK',
    ZERO_RESULTS = 'ZERO_RESULTS',
    ERROR = 'ERROR',
  }
}
