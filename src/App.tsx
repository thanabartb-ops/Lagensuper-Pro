/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { AppRoute } from './types';
import { Header } from './components/common/Header';
import { BottomNav } from './components/common/BottomNav';
import { HeroSection } from './components/landing/HeroSection';
import { DashboardSection } from './components/landing/DashboardSection';
import { ServicesSection } from './components/landing/ServicesSection';
import { ToolDetailSection } from './components/landing/ToolDetailSection';
import { ClosingCtaSection } from './components/landing/ClosingCtaSection';
import { SmartChatView } from './components/chat/SmartChatView';
import { DeepResearchView } from './components/research/DeepResearchView';
import { ImageGenView } from './components/image/ImageGenView';
import { AgentModeView } from './components/agent/AgentModeView';
import { MemoryView } from './components/memory/MemoryView';
import { SettingsView } from './components/settings/SettingsView';
import { ProjectsHubView } from './components/projects/ProjectsHubView';
import { RuntimeView } from './components/runtime/RuntimeView';
import { AuditView } from './components/audit/AuditView';

export default function App() {
  const [currentRoute, setCurrentRoute] = useState<AppRoute>('landing');
  const [selectedToolId, setSelectedToolId] = useState<string>('ai_writer');

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [currentRoute]);

  const handleStart = () => {
    const dashboardElem = document.getElementById('dashboard');
    if (dashboardElem && currentRoute === 'landing') {
      dashboardElem.scrollIntoView({ behavior: 'smooth' });
    } else {
      setCurrentRoute('smart_chat');
    }
  };

  const handleSelectTool = (toolId: string) => {
    setSelectedToolId(toolId);
    const detailElem = document.getElementById('tool-detail');
    if (detailElem) {
      detailElem.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div className="min-h-screen bg-[#0A0B14] text-white flex flex-col font-sans selection:bg-[#7B2CFE]/40 selection:text-white">
      {/* Top Application Header */}
      <Header currentRoute={currentRoute} onRouteChange={setCurrentRoute} />

      {/* Main Content Area */}
      <main className="flex-1 w-full">
        {currentRoute === 'landing' && (
          <div className="w-full space-y-4">
            {/* HERO */}
            <HeroSection
              onStartClick={handleStart}
              onRouteChange={setCurrentRoute}
            />

            {/* HOME DASHBOARD */}
            <DashboardSection
              onRouteChange={setCurrentRoute}
              onSearchSubmit={() => setCurrentRoute('smart_chat')}
            />

            {/* SERVICES & TOOLS */}
            <ServicesSection
              selectedToolId={selectedToolId}
              onSelectTool={handleSelectTool}
              onRouteChange={setCurrentRoute}
            />

            {/* TOOL DETAIL */}
            <ToolDetailSection
              selectedToolId={selectedToolId}
              onRouteChange={setCurrentRoute}
            />

            {/* CLOSING CTA */}
            <ClosingCtaSection onStartClick={handleStart} />
          </div>
        )}

        {currentRoute === 'smart_chat' && <SmartChatView />}
        {currentRoute === 'deep_research' && <DeepResearchView />}
        {currentRoute === 'create_image' && <ImageGenView />}
        {currentRoute === 'agent_mode' && <AgentModeView />}
        {currentRoute === 'memory' && <MemoryView />}
        {currentRoute === 'settings' && <SettingsView />}
        {currentRoute === 'projects' && <ProjectsHubView onRouteChange={setCurrentRoute} />}
        {currentRoute === 'runtime' && <RuntimeView />}
        {currentRoute === 'audit' && <AuditView />}
      </main>

      {/* Footer Branding */}
      <footer className="border-t border-[#312E81]/30 bg-[#0C0D1A] py-8 text-center text-xs text-white/40 mb-14 md:mb-0">
        <div className="max-w-[1120px] mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="font-bold text-white/80">LSUPERAGENT</span>
            <span>· V11 Public Beta Preview</span>
          </div>
          <div>
            <span>Canonical Marketing: </span>
            <a
              href="https://www.wokers-wise.com/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-[#7B2CFE] hover:underline"
            >
              https://www.wokers-wise.com/
            </a>
          </div>
          <div>
            <span className="text-red-400 font-mono">Gateway: NOT_CONNECTED (Mock Mode)</span>
          </div>
        </div>
      </footer>

      {/* 5-Item Mobile Bottom Navigation */}
      <BottomNav currentRoute={currentRoute} onRouteChange={setCurrentRoute} />
    </div>
  );
}

