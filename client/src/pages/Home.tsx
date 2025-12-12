import { Link } from 'react-router-dom'

export default function Home() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="max-w-md w-full mx-4">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Meeting Facilitator</h1>
          <p className="text-gray-600">Gather answers from your team and reveal them together</p>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-8 space-y-4">
          <Link
            to="/create"
            className="block w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-3 px-6 rounded-lg text-center transition-colors"
          >
            Create a Meeting
          </Link>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-300"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-white text-gray-500">or</span>
            </div>
          </div>

          <Link
            to="/join"
            className="block w-full bg-white hover:bg-gray-50 text-indigo-600 font-semibold py-3 px-6 rounded-lg text-center border-2 border-indigo-600 transition-colors"
          >
            Join a Meeting
          </Link>
        </div>

        <p className="text-center text-gray-500 text-sm mt-6">
          Perfect for retrospectives, brainstorming, and team feedback sessions
        </p>
      </div>
    </div>
  )
}
