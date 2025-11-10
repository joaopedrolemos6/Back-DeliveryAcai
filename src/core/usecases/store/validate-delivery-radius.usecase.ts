import { addressesRepo } from "../../../infra/repositories/addresses.repo";
import { getCoordinatesFromAddress } from "../../../services/geocoding.service";
import { BadRequestError } from "../../errors/app-error";

function toRad(value: number) {
  return (value * Math.PI) / 180;
}

function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number) {
  const R = 6371; // km
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

export async function validateAddressInRadius(
  userId: string,
  addressId: string,
  settings: {
    latitude: number;
    longitude: number;
    delivery_radius_km: number;
  }
) {
  const address = await addressesRepo.findOwnedById(userId, addressId);
  if (!address) throw new BadRequestError("Endereço não encontrado");

  if (address.latitude == null || address.longitude == null) {
    const coords = await getCoordinatesFromAddress(address);
    if (!coords) throw new BadRequestError("Não foi possível obter coordenadas do endereço");

    address.latitude = coords.lat;
    address.longitude = coords.lng;

    // Atualiza o endereço no banco com as coordenadas
    await addressesRepo.updateOwned(userId, addressId, {
      latitude: coords.lat,
      longitude: coords.lng
    });
  }

  const distance = calculateDistance(
    settings.latitude,
    settings.longitude,
    address.latitude,
    address.longitude
  );

  if (distance > settings.delivery_radius_km) {
    throw new BadRequestError("Endereço fora da área de entrega");
  }
}
