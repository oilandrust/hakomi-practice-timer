import { useState, useEffect } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'

function formatTimer(seconds) {
  const mins = Math.floor(seconds / 60)
  const secs = seconds % 60
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
}

function formatMinutes(totalMinutes) {
  const rounded = Math.max(0, Math.round(totalMinutes))
  const hours = Math.floor(rounded / 60)
  const minutes = rounded % 60
  if (hours === 0) return `${minutes} min`
  if (minutes === 0) return `${hours} hr${hours > 1 ? 's' : ''}`
  return `${hours} hr${hours > 1 ? 's' : ''} ${minutes} min`
}

function Timer() {
  const location = useLocation()
  const navigate = useNavigate()
  const { practiceTime, feedbackTime } = location.state || {}

  const [timerRunning, setTimerRunning] = useState(false)
  const [timerPaused, setTimerPaused] = useState(false)
  const [timerSeconds, setTimerSeconds] = useState(practiceTime * 60) // Initialize with practice time
  const [currentPhase, setCurrentPhase] = useState('practice') // 'practice', 'feedback', 'finished'
  const [pausedSeconds, setPausedSeconds] = useState(0)

  // Timer effect
  useEffect(() => {
    let interval = null
    if (timerRunning && !timerPaused && timerSeconds > 0) {
      interval = setInterval(() => {
        setTimerSeconds(prev => {
          if (prev <= 1) {
            setTimerRunning(false)
            if (currentPhase === 'practice' && feedbackTime > 0) {
              setCurrentPhase('feedback')
              setTimerSeconds(feedbackTime * 60)
            } else {
              setCurrentPhase('finished')
            }
            return 0
          }
          return prev - 1
        })
      }, 1000)
    }
    return () => {
      if (interval) clearInterval(interval)
    }
  }, [timerRunning, timerPaused, timerSeconds, currentPhase, feedbackTime])

  // Keep screen awake when timer is running
  useEffect(() => {
    let wakeLock = null
    let userActivityTimer = null

    const requestWakeLock = async () => {
      try {
        if ('wakeLock' in navigator) {
          wakeLock = await navigator.wakeLock.request('screen')
        }
      } catch (err) {
        console.log('Wake Lock not supported or failed:', err)
      }
    }

    const releaseWakeLock = () => {
      if (wakeLock) {
        wakeLock.release()
        wakeLock = null
      }
    }

    const keepScreenAwake = () => {
      // Fallback: simulate user activity to prevent screen sleep
      if (userActivityTimer) {
        clearInterval(userActivityTimer)
      }
      
      userActivityTimer = setInterval(() => {
        // Trigger a small user activity event to keep screen awake
        const event = new Event('touchstart', { bubbles: true })
        document.dispatchEvent(event)
      }, 30000) // Every 30 seconds
    }

    const stopKeepingScreenAwake = () => {
      if (userActivityTimer) {
        clearInterval(userActivityTimer)
        userActivityTimer = null
      }
    }

    if (timerRunning && !timerPaused) {
      requestWakeLock()
      keepScreenAwake()
    } else {
      releaseWakeLock()
      stopKeepingScreenAwake()
    }

    // Cleanup on unmount
    return () => {
      releaseWakeLock()
      stopKeepingScreenAwake()
    }
  }, [timerRunning, timerPaused])

  // Start practice timer
  const startPractice = () => {
    setTimerSeconds(practiceTime * 60)
    setCurrentPhase('practice')
    setTimerRunning(true)
    setTimerPaused(false)
  }

  // Start feedback timer
  const startFeedback = () => {
    setTimerSeconds(feedbackTime * 60)
    setCurrentPhase('feedback')
    setTimerRunning(true)
    setTimerPaused(false)
  }

  // Pause/Resume timer
  const togglePause = () => {
    if (timerPaused) {
      setTimerPaused(false)
      setTimerSeconds(pausedSeconds)
    } else {
      setTimerPaused(true)
      setPausedSeconds(timerSeconds)
    }
  }

  // Reset timer
  const resetTimer = () => {
    setTimerRunning(false)
    setTimerPaused(false)
    setTimerSeconds(0)
    setCurrentPhase('practice')
    setPausedSeconds(0)
  }

  // Finish round and go back
  const finishRound = () => {
    navigate('/practice')
  }

  if (!practiceTime) {
    return (
      <div style={{ padding: '2rem', textAlign: 'center' }}>
        <h2>No timer data found</h2>
        <button onClick={() => navigate('/practice')} style={{ marginTop: '1rem' }}>
          Back to Practice Session
        </button>
      </div>
    )
  }

  const getButtonText = () => {
    if (currentPhase === 'practice' && !timerRunning) return `Start ${formatMinutes(practiceTime)} Practice`
    if (currentPhase === 'feedback' && !timerRunning) return `Start ${formatMinutes(feedbackTime)} Feedback`
    if (currentPhase === 'finished') return 'Finish Round'
    return timerPaused ? 'Resume' : 'Pause'
  }

  const handleMainButtonClick = () => {
    if (currentPhase === 'practice' && !timerRunning) {
      startPractice()
    } else if (currentPhase === 'feedback' && !timerRunning) {
      startFeedback()
    } else if (currentPhase === 'finished') {
      finishRound()
    } else {
      togglePause()
    }
  }

  const getPhaseColor = () => {
    if (currentPhase === 'practice') return 'var(--pico-primary)'
    if (currentPhase === 'feedback') return 'var(--pico-secondary)'
    return 'var(--pico-muted-color)'
  }

  const getPhaseText = () => {
    if (currentPhase === 'practice') return 'Practice Time'
    if (currentPhase === 'feedback') return 'Feedback Time'
    return 'Round Complete'
  }

  return (
    <div 
      className={timerRunning && !timerPaused ? 'timer-active' : ''}
      style={{ 
        minHeight: '100vh', 
        display: 'flex', 
        flexDirection: 'column',
        alignItems: 'center',
        textAlign: 'center'
      }}
    >
      {/* Navbar with quit button */}
      <div style={{
        position: 'fixed',
        top: '0',
        left: '0',
        right: '0',
        display: 'flex',
        justifyContent: 'flex-end',
        padding: '1rem',
        background: 'var(--pico-background-color)',
        backdropFilter: 'blur(10px)',
        borderBottom: '1px solid var(--pico-muted-color)',
        zIndex: 1000
      }}>
        <button
          onClick={() => navigate('/practice')}
          style={{
            padding: '0.5rem',
            fontSize: '1.2rem',
            background: 'transparent',
            color: 'var(--pico-muted-color)',
            border: '2px solid var(--pico-muted-color)',
            borderRadius: '50%',
            cursor: 'pointer',
            width: '2.5rem',
            height: '2.5rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            lineHeight: '1',
            transition: 'all 0.2s ease'
          }}
          title="Quit Session"
          onMouseEnter={(e) => {
            e.target.style.background = 'var(--pico-muted-color)'
            e.target.style.color = 'white'
          }}
          onMouseLeave={(e) => {
            e.target.style.background = 'transparent'
            e.target.style.color = 'var(--pico-muted-color)'
          }}
        >
          ✕
        </button>
      </div>

      {/* Main content */}
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        padding: '2rem',
        paddingTop: '5rem',
        textAlign: 'center'
      }}>
      {/* Timer display */}
      <div style={{ 
        fontSize: '6rem', 
        fontWeight: 'bold', 
        fontFamily: 'monospace',
        marginBottom: '2rem',
        color: timerRunning ? getPhaseColor() : 'inherit',
        textAlign: 'center'
      }}>
        {formatTimer(timerSeconds)}
      </div>



      {/* Main action button - only show when timer is not running */}
      {!timerRunning && (
        <button
          onClick={handleMainButtonClick}
          style={{
            padding: '1.5rem 3rem',
            fontSize: '1.3rem',
            fontWeight: 'bold',
            background: currentPhase === 'finished' ? 'var(--pico-primary)' : getPhaseColor(),
            color: 'white',
            border: 'none',
            borderRadius: '10px',
            cursor: 'pointer',
            marginBottom: '1rem',
            minWidth: '250px'
          }}
        >
          {getButtonText()}
        </button>
      )}

      {/* Pause and Finish buttons - only show when timer is running */}
      <div style={{ 
        display: 'flex', 
        gap: '1rem',
        marginTop: '1rem'
      }}>
        {/* Pause/Resume button (only show when timer is running) */}
        {timerRunning && currentPhase !== 'finished' && (
          <button
            onClick={togglePause}
            style={{
              padding: '1.5rem 3rem',
              fontSize: '1.3rem',
              fontWeight: 'bold',
              background: 'transparent',
              color: getPhaseColor(),
              border: `2px solid ${getPhaseColor()}`,
              borderRadius: '10px',
              cursor: 'pointer',
              minWidth: '150px'
            }}
          >
            {timerPaused ? 'Resume' : 'Pause'}
          </button>
        )}

        {/* Finish button (only show when timer is running) */}
        {timerRunning && currentPhase !== 'finished' && (
          <button
            onClick={() => {
              setTimerRunning(false)
              if (currentPhase === 'practice' && feedbackTime > 0) {
                setCurrentPhase('feedback')
                setTimerSeconds(feedbackTime * 60)
              } else {
                setCurrentPhase('finished')
              }
            }}
            style={{
              padding: '1.5rem 3rem',
              fontSize: '1.3rem',
              fontWeight: 'bold',
              background: 'transparent',
              color: 'var(--pico-del-color, #b91c1c)',
              border: '2px solid var(--pico-del-color, #b91c1c)',
              borderRadius: '10px',
              cursor: 'pointer',
              minWidth: '150px'
            }}
          >
            Finish
          </button>
        )}



      </div>
      </div>
    </div>
  )
}

export default Timer
