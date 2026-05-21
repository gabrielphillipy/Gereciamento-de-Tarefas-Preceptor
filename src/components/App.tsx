import { usePreceptorData } from "../hooks/usePreceptorData";
import { Dashboard } from "./Dashboard";
import { Login } from "./Login";
import { ResetPassword } from "./ResetPassword";

export function App() {
  const {
    currentUser,
    allUsers,
    items,
    loading,
    recovery,
    refreshItems,
    refreshUsers,
    logout,
  } = usePreceptorData();

  if (loading) {
    return (
      <div className="loading-screen">
        <div className="brand-mark">
          <span>P!</span>
        </div>
        <p>Carregando...</p>
      </div>
    );
  }

  if (recovery) {
    return <ResetPassword />;
  }

  if (!currentUser) {
    return <Login />;
  }

  return (
    <Dashboard
      currentUser={currentUser}
      allUsers={allUsers}
      items={items}
      onRefresh={refreshItems}
      onRefreshUsers={refreshUsers}
      onLogout={logout}
    />
  );
}
