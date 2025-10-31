import { addressesRepo } from "../../../infra/repositories/addresses.repo";
import { BadRequestError } from "../../errors/app-error";

function haversineKm(lat1:number, lon1:number, lat2:number, lon2:number){
  const R = 6371;
  const dLat = (lat2-lat1) * Math.PI/180;
  const dLon = (lon2-lon1) * Math.PI/180;
  const a = Math.sin(dLat/2)**2 + Math.cos(lat1*Math.PI/180)*Math.cos(lat2*Math.PI/180)*Math.sin(dLon/2)**2;
  return R * (2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a)));
}

export async function validateAddressInRadius(userId: string, addressId: string, settings:any){
  const addr = await addressesRepo.findOwnedById(userId, addressId);
  if (!addr) throw new BadRequestError("Endereço inválido");
  if (addr.latitude == null || addr.longitude == null) throw new BadRequestError("Endereço sem coordenadas");
  if (settings.latitude == null || settings.longitude == null) throw new BadRequestError("Loja sem coordenadas configuradas");
  const km = haversineKm(addr.latitude, addr.longitude, settings.latitude, settings.longitude);
  if (km > settings.delivery_radius_km) throw new BadRequestError("Fora da área de entrega");
}
