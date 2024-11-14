import { Navigate, Outlet } from 'react-router-dom'

const isAuthenticated = () => {
    const token = localStorage.getItem('accessToken')
    return !!token
}

export const ProtectedRoute = () => {
    if (!isAuthenticated()) {
        return <Navigate to="/login" replace />
    }
    return <Outlet />
}
