import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import LanguageSelector from '../components/LanguageSelector'

export default function LanguageSelectPage({ onComplete }) {
  const { i18n } = useTranslation()
  const [selected, setSelected] = useState(i18n.language)

  return (
    <div className="min-h-screen bg-gradient-to-b from-primary-50 to-white flex flex-col items-center justify-center p-6">
      <div className="max-w-2xl w-full">
        <div className="text-center mb-8">
          <span className="text-6xl mb-4 block">🌾</span>
          <h1 className="text-3xl font-bold text-primary-800 mb-2">भारत फसल</h1>
          <h2 className="text-xl text-primary-600">Bharat Fasal</h2>
          <p className="text-gray-500 mt-2">Select your language / अपनी भाषा चुनें</p>
        </div>
        <LanguageSelector selectedLang={selected} onSelect={setSelected} />
        <button
          onClick={onComplete}
          className="btn-primary w-full mt-8 flex items-center justify-center gap-2 text-xl py-4"
        >
          <span>→</span>
        </button>
      </div>
    </div>
  )
}
