import { Routes, Route } from 'react-router-dom'
import Home from './pages/Home'
import CreateMeeting from './pages/CreateMeeting'
import JoinMeeting from './pages/JoinMeeting'
import FacilitatorSession from './pages/FacilitatorSession'
import ParticipantSession from './pages/ParticipantSession'

function App() {
  return (
    <div className="min-h-screen">
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/create" element={<CreateMeeting />} />
        <Route path="/join" element={<JoinMeeting />} />
        <Route path="/join/:code" element={<JoinMeeting />} />
        <Route path="/facilitate/:code" element={<FacilitatorSession />} />
        <Route path="/session/:code" element={<ParticipantSession />} />
      </Routes>
    </div>
  )
}

export default App
