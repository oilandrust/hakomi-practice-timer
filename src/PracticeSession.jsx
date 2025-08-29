import { useState, useEffect, useRef } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'

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

function formatTimer(seconds) {
  const mins = Math.floor(seconds / 60)
  const secs = seconds % 60
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
}

function formatHoursMinutes(minutes) {
  const hours = Math.floor(minutes / 60)
  const mins = minutes % 60
  return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`
}

function PracticeSession() {
  const location = useLocation()
  const navigate = useNavigate()
  
  // Get session data from location state or localStorage
  const getSessionData = () => {
    if (location.state) {
      // Store in localStorage for persistence
      localStorage.setItem('hakomiSessionData', JSON.stringify(location.state))
      return location.state
    }
    // Try to get from localStorage
    const stored = localStorage.getItem('hakomiSessionData')
    if (stored) {
      const parsed = JSON.parse(stored)
      // Convert startTime back to Date object
      if (parsed.startTime) {
        parsed.startTime = new Date(parsed.startTime)
      }
      return parsed
    }
    return null
  }
  
  const sessionData = getSessionData()
  const [feedbackTime, setFeedbackTime] = useState(7) // Default to 7 minutes
  const [selectedRound, setSelectedRound] = useState(1)
  const [currentTime, setCurrentTime] = useState(Date.now())
  const [completedRounds, setCompletedRounds] = useState(new Set())
  const [breakCompleted, setBreakCompleted] = useState(false)
  const [showExitConfirmation, setShowExitConfirmation] = useState(false)
  const isDraggingRef = useRef(false)

  // Load completion state from localStorage
  useEffect(() => {
    const storedCompletedRounds = localStorage.getItem('hakomiCompletedRounds')
    const storedBreakCompleted = localStorage.getItem('hakomiBreakCompleted')
    
    if (storedCompletedRounds) {
      setCompletedRounds(new Set(JSON.parse(storedCompletedRounds)))
    }
    if (storedBreakCompleted) {
      setBreakCompleted(JSON.parse(storedBreakCompleted))
    }
  }, [])

  // Scroll to top when entering the practice session screen
  useEffect(() => {
    window.scrollTo(0, 0)
  }, [])

  // Add practice-session class to root element for full-width styling
  useEffect(() => {
    const rootElement = document.getElementById('root')
    if (rootElement) {
      rootElement.classList.add('practice-session')
    }
    
    // Cleanup: remove class when component unmounts
    return () => {
      if (rootElement) {
        rootElement.classList.remove('practice-session')
      }
    }
  }, [])

  // Handle Android back button to behave like the top arrow button
  useEffect(() => {
    const handlePopState = (event) => {
      // Prevent default back navigation
      event.preventDefault()
      
      // Check if all rounds and break are done
      const allRoundsDone = Array.from({ length: sessionData?.rounds || 0 }, (_, i) => i + 1)
        .every(round => completedRounds.has(round))
      const allDone = allRoundsDone && (sessionData?.breakMinutes === 0 || breakCompleted)
      
      if (allDone) {
        // If all done, clear data and go to main screen
        localStorage.removeItem('hakomiSessionData')
        localStorage.removeItem('hakomiCompletedRounds')
        localStorage.removeItem('hakomiBreakCompleted')
        navigate('/')
      } else {
        // Show exit confirmation popup
        setShowExitConfirmation(true)
      }
      
      // Push the current state back to prevent actual navigation
      window.history.pushState(null, '', window.location.href)
    }

    // Push initial state to enable back button handling
    window.history.pushState(null, '', window.location.href)
    
    // Add event listener for back button
    window.addEventListener('popstate', handlePopState)
    
    return () => {
      window.removeEventListener('popstate', handlePopState)
    }
  }, [completedRounds, breakCompleted, sessionData, navigate])

  // Update current time every five seconds to refresh the remaining time display
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(Date.now())
    }, 5000) // Update every five seconds (5000ms)

    return () => clearInterval(interval)
  }, [])

  // Auto-select the next available round when entering the screen
  useEffect(() => {
    if (!sessionData) return
    
    // Don't auto-select if user has manually selected something
    if (selectedRound && selectedRound !== 1) return
    
    // Find the first incomplete round
    for (let i = 1; i <= sessionData.rounds; i++) {
      if (!completedRounds.has(i)) {
        setSelectedRound(i)
        return
      }
    }
    
    // If all rounds are done, check if break is available and not completed
    if (sessionData.breakMinutes > 0 && !breakCompleted) {
      setSelectedRound('break')
    } else {
      setSelectedRound(null) // All done
    }
  }, [completedRounds, breakCompleted, sessionData, selectedRound])

  if (!sessionData) {
    return (
      <div style={{ padding: '2rem', textAlign: 'center' }}>
        <h2>No session data found</h2>
        <button onClick={() => navigate('/')} style={{ marginTop: '1rem' }}>
          Back to Planning
        </button>
      </div>
    )
  }

  const remainingBreakTime = sessionData.breakMinutes > 0 && !breakCompleted ? sessionData.breakMinutes : 0
  const remainingRounds = Array.from({ length: sessionData.rounds }, (_, i) => i + 1).filter(round => !completedRounds.has(round))
  const downtimePerRound = sessionData.includeLanding && sessionData.landingMinutes > 0 
    ? Math.ceil(sessionData.landingMinutes / sessionData.rounds)
    : 0

  // Calculate remaining time and adjust time per round dynamically
  let remainingTime;
  if (sessionData.timingFlexibility === 'flexible') {
    remainingTime = Math.max(0, remainingRounds.length * (sessionData.perRoundMinutes + downtimePerRound)
    + remainingBreakTime)
  } else {
      // Calculate remaining time and adjust time per round dynamically
   remainingTime = Math.max(0, 
    sessionData.totalMinutes 
    - Math.floor((currentTime - sessionData.startTime.getTime()) / 60000))
  }
  
  // Calculate adjusted time per round based on timing flexibility
  let adjustedTimePerRound
  if (sessionData.timingFlexibility === 'flexible') {
    // Flexible mode: use original per-round time minus downtime
    adjustedTimePerRound = Math.max(1, sessionData.perRoundMinutes)
  } else {
    // On-time mode: adjust based on remaining time (current behavior)
    adjustedTimePerRound = remainingRounds.length > 0 
      ? Math.max(1, Math.floor((remainingTime - remainingBreakTime) / remainingRounds.length) - downtimePerRound)
      : sessionData.perRoundMinutes
  }

  // Calculate practice time based on adjusted time per round
  const practiceTime = Math.max(1, adjustedTimePerRound - feedbackTime)
  const totalRoundTime = adjustedTimePerRound



  // Delimiter drag handlers
  const handleDelimiterMouseDown = (e) => {
    e.stopPropagation()
    isDraggingRef.current = true
    
    // Add mouse move and mouse up to document when dragging starts
    document.addEventListener('mousemove', handleMouseMove)
    document.addEventListener('mouseup', handleMouseUp)
  }

  const handleDelimiterMouseUp = () => {
    isDraggingRef.current = false
    // Remove document event listeners
    document.removeEventListener('mousemove', handleMouseMove)
    document.removeEventListener('mouseup', handleMouseUp)
  }

  const handleMouseMove = (e) => {
    if (!isDraggingRef.current) return
    
    const container = document.querySelector('.time-breakdown-container')
    if (!container) return
    
    const rect = container.getBoundingClientRect()
    const mouseX = e.clientX - rect.left
    const newFeedbackTime = Math.round(((rect.width - mouseX) / rect.width) * totalRoundTime)
    
    setFeedbackTime(Math.max(0, Math.min(totalRoundTime, newFeedbackTime)))
  }

  const handleMouseUp = () => {
    isDraggingRef.current = false
    // Remove document event listeners
    document.removeEventListener('mousemove', handleMouseMove)
    document.removeEventListener('mouseup', handleMouseUp)
  }

  const handleDelimiterTouchStart = (e) => {
    e.stopPropagation()
    isDraggingRef.current = true
    
    // Add touch move and touch end to document when dragging starts
    document.addEventListener('touchmove', handleTouchMove)
    document.addEventListener('touchend', handleTouchEnd)
  }

  const handleDelimiterTouchEnd = () => {
    isDraggingRef.current = false
    // Remove document event listeners
    document.removeEventListener('touchmove', handleTouchMove)
    document.removeEventListener('touchend', handleTouchEnd)
  }

  const handleTouchMove = (e) => {
    if (!isDraggingRef.current) return
    
    const container = document.querySelector('.time-breakdown-container')
    if (!container) return
    
    const rect = container.getBoundingClientRect()
    const touchX = e.touches[0].clientX - rect.left
    const newFeedbackTime = Math.round(((rect.width - touchX) / rect.width) * totalRoundTime)
    
    setFeedbackTime(Math.max(0, Math.min(totalRoundTime, newFeedbackTime)))
  }

  const handleTouchEnd = () => {
    isDraggingRef.current = false
    // Remove document event listeners
    document.removeEventListener('touchmove', handleTouchMove)
    document.removeEventListener('touchend', handleTouchEnd)
  }



  if (!sessionData) {
    return (
      <div style={{ padding: '2rem', textAlign: 'center' }}>
        <h2>No session data found</h2>
        <button onClick={() => navigate('/')} style={{ marginTop: '1rem' }}>
          Back to Planning
        </button>
      </div>
    )
  }

  return (
    <div style={{ 
      minHeight: '100vh', 
      display: 'flex', 
      flexDirection: 'column',
      padding: '0.75rem',
      width: '100%',
      position: 'relative'
    }}>
      {/* Discreet commit hash - only visible in development */}
      {import.meta.env.DEV && (
        <div style={{
          position: 'fixed',
          top: '0.5rem',
          right: '0.5rem',
          background: 'rgba(0.5, 0.5, 0.5, 0.1)',
          color: '#ff0000',
          fontSize: '0.7rem',
          padding: '0.2rem 0.4rem',
          borderRadius: '0.25rem',
          fontFamily: 'monospace',
          zIndex: 9999,
          pointerEvents: 'none'
        }}>
          {import.meta.env.VITE_COMMIT_HASH || 'dev'}
        </div>
      )}
      {/* Navigation bar with time info */}
      <div className="navigation-bar" style={{
        background: 'var(--pico-background-color, #fff)',
        borderBottom: '1px solid var(--pico-muted-border-color, #e9ecef)',
        padding: '1rem',
        marginBottom: '1.5rem',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between'
      }}>
        <button
          onClick={() => {
            // If all rounds and break are done, no need for confirmation
            if (selectedRound === null) {
              localStorage.removeItem('hakomiSessionData')
              localStorage.removeItem('hakomiCompletedRounds')
              localStorage.removeItem('hakomiBreakCompleted')
              navigate('/')
            } else {
              // Show confirmation only if there are still rounds/break to complete
              setShowExitConfirmation(true)
            }
          }}
          style={{
            background: 'transparent',
            border: 'none',
            fontSize: '1.5rem',
            color: 'var(--pico-muted-color)',
            cursor: 'pointer',
            padding: '0.5rem',
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'all 0.2s ease'
          }}
          onMouseEnter={(e) => {
            e.target.style.background = 'rgba(0,0,0,0.1)'
            e.target.style.color = 'var(--pico-primary)'
          }}
          onMouseLeave={(e) => {
            e.target.style.background = 'transparent'
            e.target.style.color = 'var(--pico-muted-color)'
          }}
          title="Back to Planning"
        >
          ←
        </button>
        
        {/* Time information in the center */}
        <div className="time-info" style={{ 
          display: 'flex', 
          alignItems: 'center', 
          gap: '2rem',
          fontSize: '1rem',
          fontWeight: 'bold'
        }}>
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: '0.5rem',
            color: 'var(--pico-primary)'
          }}>
            <span style={{ fontSize: '1.2rem' }}>⏱️</span>
            {sessionData.timingFlexibility === 'flexible'
              ? formatMinutes(Math.max(0, remainingTime))
              : formatMinutes(Math.max(0, sessionData.totalMinutes - Math.floor((currentTime - sessionData.startTime.getTime()) / 60000)))
            }
          </div>
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: '0.5rem',
            color: 'var(--pico-primary)'
          }}>
            <span style={{ fontSize: '1.2rem' }}>🕐</span>
            {sessionData.timingFlexibility === 'flexible' 
              ? formatTime(new Date(currentTime + remainingTime * 60000))
              : formatTime(new Date(sessionData.startTime.getTime() + sessionData.totalMinutes * 60000))
            }
          </div>
        </div>
        
        {/* Spacer to balance the layout */}
        <div style={{ width: '48px' }}></div>
      </div>

      {/* Exit Confirmation Popup */}
      {showExitConfirmation && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <div style={{
            background: 'var(--pico-card-background-color, #fff)',
            padding: '2rem',
            borderRadius: '8px',
            maxWidth: '400px',
            textAlign: 'center',
            boxShadow: '0 4px 20px rgba(0,0,0,0.3)'
          }}>
            <h3 style={{ margin: '0 0 1.5rem 0' }}>Finish Session?</h3>
            <div style={{ 
              display: 'flex', 
              gap: '1rem', 
              justifyContent: 'center'
            }}>
              <button
                onClick={() => setShowExitConfirmation(false)}
                style={{
                  padding: '0.75rem 1.5rem',
                  fontSize: '1rem',
                  background: 'var(--pico-muted-border-color)',
                  color: 'var(--pico-color)',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer'
                }}
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  // Clear all session data
                  localStorage.removeItem('hakomiSessionData')
                  localStorage.removeItem('hakomiCompletedRounds')
                  localStorage.removeItem('hakomiBreakCompleted')
                  setShowExitConfirmation(false)
                  navigate('/')
                }}
                style={{
                  padding: '0.75rem 1.5rem',
                  fontSize: '1rem',
                  background: 'var(--pico-del-color, #b91c1c)',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer'
                }}
              >
                Yes
              </button>
            </div>
          </div>
        </div>
      )}



      {/* Round and Break Selection */}
      <div style={{ 
        background: 'var(--pico-card-background-color, #fff)',
        padding: '1.25rem',
        borderRadius: '8px',
        marginBottom: '1.5rem',
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
      }}>
        {/* Round Buttons Row */}
        <div style={{ 
          display: 'flex', 
          justifyContent: 'center', 
          gap: '1rem',
          flexWrap: 'wrap',
          padding: '0 1rem'
        }}>
          {Array.from({ length: sessionData.rounds }, (_, index) => {
            const roundNumber = index + 1
            const isCompleted = completedRounds.has(roundNumber)
            const isSelected = selectedRound === roundNumber
            
            return (
              <button
                key={index}
                onClick={() => !isCompleted && setSelectedRound(roundNumber)}
                style={{
                  width: '70px',
                  height: '70px',
                  borderRadius: '50%',
                  border: 'none',
                  background: isCompleted 
                    ? 'rgba(128, 128, 128, 0.3)' 
                    : isSelected 
                      ? 'var(--pico-primary)' 
                      : 'var(--pico-muted-border-color)',
                  color: isCompleted 
                    ? 'var(--pico-color)' 
                    : isSelected 
                      ? 'var(--pico-primary-inverse)' 
                      : 'var(--pico-color)',
                  fontSize: '1rem',
                  fontWeight: 'bold',
                  cursor: isCompleted ? 'default' : 'pointer',
                  transition: 'all 0.2s ease',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexDirection: 'column',
                  opacity: isCompleted ? 0.7 : 1
                }}
              >
                <div>Round</div>
                <div>{roundNumber}</div>
                {isCompleted && <div style={{ fontSize: '0.7rem', marginTop: '2px' }}>✓</div>}
              </button>
            )
          })}
          {sessionData.breakMinutes > 0 && (
            <button
              onClick={() => !breakCompleted && setSelectedRound('break')}
              style={{
                width: '70px',
                height: '70px',
                borderRadius: '50%',
                border: 'none',
                background: breakCompleted 
                  ? 'rgba(128, 128, 128, 0.3)' 
                  : selectedRound === 'break' 
                    ? 'var(--pico-primary)' 
                    : 'var(--pico-muted-border-color)',
                color: breakCompleted 
                  ? 'var(--pico-color)' 
                  : selectedRound === 'break' 
                    ? 'var(--pico-primary-inverse)' 
                    : 'var(--pico-color)',
                fontSize: '1rem',
                fontWeight: 'bold',
                cursor: breakCompleted ? 'default' : 'pointer',
                transition: 'all 0.2s ease',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexDirection: 'column',
                opacity: breakCompleted ? 0.7 : 1
              }}
            >
              <div>Break</div>
              {breakCompleted && <div style={{ fontSize: '0.7rem', marginTop: '2px' }}>✓</div>}
            </button>
          )}
        </div>
      </div>

      {/* All Done Display */}
      {selectedRound === null && (
        <div style={{ 
          textAlign: 'center',
          fontSize: '2rem',
          fontWeight: 'bold',
          color: 'var(--pico-success)',
          marginBottom: '2rem',
          padding: '2rem',
          background: 'var(--pico-card-background-color, #fff)',
          borderRadius: '8px',
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
        }}>
          🎉 All Done! 🎉
        </div>
      )}

      {/* Selected Duration Display - Below the round buttons container */}
      {selectedRound && (
        <div style={{ 
          textAlign: 'center',
          fontSize: '2.5rem',
          fontWeight: 'bold',
          fontFamily: 'monospace',
          marginBottom: '2rem',
          color: selectedRound === 'break' ? 'var(--pico-success)' : 'var(--pico-primary)'
        }}>
          {selectedRound === 'break' 
            ? formatHoursMinutes(sessionData.breakMinutes)
            : formatHoursMinutes(adjustedTimePerRound)
          }
        </div>
      )}

      {/* Interactive Time Breakdown - Only show when a round is selected */}
      {selectedRound && selectedRound !== 'break' && (
        <div style={{ marginBottom: '2rem' }}>
          
          {/* Visual Time Breakdown */}
          <div 
            className="time-breakdown-container"
            style={{
              position: 'relative',
              height: '80px',
              background: 'var(--pico-card-background-color, #fff)',
              borderRadius: '8px',
              overflow: 'hidden',
              boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
            }}
          >
                      {/* Practice Time Section */}
            <div style={{
              position: 'absolute',
              left: '0',
              top: '0',
              width: `${(practiceTime / totalRoundTime) * 100}%`,
              height: '100%',
              background: 'var(--pico-card-background-color, #fff)',
              transition: 'width 0.1s ease'
            }} />
            
            {/* Feedback Time Section */}
            <div style={{
              position: 'absolute',
              right: '0',
              top: '0',
              width: `${(feedbackTime / totalRoundTime) * 100}%`,
              height: '100%',
              background: 'var(--pico-muted-border-color, #e9ecef)',
              transition: 'width 0.1s ease'
            }} />
            
            {/* Draggable Delimiter - Invisible large touch area */}
            <div style={{
              position: 'absolute',
              left: `${(practiceTime / totalRoundTime) * 100}%`,
              top: '0',
              width: '40px',
              height: '100%',
              background: 'transparent',
              cursor: 'ew-resize',
              zIndex: 10,
              transform: 'translateX(-50%)'
            }}
            onMouseDown={handleDelimiterMouseDown}
            onTouchStart={handleDelimiterTouchStart}
            />
            
            {/* Visible thin delimiter */}
            <div style={{
              position: 'absolute',
              left: `${(practiceTime / totalRoundTime) * 100}%`,
              top: '0',
              width: '6px',
              height: '100%',
              background: '#cccccc',
              zIndex: 11,
              transform: 'translateX(-50%)',
              pointerEvents: 'none'
            }} />
            
            {/* Overlaid Time Breakdown Text */}
            <div style={{ 
              position: 'absolute',
              top: '0',
              left: '0',
              right: '0',
              bottom: '0',
              display: 'flex', 
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: '0 1rem',
              zIndex: 5,
              pointerEvents: 'none'
            }}>
              <div style={{ 
                textAlign: 'center',
                color: 'var(--pico-primary)',
                fontWeight: 'bold'
              }}>
                <div style={{ fontSize: '1.2rem' }}>Practice</div>
                <div style={{ fontSize: '1.1rem', color: 'var(--pico-primary)' }}>
                  {formatMinutes(practiceTime)}
                </div>
              </div>
              <div style={{ 
                textAlign: 'center',
                color: 'var(--pico-primary)',
                fontWeight: 'bold'
              }}>
                <div style={{ fontSize: '1.2rem' }}>Feedback</div>
                <div style={{ fontSize: '1.1rem', color: 'var(--pico-primary)' }}>
                  {formatMinutes(feedbackTime)}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Start Round button */}
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center',
        marginBottom: '2rem'
      }}>
        <button
          onClick={() => {
            if (selectedRound === null) {
              // All done - clear data and go back to main screen
              localStorage.removeItem('hakomiSessionData')
              localStorage.removeItem('hakomiCompletedRounds')
              localStorage.removeItem('hakomiBreakCompleted')
              navigate('/')
            } else {
              // Start round or break
              navigate('/timer', {
                state: {
                  practiceTime: selectedRound === 'break' ? 0 : practiceTime,
                  feedbackTime: selectedRound === 'break' ? 0 : feedbackTime,
                  isBreak: selectedRound === 'break',
                  roundNumber: selectedRound,
                  adjustedTimePerRound: selectedRound === 'break' ? 0 : adjustedTimePerRound
                }
              })
            }
          }}
          style={{
            padding: '1.25rem 1.5rem',
            fontSize: '1.2rem',
            fontWeight: 'bold',
            background: selectedRound === null 
              ? 'var(--pico-del-color, #b91c1c)' 
              : selectedRound === 'break' 
                ? 'var(--pico-primary)' 
                : 'var(--pico-primary)',
            color: 'var(--pico-primary-inverse)',
            border: 'none',
            borderRadius: '10px',
            cursor: 'pointer',
            width: '100%'
          }}
        >
          {selectedRound === null 
            ? 'Finish' 
            : selectedRound === 'break' 
              ? 'Start Break' 
              : 'Start Round'
          }
        </button>
      </div>


    </div>
  )
}

export default PracticeSession
