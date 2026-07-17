import './globals.css'
import AuthProvider from '../src/lib/AuthProvider'
import DataProvider from '../src/lib/DataProvider'
import Header from '../src/components/Header'

export const metadata = {
  title: 'InfraTAF Management',
  description: 'InfraTAF Management System'
}

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <AuthProvider>
          <DataProvider>
            <div className="app-root">
              <Header />
              <main className="container">{children}</main>
            </div>
          </DataProvider>
        </AuthProvider>
      </body>
    </html>
  )
}
