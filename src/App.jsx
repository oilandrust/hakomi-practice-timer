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

function formatTime(date) {
  return date.toLocaleTimeString('en-US', { 
    hour: 'numeric', 
    minute: '2-digit',
    hour12: true 
  })
}

function App() {
  const [totalMinutes, setTotalMinutes] = useState(60)
  const [rounds, setRounds] = useState(2)
  const [breakMinutes, setBreakMinutes] = useState(0)
  const [landingMinutes, setLandingMinutes] = useState(3)
  const [includeLanding, setIncludeLanding] = useState(true)
  const [startTime, setStartTime] = useState(new Date())
  const [timingMode, setTimingMode] = useState('during') // 'during' or 'until'

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

  // Calculate rounded end times for "until" mode
  const getRoundedEndTimes = () => {
    const now = new Date()
    const times = []
    
    // 60 minutes from now, rounded to nearest 30 minutes
    const time60 = new Date(now.getTime() + 60 * 60000)
    const rounded60 = new Date(time60)
    rounded60.setMinutes(Math.round(time60.getMinutes() / 30) * 30)
    rounded60.setSeconds(0)
    rounded60.setMilliseconds(0)
    times.push({ label: '60 min', time: rounded60, minutes: Math.round((rounded60.getTime() - now.getTime()) / 60000) })
    
    // 90 minutes from now, rounded to nearest 30 minutes
    const time90 = new Date(now.getTime() + 90 * 60000)
    const rounded90 = new Date(time90)
    rounded90.setMinutes(Math.round(time90.getMinutes() / 30) * 30)
    rounded90.setSeconds(0)
    rounded90.setMilliseconds(0)
    times.push({ label: '90 min', time: rounded90, minutes: Math.round((rounded90.getTime() - now.getTime()) / 60000) })
    
    // 2 hours from now, rounded to nearest hour
    const time120 = new Date(now.getTime() + 120 * 60000)
    const rounded120 = new Date(time120)
    rounded120.setMinutes(Math.round(time120.getMinutes() / 30) * 30)
    rounded120.setSeconds(0)
    rounded120.setMilliseconds(0)
    times.push({ label: '2 hours', time: rounded120, minutes: Math.round((rounded120.getTime() - now.getTime()) / 60000) })
    
    return times
  }

  const { availableMinutes, perRoundMinutes, error } = useMemo(() => {
    const landingTime = includeLanding ? (landingMinutes || 0) : 0
    const available = Number.isFinite(totalMinutes) && Number.isFinite(breakMinutes)
      ? Math.max(0, (totalMinutes || 0) - (breakMinutes || 0) - landingTime)
      : 0
    const validRounds = Number.isFinite(rounds) && rounds > 0
    const perRound = validRounds ? available / rounds : 0
    let message = ''
    if (!validRounds) message = 'Rounds must be at least 1'
    else if ((breakMinutes || 0) + landingTime > (totalMinutes || 0)) message = 'Break time and landing time cannot exceed total session time'
    return {
      availableMinutes: available,
      perRoundMinutes: Math.floor(perRound),
      error: message,
    }
  }, [totalMinutes, rounds, breakMinutes, landingMinutes, includeLanding])

  return (
    <section>
      <form>
        <div className="grid">
          <div>
            <div style={{ textAlign: 'left', fontWeight: 'bold', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <span>Total session</span>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.9rem', fontWeight: 'normal' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', cursor: 'pointer' }}>
                  <input
                    type="radio"
                    name="timingMode"
                    value="during"
                    checked={timingMode === 'during'}
                    onChange={(e) => setTimingMode(e.target.value)}
                    style={{ margin: 0 }}
                  />
                  <span>during</span>
                </label>
                <label style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', cursor: 'pointer' }}>
                  <input
                    type="radio"
                    name="timingMode"
                    value="until"
                    checked={timingMode === 'until'}
                    onChange={(e) => setTimingMode(e.target.value)}
                    style={{ margin: 0 }}
                  />
                  <span>until</span>
                </label>
              </div>
            </div>
            <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.5rem' }}>
              {timingMode === 'during' ? (
                <>
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
                </>
              ) : (
                getRoundedEndTimes().map((option, index) => (
                  <button 
                    key={index}
                    type="button" 
                    onClick={() => setTotalMinutes(option.minutes)}
                    className={totalMinutes === option.minutes ? 'secondary' : 'outline'}
                  >
                    {formatTime(option.time)}
                  </button>
                ))
              )}
            </div>
            {timingMode === 'during' && (
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
            )}
          </div>
        </div>
        
        <div className="grid" style={{ marginTop: '1rem' }}>
          <div>
            <div style={{ textAlign: 'left', fontWeight: 'bold', marginBottom: '0.5rem' }}>Rounds</div>
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
          </div>

        </div>
        
        <div className="grid" style={{ marginTop: '1rem' , marginBottom: '0'}}>
          <div>
            <div style={{ textAlign: 'left', fontWeight: 'bold', marginBottom: '0.5rem' }}>Break</div>
            <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0' }}>
              <button 
                type="button" 
                onClick={() => setBreakMinutes(0)}
                className={breakMinutes === 0 ? 'secondary' : 'outline'}
              >
                No break
              </button>
              <button 
                type="button" 
                onClick={() => setBreakMinutes(5)}
                className={breakMinutes === 5 ? 'secondary' : 'outline'}
              >
                5 min
              </button>
              <button 
                type="button" 
                onClick={() => setBreakMinutes(10)}
                className={breakMinutes === 10 ? 'secondary' : 'outline'}
              >
                10 min
              </button>
              <button 
                type="button" 
                onClick={() => setBreakMinutes(15)}
                className={breakMinutes === 15 ? 'secondary' : 'outline'}
              >
                15 min
              </button>
            </div>
          </div>
        </div>
        
        <div className="grid" style={{ marginTop: '0rem' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <input
                type="checkbox"
                checked={includeLanding}
                onChange={(e) => setIncludeLanding(e.target.checked)}
                style={{ margin: 0 }}
              />
              <input
                type="number"
                inputMode="numeric"
                min={1}
                step={1}
                value={includeLanding ? landingMinutes : 0}
                onChange={(e) => setLandingMinutes(Number(e.target.value))}
                placeholder="5"
                disabled={!includeLanding}
                style={{ 
                  width: '80px', 
                  padding: '0.25rem 0.5rem',
                  opacity: includeLanding ? 1 : 0.5
                }}
              />
              <span style={{ fontSize: '0.9rem', opacity: 0.8 }}>min to land and prepare</span>
            </div>
          </div>
        </div>
      </form>

      {error ? (
        <article style={{ marginTop: '0.75rem' }}>
          <p role="status" style={{ color: 'var(--pico-del-color, #b91c1c)' }}>{error}</p>
        </article>
      ) : (
        <article style={{ marginTop: '0.75rem' }}>
          <header>
            <strong>Practice Session: {formatMinutes(totalMinutes)}</strong>
          </header>
          {includeLanding && landingMinutes > 0 && (
            <p style={{ margin: '0 0 0.5rem 0', fontSize: '1.25rem' }}>
              {formatMinutes(landingMinutes)} to land and prepare
            </p>
          )}
          <p style={{ fontSize: '1.25rem', margin: 0 }}>
            {rounds} round{rounds > 1 ? 's' : ''} of {formatMinutes(perRoundMinutes)}
          </p>
          {breakMinutes > 0 && (
            <p style={{ margin: '0.5rem 0 0 0', fontSize: '1.25rem' }}>
              {formatMinutes(breakMinutes)} break
            </p>
          )}
          <footer style={{ 
            marginTop: '1rem', 
            paddingTop: '0.75rem', 
            borderTop: '1px solid rgba(0,0,0,0.1)',
            display: 'flex', 
            alignItems: 'center', 
            gap: '0.5rem', 
            justifyContent: 'center',
            fontSize: '0.9rem',
            opacity: 0.8
          }}>
            <span>
              Start <strong>{formatTime(startTime)}</strong>, end <strong>{formatTime(new Date(startTime.getTime() + totalMinutes * 60000))}</strong>
            </span>
            <button 
              type="button" 
              onClick={() => setStartTime(new Date())}
              style={{ 
                fontSize: '1.1rem', 
                padding: '0.35rem',
                opacity: 0.8,
                background: 'transparent',
                border: '1px solid var(--pico-primary)',
                borderRadius: '4px',
                cursor: 'pointer',
                width: '28px',
                height: '28px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--pico-primary)',
                lineHeight: '1',
                alignSelf: 'baseline'
              }}
              title="Update start time"
            >
              ↻
            </button>
          </footer>
        </article>
      )}
    </section>
  )
}

export default App
