import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Financial Literacy Toolkit - Loyola University Chicago',
  description: 'AI-assisted financial literacy assessment for Quinlan School of Business',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-gray-50">
        {children}
      </body>
    </html>
  )
}
