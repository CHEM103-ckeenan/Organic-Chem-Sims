import React, { useState } from 'react';
import { Atom, Video, FlaskConical } from 'lucide-react';
import ReactionSimulation from './components/ReactionSimulation';
import VeoStudio from './components/VeoStudio';

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'reaction' | 'veo'>('reaction');

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans selection:bg-indigo-500 selection:text-white">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-2">
              <div className="bg-indigo-600 p-2 rounded-lg">
                <FlaskConical className="w-6 h-6 text-white" />
              </div>
              <h1 className="text-xl font-bold bg-gradient-to-r from-indigo-600 to-cyan-600 bg-clip-text text-transparent">
                ChemAnim & Veo
              </h1>
            </div>
            
            <nav className="flex space-x-1 bg-slate-100 p-1 rounded-xl border border-slate-200">
              <button
                onClick={() => setActiveTab('reaction')}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                  activeTab === 'reaction'
                    ? 'bg-white text-indigo-600 shadow-sm ring-1 ring-black/5'
                    : 'text-slate-500 hover:text-slate-900 hover:bg-slate-200/50'
                }`}
              >
                <Atom className="w-4 h-4" />
                Reaction Vis
              </button>
              <button
                onClick={() => setActiveTab('veo')}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                  activeTab === 'veo'
                    ? 'bg-white text-indigo-600 shadow-sm ring-1 ring-black/5'
                    : 'text-slate-500 hover:text-slate-900 hover:bg-slate-200/50'
                }`}
              >
                <Video className="w-4 h-4" />
                Veo Studio
              </button>
            </nav>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="transition-opacity duration-300 ease-in-out">
          {activeTab === 'reaction' ? <ReactionSimulation /> : <VeoStudio />}
        </div>
      </main>
      
      {/* Footer */}
      <footer className="mt-12 border-t border-slate-200 py-6 text-center text-slate-500 text-sm">
        <p>© 2024 ChemAnim & Veo Studio. Powered by Gemini & React.</p>
      </footer>
    </div>
  );
};

export default App;