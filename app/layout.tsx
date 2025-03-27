import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Voice-Enabled Isometric Game',
  description: 'A multiplayer isometric game with proximity voice chat',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
} 