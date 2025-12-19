
import React, { useState, useEffect, useRef } from 'react';
import { PostStyle, ModelTier, ProviderEngine, GeneratedPost, ProviderConfig } from './types';
import { generateXPost } from './services/geminiService';
import { Button } from './components/Button';
import { PostCard } from './components/PostCard';

const RESEARCH_LOGS = [
  "CONNECTING_SECURE_RESEARCH_NODES...",
  "CRAWLING_LIVE_SATELLITE_DATA...",
  "EXTRACTING_VERIFIED_CONTEXT...",
  "SCRUBBING_SYNTHETIC_NOISE...",
  "CALIBRATING_HUMAN_TONALITY...",
  "FINALIZING_NARRATIVE_PAYLOAD...",
  "DEPLOYING_GHOST_SIGNAL..."
];

const ENGINE_MODELS: Record<string, { id: string, name: string, description?: string }[]> = {
  [ProviderEngine.GEMINI]: [
    { id: 'gemini-3-flash-preview', name: 'Gemini 3 Flash', description: 'Ultra-fast intelligence' },
    { id: 'gemini-3-pro-preview', name: 'Gemini 3 Pro', description: 'Advanced reasoning' },
    { id: 'gemini-flash-lite-latest', name: 'Gemini Flash Lite', description: 'Efficient & concise' },
  ],
  [ProviderEngine.OPENROUTER]: [
    { id: 'google/gemini-2.0-flash-lite-preview-02-05:free', name: 'Gemini 2.0 Flash Lite (Free)', description: 'Fast and reliable' },
    { id: 'deepseek/deepseek-r1:free', name: 'DeepSeek R1 (Free)', description: 'Advanced reasoning' },
    { id: 'meta-llama/llama-3.1-8b-instruct:free', name: 'Llama 3.1 8B (Free)', description: 'Punchy' },
    { id: 'openai/gpt-4o-mini', name: 'GPT-4o Mini', description: 'Smart and economical' },
    { id: 'anthropic/claude-3.5-sonnet', name: 'Claude 3.5 Sonnet', description: 'Creative writing' },
  ],
  [ProviderEngine.GROQ]: [
    { id: 'llama-3-70b-8192', name: 'Llama 3 70B', description: 'Instant generation' },
    { id: 'llama3-8b-8192', name: 'Llama 3 8B', description: 'Hyper-speed' },
  ],
  [ProviderEngine.OPENAI]: [
    { id: 'gpt-4o', name: 'GPT-4o', description: 'Flagship model' },
    { id: 'gpt-4o-mini', name: 'GPT-4o Mini', description: 'Fast' },
  ],
  [ProviderEngine.ANTHROPIC]: [
    { id: 'claude-3-5-sonnet-latest', name: 'Claude 3.5 Sonnet', description: 'The writer\'s choice' },
  ],
  [ProviderEngine.GROK]: [
    { id: 'grok-beta', name: 'Grok Beta', description: 'Witty and current' },
  ]
};

