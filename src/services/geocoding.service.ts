import axios from "axios";

type Coordinates = { lat: number; lng: number };

type Address = {
  street: string;
  number: string;
  district: string;
  city: string;
  state: string;
  zip: string;
};

export async function getCoordinatesFromAddress(address: Address): Promise<Coordinates> {
  const formatted = `${address.street}, ${address.number}, ${address.district}, ${address.city} - ${address.state}, ${address.zip}`;

  try {
    const response = await axios.get("https://api.opencagedata.com/geocode/v1/json", {
      params: {
        key: process.env.OPENCAGE_API_KEY,
        q: formatted,
        language: "pt",
        countrycode: "br",
      },
    });

    const result = response.data.results?.[0];
    if (!result) throw new Error("Endereço não encontrado");

    return {
      lat: result.geometry.lat,
      lng: result.geometry.lng,
    };
  } catch (err) {
    console.error("Erro ao obter coordenadas:", err);
    throw new Error("Não foi possível obter coordenadas do endereço");
  }
}
