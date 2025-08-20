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

  // Update current time every minute to refresh the remaining time display
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(Date.now())
    }, 60000) // Update every minute (60000ms)

    return () => clearInterval(interval)
  }, [])

  // Auto-select the next available round when entering the screen
  useEffect(() => {
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
  }, [completedRounds, breakCompleted, sessionData.rounds, sessionData.breakMinutes])

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

  // Calculate practice time based on feedback time (after null check)
  const practiceTime = sessionData.perRoundMinutes - feedbackTime
  const totalRoundTime = sessionData.perRoundMinutes



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
      padding: '1rem',
      maxWidth: '600px',
      margin: '0 auto',
      position: 'relative'
    }}>
      {/* Navigation bar */}
      <div style={{
        background: 'var(--pico-background-color, #fff)',
        borderBottom: '1px solid var(--pico-muted-border-color, #e9ecef)',
        padding: '1rem',
        marginBottom: '1.5rem',
        display: 'flex',
        alignItems: 'center'
      }}>
        <button
          onClick={() => {
            // If all rounds are done, clear the data when going back
            if (selectedRound === null) {
              localStorage.removeItem('hakomiSessionData')
              localStorage.removeItem('hakomiCompletedRounds')
              localStorage.removeItem('hakomiBreakCompleted')
            }
            navigate('/')
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
      </div>

      {/* Header with session summary */}
      <div style={{ 
        background: 'var(--pico-card-background-color, #fff)',
        padding: '1.5rem',
        borderRadius: '8px',
        marginBottom: '2rem',
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
      }}>
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-around', 
          alignItems: 'center',
          fontSize: '1.2rem',
          fontWeight: 'bold'
        }}>
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: '0.5rem',
            color: 'var(--pico-primary)'
          }}>
            <span style={{ fontSize: '1.5rem' }}>⏱️</span>
            {formatMinutes(Math.max(0, sessionData.totalMinutes - Math.floor((currentTime - sessionData.startTime.getTime()) / 60000)))}
          </div>
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: '0.5rem',
            color: 'var(--pico-primary)'
          }}>
            <span style={{ fontSize: '1.5rem' }}>🕐</span>
            {formatTime(new Date(sessionData.startTime.getTime() + sessionData.totalMinutes * 60000))}
          </div>
        </div>
      </div>

      {/* Round and Break Selection */}
      <div style={{ 
        background: 'var(--pico-card-background-color, #fff)',
        padding: '1.5rem',
        borderRadius: '8px',
        marginBottom: '2rem',
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
      }}>
        {/* Round Buttons Row */}
        <div style={{ 
          display: 'flex', 
          justifyContent: 'center', 
          gap: '1rem',
          marginBottom: '1.5rem',
          flexWrap: 'wrap'
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
                  width: '60px',
                  height: '60px',
                  borderRadius: '50%',
                  border: 'none',
                  background: isCompleted 
                    ? 'var(--pico-success)' 
                    : isSelected 
                      ? 'var(--pico-primary)' 
                      : 'var(--pico-muted-border-color)',
                  color: isCompleted || isSelected ? 'var(--pico-primary-inverse)' : 'var(--pico-color)',
                  fontSize: '0.9rem',
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
                width: '60px',
                height: '60px',
                borderRadius: '50%',
                border: 'none',
                background: breakCompleted 
                  ? 'var(--pico-success)' 
                  : selectedRound === 'break' 
                    ? 'var(--pico-success)' 
                    : 'var(--pico-success-hover)',
                color: selectedRound === 'break' || breakCompleted ? 'var(--pico-primary-inverse)' : 'var(--pico-color)',
                fontSize: '0.9rem',
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
            ? formatTimer(sessionData.breakMinutes * 60)
            : formatTimer(sessionData.perRoundMinutes * 60)
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
                color: '#ffffff',
                fontWeight: 'bold'
              }}>
                <div style={{ fontSize: '1.2rem' }}>Practice</div>
                <div style={{ fontSize: '1.1rem', color: 'var(--pico-primary)' }}>
                  {formatMinutes(practiceTime)}
                </div>
              </div>
              <div style={{ 
                textAlign: 'center',
                color: '#ffffff',
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
                  roundNumber: selectedRound
                }
              })
            }
          }}
          style={{
            padding: '1.5rem 3rem',
            fontSize: '1.3rem',
            fontWeight: 'bold',
            background: selectedRound === null 
              ? 'var(--pico-del-color, #b91c1c)' 
              : selectedRound === 'break' 
                ? 'var(--pico-success)' 
                : 'var(--pico-primary)',
            color: 'var(--pico-primary-inverse)',
            border: 'none',
            borderRadius: '10px',
            cursor: 'pointer',
            minWidth: '250px'
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