export default function App() {
  const [isDarkMode, setIsDarkMode] = useState(true);
  const [projectName, setProjectName] = useState('');
  const [maxCharacters, setMaxCharacters] = useState(280);
  const [style, setStyle] = useState<PostStyle>(PostStyle.STORYTELLER);
  const [customStyleDescription, setCustomStyleDescription] = useState('');
  const [engine, setEngine] = useState<ProviderEngine>(ProviderEngine.GEMINI);
  const [modelTier, setModelTier] = useState<ModelTier>(ModelTier.FLASH);
  const [isGenerating, setIsGenerating] = useState(false);
  const [logIndex, setLogIndex] = useState(0);
  const [result, setResult] = useState<GeneratedPost | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [activeMenu, setActiveMenu] = useState<'style' | 'model' | 'engine' | 'setup-model' | null>(null);
  const [hasKey, setHasKey] = useState(false);
  const [refinementCommand, setRefinementCommand] = useState('');

  const [isSetupOpen, setIsSetupOpen] = useState(false);
  const [setupEngine, setSetupEngine] = useState<ProviderEngine>(ProviderEngine.GEMINI);
  const [configs, setConfigs] = useState<Record<string, ProviderConfig>>({
    [ProviderEngine.GEMINI]: { engine: ProviderEngine.GEMINI, apiKey: '', model: 'gemini-3-flash-preview', temperature: 0.7 },
    [ProviderEngine.GROQ]: { engine: ProviderEngine.GROQ, apiKey: '', model: 'llama-3-70b-8192', baseUrl: 'https://api.groq.com/openai/v1/chat/completions', temperature: 0.2 },
    [ProviderEngine.OPENAI]: { engine: ProviderEngine.OPENAI, apiKey: '', model: 'gpt-4o', baseUrl: 'https://api.openai.com/v1/chat/completions', temperature: 0.7 },
    [ProviderEngine.ANTHROPIC]: { engine: ProviderEngine.ANTHROPIC, apiKey: '', model: 'claude-3-5-sonnet-latest', baseUrl: '', temperature: 0.7 },
    [ProviderEngine.OPENROUTER]: { engine: ProviderEngine.OPENROUTER, apiKey: '', model: 'google/gemini-2.0-flash-lite-preview-02-05:free', baseUrl: 'https://openrouter.ai/api/v1/chat/completions', temperature: 0.7 },
    [ProviderEngine.GROK]: { engine: ProviderEngine.GROK, apiKey: '', model: 'grok-beta', baseUrl: 'https://api.x.ai/v1/chat/completions', temperature: 0.7 }
  });

  const styleDropdownRef = useRef<HTMLDivElement>(null);
  const modelDropdownRef = useRef<HTMLDivElement>(null);
  const engineDropdownRef = useRef<HTMLDivElement>(null);
  const setupModelDropdownRef = useRef<HTMLDivElement>(null);
  const blob1Ref = useRef<HTMLDivElement>(null);
  const blob2Ref = useRef<HTMLDivElement>(null);
  const blob3Ref = useRef<HTMLDivElement>(null);
  
  const mouse = useRef({ x: window.innerWidth / 2, y: window.innerHeight / 2 });
  const pos = useRef({ x1: 0, y1: 0, x2: 0, y2: 0, x3: 0, y3: 0 });

  useEffect(() => {
    const saved = localStorage.getItem('postix_configs');
    if (saved) setConfigs(JSON.parse(saved));
    
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }

    const checkKey = async () => {
      // @ts-ignore
      if (window.aistudio && typeof window.aistudio.hasSelectedApiKey === 'function') {
        try {
          // @ts-ignore
          const selected = await window.aistudio.hasSelectedApiKey();
          setHasKey(selected);
        } catch (e) {
          setHasKey(true);
        }
      } else {
        setHasKey(true);
      }
    };
    checkKey();
  }, [isDarkMode]);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      mouse.current = { x: e.clientX, y: e.clientY };
    };
    const handleClickOutside = (e: MouseEvent) => {
      if (
        (styleDropdownRef.current && !styleDropdownRef.current.contains(e.target as Node)) &&
        (modelDropdownRef.current && !modelDropdownRef.current.contains(e.target as Node)) &&
        (engineDropdownRef.current && !engineDropdownRef.current.contains(e.target as Node)) &&
        (setupModelDropdownRef.current && !setupModelDropdownRef.current.contains(e.target as Node))
      ) {
        setActiveMenu(null);
      }
    };
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mousedown', handleClickOutside);

    let frameId: number;
    const animateBlobs = () => {
      pos.current.x1 += (mouse.current.x - pos.current.x1) * 0.08;
      pos.current.y1 += (mouse.current.y - pos.current.y1) * 0.08;
      pos.current.x2 += (mouse.current.x - pos.current.x2) * 0.05;
      pos.current.y2 += (mouse.current.y - pos.current.y2) * 0.05;
      pos.current.x3 += (mouse.current.x - pos.current.x3) * 0.02;
      pos.current.y3 += (mouse.current.y - pos.current.y3) * 0.02;

      if (blob1Ref.current) blob1Ref.current.style.transform = `translate3d(${pos.current.x1 - 300}px, ${pos.current.y1 - 300}px, 0)`;
      if (blob2Ref.current) blob2Ref.current.style.transform = `translate3d(${pos.current.x2 - 400}px, ${pos.current.y2 - 400}px, 0)`;
      if (blob3Ref.current) blob3Ref.current.style.transform = `translate3d(${pos.current.x3 - 500}px, ${pos.current.y3 - 500}px, 0)`;

      frameId = requestAnimationFrame(animateBlobs);
    };
    frameId = requestAnimationFrame(animateBlobs);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mousedown', handleClickOutside);
      cancelAnimationFrame(frameId);
    };
  }, []);

  useEffect(() => {
    if (isGenerating) {
      const interval = setInterval(() => {
        setLogIndex(prev => (prev < RESEARCH_LOGS.length - 1 ? prev + 1 : prev));
      }, 700);
      return () => clearInterval(interval);
    }
  }, [isGenerating]);

  const handleLinkKey = async () => {
    // @ts-ignore
    if (window.aistudio && typeof window.aistudio.openSelectKey === 'function') {
      try {
        // @ts-ignore
        await window.aistudio.openSelectKey();
        // @ts-ignore
        const selected = await window.aistudio.hasSelectedApiKey();
        setHasKey(selected);
      } catch (e) {
        setError("AI Studio selector failed.");
      }
    } else {
      setIsSetupOpen(true);
      setSetupEngine(ProviderEngine.GEMINI);
    }
  };

  const saveConfigs = () => {
    localStorage.setItem('postix_configs', JSON.stringify(configs));
    setIsSetupOpen(false);
  };

  const handleGenerate = async (e?: React.FormEvent, refinement?: string) => {
    if (e) e.preventDefault();
    if (!projectName.trim() && !refinement) return;
    
    // @ts-ignore
    const isAiStudio = !!(window.aistudio && window.aistudio.openSelectKey);
    const currentConfig = configs[engine];
    const hasManualKey = currentConfig?.apiKey?.trim();

    if (engine === ProviderEngine.GEMINI && !hasKey && isAiStudio && !hasManualKey) {
      await handleLinkKey();
      return;
    }

    if (!hasManualKey && !hasKey) {
      setSetupEngine(engine);
      setIsSetupOpen(true);
      return;
    }

    setIsGenerating(true);
    if (!refinement) setResult(null); 
    setError(null);
    setLogIndex(0);
    
    try {
      const response = await generateXPost({ 
        projectName, 
        maxCharacters, 
        style, 
        customStyleDescription,
        engine,
        modelTier,
        config: currentConfig,
        refinementCommand: refinement,
        previousHistory: result?.history as any
      });
      setResult(response);
      setRefinementCommand('');
    } catch (err: any) {
      setError(err.message || "Synthesis Protocol Error.");
    } finally {
      setIsGenerating(false);
    }
  };

  const getModelLabel = (eng: string, modelId: string) => {
    const found = ENGINE_MODELS[eng]?.find(m => m.id === modelId);
    return found ? found.name : (modelId || 'Select Model');
  };

  return (
    <div className="min-h-screen flex flex-col relative overflow-hidden bg-zinc-50 dark:bg-black transition-colors duration-700">
      <div ref={blob3Ref} className="fluid-blob w-[1000px] h-[1000px] bg-[#0071e3]" />
      <div ref={blob2Ref} className="fluid-blob w-[800px] h-[800px] bg-[#0071e3]" />
      <div ref={blob1Ref} className="fluid-blob w-[600px] h-[600px] bg-[#0071e3]" />
      <div className="fixed inset-0 z-0 grid-pattern pointer-events-none" />

      {/* Header */}
      <header className="relative z-50 w-full max-w-7xl mx-auto px-6 lg:px-10 py-8 flex items-center justify-between animate-reveal">
        <div className="flex items-center gap-4 group cursor-pointer" onClick={() => window.location.reload()}>
          <div className="w-12 h-12 bg-white dark:bg-white flex items-center justify-center rounded-2xl shadow-xl border border-zinc-200 dark:border-transparent">
            <span className="text-black font-black text-xl tracking-tighter">P</span>
          </div>
          <h1 className="text-xl font-black tracking-tighter uppercase text-zinc-900 dark:text-white">Postix</h1>
        </div>

        <div className="flex items-center gap-3">
          <button 
            onClick={() => setIsSetupOpen(true)}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-white dark:bg-[#1a1a1c] border border-zinc-200 dark:border-white/10 text-[10px] font-black uppercase tracking-widest text-zinc-900 dark:text-white hover:bg-zinc-100 dark:hover:bg-[#2c2c2e] transition-all shadow-sm"
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
            Integrations
          </button>
          
          <button onClick={() => setIsDarkMode(!isDarkMode)} className="p-3 bg-white dark:bg-[#1a1a1c] rounded-xl border border-zinc-200 dark:border-white/10 shadow-sm text-zinc-900 dark:text-white">
            {isDarkMode ? (
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364-6.364l-.707.707M12 7a5 5 0 100 10 5 5 0 000-10z" /></svg>
            ) : (
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" /></svg>
            )}
          </button>
        </div>
      </header>

      {/* SETUP MODAL */}
      {isSetupOpen && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 animate-reveal">
          <div className="absolute inset-0 bg-zinc-900/40 dark:bg-black/80 backdrop-blur-md" onClick={() => setIsSetupOpen(false)} />
          <div className="relative w-full max-w-lg bg-white dark:bg-[#121214] rounded-[2.5rem] p-8 md:p-10 shadow-2xl border border-zinc-200 dark:border-white/10 overflow-hidden flex flex-col max-h-[90vh]">
            <div className="flex items-center justify-between mb-8 shrink-0">
              <div>
                <h2 className="text-xl font-black uppercase tracking-tight text-zinc-900 dark:text-white leading-none">PROVIDER SETUP</h2>
                <p className="text-[8px] font-black uppercase tracking-[0.4em] text-zinc-500 dark:text-zinc-400 mt-2">Configure Node Settings</p>
              </div>
              <button onClick={() => setIsSetupOpen(false)} className="p-2.5 bg-zinc-100 dark:bg-white/10 rounded-full text-zinc-900 dark:text-white hover:scale-110 transition-transform"><svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={4}><path d="M6 18L18 6M6 6l12 12" /></svg></button>
            </div>

            <div className="space-y-6 overflow-y-auto custom-scrollbar pr-2 pb-6 grow">
              <div className="grid grid-cols-3 gap-2">
                {Object.values(ProviderEngine).map(e => (
                  <button key={e} onClick={() => setSetupEngine(e)} className={`py-3 rounded-xl text-[8px] font-black uppercase tracking-widest transition-all border ${setupEngine === e ? 'bg-[#0071e3] text-white border-transparent' : 'bg-zinc-50 dark:bg-white/5 text-zinc-600 dark:text-zinc-300 border-zinc-200 dark:border-white/10'}`}>{e.split(' ').pop()}</button>
                ))}
              </div>

              <div className="bg-zinc-50 dark:bg-zinc-900/50 rounded-2xl p-6 border border-zinc-200 dark:border-white/5 space-y-6">
                <div className="space-y-5">
                  {/* Unified API Key Field */}
                  <div className="space-y-2">
                    <label className="text-[9px] font-black uppercase tracking-[0.2em] text-zinc-500 dark:text-zinc-400">API Access Key</label>
                    <input 
                      type="password" 
                      value={configs[setupEngine]?.apiKey || ''} 
                      onChange={(e) => setConfigs({ ...configs, [setupEngine]: { ...configs[setupEngine], apiKey: e.target.value } })} 
                      placeholder={setupEngine === ProviderEngine.GEMINI ? "Enter Gemini API Key..." : "sk-..."} 
                      className="w-full rounded-xl px-4 py-4 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-none outline-none text-[11px] font-mono font-bold text-zinc-900 dark:text-white" 
                    />
                    {setupEngine === ProviderEngine.GEMINI && (
                      <p className="text-[7px] font-black uppercase tracking-widest text-[#0071e3] mt-1 opacity-60">Manual override for system key</p>
                    )}
                  </div>

                  {/* Unified Model Dropdown - Fixed positioning to open downwards and avoid clipping */}
                  <div className="space-y-2" ref={setupModelDropdownRef}>
                    <label className="text-[9px] font-black uppercase tracking-[0.2em] text-zinc-500 dark:text-zinc-400">Target Model</label>
                    <div className="relative">
                      <button 
                        type="button" 
                        onClick={() => setActiveMenu(activeMenu === 'setup-model' ? null : 'setup-model')}
                        className="w-full bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-none rounded-xl px-4 py-4 flex items-center justify-between text-[11px] font-bold text-zinc-900 dark:text-white"
                      >
                        <span className="truncate">{getModelLabel(setupEngine, configs[setupEngine]?.model || '')}</span>
                        <svg className={`w-3 h-3 opacity-40 transition-transform ${activeMenu === 'setup-model' ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path d="M19 9l-7 7-7-7" /></svg>
                      </button>
                      
                      {activeMenu === 'setup-model' && (
                        <div className="absolute top-full mt-2 left-0 w-full bg-white dark:bg-[#1a1a1c] rounded-2xl p-2 shadow-2xl border border-zinc-200 dark:border-white/10 z-[210] animate-reveal origin-top space-y-1 max-h-[250px] overflow-y-auto custom-scrollbar">
                          {ENGINE_MODELS[setupEngine]?.map(m => (
                            <button 
                              key={m.id} 
                              type="button" 
                              onClick={() => { setConfigs({...configs, [setupEngine]: {...configs[setupEngine], model: m.id}}); setActiveMenu(null); }}
                              className={`w-full text-left px-4 py-3 rounded-lg transition-all ${configs[setupEngine]?.model === m.id ? 'bg-[#0071e3] text-white' : 'hover:bg-zinc-100 dark:hover:bg-white/5 text-zinc-900 dark:text-zinc-100'}`}
                            >
                              <div className="text-[10px] font-black uppercase tracking-tighter">{m.name}</div>
                              {m.description && <div className="text-[8px] opacity-60 font-medium truncate">{m.description}</div>}
                            </button>
                          ))}
                          <div className="p-3 border-t border-zinc-200 dark:border-white/10 mt-1">
                            <p className="text-[8px] font-black uppercase tracking-widest text-zinc-400 mb-2">Manual Model ID</p>
                            <input 
                              type="text" 
                              placeholder="e.g. gpt-4o" 
                              value={configs[setupEngine]?.model || ''}
                              onChange={(e) => setConfigs({...configs, [setupEngine]: {...configs[setupEngine], model: e.target.value}})}
                              onClick={(e) => e.stopPropagation()}
                              className="w-full bg-zinc-100 dark:bg-white/5 rounded-lg px-3 py-2 text-[10px] outline-none border-none focus:ring-1 focus:ring-[#0071e3]"
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-[9px] font-black uppercase tracking-[0.2em] text-zinc-500 dark:text-zinc-400">Temp</label>
                      <input type="number" step="0.1" min="0" max="2" value={configs[setupEngine]?.temperature || 0.7} onChange={(e) => setConfigs({ ...configs, [setupEngine]: { ...configs[setupEngine], temperature: parseFloat(e.target.value) } })} className="w-full rounded-xl px-4 py-4 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-none outline-none text-[10px] font-bold text-zinc-900 dark:text-white" />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[9px] font-black uppercase tracking-[0.2em] text-zinc-500 dark:text-zinc-400">Context</label>
                      <div className="w-full px-4 py-4 bg-zinc-100 dark:bg-zinc-800/50 rounded-xl text-[10px] font-bold opacity-40 uppercase">Hybrid</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex gap-3 pt-6 border-t border-zinc-200 dark:border-white/10 mt-auto shrink-0">
              <Button onClick={() => setIsSetupOpen(false)} variant="outline" className="flex-1 h-12 rounded-xl text-[9px] text-zinc-500 border-zinc-200 dark:border-white/10">Discard</Button>
              <Button onClick={saveConfigs} className="flex-[2] h-12 rounded-xl text-[9px] bg-[#0071e3] text-white">Save Engine</Button>
            </div>
          </div>
        </div>
      )}

      {/* Main UI */}
      <main className="relative z-20 flex-1 w-full max-w-7xl mx-auto px-6 lg:px-10 py-4 grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-20 items-start">
        <div className="lg:col-span-5 space-y-10 animate-reveal">
          <div className="space-y-4">
            <h2 className="text-6xl md:text-8xl font-black tracking-tighter leading-[0.85] text-zinc-900 dark:text-white transition-colors uppercase">Signal <br /> Craft.</h2>
            <p className="opacity-70 font-medium text-lg text-zinc-700 dark:text-zinc-300">Intelligent research & ghostwriting.</p>
          </div>

          <form onSubmit={(e) => handleGenerate(e)} className="bg-white dark:bg-[#121214] rounded-[3rem] p-8 lg:p-12 space-y-10 shadow-xl border border-zinc-200 dark:border-white/10 transition-colors">
            <div className="space-y-3 relative">
              <div className="flex justify-between items-center px-1">
                <label className="text-[10px] font-black uppercase tracking-[0.6em] text-zinc-500 dark:text-zinc-400">Subject or URL</label>
                <div className="bg-zinc-100 dark:bg-white/5 px-3 py-1.5 rounded-lg flex items-center gap-2 border border-zinc-200 dark:border-white/10">
                   <input type="number" value={maxCharacters} onChange={(e) => setMaxCharacters(parseInt(e.target.value) || 0)} className="w-12 bg-transparent border-none focus:ring-0 text-[10px] font-mono font-bold text-[#0071e3] text-right p-0" />
                   <span className="text-[8px] font-black text-zinc-400 dark:text-white/40">LMT</span>
                </div>
              </div>
              <input type="text" value={projectName} onChange={(e) => setProjectName(e.target.value)} placeholder="Topic, @username, or https://..." className="w-full rounded-2xl px-6 py-5 focus:outline-none focus:ring-2 focus:ring-[#0071e3]/40 transition-all text-lg font-bold border border-zinc-200 dark:border-none bg-zinc-50 dark:bg-zinc-900 text-zinc-900 dark:text-zinc-50" required />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-3" ref={engineDropdownRef}>
                <label className="text-[9px] font-black uppercase text-zinc-500 dark:text-zinc-400">Engine Protocol</label>
                <div className="relative">
                  <button type="button" onClick={() => setActiveMenu(activeMenu === 'engine' ? null : 'engine')} className="w-full bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-white/10 rounded-xl px-4 py-4 flex items-center justify-between text-[10px] font-black uppercase text-zinc-900 dark:text-white transition-colors">
                    <span className="truncate">{engine.split(' ').pop()}</span>
                    <svg className="w-3 h-3 opacity-40" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path d="M19 9l-7 7-7-7" /></svg>
                  </button>
                  {activeMenu === 'engine' && (
                    <div className="absolute top-full mt-2 left-0 w-full bg-white dark:bg-[#1a1a1c] rounded-2xl p-2 shadow-2xl border border-zinc-200 dark:border-white/10 z-[100] animate-reveal origin-top space-y-1">
                      {Object.values(ProviderEngine).map(e => (
                        <button key={e} type="button" onClick={() => { setEngine(e); setActiveMenu(null); }} className={`w-full text-left px-4 py-3 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all ${engine === e ? 'bg-[#0071e3] text-white shadow-lg' : 'hover:bg-zinc-100 dark:hover:bg-white/10 text-zinc-900 dark:text-zinc-200'}`}>{e}</button>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <div className="space-y-3" ref={modelDropdownRef}>
                <label className="text-[9px] font-black uppercase text-zinc-500 dark:text-zinc-400">Reasoning Tier</label>
                <div className="relative">
                  <button type="button" onClick={() => setActiveMenu(activeMenu === 'model' ? null : 'model')} className="w-full bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-white/10 rounded-xl px-4 py-4 flex items-center justify-between text-[10px] font-black uppercase text-zinc-900 dark:text-white transition-colors">
                    <span className="truncate">{modelTier.split(' ').pop().replace('(', '').replace(')', '')}</span>
                    <svg className="w-3 h-3 opacity-40" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path d="M19 9l-7 7-7-7" /></svg>
                  </button>
                  {activeMenu === 'model' && (
                    <div className="absolute top-full mt-2 left-0 w-full bg-white dark:bg-[#1a1a1c] rounded-2xl p-2 shadow-2xl border border-zinc-200 dark:border-white/10 z-[100] animate-reveal origin-top space-y-1">
                      {Object.values(ModelTier).map(m => (
                        <button key={m} type="button" onClick={() => { setModelTier(m); setActiveMenu(null); }} className={`w-full text-left px-4 py-3 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all ${modelTier === m ? 'bg-[#0071e3] text-white shadow-lg' : 'hover:bg-zinc-100 dark:hover:bg-white/10 text-zinc-900 dark:text-zinc-200'}`}>{m}</button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="space-y-3" ref={styleDropdownRef}>
              <label className="text-[10px] font-black uppercase tracking-[0.6em] text-zinc-500 dark:text-zinc-400 px-1">Perspective Identity</label>
              <div className="relative">
                <button type="button" onClick={() => setActiveMenu(activeMenu === 'style' ? null : 'style')} className="w-full bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-white/10 rounded-2xl px-6 py-5 flex items-center justify-between text-[11px] font-black uppercase tracking-[0.2em] text-zinc-900 dark:text-white shadow-sm">
                  <span className="truncate">{style}</span>
                  <svg className="w-4 h-4 opacity-40" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path d="M19 9l-7 7-7-7" /></svg>
                </button>
                {activeMenu === 'style' && (
                  <div className="absolute top-full mt-3 left-0 w-full bg-white dark:bg-[#1a1a1c] rounded-[2rem] p-4 shadow-2xl border border-zinc-200 dark:border-white/10 z-[100] animate-reveal origin-top grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-[300px] overflow-y-auto custom-scrollbar">
                    {Object.values(PostStyle).map(s => (
                      <button key={s} type="button" onClick={() => { setStyle(s); setActiveMenu(null); }} className={`w-full text-left px-4 py-3 rounded-xl text-[8px] font-black uppercase tracking-widest transition-all ${style === s ? 'bg-[#0071e3] text-white shadow-lg' : 'hover:bg-zinc-100 dark:hover:bg-white/5 text-zinc-900 dark:text-zinc-200'}`}>{s}</button>
                    ))}
                  </div>
                )}
              </div>
              
              {style === PostStyle.CUSTOM && (
                <div className="mt-4 animate-reveal">
                  <textarea 
                    value={customStyleDescription}
                    onChange={(e) => setCustomStyleDescription(e.target.value)}
                    placeholder="Describe the persona... (e.g. A cynical 1950s detective, or a hyper-active tech influencer)"
                    className="w-full h-24 rounded-2xl px-6 py-4 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-none text-[11px] font-bold text-zinc-900 dark:text-white focus:ring-2 focus:ring-[#0071e3] outline-none transition-all"
                  />
                </div>
              )}
            </div>

            <Button type="submit" isLoading={isGenerating} className="w-full h-20 rounded-[1.8rem] bg-[#0071e3] text-white shadow-[0_20px_50px_rgba(0,113,227,0.3)] font-black uppercase tracking-[0.4em] text-[10px] transition-all duration-500 active:scale-95">
              {isGenerating ? 'ANALYZING...' : 'Generate Protocol Posts'}
            </Button>
          </form>
        </div>

        {/* RESULTS AREA */}
        <div className="lg:col-span-7 flex flex-col justify-start lg:pt-14 min-h-[500px]">
          {isGenerating && (
            <div className="w-full space-y-8 animate-reveal">
              <div className="bg-white dark:bg-[#121214] rounded-[3rem] p-10 font-mono text-[10px] shadow-xl relative overflow-hidden border border-zinc-200 dark:border-white/10">
                <div className="absolute top-0 left-0 w-full h-1 bg-[#0071e3] animate-pulse"></div>
                <div className="flex items-center gap-4 border-b border-zinc-200 dark:border-white/10 pb-6 mb-6">
                  <div className="flex gap-2"><div className="w-2 h-2 rounded-full bg-[#0071e3]"></div><div className="w-2 h-2 rounded-full bg-zinc-300 dark:bg-zinc-700"></div></div>
                  <span className="opacity-60 font-black uppercase text-zinc-900 dark:text-white">Neural_Synthesis_Stream</span>
                </div>
                <div className="space-y-3 text-zinc-900 dark:text-zinc-100">
                  {RESEARCH_LOGS.slice(0, logIndex + 1).map((log, i) => (
                    <div key={i} className="flex gap-6 animate-reveal opacity-80"><span className="opacity-40 text-zinc-400">[{new Date().toLocaleTimeString([], { hour12: false })}]</span><span className={i === logIndex ? "text-[#0071e3] font-black" : "font-medium"}>{i === logIndex ? ">> " : "OK "}{log}</span></div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {!result && !isGenerating && !error && (
            <div className="flex-1 flex flex-col items-center justify-center text-center py-20 animate-reveal">
              <div className="w-24 h-24 bg-white dark:bg-white/5 border border-zinc-200 dark:border-white/10 rounded-[2.5rem] flex items-center justify-center mb-8 shadow-sm">
                <svg className="w-10 h-10 opacity-30 text-zinc-900 dark:text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={0.5}><path d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
              </div>
              <h3 className="text-[10px] font-black uppercase tracking-[0.7em] opacity-40 text-zinc-900 dark:text-white">Ready for Synthesis</h3>
            </div>
          )}

          {error && (
            <div className="w-full p-12 bg-red-50 dark:bg-red-500/5 rounded-[3rem] text-center space-y-6 animate-reveal border border-red-500/20 shadow-sm">
              <div className="w-16 h-16 bg-red-500/10 text-red-500 rounded-[1.5rem] flex items-center justify-center mx-auto"><svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg></div>
              <p className="font-bold text-red-600 dark:text-red-400">{error}</p>
              <Button onClick={() => setError(null)} variant="outline" className="px-8 py-3 text-[9px] border-zinc-200 dark:border-white/10 text-zinc-600 dark:text-zinc-300 mx-auto">Dismiss</Button>
            </div>
          )}

          {result && !isGenerating && (
            <div className="w-full space-y-8 animate-reveal">
              <div className="flex items-center justify-between px-6">
                <div className="flex items-center gap-3"><div className="w-2 h-2 bg-[#0071e3] rounded-full shadow-lg"></div><span className="text-[10px] font-black uppercase tracking-[0.5em] text-zinc-500 dark:text-white/40">Payload_Validated</span></div>
                <div className="bg-zinc-200 dark:bg-white/10 px-4 py-1.5 rounded-full"><span className="text-[10px] font-mono font-bold text-[#0071e3]">{result.content.length} / {maxCharacters}</span></div>
              </div>
              <PostCard post={result} />
              
              {/* REFINEMENT COMMAND BAR */}
              <div className="bg-white dark:bg-[#121214] border border-zinc-200 dark:border-white/10 rounded-[2.5rem] p-6 shadow-xl flex items-center gap-4 group transition-all hover:border-[#0071e3]/30">
                <div className="w-10 h-10 bg-[#0071e3]/10 flex items-center justify-center rounded-xl text-[#0071e3]">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                </div>
                <input 
                  type="text" 
                  value={refinementCommand}
                  onChange={(e) => setRefinementCommand(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleGenerate(undefined, refinementCommand)}
                  placeholder="Request changes... (e.g. 'Add a hook', 'make it punchier')" 
                  className="flex-1 bg-transparent border-none outline-none text-[11px] font-bold text-zinc-900 dark:text-white placeholder:opacity-30"
                />
                <button 
                  onClick={() => handleGenerate(undefined, refinementCommand)}
                  disabled={!refinementCommand.trim() || isGenerating}
                  className="px-6 py-3 bg-[#0071e3] text-white rounded-xl text-[9px] font-black uppercase tracking-widest disabled:opacity-30 transition-all hover:scale-105 shadow-md flex items-center gap-2"
                >
                  {isGenerating ? 'Refining...' : 'Apply'}
                </button>
              </div>
            </div>
          )}
        </div>
      </main>

      <footer className="relative z-50 w-full max-w-7xl mx-auto px-10 py-12 border-t border-zinc-200 dark:border-white/10 flex flex-col md:flex-row items-center justify-between gap-8 transition-colors">
        <div className="flex gap-8 opacity-40 text-[10px] font-black uppercase text-zinc-900 dark:text-white">
          <span>RISHUZ_CORP</span>
          <span>BUILD_0X2025F</span>
        </div>
        <div className="text-[10px] font-black uppercase text-zinc-900 dark:text-white/50">
          &copy; 2025 Built By <a href="https://x.com/rishuz321" target="_blank" rel="noopener noreferrer" className="hover:text-[#0071e3] underline underline-offset-4 decoration-[#0071e3]/40">RISHUZ</a>
        </div>
      </footer>
    </div>
  );
}
