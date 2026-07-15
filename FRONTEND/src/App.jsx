import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import ProtectedRoute from "./components/common/ProtectedRoute";
import { AuthProvider } from "./context/AuthContext";
import AppLayout from "./layouts/AppLayout";
import Dashboard from "./pages/Dashboard";
import Finance from "./pages/Finance";
import Locations from "./pages/Locations";
import Login from "./pages/Login";
import Parkings from "./pages/Parkings";
import Users from "./pages/Users";
import Vehicles from "./pages/Vehicles";

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route
            element={
              <ProtectedRoute>
                <AppLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<Dashboard />} />
            <Route path="/vehicles" element={<Vehicles />} />
            <Route path="/operations" element={<Locations />} />
            <Route path="/locations" element={<Navigate to="/operations" replace />} />
            <Route path="/payments" element={<Navigate to="/operations" replace />} />
            <Route path="/parkings" element={<Parkings />} />
            <Route path="/finance" element={<Finance />} />
            <Route path="/users" element={<Users />} />
          </Route>
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
