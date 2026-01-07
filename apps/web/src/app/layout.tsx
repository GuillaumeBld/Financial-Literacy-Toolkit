import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Financial Literacy Toolkit - by Dr, Abol Jalilvand and Guillaume Bolivard',
  description: 'AI-assisted financial literacy assessment by Dr, Abol Jalilvand and Guillaume Bolivard',
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
