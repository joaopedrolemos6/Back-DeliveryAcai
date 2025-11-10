import axios from "axios";

const OPENCAGE_API_KEY = "928b4f5b9b0948d8b92974cb74608186";

export async function geocodeAddress(address: {
  street: string;
  number: string;
  district?: string;
  city: string;
  state: string;
  zip: string;
}) {
  const formatted = `${address.street}, ${address.number}, ${address.district ?? ""}, ${address.city}, ${address.state}, ${address.zip}, Brazil`;

  const url = `https://api.opencagedata.com/geocode/v1/json?q=${encodeURIComponent(
    formatted
  )}&key=${OPENCAGE_API_KEY}&language=pt&countrycode=br&limit=1`;

  const res = await axios.get(url);

  if (res.data.results.length === 0) {
    return { latitude: null, longitude: null };
  }

  const { lat, lng } = res.data.results[0].geometry;
  return { latitude: lat, longitude: lng };
}
