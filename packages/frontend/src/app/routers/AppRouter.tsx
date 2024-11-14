import '../styles/index.scss'
import { RouterProvider, createBrowserRouter } from 'react-router-dom'
import { BaseLayout } from '../layout'
import { Fallback } from '@/shared/ui'
import { LandingPage } from '@/pages/landing'

const router = createBrowserRouter([
    {
        path: '/',
        element: <BaseLayout />,
        errorElement: <Fallback />,
        children: [
            {
                path: '',
                element: <LandingPage />,
            },
        ],
    },
])

export const AppRouter = () => {
    return (
        <div className="app">
            <div className="app__content">
                <RouterProvider router={router} />
            </div>
        </div>
    )
}
