'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { StatusBadge } from '../common/StatusBadge';
import { GradientButton } from '../common/GradientButton';
import { AgentTask, AgentStep } from '../../types';
import {
  Bot,
  Play,
  Pause,
  RotateCcw,
  Terminal,
  Layers,
  ShieldQuestion,
} from 'lucide-react';

/** Simulated duration of one agent step. */
const STEP_DURATION_MS = 1500;

const STEP_OUTPUTS = [
  'แยกย่อยเป้าหมายออกเป็น 4 ข้อย่อย สำเร็จ',
  'ดึงข้อมูลบริบท 3 แหล่งเสร็จสิ้น',
  'สร้างร่างโครงสร้างสมบูรณ์',
  'จัดรูปแบบผลลัพธ์และบันทึกเรียบร้อย',
];

const stamp = () => `[${new Date().toLocaleTimeString()}]`;

export const AgentModeView: React.FC = () => {
  const [objective, setObjective] = useState('');
  const [mode, setMode] = useState<'supervised' | 'autonomous'>('supervised');
  const [task, setTask] = useState<AgentTask | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearTimer = useCallback(() => {
    if (timerRef.current !== null) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  useEffect(() => clearTimer, [clearTimer]);

  /**
   * Advances one step.
   *
   * The previous implementation scheduled the whole run up front with fixed
   * setTimeout calls that bailed out when the task was paused — so pausing
   * silently skipped those steps for good and the task could never finish.
   * Progress is now driven step by step from task state, so pause simply stops
   * scheduling and resume picks up exactly where it left off.
   */
  const completeCurrentStep = useCallback(() => {
    setTask((prev) => {
      if (!prev || prev.status !== 'executing') return prev;

      const index = prev.currentStep;
      const isLast = index >= prev.steps.length - 1;
      const steps = prev.steps.map((s, i) =>
        i === index ? { ...s, status: 'completed' as const, output: STEP_OUTPUTS[i] ?? s.output } : s
      );
      const logs = [...prev.logs, `${stamp()} ขั้นที่ ${index + 1} สำเร็จ: ${prev.steps[index].title}`];

      if (isLast) {
        return {
          ...prev,
          status: 'completed',
          steps,
          logs: [...logs, `${stamp()} จบกระบวนการทำงานของเอเจนท์สมบูรณ์ (NOT_CONNECTED Simulation)`],
        };
      }

      // Supervised runs stop here and wait for a human to approve the next step.
      if (prev.mode === 'supervised') {
        return {
          ...prev,
          status: 'awaiting_approval',
          currentStep: index + 1,
          steps,
          logs: [...logs, `${stamp()} รอการอนุมัติจากผู้ใช้ก่อนเริ่มขั้นที่ ${index + 2}`],
        };
      }

      return {
        ...prev,
        currentStep: index + 1,
        steps: steps.map((s, i) => (i === index + 1 ? { ...s, status: 'running' as const } : s)),
        logs,
      };
    });
  }, []);

  // Only an actively executing task schedules work. Pausing stops the clock;
  // resuming restarts it from the same step.
  useEffect(() => {
    clearTimer();
    if (!task || task.status !== 'executing') return;
    timerRef.current = setTimeout(completeCurrentStep, STEP_DURATION_MS);
    return clearTimer;
  }, [task, completeCurrentStep, clearTimer]);

  const approveNextStep = () => {
    setTask((prev) => {
      if (!prev || prev.status !== 'awaiting_approval') return prev;
      return {
        ...prev,
        status: 'executing',
        steps: prev.steps.map((s, i) =>
          i === prev.currentStep ? { ...s, status: 'running' as const } : s
        ),
        logs: [...prev.logs, `${stamp()} ผู้ใช้อนุมัติให้ดำเนินขั้นที่ ${prev.currentStep + 1}`],
      };
    });
  };

  const startAgentExecution = () => {
    if (!objective.trim()) return;

    const initialSteps: AgentStep[] = [
      {
        id: 's1',
        title: 'วิเคราะห์โครงสร้างเป้าหมาย & กำหนดตัวแปรนำเข้า',
        tool: 'ObjectiveParser',
        status: 'running',
        output: 'แยกย่อยเป้าหมายออกเป็น 4 ข้อย่อย สำเร็จ',
      },
      {
        id: 's2',
        title: 'รวบรวมบริบทและค้นหาเอกสารอ้างอิง',
        tool: 'ContextGatherer',
        status: 'pending',
      },
      {
        id: 's3',
        title: 'สร้างร่างผลงานและส่งตรวจสอบความสอดคล้อง',
        tool: 'SynthesisEngine',
        status: 'pending',
      },
      {
        id: 's4',
        title: 'จัดรูปแบบผลลัพธ์สุดท้ายและบันทึกลงในระบบ',
        tool: 'Formatter & Exporter',
        status: 'pending',
      },
    ];

    const newTask: AgentTask = {
      id: `task-${Date.now()}`,
      objective: objective.trim(),
      mode,
      status: 'executing',
      currentStep: 0,
      steps: initialSteps,
      logs: [
        `[${new Date().toLocaleTimeString()}] เริ่มต้นกระบวนการ Agent Mode: "${objective.trim()}"`,
        `[${new Date().toLocaleTimeString()}] กำหนดโหมดการทำงาน: ${mode}`,
        `[${new Date().toLocaleTimeString()}] สร้างแผนผังการปฏิบัติงาน 4 ขั้นตอน (Mock Simulation)`,
      ],
      createdAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setTask(newTask);

    // Execution is advanced by the effect above, one step at a time.
  };

  const togglePause = () => {
    setTask((prev) => {
      if (!prev) return prev;
      // Only a running or paused task can be toggled. A task waiting for
      // approval is already stopped — the approval banner drives it instead.
      if (prev.status !== 'executing' && prev.status !== 'paused') return prev;

      const resuming = prev.status === 'paused';
      return {
        ...prev,
        status: resuming ? 'executing' : 'paused',
        steps: prev.steps.map((s, i) =>
          i === prev.currentStep && (s.status === 'running' || s.status === 'paused')
            ? { ...s, status: resuming ? ('running' as const) : ('paused' as const) }
            : s
        ),
        logs: [...prev.logs, `${stamp()} ${resuming ? 'ดำเนินการต่อ' : 'หยุดชั่วคราวโดยผู้ใช้'}`],
      };
    });
  };

  const resetTask = () => {
    clearTimer();
    setTask(null);
    setObjective('');
  };

  return (
    <div className="max-w-[1120px] mx-auto px-4 sm:px-6 py-6 pb-20 md:pb-10 space-y-6">
      {/* Surface Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 bg-[#131525] border border-[#312E81] rounded-2xl shadow-lg">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-xl bg-[#7B2CFE]/10 border border-[#7B2CFE]/30 flex items-center justify-center text-[#7B2CFE]">
            <Bot className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-bold text-white">โหมดเอเจนท์ (Agent Mode)</h2>
              <StatusBadge type="coming_soon" text="Interactive Preview" size="sm" />
            </div>
            <p className="text-xs sm:text-sm text-white/50">
              มอบหมายงานให้ AI วางแผนและดำเนินการต่อเนื่องเป็นขั้นตอน
            </p>
          </div>
        </div>

        <StatusBadge type="not_connected" text="Gateway: NOT_CONNECTED" size="sm" />
      </div>

      {/* Goal Formulation Form */}
      <div className="bg-[#131525]/90 border border-[#312E81] rounded-2xl p-5 sm:p-6 space-y-4 shadow-lg">
        <label className="block text-sm font-bold text-white">
          เป้าหมายหรือภารกิจที่ต้องการมอบหมาย (Objective)
        </label>
        <textarea
          value={objective}
          onChange={(e) => setObjective(e.target.value)}
          disabled={task !== null && task.status !== 'completed'}
          placeholder="เช่น จัดทำแผนกลยุทธ์การตลาดไตรมาส 3 พร้อมตารางเวลาดำเนินงานและ KPI..."
          rows={3}
          className="w-full p-4 rounded-2xl bg-[#0C0D1A] border border-[#312E81] text-white text-sm focus:border-[#7B2CFE] focus:ring-1 focus:ring-[#7B2CFE] outline-none placeholder:text-white/30 transition-all resize-none disabled:opacity-60"
        />

        {/* Execution Mode */}
        <div className="flex flex-wrap items-center justify-between gap-4 pt-2">
          <div className="flex items-center gap-2">
            <span className="text-xs text-white/50">การควบคุม:</span>
            <div className="inline-flex rounded-xl bg-[#0C0D1A] p-1 border border-[#312E81]">
              <button
                type="button"
                onClick={() => setMode('supervised')}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                  mode === 'supervised'
                    ? 'bg-[#7B2CFE] text-white shadow-md shadow-[#7B2CFE]/40'
                    : 'text-white/50 hover:text-white'
                }`}
              >
                มีมนุษย์ร่วมตรวจสอบ (Supervised)
              </button>
              <button
                type="button"
                onClick={() => setMode('autonomous')}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                  mode === 'autonomous'
                    ? 'bg-[#00D1FF] text-black'
                    : 'text-white/50 hover:text-white'
                }`}
              >
                อัตโนมัติเต็มรูปแบบ (Autonomous)
              </button>
            </div>
          </div>

          {!task && (
            <GradientButton
              onClick={startAgentExecution}
              disabled={!objective.trim()}
              size="md"
            >
              เริ่มต้นมอบหมายงานเอเจนท์
            </GradientButton>
          )}
        </div>
      </div>

      {/* Execution Tracker */}
      {task && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Steps Column */}
          <div className="lg:col-span-2 bg-[#131525]/90 border border-[#312E81] rounded-2xl p-5 sm:p-6 space-y-4 shadow-xl">
            <div className="flex items-center justify-between border-b border-[#312E81] pb-3">
              <div className="flex items-center gap-2">
                <Layers className="w-5 h-5 text-[#00D1FF]" />
                <h3 className="text-base font-bold text-white">ขั้นตอนการดำเนินงาน</h3>
              </div>
              <div className="flex items-center gap-2">
                {(task.status === 'executing' || task.status === 'paused') && (
                  <button
                    onClick={togglePause}
                    className="rounded-xl bg-[#0C0D1A] border border-[#312E81] text-xs text-white hover:border-[#7B2CFE] min-h-[44px] min-w-[44px] flex items-center justify-center"
                    aria-label={task.status === 'paused' ? 'ดำเนินการต่อ' : 'หยุดชั่วคราว'}
                    title={task.status === 'paused' ? 'ดำเนินการต่อ' : 'หยุดชั่วคราว'}
                  >
                    {task.status === 'paused' ? (
                      <Play className="w-4 h-4 text-emerald-400" />
                    ) : (
                      <Pause className="w-4 h-4 text-yellow-400" />
                    )}
                  </button>
                )}
                <button
                  onClick={resetTask}
                  className="p-2 rounded-xl bg-[#0C0D1A] border border-[#312E81] text-xs text-white hover:border-[#7B2CFE]"
                  title="เริ่มใหม่"
                >
                  <RotateCcw className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Human-in-the-loop gate. In supervised mode the run stops here
                until a person explicitly approves the next step. */}
            {task.status === 'awaiting_approval' && (
              <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/40 flex flex-col sm:flex-row sm:items-center gap-3 justify-between">
                <div className="flex items-start gap-2.5">
                  <ShieldQuestion className="w-5 h-5 text-amber-300 shrink-0 mt-0.5" />
                  <div>
                    <span className="block text-xs font-bold text-amber-200">
                      รออนุมัติก่อนดำเนินขั้นที่ {task.currentStep + 1}
                    </span>
                    <span className="block text-[11px] text-amber-200/70">
                      {task.steps[task.currentStep]?.title}
                    </span>
                  </div>
                </div>
                <button
                  onClick={approveNextStep}
                  className="shrink-0 px-4 rounded-xl bg-amber-400 hover:bg-amber-300 text-black text-xs font-bold min-h-[44px]"
                >
                  อนุมัติและดำเนินการต่อ
                </button>
              </div>
            )}

            {task.status === 'paused' && (
              <div className="p-3 rounded-xl bg-yellow-500/10 border border-yellow-500/30 text-[11px] text-yellow-200 flex items-center gap-2">
                <Pause className="w-4 h-4 shrink-0" />
                หยุดชั่วคราวที่ขั้นที่ {task.currentStep + 1} · กด Play เพื่อทำต่อจากจุดเดิม
              </div>
            )}

            <div className="space-y-3">
              {task.steps.map((step, index) => (
                <div
                  key={step.id}
                  className={`p-4 rounded-xl border transition-all ${
                    step.status === 'completed'
                      ? 'bg-[#0C0D1A] border-emerald-500/30 text-white'
                      : step.status === 'running'
                      ? 'bg-[#1A1C30] border-[#7B2CFE] text-white shadow-lg ring-1 ring-[#7B2CFE]/40'
                      : 'bg-[#0C0D1A] border-[#312E81] text-white/40'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2.5">
                      <span className="w-6 h-6 rounded-full bg-[#131525] border border-[#312E81] text-xs flex items-center justify-center font-bold">
                        {index + 1}
                      </span>
                      <span className="text-sm font-bold">{step.title}</span>
                    </div>
                    <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-[#131525] border border-[#312E81] text-white/60">
                      Tool: {step.tool}
                    </span>
                  </div>
                  {step.output && (
                    <div className="mt-2 text-xs text-[#00D1FF] pl-8 font-mono">
                      ↳ {step.output}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Real-time Agent Log Stream */}
          <div className="bg-[#0C0D1A] border border-[#312E81] rounded-2xl p-5 flex flex-col h-[340px] shadow-xl">
            <div className="flex items-center gap-2 mb-3 pb-2 border-b border-[#312E81]">
              <Terminal className="w-4 h-4 text-[#7B2CFE]" />
              <h4 className="text-xs font-bold text-white uppercase tracking-wider">
                บันทึกการทำงาน (Agent Logs)
              </h4>
            </div>
            <div className="flex-1 overflow-y-auto space-y-1.5 font-mono text-[11px] text-white/60 pr-1">
              {task.logs.map((log, i) => (
                <div key={i} className="leading-tight">
                  {log}
                </div>
              ))}
            </div>
            <div className="pt-2 text-[10px] text-white/30 text-right font-mono">
              LS_AGENT Runtime Simulator
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
