'use client'

import { useState } from 'react'

export default function EngagementCalendar({ cards, onMilestoneReached }) {
  const [currentMonth, setCurrentMonth] = useState(new Date())

  // Get dates when user kept cards
  const engagedDates = new Set(
    cards.map(card => new Date(card.kept_at).toDateString())
  )

  // Calculate total engaged days
  const totalDays = engagedDates.size

  // Calculate current streak
  const calculateStreak = () => {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    let streak = 0
    let currentDate = new Date(today)

    while (true) {
      const dateStr = currentDate.toDateString()
      if (engagedDates.has(dateStr)) {
        streak++
        currentDate.setDate(currentDate.getDate() - 1)
      } else {
        break
      }
    }

    return streak
  }

  const currentStreak = calculateStreak()

  // Get calendar grid for current month
  const getCalendarDays = () => {
    const year = currentMonth.getFullYear()
    const month = currentMonth.getMonth()
    const firstDay = new Date(year, month, 1)
    const lastDay = new Date(year, month + 1, 0)
    const startingDayOfWeek = firstDay.getDay()
    const daysInMonth = lastDay.getDate()

    const days = []

    // Empty cells for days before month starts
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(null)
    }

    // Days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(year, month, day)
      const dateStr = date.toDateString()
      const isEngaged = engagedDates.has(dateStr)
      const isToday = dateStr === new Date().toDateString()

      days.push({
        day,
        date,
        isEngaged,
        isToday
      })
    }

    return days
  }

  const calendarDays = getCalendarDays()

  const prevMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1))
  }

  const nextMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1))
  }

  const monthName = currentMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })

  return (
    <div className="bg-white rounded-2xl shadow-sm p-4 mb-3">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-sm font-bold text-gray-700">Your Journey</h2>
        <div className="flex gap-3 text-xs text-gray-600">
          <span className="font-semibold">{currentStreak} day streak 🔥</span>
          <span>{totalDays} total days</span>
        </div>
      </div>

      <div className="flex items-center justify-between mb-2">
        <button onClick={prevMonth} className="p-1 hover:bg-gray-100 rounded">
          <svg viewBox="0 0 24 24" className="w-5 h-5 fill-gray-600">
            <path d="M15.41 7.41L14 6l-6 6 6 6 1.41-1.41L10.83 12z"/>
          </svg>
        </button>
        <span className="text-sm font-semibold text-gray-700">{monthName}</span>
        <button onClick={nextMonth} className="p-1 hover:bg-gray-100 rounded">
          <svg viewBox="0 0 24 24" className="w-5 h-5 fill-gray-600">
            <path d="M10 6L8.59 7.41 13.17 12l-4.58 4.59L10 18l6-6z"/>
          </svg>
        </button>
      </div>

      <div className="grid grid-cols-7 gap-1">
        {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((day, i) => (
          <div key={i} className="text-center text-xs font-medium text-gray-400 py-1">
            {day}
          </div>
        ))}
        {calendarDays.map((day, i) => {
          if (!day) {
            return <div key={i} className="aspect-square" />
          }

          return (
            <div
              key={i}
              className={`aspect-square rounded-lg flex items-center justify-center text-xs font-medium transition-all ${
                day.isToday
                  ? 'ring-2 ring-blue-500 ring-offset-1'
                  : ''
              } ${
                day.isEngaged
                  ? 'bg-gradient-to-br from-purple-500 to-pink-500 text-white shadow-sm'
                  : 'bg-gray-50 text-gray-400'
              }`}
            >
              {day.day}
            </div>
          )
        })}
      </div>
    </div>
  )
}
