/* eslint-disable tailwindcss/classnames-order */
import { Routes, Route, Navigate } from 'react-router-dom'
import Navbar from 'components/Navbar'
import DetailSearch from 'pages/DetailSearch'
import RegionInfo from 'pages/RegionInfo'
import Comparison from 'pages/Comparison'
import MapSearch from 'pages/MapSearch'
// zustand store used directly; no provider needed
import NotFound from 'pages/NotFound'

export default function App() {
  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <Routes>
          <Route path="/" element={<Navigate to="/map" replace />} />
          <Route path="/map" element={<MapSearch />} />
          <Route path="/search" element={<DetailSearch />} />
          <Route path="/region" element={<RegionInfo />} />
          <Route path="/compare" element={<Comparison />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </main>
    </div>
  )
}
