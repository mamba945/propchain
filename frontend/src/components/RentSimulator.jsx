import { useState } from 'react'

export default function RentSimulator({ property }) {
  const total = property.total_tokens
  const price = Number(property.price_per_token)
  const [tokens, setTokens] = useState(Math.min(10, total))

  const share = (tokens / total) * 100
  const cost = tokens * price
  const propertyValue = total * price
  const annualYield = propertyValue * 0.08
  const userAnnual = annualYield * (tokens / total)
  const userMonthly = userAnnual / 12
  const roiYears = userAnnual > 0 ? cost / userAnnual : 0

  return (
    <div className="mt-8 card-dark p-6 animate-fade-up">
      <div className="mb-5">
        <h3 className="text-lg font-semibold text-white">Симулятор доходности</h3>
        <p className="text-xs text-gray-500 mt-1">Рассчитай свой пассивный доход</p>
      </div>

      <div className="mb-6">
        <div className="flex justify-between text-xs mb-2">
          <span className="text-gray-500">Количество токенов</span>
          <span className="text-[#00d4aa] font-mono">{tokens.toLocaleString()}</span>
        </div>
        <input
          type="range"
          min={1}
          max={total}
          value={tokens}
          onChange={(e) => setTokens(Number(e.target.value))}
          className="w-full accent-[#00d4aa]"
        />
        <div className="flex justify-between text-[10px] text-gray-600 mt-1">
          <span>1</span>
          <span>{total.toLocaleString()}</span>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <Row label="Твоя доля" value={`${share.toFixed(2)}%`} />
        <Row label="Стоимость покупки" value={`${cost.toFixed(2)} SOL`} />
        <Row label="Ежемесячный доход" value={`${userMonthly.toFixed(4)} SOL`} highlight />
        <Row label="Годовой доход" value={`${userAnnual.toFixed(4)} SOL`} highlight />
        <Row label="ROI" value={`${roiYears.toFixed(1)} лет до окупаемости`} />
      </div>

      <p className="text-[10px] text-gray-600 mt-5 leading-relaxed">
        * Расчёт основан на средней доходности аренды 8% годовых
      </p>
    </div>
  )
}

function Row({ label, value, highlight }) {
  return (
    <div className="stat-card px-4 py-3">
      <p className="text-[10px] uppercase tracking-wider text-gray-500 mb-1">{label}</p>
      <p className={`text-sm font-mono font-semibold ${highlight ? 'text-[#00d4aa]' : 'text-white'}`}>{value}</p>
    </div>
  )
}
