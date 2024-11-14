import { ErrorBoundary } from 'react-error-boundary'
import { Fallback } from '@/shared/ui'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'

interface IProviders {
    readonly children: JSX.Element
}

const queryClient = new QueryClient()

export const Providers = ({ children }: IProviders) => {
    return (
        <QueryClientProvider client={queryClient}>
            <ErrorBoundary FallbackComponent={Fallback}>
                {children}
            </ErrorBoundary>
        </QueryClientProvider>
    )
}
