import { useMemo, useState } from 'react'
import './App.css'

function formatMinutes(totalMinutes) {
  const rounded = Math.max(0, Math.round(totalMinutes))
  const hours = Math.floor(rounded / 60)
  const minutes = rounded % 60
  if (hours === 0) return `${minutes} min`
  if (minutes === 0) return `${hours} hr${hours > 1 ? 's' : ''}`
  return `${hours} hr${hours > 1 ? 's' : ''} ${minutes} min`
}

function App() {
  const [totalMinutes, setTotalMinutes] = useState(60)
  const [rounds, setRounds] = useState(2)
  const [breakMinutes, setBreakMinutes] = useState(0)

  // Convert total minutes to hours and minutes for display
  const hours = Math.floor(totalMinutes / 60)
  const minutes = totalMinutes % 60

  // Handle preset button clicks
  const handlePreset = (presetMinutes) => {
    setTotalMinutes(presetMinutes)
  }

  // Handle hours input change
  const handleHoursChange = (e) => {
    const newHours = Number(e.target.value) || 0
    const newMinutes = minutes
    setTotalMinutes(newHours * 60 + newMinutes)
  }

  // Handle minutes input change
  const handleMinutesChange = (e) => {
    const newMinutes = Number(e.target.value) || 0
    const newHours = hours
    setTotalMinutes(newHours * 60 + newMinutes)
  }

  const { availableMinutes, perRoundMinutes, error } = useMemo(() => {
    const available = Number.isFinite(totalMinutes) && Number.isFinite(breakMinutes)
      ? Math.max(0, (totalMinutes || 0) - (breakMinutes || 0))
      : 0
    const validRounds = Number.isFinite(rounds) && rounds > 0
    const perRound = validRounds ? available / rounds : 0
    let message = ''
    if (!validRounds) message = 'Rounds must be at least 1'
    else if ((breakMinutes || 0) > (totalMinutes || 0)) message = 'Break time cannot exceed total session time'
    return {
      availableMinutes: available,
      perRoundMinutes: Math.round(perRound),
      error: message,
    }
  }, [totalMinutes, rounds, breakMinutes])

  return (
    <section>
      <form>
        <div className="grid">
          <label>
            Total session
            <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.5rem' }}>
              <button 
                type="button" 
                onClick={() => handlePreset(60)}
                className={totalMinutes === 60 ? 'secondary' : 'outline'}
              >
                60 min
              </button>
              <button 
                type="button" 
                onClick={() => handlePreset(90)}
                className={totalMinutes === 90 ? 'secondary' : 'outline'}
              >
                90 min
              </button>
              <button 
                type="button" 
                onClick={() => handlePreset(120)}
                className={totalMinutes === 120 ? 'secondary' : 'outline'}
              >
                2 hours
              </button>
            </div>
            <div className="time-inputs">
              <input
                type="number"
                inputMode="numeric"
                min={0}
                step={1}
                value={hours}
                onChange={handleHoursChange}
                placeholder="0"
                style={{ width: '80px' }}
              />
              <span>hr</span>
              <input
                type="number"
                inputMode="numeric"
                min={0}
                step={1}
                max={59}
                value={minutes}
                onChange={handleMinutesChange}
                placeholder="0"
                style={{ width: '80px' }}
              />
              <span>min</span>
            </div>
          </label>
        </div>
        
        <div className="grid" style={{ marginTop: '1rem' }}>
          <label>
            Rounds
            <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.5rem' }}>
              <button 
                type="button" 
                onClick={() => setRounds(2)}
                className={rounds === 2 ? 'secondary' : 'outline'}
              >
                2 rounds
              </button>
              <button 
                type="button" 
                onClick={() => setRounds(3)}
                className={rounds === 3 ? 'secondary' : 'outline'}
              >
                3 rounds
              </button>
            </div>
          </label>

          <label>
            Break
            <input
              type="number"
              inputMode="numeric"
              min={0}
              step={1}
              value={breakMinutes}
              onChange={(e) => setBreakMinutes(Number(e.target.value))}
              placeholder="e.g., 10"
            />
          </label>
        </div>
      </form>

      {error ? (
        <article style={{ marginTop: '0.75rem' }}>
          <p role="status" style={{ color: 'var(--pico-del-color, #b91c1c)' }}>{error}</p>
        </article>
      ) : (
        <article style={{ marginTop: '0.75rem' }}>
          <header>
            <strong>Practice Session</strong>
          </header>
          <p style={{ fontSize: '1.25rem', margin: 0 }}>
            {rounds} round{rounds > 1 ? 's' : ''} of {formatMinutes(perRoundMinutes)}
          </p>
          {breakMinutes > 0 && (
            <p style={{ margin: '0.5rem 0 0 0', fontSize: '1rem' }}>
              {formatMinutes(breakMinutes)} break
            </p>
          )}
        </article>
      )}

      <div style={{ marginTop: '1rem', display: 'flex', gap: '0.5rem' }}>
        <button type="button" onClick={() => { setTotalMinutes(60); setRounds(2); setBreakMinutes(0) }}>Reset</button>
      </div>
    </section>
  )
}

export default App
