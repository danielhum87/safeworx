import Link from 'next/link'

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <div className="flex items-center space-x-2">
            <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-xl">S</span>
            </div>
            <span className="text-2xl font-bold text-gray-900">SafeWorx</span>
          </div>
          <nav className="hidden md:flex space-x-8">
            <a href="#features" className="text-gray-600 hover:text-gray-900">Features</a>
            <a href="#how-it-works" className="text-gray-600 hover:text-gray-900">How It Works</a>
            <a href="#pricing" className="text-gray-600 hover:text-gray-900">Pricing</a>
          </nav>
          <div className="flex space-x-4">
            <button className="text-gray-600 hover:text-gray-900 font-medium">
              Sign In
            </button>
            <button className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 font-medium">
              Get Started
            </button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="text-center">
          <h1 className="text-5xl md:text-6xl font-bold text-gray-900 mb-6">
            One Tap Could
            <span className="block text-blue-600">Save Your Life</span>
          </h1>
          <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
            The safety app for lone workers, first dates, and anyone who works or meets people alone. 
            Emergency alerts sent to your contacts and verified venues with a single tap.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            
             <Link href="/signup">
            <button className="bg-blue-600 text-white px-8 py-4 rounded-lg hover:bg-blue-700 font-semibold text-lg">
            Start Free Trial
           </button>
          </Link>
          
            <button className="border-2 border-gray-300 text-gray-700 px-8 py-4 rounded-lg hover:border-gray-400 font-semibold text-lg">
              Watch Demo
            </button>
          </div>
          <p className="text-sm text-gray-500 mt-4">
            14-day free trial • No credit card required
          </p>
        </div>

        {/* App Preview */}
        <div className="mt-16 relative">
          <div className="absolute inset-0 bg-gradient-to-t from-white via-transparent to-transparent h-32 bottom-0 z-10"></div>
          <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-4xl mx-auto border border-gray-200">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="text-center p-6 bg-gray-50 rounded-xl">
                <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-3xl">🚨</span>
                </div>
                <h3 className="font-bold text-lg mb-2">One-Tap Alert</h3>
                <p className="text-gray-600 text-sm">Instantly alert emergency contacts and nearby venues</p>
              </div>
              <div className="text-center p-6 bg-gray-50 rounded-xl">
                <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-3xl">📍</span>
                </div>
                <h3 className="font-bold text-lg mb-2">Live Location</h3>
                <p className="text-gray-600 text-sm">Share your real-time location with trusted contacts</p>
              </div>
              <div className="text-center p-6 bg-gray-50 rounded-xl">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-3xl">🏢</span>
                </div>
                <h3 className="font-bold text-lg mb-2">Verified Venues</h3>
                <p className="text-gray-600 text-sm">Network of bars & restaurants ready to help</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="bg-gray-50 py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">Built for Your Safety</h2>
            <p className="text-xl text-gray-600">Multiple ways to stay safe, whatever situation you're in</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <div className="bg-white p-8 rounded-xl shadow-sm">
              <div className="text-4xl mb-4">👤</div>
              <h3 className="text-xl font-bold mb-3">Lone Workers</h3>
              <p className="text-gray-600">Check-in timers, location tracking, and automatic alerts if you don't check out on time.</p>
            </div>

            <div className="bg-white p-8 rounded-xl shadow-sm">
              <div className="text-4xl mb-4">💝</div>
              <h3 className="text-xl font-bold mb-3">First Dates</h3>
              <p className="text-gray-600">Date mode with pre-set excuses, venue alerts, and emergency contacts on standby.</p>
            </div>

            <div className="bg-white p-8 rounded-xl shadow-sm">
              <div className="text-4xl mb-4">🏪</div>
              <h3 className="text-xl font-bold mb-3">Verified Venues</h3>
              <p className="text-gray-600">Partner bars and restaurants receive alerts on tablets, staff can help discreetly.</p>
            </div>

            <div className="bg-white p-8 rounded-xl shadow-sm">
              <div className="text-4xl mb-4">📞</div>
              <h3 className="text-xl font-bold mb-3">Emergency Contacts</h3>
              <p className="text-gray-600">Add unlimited contacts, set primary responders, send instant alerts with location.</p>
            </div>

            <div className="bg-white p-8 rounded-xl shadow-sm">
              <div className="text-4xl mb-4">⏰</div>
              <h3 className="text-xl font-bold mb-3">Check-In Timers</h3>
              <p className="text-gray-600">Set automatic check-ins, get reminded, auto-alert if you forget.</p>
            </div>

            <div className="bg-white p-8 rounded-xl shadow-sm">
              <div className="text-4xl mb-4">🗺️</div>
              <h3 className="text-xl font-bold mb-3">Location Sharing</h3>
              <p className="text-gray-600">Real-time GPS tracking, breadcrumb trail of where you've been.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Story Section */}
      <section className="py-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-blue-50 border-l-4 border-blue-600 p-8 rounded-r-xl">
            <h3 className="text-2xl font-bold text-gray-900 mb-4">Why I Built SafeWorx</h3>
            <p className="text-gray-700 mb-4">
              "Three years ago, I was trapped in a customer's bathroom by someone threatening me with a knife. 
              I'm a gas engineer - I work alone in people's homes every day. That day, nobody knew where I was. 
              I had no way to call for help without making things worse."
            </p>
            <p className="text-gray-700 mb-4">
              "I barely escaped. But it made me realize: there are millions of people who work alone, meet strangers, 
              or put themselves in vulnerable situations every single day. And most have no safety net."
            </p>
            <p className="text-gray-700 font-semibold">
              "SafeWorx is that safety net. Because nobody should die because they couldn't call for help."
            </p>
            <p className="text-gray-600 mt-4">— James, Founder</p>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-blue-600 py-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-4xl font-bold text-white mb-4">Ready to Feel Safer?</h2>
          <p className="text-xl text-blue-100 mb-8">
            Join thousands of people who refuse to work or date alone without backup.
          </p>
          <button className="bg-white text-blue-600 px-8 py-4 rounded-lg hover:bg-gray-100 font-semibold text-lg">
            Start Your Free Trial
          </button>
          <p className="text-blue-100 text-sm mt-4">No credit card required • Cancel anytime</p>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-400 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center space-x-2 mb-4">
                <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold">S</span>
                </div>
                <span className="text-white font-bold text-lg">SafeWorx</span>
              </div>
              <p className="text-sm">Making the world safer, one tap at a time.</p>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-4">Product</h4>
              <ul className="space-y-2 text-sm">
                <li><a href="#" className="hover:text-white">Features</a></li>
                <li><a href="#" className="hover:text-white">Pricing</a></li>
                <li><a href="#" className="hover:text-white">For Venues</a></li>
              </ul>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-4">Company</h4>
              <ul className="space-y-2 text-sm">
                <li><a href="#" className="hover:text-white">About</a></li>
                <li><a href="#" className="hover:text-white">Blog</a></li>
                <li><a href="#" className="hover:text-white">Contact</a></li>
              </ul>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-4">Legal</h4>
              <ul className="space-y-2 text-sm">
                <li><a href="#" className="hover:text-white">Privacy</a></li>
                <li><a href="#" className="hover:text-white">Terms</a></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-800 mt-8 pt-8 text-center text-sm">
            <p>&copy; 2025 SafeWorx. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}