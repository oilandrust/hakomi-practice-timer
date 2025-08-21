import { useState, useEffect, useMemo } from 'react'
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
  const { practiceTime, feedbackTime, roundNumber, isBreak, adjustedTimePerRound } = location.state || {}

  const [timerRunning, setTimerRunning] = useState(false)
  const [timerPaused, setTimerPaused] = useState(false)
  const [startTime, setStartTime] = useState(null)
  const [totalDuration, setTotalDuration] = useState(0)
  
  // Get break duration from localStorage if this is a break session
  const getBreakDuration = () => {
    if (isBreak) {
      const sessionData = localStorage.getItem('hakomiSessionData')
      if (sessionData) {
        const parsed = JSON.parse(sessionData)
        return parsed.breakMinutes * 60
      }
    }
    return adjustedTimePerRound ? adjustedTimePerRound * 60 : practiceTime * 60
  }

  const [currentPhase, setCurrentPhase] = useState(isBreak ? 'break' : 'practice') // 'practice', 'feedback', 'break', 'finished'
  const [pausedSeconds, setPausedSeconds] = useState(0)

  const [timerSeconds, setTimerSeconds] = useState(getBreakDuration())

  // Timer effect - check for completion and update display
  useEffect(() => {
    let interval = null
    if (timerRunning && !timerPaused) {
      interval = setInterval(() => {
        // Always calculate based on real elapsed time
        if (startTime && totalDuration > 0) {
          const elapsed = Math.floor((Date.now() - startTime) / 1000)
          const remaining = totalDuration - elapsed
          
          if (remaining <= 0) {
            setTimerRunning(false)
            setTimerSeconds(0)
            
            // Play completion sound
            playCompletionSound()
            
            if (currentPhase === 'practice' && feedbackTime > 0) {
              setCurrentPhase('feedback')
              setTotalDuration(feedbackTime * 60)
              setStartTime(Date.now())
              setTimerRunning(true)
            } else {
              setCurrentPhase('finished')
            }
          } else {
            setTimerSeconds(remaining)
          }
        }
      }, 1000)
    }
    return () => {
      if (interval) clearInterval(interval)
    }
  }, [timerRunning, timerPaused, startTime, totalDuration, currentPhase, feedbackTime])

  // Effect to handle phone wake/sleep - recalculate time when component becomes visible
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && timerRunning && !timerPaused && startTime && totalDuration > 0) {
        // Recalculate time when page becomes visible (phone wakes up)
        const elapsed = Math.floor((Date.now() - startTime) / 1000)
        const remaining = totalDuration - elapsed
        
        if (remaining <= 0) {
          // Timer finished while phone was locked
          setTimerRunning(false)
          setTimerSeconds(0)
          playCompletionSound()
          
          if (currentPhase === 'practice' && feedbackTime > 0) {
            setCurrentPhase('feedback')
            setTotalDuration(feedbackTime * 60)
            setStartTime(Date.now())
            setTimerRunning(true)
          } else {
            setCurrentPhase('finished')
          }
        } else {
          setTimerSeconds(remaining)
        }
      }
    }

    const handleFocus = () => {
      if (timerRunning && !timerPaused && startTime && totalDuration > 0) {
        // Recalculate time when window gains focus
        const elapsed = Math.floor((Date.now() - startTime) / 1000)
        const remaining = totalDuration - elapsed
        
        if (remaining <= 0) {
          setTimerRunning(false)
          setTimerSeconds(0)
          playCompletionSound()
          
          if (currentPhase === 'practice' && feedbackTime > 0) {
            setCurrentPhase('feedback')
            setTotalDuration(feedbackTime * 60)
            setStartTime(Date.now())
            setTimerRunning(true)
          } else {
            setCurrentPhase('finished')
          }
        } else {
          setTimerSeconds(remaining)
        }
      }
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)
    window.addEventListener('focus', handleFocus)
    
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange)
      window.removeEventListener('focus', handleFocus)
    }
  }, [timerRunning, timerPaused, startTime, totalDuration, currentPhase, feedbackTime])

  // Function to play completion sound
  const playCompletionSound = () => {
    try {
      // Create audio context for better mobile support
      const audioContext = new (window.AudioContext || window.webkitAudioContext)()
      const oscillator = audioContext.createOscillator()
      const gainNode = audioContext.createGain()
      
      oscillator.connect(gainNode)
      gainNode.connect(audioContext.destination)
      
      oscillator.frequency.setValueAtTime(800, audioContext.currentTime)
      oscillator.frequency.setValueAtTime(600, audioContext.currentTime + 0.1)
      oscillator.frequency.setValueAtTime(800, audioContext.currentTime + 0.2)
      oscillator.frequency.setValueAtTime(600, audioContext.currentTime + 0.3)
      
      gainNode.gain.setValueAtTime(0.3, audioContext.currentTime)
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.4)
      
      oscillator.start(audioContext.currentTime)
      oscillator.stop(audioContext.currentTime + 0.4)
    } catch (error) {
      console.log('Audio playback not supported:', error)
    }
  }

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

  // Save completion state to localStorage when timer finishes
  useEffect(() => {
    if (currentPhase === 'finished' && roundNumber) {
      if (roundNumber === 'break') {
        localStorage.setItem('hakomiBreakCompleted', 'true')
      } else {
        const storedCompletedRounds = localStorage.getItem('hakomiCompletedRounds')
        const completedRounds = storedCompletedRounds ? JSON.parse(storedCompletedRounds) : []
        if (!completedRounds.includes(roundNumber)) {
          completedRounds.push(roundNumber)
          localStorage.setItem('hakomiCompletedRounds', JSON.stringify(completedRounds))
        }
      }
    }
  }, [currentPhase, roundNumber])

  // Auto-start break timer when entering break session
  useEffect(() => {
    if (isBreak && !timerRunning && currentPhase === 'break') {
      startPractice() // This will start the break timer
    }
  }, [isBreak, timerRunning, currentPhase])

  // Initialize totalDuration when component mounts
  useEffect(() => {
    if (isBreak) {
      const sessionData = localStorage.getItem('hakomiSessionData')
      if (sessionData) {
        const parsed = JSON.parse(sessionData)
        setTotalDuration(parsed.breakMinutes * 60)
      }
    } else {
      const duration = adjustedTimePerRound ? adjustedTimePerRound * 60 : practiceTime * 60
      setTotalDuration(duration)
    }
  }, [isBreak, adjustedTimePerRound, practiceTime])

  // Start practice timer
  const startPractice = () => {
    if (isBreak) {
      // For break sessions, start with break duration
      const sessionData = localStorage.getItem('hakomiSessionData')
      if (sessionData) {
        const parsed = JSON.parse(sessionData)
        const duration = parsed.breakMinutes * 60
        setTotalDuration(duration)
        setStartTime(Date.now())
        setTimerSeconds(duration)
        setCurrentPhase('break')
      }
    } else {
      const duration = adjustedTimePerRound ? adjustedTimePerRound * 60 : practiceTime * 60
      setTotalDuration(duration)
      setStartTime(Date.now())
      setTimerSeconds(duration)
      setCurrentPhase('practice')
    }
    setTimerRunning(true)
    setTimerPaused(false)
  }

  // Start feedback timer
  const startFeedback = () => {
    const duration = feedbackTime * 60
    setTotalDuration(duration)
    setStartTime(Date.now())
    setTimerSeconds(duration)
    setCurrentPhase('feedback')
    setTimerRunning(true)
    setTimerPaused(false)
  }

  // Pause/Resume timer
  const togglePause = () => {
    if (timerPaused) {
      setTimerPaused(false)
      // Adjust start time to account for paused time
      const newStartTime = Date.now() - (pausedSeconds * 1000)
      setStartTime(newStartTime)
    } else {
      setTimerPaused(true)
      setPausedSeconds(timerSeconds)
    }
  }

  // Reset timer
  const resetTimer = () => {
    setTimerRunning(false)
    setTimerPaused(false)
    setStartTime(null)
    setTotalDuration(0)
    setTimerSeconds(getBreakDuration())
    setCurrentPhase('practice')
    setPausedSeconds(0)
  }

  // Finish round and go back
  const finishRound = () => {
    navigate('/practice')
  }

  if (!practiceTime && !isBreak) {
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
    if (currentPhase === 'break' && !timerRunning) {
      const sessionData = localStorage.getItem('hakomiSessionData')
      if (sessionData) {
        const parsed = JSON.parse(sessionData)
        return `Start ${formatMinutes(parsed.breakMinutes)} Break`
      }
      return 'Start Break'
    }
    if (currentPhase === 'practice' && !timerRunning) {
      const timeToShow = adjustedTimePerRound || practiceTime
      return `Start ${formatMinutes(timeToShow)} Practice`
    }
    if (currentPhase === 'feedback' && !timerRunning) return `Start ${formatMinutes(feedbackTime)} Feedback`
    if (currentPhase === 'finished') return 'Finish Round'
    return timerPaused ? 'Resume' : 'Pause'
  }

  const handleMainButtonClick = () => {
    if ((currentPhase === 'practice' || currentPhase === 'break') && !timerRunning) {
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
    if (currentPhase === 'break') return 'var(--pico-success)'
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
