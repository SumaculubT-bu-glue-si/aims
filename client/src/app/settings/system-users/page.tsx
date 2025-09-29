
import SystemUsersClientPage from "./system-users-client-page";
import { getSystemUsers } from './actions';

export default async function ManageSystemUsersPage() {
  const { users, error } = await getSystemUsers();
  return <SystemUsersClientPage initialUsers={users} initialError={error} />;
}
