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
            <input
              type="number"
              inputMode="numeric"
              min={0}
              step={1}
              value={totalMinutes}
              onChange={(e) => setTotalMinutes(Number(e.target.value))}
              placeholder="e.g., 60"
            />
            <small>minutes</small>
          </label>

          <label>
            Rounds
            <input
              type="number"
              inputMode="numeric"
              min={1}
              step={1}
              value={rounds}
              onChange={(e) => setRounds(Number(e.target.value))}
              placeholder="2 or 3"
            />
            <small>usually 2–3</small>
          </label>

          <label>
            Total break time
            <input
              type="number"
              inputMode="numeric"
              min={0}
              step={1}
              value={breakMinutes}
              onChange={(e) => setBreakMinutes(Number(e.target.value))}
              placeholder="e.g., 10"
            />
            <small>minutes (all breaks combined)</small>
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
            <strong>Per-round time</strong>
          </header>
          <p style={{ fontSize: '1.25rem', margin: 0 }}>
            {formatMinutes(perRoundMinutes)}
          </p>
          <footer>
            <small>Available practice time: {formatMinutes(availableMinutes)}</small>
          </footer>
        </article>
      )}

      <div style={{ marginTop: '1rem', display: 'flex', gap: '0.5rem' }}>
        <button type="button" onClick={() => { setTotalMinutes(60); setRounds(2); setBreakMinutes(0) }}>Reset</button>
      </div>
    </section>
  )
}

export default App
