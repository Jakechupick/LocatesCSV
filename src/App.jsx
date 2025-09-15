import { useState, useEffect } from 'react'
import { auth } from './firebase'
import { signInWithEmailAndPassword, signOut, onAuthStateChanged } from 'firebase/auth'

function App() {
  const [pastedData, setPastedData] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [user, setUser] = useState(null)
  const [isWhitelisted, setIsWhitelisted] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      console.log('onAuthStateChanged fired, currentUser:', currentUser ? currentUser.uid : 'null')
      setUser(currentUser)
      setIsWhitelisted(false)
      if (currentUser) {
        try {
          console.log('Fetching idTokenResult for user:', currentUser.uid)
          const idTokenResult = await currentUser.getIdTokenResult()
          console.log('idTokenResult fetched, claims:', idTokenResult.claims)
          setIsWhitelisted(idTokenResult.claims.role === 'whitelisted')
          console.log('isWhitelisted set to:', idTokenResult.claims.role === 'whitelisted')
        } catch (err) {
          console.error('Error getting token:', err)
        }
      } else {
        console.log('No currentUser, skipping token fetch')
      }
    })
    return () => unsubscribe()
  }, [])

  const handleLogin = async () => {
    console.log('handleLogin started with email:', email)
    try {
      setError('')
      console.log('Attempting signInWithEmailAndPassword')
      await signInWithEmailAndPassword(auth, email, password)
      console.log('signInWithEmailAndPassword succeeded')
    } catch (err) {
      setError('Login failed: ' + err.message)
      console.log('signInWithEmailAndPassword failed:', err)
    }
  }

  const handleLogout = async () => {
    try {
      await signOut(auth)
    } catch (err) {
      console.error('Logout failed:', err)
    }
  }

  const handleGenerate = () => {
    const rows = pastedData.split('\n').filter(line => line.trim() !== '')
    const data = rows.map(row => {
      const parts = row.split('\t').map(p => p.trim())
      if (parts.length < 4) return null
      
      // New format: Symbol, Quantity, Fee, Source
      const symbol = parts[0]
      const quantity = parts[1].replace(/,/g, '')
      const fee = parts[2].replace('$', '')
      const source = parts[3] || 'Goldman'
      
      // Constants that get added automatically
      const importType = 'Fee'
      const type = 'locate'
      const rate = '-1%'
      
      return { importType, type, symbol, quantity, fee, rate, source }
    }).filter(d => d !== null)

    const headers = 'importType,Type,Symbol,Quantity,Fee,Rate,Source'
    const csvRows = data.map(d => `${d.importType},${d.type},${d.symbol},${d.quantity},${d.fee},${d.rate},${d.source}`)
    const csvContent = [headers, ...csvRows].join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const now = new Date()
    const mm = String(now.getMonth() + 1).padStart(2, '0')
    const dd = String(now.getDate()).padStart(2, '0')
    const yyyy = now.getFullYear()
    const time = now.toTimeString().split(' ')[0].replace(/:/g, '')
    const filename = `${mm}${dd}${yyyy}${time}_Locate_Upload.csv`
    const link = document.createElement('a')
    link.href = url
    link.download = filename
    link.click()
    URL.revokeObjectURL(url)
  }

  if (!user || !isWhitelisted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-blue-50">
        <div className="bg-white/80 backdrop-blur-sm p-10 rounded-2xl shadow-2xl border border-white/20 max-w-md w-full mx-4">
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-2xl mx-auto mb-4 flex items-center justify-center">
              <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent mb-2">
              Locate CSV Generator
            </h1>
            <p className="text-gray-600 text-sm">Sign in to your account</p>
          </div>
          
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6">
              <p className="text-red-700 text-sm text-center">{error}</p>
            </div>
          )}
          
          {!isWhitelisted && user && (
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-6">
              <p className="text-amber-800 text-sm text-center">Access denied: Your account is not whitelisted. Contact admin.</p>
            </div>
          )}
          
          <form className="space-y-6">
            <div className="space-y-1">
              <label className="text-sm font-medium text-gray-700 block">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email"
                className="w-full p-4 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-gray-50/50"
              />
            </div>
            
            <div className="space-y-1">
              <label className="text-sm font-medium text-gray-700 block">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                className="w-full p-4 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-gray-50/50"
              />
            </div>
            
            <button 
              type="button"
              onClick={handleLogin} 
              className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white p-4 rounded-xl font-semibold hover:from-blue-700 hover:to-indigo-700 transform hover:scale-[1.02] transition-all duration-200 shadow-lg hover:shadow-xl"
            >
              Sign in
            </button>
          </form>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-sm border-b border-gray-200/50 sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-6 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <div>
                <h1 className="text-xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
                  Locate CSV Generator
                </h1>
                <p className="text-xs text-gray-500">Financial data processing tool</p>
              </div>
            </div>
            
            <button 
              onClick={handleLogout} 
              className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded-xl font-medium transition-all duration-200 flex items-center space-x-2 border border-gray-200"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
              <span>Sign out</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-6xl mx-auto px-6 py-8">
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-2xl border border-white/20 overflow-hidden">
          {/* Card Header */}
          <div className="bg-gradient-to-r from-blue-500/10 to-indigo-500/10 px-8 py-6 border-b border-gray-200/50">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Data Input</h2>
            <p className="text-gray-600 text-sm">Paste your locate data below and generate a formatted CSV file</p>
          </div>

          {/* Card Content */}
          <div className="p-8">
            <div className="space-y-6">

              {/* Data Input */}
              <div className="space-y-3">
                <label className="block text-sm font-medium text-gray-700">
                  Locate Data
                  <span className="text-gray-400 ml-1">(Tab-separated values)</span>
                </label>
                <textarea
                  value={pastedData}
                  onChange={e => setPastedData(e.target.value)}
                  rows={12}
                  placeholder="Paste your locate data here...

Example:
CHEK	 15,000 	 $0.0100 	WEDBUSH
HSDT	 10,000 	 $0.0050 	LOC7"
                  className="w-full p-6 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-gray-50/30 font-mono text-sm resize-y min-h-[300px]"
                />
              </div>

              {/* Generate Button */}
              <div className="flex justify-end pt-4">
                <button 
                  onClick={handleGenerate}
                  disabled={!pastedData.trim()}
                  className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-8 py-4 rounded-xl font-semibold hover:from-blue-700 hover:to-indigo-700 transform hover:scale-[1.02] transition-all duration-200 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none flex items-center space-x-2"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  <span>Generate CSV</span>
                </button>
              </div>
            </div>
          </div>
        </div>

      </main>
    </div>
  )
}

export default App
