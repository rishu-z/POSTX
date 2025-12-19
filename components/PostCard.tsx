
import React, { useState } from 'react';
import { GeneratedPost } from '../types';

interface PostCardProps {
  post: GeneratedPost;
}

export const PostCard: React.FC<PostCardProps> = ({ post }) => {
  const [copied, setCopied] = useState(false);

  const copyToClipboard = () => {
    navigator.clipboard.writeText(post.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="bg-zinc-100 dark:bg-[#1a1a1c] rounded-[2.5rem] md:rounded-[4rem] overflow-hidden shadow-2xl border border-black/10 dark:border-white/10 group transition-all duration-1000">
      <div className="p-8 md:p-16 lg:p-20 space-y-10">
        
        {/* Card Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
          <div className="flex items-center gap-4 md:gap-6">
            <div className="w-12 h-12 md:w-14 md:h-14 bg-zinc-900 dark:bg-white flex items-center justify-center rounded-2xl shadow-xl transition-all duration-700 group-hover:rotate-3">
              <svg className="w-6 h-6 md:w-7 md:h-7 text-white dark:text-black" fill="currentColor" viewBox="0 0 24 24">
                <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"></path>
              </svg>
            </div>
            <div>
              <h3 className="font-black text-xl md:text-2xl tracking-tighter uppercase leading-none text-zinc-900 dark:text-white">Synthesized</h3>
              <p className="text-[9px] font-black uppercase tracking-[0.4em] opacity-60 mt-2 text-zinc-600 dark:text-zinc-400">Verified Ghost Output</p>
            </div>
          </div>
          <button 
            onClick={copyToClipboard}
            className={`flex items-center justify-center gap-3 px-6 py-4 rounded-xl md:rounded-[1.2rem] font-black text-[9px] md:text-[10px] uppercase tracking-[0.3em] transition-all duration-500 active:scale-95 shadow-lg ${copied ? 'bg-green-600 text-white' : 'bg-[#0071e3] text-white hover:bg-[#0077ed]'}`}
          >
            {copied ? (
              <><svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={4}><path d="M5 13l4 4L19 7" /></svg> Copied</>
            ) : (
              <><svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" /></svg> Copy Post</>
            )}
          </button>
        </div>

        {/* Content Area */}
        <div className="relative">
          <div className="relative whitespace-pre-wrap text-2xl md:text-3xl lg:text-4xl font-black leading-[1.3] tracking-tight bg-black/5 dark:bg-white/5 border border-black/5 dark:border-white/5 p-8 md:p-14 rounded-[2rem] md:rounded-[3rem] shadow-inner text-zinc-900 dark:text-zinc-50">
            {post.content}
          </div>
        </div>

        {/* Sources */}
        {post.sources.length > 0 && (
          <div className="pt-10 border-t border-black/10 dark:border-white/10">
            <h4 className="text-[10px] font-black uppercase tracking-[0.6em] opacity-60 mb-8 text-zinc-600 dark:text-zinc-400">Grounding References</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {post.sources.map((source, idx) => (
                <a key={idx} href={source.uri} target="_blank" rel="noopener noreferrer" className="flex items-center justify-between bg-black/5 dark:bg-white/5 border border-black/5 dark:border-white/10 hover:border-[#0071e3]/40 px-6 py-5 rounded-2xl transition-all duration-500">
                  <span className="text-[10px] font-black text-zinc-700 dark:text-zinc-200 truncate pr-4 uppercase">{source.title}</span>
                  <svg className="w-4 h-4 opacity-40 text-current" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" /></svg>
                </a>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
