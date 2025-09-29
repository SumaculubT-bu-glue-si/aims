
import AssetFieldsClientPage from "./asset-fields-client-page";
import { getAssetFields } from "./actions";

export default async function ManageAssetFieldsPage() {
  const { fields, error } = await getAssetFields();
  return <AssetFieldsClientPage initialFields={fields} initialError={error} />
}
