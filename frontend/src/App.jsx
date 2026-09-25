import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom"

import Login from "./pages/Login"
import Register from "./pages/Register"
import RegisterComplaint from "./pages/RegisterComplaint"
import CitizenDashboard from "./pages/CitizenDashboard"
import CitizenProfile from "./pages/CitizenProfile"
import MyComplaints from "./pages/MyComplaints"
import OfficerDashboard from "./pages/OfficerDashboard"
import DepartmentDashboard from "./pages/DepartmentDashboard"
import AdminDashboard from "./pages/AdminDashboard"
import WardDashboard from "./pages/WardDashboard"
import OfficerProfile from "./pages/OfficerProfile"
import DepartmentProfile from "./pages/DepartmentProfile"


function App() {
  return (
    <BrowserRouter>
      <Routes>

        {/* Default */}
        <Route
          path="/"
          element={<Navigate to="/login" />}
        />

        {/* Authentication */}
        <Route
          path="/login"
          element={<Login />}
        />

        <Route
          path="/register"
          element={<Register />}
        />

        {/* Citizen */}
        <Route
          path="/complaint"
          element={<RegisterComplaint />}
        />

        <Route
          path="/dashboard"
          element={<CitizenDashboard />}
        />

        <Route
          path="/my-complaints"
          element={<MyComplaints />}
        />

        <Route
          path="/profile"
          element={<CitizenProfile />}
        />

        {/* Officer */}
        <Route
          path="/officer-dashboard"
          element={<OfficerDashboard />}
        />

        {/* Department Admin */}
        <Route
          path="/department-dashboard"
          element={<DepartmentDashboard />}
        />

        {/* Super Admin */}
        <Route
          path="/admin-dashboard"
          element={<AdminDashboard />}
        />

        <Route
         path="/ward-dashboard"
         element={<WardDashboard />}
        />

        <Route
          path="/officer-profile"
          element={<OfficerProfile />}
        />

        <Route
          path="/department-profile"
          element={<DepartmentProfile />}
        />

      </Routes>
    </BrowserRouter>
  )
}

export default App