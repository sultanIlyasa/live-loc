let map, marker, circle, zoomed;
let currentPosition = null;

// Initialize the map
function initMap() {
  map = L.map("map").setView([51.505, -0.09], 13);

  L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
    maxZoom: 19,
    attribution: "© OpenStreetMap",
  }).addTo(map);

  navigator.geolocation.watchPosition(success, error);
}

// Update the map with the current position
function success(pos) {
  const lat = pos.coords.latitude;
  const lng = pos.coords.longitude;
  const accuracy = pos.coords.accuracy;

  currentPosition = pos;

  if (marker) {
    map.removeLayer(marker);
    map.removeLayer(circle);
  }

  marker = L.marker([lat, lng]).addTo(map);
  circle = L.circle([lat, lng], { radius: accuracy }).addTo(map);

  if (!zoomed) {
    zoomed = map.fitBounds(circle.getBounds());
  }

  map.setView([lat, lng]);
}

function error(err) {
  if (err.code === 1) {
    alert("Please allow geolocation access");
  } else {
    alert("Cannot get current location");
  }
}

async function reverseGeocode(lat, lon) {
  const baseUrl = "https://nominatim.openstreetmap.org/reverse";
  const params = new URLSearchParams({
    lat: lat,
    lon: lon,
    format: "json",
  });

  try {
    const response = await fetch(`${baseUrl}?${params}`);

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error("There was a problem with the fetch operation:", error);
    return null;
  }
}

function exportToJSON(data) {
  const jsonString = JSON.stringify(data, null, 2);
  const blob = new Blob([jsonString], { type: "application/json" });
  const url = URL.createObjectURL(blob);

  const a = document.createElement("a");
  a.href = url;
  a.download = "geocode_result.json";
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

document.getElementById("geocodeBtn").addEventListener("click", async () => {
  if (!currentPosition) {
    alert("Waiting for location data. Please try again in a moment.");
    return;
  }

  const latitude = currentPosition.coords.latitude;
  const longitude = currentPosition.coords.longitude;

  const geocodeResult = await reverseGeocode(latitude, longitude);
  const resultDiv = document.getElementById("result");

  if (geocodeResult) {
    resultDiv.textContent = `Address: ${geocodeResult.display_name}`;
    document.getElementById("exportBtn").disabled = false;
  } else {
    resultDiv.textContent = "Failed to retrieve address.";
    document.getElementById("exportBtn").disabled = true;
  }
});

document.getElementById("exportBtn").addEventListener("click", async () => {
  if (!currentPosition) {
    alert("No location data available.");
    return;
  }

  const latitude = currentPosition.coords.latitude;
  const longitude = currentPosition.coords.longitude;

  const geocodeResult = await reverseGeocode(latitude, longitude);
  if (geocodeResult) {
    exportToJSON(geocodeResult);
  } else {
    alert("Failed to retrieve address for export.");
  }
});

// Initialize the map when the script loads
initMap();
