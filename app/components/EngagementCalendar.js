'use client'

import { useState } from 'react'

export default function EngagementCalendar({ cards, exploreKeeps = [], onMilestoneReached }) {
  const [currentMonth, setCurrentMonth] = useState(new Date())

  // Get dates when user kept moment cards
  const momentDates = new Set(
    cards.map(card => new Date(card.kept_at).toDateString())
  )

  // Get dates when user kept walk cards
  const walkDates = new Set(
    exploreKeeps.map(keep => new Date(keep.kept_at).toDateString())
  )

  // Combined engaged dates (either moment or walk)
  const engagedDates = new Set([...momentDates, ...walkDates])

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
      const hasMoment = momentDates.has(dateStr)
      const hasWalk = walkDates.has(dateStr)
      const isEngaged = hasMoment || hasWalk
      const isToday = dateStr === new Date().toDateString()

      days.push({
        day,
        date,
        isEngaged,
        hasMoment,
        hasWalk,
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
    <div className="bg-surface-card rounded-2xl shadow-sm p-4 mb-3">
      <div className="flex items-center justify-between mb-3">
        <h2 className="font-bold text-sm text-text-primary">Your Journey</h2>
        <div className="flex gap-3 text-xs text-text-secondary">
          <span className="font-semibold">{currentStreak} day streak 🔥</span>
          <span>{totalDays} total days</span>
        </div>
      </div>

      <div className="flex items-center justify-between mb-2">
        <button onClick={prevMonth} className="p-1 hover:bg-surface rounded">
          <svg viewBox="0 0 24 24" className="w-5 h-5 fill-text-secondary">
            <path d="M15.41 7.41L14 6l-6 6 6 6 1.41-1.41L10.83 12z"/>
          </svg>
        </button>
        <span className="text-sm font-semibold text-text-primary">{monthName}</span>
        <button onClick={nextMonth} className="p-1 hover:bg-surface rounded">
          <svg viewBox="0 0 24 24" className="w-5 h-5 fill-text-secondary">
            <path d="M10 6L8.59 7.41 13.17 12l-4.58 4.59L10 18l6-6z"/>
          </svg>
        </button>
      </div>

      <div className="grid grid-cols-7 gap-1">
        {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((day, i) => (
          <div key={i} className="text-center text-xs font-medium text-text-muted py-1">
            {day}
          </div>
        ))}
        {calendarDays.map((day, i) => {
          if (!day) {
            return <div key={i} className="aspect-square" />
          }

          const bgClass = day.hasMoment && day.hasWalk
            ? 'bg-gradient-to-br from-[#C97B84] to-[#957BA8] text-white shadow-sm'
            : day.hasMoment
              ? 'bg-gradient-to-br from-[#C97B84] to-[#957BA8] text-white shadow-sm'
              : day.hasWalk
                ? 'bg-gradient-to-br from-[#6B8FA8] to-[#A0B8C8] text-white shadow-sm'
                : 'bg-surface text-text-muted'

          return (
            <div
              key={i}
              className={`aspect-square rounded-lg flex items-center justify-center text-xs font-medium transition-all relative ${
                day.isToday
                  ? 'ring-2 ring-primary ring-offset-1'
                  : ''
              } ${bgClass}`}
            >
              {day.day}
              {day.hasMoment && day.hasWalk && (
                <span className="absolute bottom-0.5 right-0.5 w-2 h-2 bg-[#A0B8C8] rounded-full border border-white" />
              )}
            </div>
          )
        })}
      </div>

      {/* Legend */}
      <div className="flex items-center justify-center gap-4 mt-2 text-[10px] text-text-muted">
        <div className="flex items-center gap-1">
          <span className="w-3 h-3 rounded bg-gradient-to-br from-[#C97B84] to-[#957BA8] inline-block" />
          <span>Moment</span>
        </div>
        <div className="flex items-center gap-1">
          <span className="w-3 h-3 rounded bg-gradient-to-br from-[#6B8FA8] to-[#A0B8C8] inline-block" />
          <span>Walk</span>
        </div>
      </div>
    </div>
  )
}
