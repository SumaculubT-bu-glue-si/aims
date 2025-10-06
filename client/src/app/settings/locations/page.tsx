
import LocationsClientPage from "./locations-client-page";
import { getLocations } from "./actions";

export default async function ManageLocationsPage() {
  const { locations, error } = await getLocations();
  return <LocationsClientPage initialLocations={locations} initialError={error} />;
}
