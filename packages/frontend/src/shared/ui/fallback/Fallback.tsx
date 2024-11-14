import { Link, useRouteError } from 'react-router-dom'
import { RejectedDataType } from '../../types'

import './fallback.scss'

export const Fallback = () => {
    const error = useRouteError()
    const knownError = error as RejectedDataType

    return (
        <div role="alert" className="fallback">
            <h1 className="fallback_img">Something went wrong</h1>
            <span className="fallback_describe">
                {knownError?.messageError} {knownError?.status}
            </span>
            <Link to="/" className="fallback_link">
                Go to home page
            </Link>
        </div>
    )
}
