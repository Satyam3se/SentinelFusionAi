import React, { useEffect, useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import {
  Radar as RadarIcon,
  Crosshair,
  ShieldAlert,
  AlertTriangle,
  Radio,
  Compass,
  Zap,
  Play,
  Pause,
  RotateCcw,
  Layers,
  CheckCircle2,
  Send,
  Eye,
  Activity,
  ArrowRight
} from 'lucide-react';
import { api } from '../services/api';
import { StatusBadge } from '../components/StatusBadge';
import { Modal } from '../components/Modal';
import { useAuth } from '../context/AuthContext';

interface TacticalContact {
  contact_id: string;
  incident_id?: string;
  callsign: string;
  title: string;
  sector: string;
  sector_name: string;
  bearing_deg: number;
  range_km: number;
  altitude_m: number;
  speed_kmh: number;
  priority: string;
  status: string;
  correlation_confidence: string;
  is_contradiction: boolean;
  ew_spoofing_risk: number;
  sensor_trust_index: number;
  heuristic_score: number;
  recommended_coas: Array<{
    coa_id: string;
    name: string;
    action_type: string;
    summary: string;
    risk_level: string;
    readiness_time: string;
    recommended: boolean;
    pros?: string;
    cons?: string;
  }>;
  updated_at: string;
}

export const TacticalMapPage: React.FC = () => {
  const [contacts, setContacts] = useState<TacticalContact[]>([]);
  const [selectedContact, setSelectedContact] = useState<TacticalContact | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [sectorFilter, setSectorFilter] = useState<string>('ALL');
  const [threatFilter, setThreatFilter] = useState<string>('ALL');
  const [sweepAngle, setSweepAngle] = useState<number>(0);
  const [isSweepActive, setIsSweepActive] = useState<boolean>(true);
  const [mousePolar, setMousePolar] = useState<{ bearing: number; range: number } | null>(null);

  // Overlay Toggles
  const [showRings, setShowRings] = useState<boolean>(true);
  const [showSectors, setShowSectors] = useState<boolean>(true);
  const [showEwAlerts, setShowEwAlerts] = useState<boolean>(true);

  // COA Execution Modal state
  const [isCoaModalOpen, setIsCoaModalOpen] = useState<boolean>(false);
  const [selectedCoa, setSelectedCoa] = useState<any>(null);
  const [justification, setJustification] = useState<string>('');
  const [isSubmittingCoa, setIsSubmittingCoa] = useState<boolean>(false);
  const [coaSuccessReceipt, setCoaSuccessReceipt] = useState<any>(null);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const { user } = useAuth();

  const fetchContacts = async () => {
    try {
      setLoading(true);
      const data = await api.tactical.getRadarContacts();
      setContacts(data.contacts || []);
      if (data.contacts?.length > 0 && !selectedContact) {
        setSelectedContact(data.contacts[0]);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to initialize tactical radar telemetry.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchContacts();
  }, []);

  // Continuous sweeping radar beam animation loop
  useEffect(() => {
    let animId: number;
    const animate = () => {
      if (isSweepActive) {
        setSweepAngle((prev) => (prev + 1.2) % 360);
      }
      animId = requestAnimationFrame(animate);
    };
    animId = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animId);
  }, [isSweepActive]);

  // Filter contacts
  const filteredContacts = contacts.filter((c) => {
    if (sectorFilter !== 'ALL' && c.sector !== sectorFilter) return false;
    if (threatFilter === 'CONTRADICTIONS_ONLY' && !c.is_contradiction) return false;
    if (threatFilter === 'HIGH_CRITICAL' && !['HIGH', 'CRITICAL'].includes(c.priority)) return false;
    return true;
  });

  // Canvas Radar Scope Rendering
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;
    const cx = width / 2;
    const cy = height / 2;
    const radius = Math.min(cx, cy) - 24;

    // Clear background
    ctx.clearRect(0, 0, width, height);

    // Radar circular base with Dark Tricolour ambient gradient
    const bgGrad = ctx.createRadialGradient(cx, cy, 10, cx, cy, radius);
    bgGrad.addColorStop(0, '#060b18');
    bgGrad.addColorStop(0.7, '#040812');
    bgGrad.addColorStop(1, '#02050b');
    ctx.fillStyle = bgGrad;
    ctx.beginPath();
    ctx.arc(cx, cy, radius, 0, Math.PI * 2);
    ctx.fill();

    // Concentric Range Rings (10km, 20km, 30km, 40km, 50km)
    if (showRings) {
      ctx.lineWidth = 1;
      const rings = [0.2, 0.4, 0.6, 0.8, 1.0];
      const ringLabels = ['10 KM', '20 KM', '30 KM', '40 KM', '50 KM'];

      rings.forEach((r, idx) => {
        ctx.strokeStyle = idx === 4 ? 'rgba(255, 153, 51, 0.4)' : 'rgba(37, 99, 235, 0.25)';
        ctx.setLineDash(idx === 4 ? [] : [4, 4]);
        ctx.beginPath();
        ctx.arc(cx, cy, radius * r, 0, Math.PI * 2);
        ctx.stroke();

        // Range labels
        ctx.fillStyle = 'rgba(148, 163, 184, 0.6)';
        ctx.font = '9px "JetBrains Mono", monospace';
        ctx.fillText(ringLabels[idx], cx + 4, cy - radius * r + 11);
      });
      ctx.setLineDash([]);
    }

    // 4 Fictional Sector Quadrants
    if (showSectors) {
      ctx.lineWidth = 1;
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
      ctx.setLineDash([2, 4]);

      // Crosshairs (N-S, E-W)
      ctx.beginPath();
      ctx.moveTo(cx, cy - radius);
      ctx.lineTo(cx, cy + radius);
      ctx.moveTo(cx - radius, cy);
      ctx.lineTo(cx + radius, cy);
      ctx.stroke();

      // Sector Labels
      ctx.font = 'bold 10px "Rajdhani", sans-serif';
      ctx.fillStyle = 'rgba(255, 153, 51, 0.8)';
      ctx.fillText('ZONE-A (NORTHERN RIDGE)', cx + radius * 0.25, cy - radius * 0.65);

      ctx.fillStyle = 'rgba(56, 189, 248, 0.8)';
      ctx.fillText('ZONE-B (EASTERN PASS)', cx + radius * 0.35, cy + radius * 0.55);

      ctx.fillStyle = 'rgba(74, 222, 128, 0.8)';
      ctx.fillText('ZONE-C (DESERT RIM)', cx - radius * 0.85, cy + radius * 0.55);

      ctx.fillStyle = 'rgba(251, 146, 60, 0.8)';
      ctx.fillText('ZONE-D (RIVERINE BASIN)', cx - radius * 0.85, cy - radius * 0.65);

      ctx.setLineDash([]);
    }

    // Cardinal Degrees Marks on Outer Rim
    ctx.strokeStyle = 'rgba(255, 153, 51, 0.6)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(cx, cy, radius, 0, Math.PI * 2);
    ctx.stroke();

    for (let deg = 0; deg < 360; deg += 30) {
      const rad = ((deg - 90) * Math.PI) / 180;
      const x1 = cx + (radius - 6) * Math.cos(rad);
      const y1 = cy + (radius - 6) * Math.sin(rad);
      const x2 = cx + radius * Math.cos(rad);
      const y2 = cy + radius * Math.sin(rad);

      ctx.strokeStyle = deg % 90 === 0 ? '#FF9933' : 'rgba(255, 255, 255, 0.4)';
      ctx.lineWidth = deg % 90 === 0 ? 2 : 1;
      ctx.beginPath();
      ctx.moveTo(x1, y1);
      ctx.lineTo(x2, y2);
      ctx.stroke();

      if (deg % 90 === 0) {
        const cardinal = deg === 0 ? '000° N' : deg === 90 ? '090° E' : deg === 180 ? '180° S' : '270° W';
        ctx.fillStyle = '#FFFFFF';
        ctx.font = 'bold 10px "JetBrains Mono", monospace';
        const lx = cx + (radius + 14) * Math.cos(rad) - 15;
        const ly = cy + (radius + 14) * Math.sin(rad) + 4;
        ctx.fillText(cardinal, lx, ly);
      }
    }

    // Radar Sweeping Beam (Green Phosphor & Saffron Aura)
    if (isSweepActive) {
      const sweepRad = ((sweepAngle - 90) * Math.PI) / 180;
      const sweepX = cx + radius * Math.cos(sweepRad);
      const sweepY = cy + radius * Math.sin(sweepRad);

      // Sweeping line
      ctx.strokeStyle = '#10B981';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.lineTo(sweepX, sweepY);
      ctx.stroke();

      // Phosphor Fade Cone behind the sweep
      const coneAngle = 0.45; // ~25 degrees
      const grad = ctx.createRadialGradient(cx, cy, 0, cx, cy, radius);
      grad.addColorStop(0, 'rgba(16, 185, 129, 0.25)');
      grad.addColorStop(1, 'rgba(16, 185, 129, 0.02)');

      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.arc(cx, cy, radius, sweepRad - coneAngle, sweepRad);
      ctx.closePath();
      ctx.fill();
    }

    // C2 Central Base Station Icon
    ctx.fillStyle = '#FF9933';
    ctx.beginPath();
    ctx.arc(cx, cy, 5, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#FFFFFF';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.arc(cx, cy, 9, 0, Math.PI * 2);
    ctx.stroke();

    // Plot Filtered Tactical Contacts
    filteredContacts.forEach((contact) => {
      const maxRangeKm = 50;
      const normalizedDist = (contact.range_km / maxRangeKm) * radius;
      const angleRad = ((contact.bearing_deg - 90) * Math.PI) / 180;
      const px = cx + normalizedDist * Math.cos(angleRad);
      const py = cy + normalizedDist * Math.sin(angleRad);

      const isSelected = selectedContact?.contact_id === contact.contact_id;

      // Color coding based on contradiction and priority
      let blipColor = '#10B981'; // Green for normal
      if (contact.is_contradiction) {
        blipColor = '#F43F5E'; // Vibrant Rose Red for Contradiction
      } else if (contact.priority === 'CRITICAL' || contact.priority === 'HIGH') {
        blipColor = '#FF9933'; // Saffron Orange for High
      } else if (contact.priority === 'MEDIUM') {
        blipColor = '#38BDF8'; // Chakra Sky Blue
      }

      // Outer Selection Target Ring
      if (isSelected) {
        ctx.strokeStyle = '#FFFFFF';
        ctx.lineWidth = 1.5;
        ctx.setLineDash([3, 3]);
        ctx.beginPath();
        ctx.arc(px, py, 14, 0, Math.PI * 2);
        ctx.stroke();
        ctx.setLineDash([]);
      }

      // Pulsing threat warning halo for contradictions
      if (contact.is_contradiction && showEwAlerts) {
        ctx.strokeStyle = 'rgba(244, 63, 94, 0.4)';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(px, py, 18 + Math.sin(sweepAngle * 0.1) * 3, 0, Math.PI * 2);
        ctx.stroke();
      }

      // Main Contact Blip
      ctx.fillStyle = blipColor;
      ctx.beginPath();
      ctx.arc(px, py, isSelected ? 6 : 4.5, 0, Math.PI * 2);
      ctx.fill();

      // Contact Callsign & Range Label
      ctx.fillStyle = isSelected ? '#FFFFFF' : '#CBD5E1';
      ctx.font = isSelected ? 'bold 10px "JetBrains Mono", monospace' : '9px "JetBrains Mono", monospace';
      ctx.fillText(contact.callsign, px + 8, py - 4);

      if (contact.is_contradiction) {
        ctx.fillStyle = '#FB7185';
        ctx.font = 'bold 8px "JetBrains Mono", monospace';
        ctx.fillText('! CONTRADICTION', px + 8, py + 7);
      }
    });
  }, [contacts, filteredContacts, selectedContact, sweepAngle, isSweepActive, showRings, showSectors, showEwAlerts]);

  // Handle Canvas Click to Select Contact
  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const cx = canvas.width / 2;
    const cy = canvas.height / 2;
    const radius = Math.min(cx, cy) - 24;

    let closest: TacticalContact | null = null;
    let minDistance = 25; // hit test threshold

    filteredContacts.forEach((contact) => {
      const normalizedDist = (contact.range_km / 50) * radius;
      const angleRad = ((contact.bearing_deg - 90) * Math.PI) / 180;
      const px = cx + normalizedDist * Math.cos(angleRad);
      const py = cy + normalizedDist * Math.sin(angleRad);

      const d = Math.hypot(x - px, y - py);
      if (d < minDistance) {
        minDistance = d;
        closest = contact;
      }
    });

    if (closest) {
      setSelectedContact(closest);
    }
  };

  // Track Mouse Movement on Radar
  const handleCanvasMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const cx = canvas.width / 2;
    const cy = canvas.height / 2;
    const radius = Math.min(cx, cy) - 24;

    const dx = x - cx;
    const dy = y - cy;
    const distPx = Math.hypot(dx, dy);

    if (distPx <= radius) {
      let deg = (Math.atan2(dy, dx) * 180) / Math.PI + 90;
      if (deg < 0) deg += 360;
      const range = (distPx / radius) * 50;
      setMousePolar({ bearing: Math.round(deg), range: Math.round(range * 10) / 10 });
    } else {
      setMousePolar(null);
    }
  };

  const handleOpenCoaModal = (coa: any) => {
    setSelectedCoa(coa);
    setJustification(`Authorized execution of Course of Action [${coa.coa_id}] to resolve active target posture.`);
    setIsCoaModalOpen(true);
  };

  const handleSubmitCoa = async () => {
    if (!selectedContact || !selectedCoa) return;
    setIsSubmittingCoa(true);
    try {
      const res = await api.tactical.executeCoa({
        contact_id: selectedContact.contact_id,
        incident_id: selectedContact.incident_id,
        coa_id: selectedCoa.coa_id,
        coa_name: selectedCoa.name,
        action_type: selectedCoa.action_type,
        officer_justification: justification,
      });
      setCoaSuccessReceipt(res);
      await fetchContacts();
    } catch (err: any) {
      alert(`COA Transmission failed: ${err.message}`);
    } finally {
      setIsSubmittingCoa(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Title & Operational Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#1e293b] pb-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-bold font-heading tracking-wider text-white flex items-center gap-2">
              <RadarIcon className="w-6 h-6 text-[#FF9933] animate-pulse" />
              TACTICAL RADAR SCOPE & COA MATRIX
            </h1>
            <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-gradient-to-r from-[#FF9933]/25 via-white/10 to-[#138808]/25 text-white border border-[#FF9933]/50 font-mono font-bold shadow-sm">
              🇮🇳 ACTIVE PHASED ARRAY SEARCH • 50KM
            </span>
          </div>
          <p className="text-xs text-[#94a3b8] mt-1 font-mono">
            360° Real-time multi-sensor contact plot, electronic warfare anomaly tracking, and AI-assisted Courses of Action.
          </p>
        </div>

        {/* Global Action Triggers */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsSweepActive(!isSweepActive)}
            className="px-3 py-1.5 rounded-lg bg-[#0b1120] border border-[#1e293b] text-xs font-mono text-[#cbd5e1] hover:border-[#FF9933] flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            {isSweepActive ? <Pause className="w-3.5 h-3.5 text-amber-400" /> : <Play className="w-3.5 h-3.5 text-emerald-400" />}
            <span>{isSweepActive ? 'Freeze Sweep' : 'Resume Sweep'}</span>
          </button>
          <button
            onClick={fetchContacts}
            className="px-3 py-1.5 rounded-lg bg-[#0b1120] border border-[#1e293b] text-xs font-mono text-[#cbd5e1] hover:border-[#FF9933] flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5 text-[#38bdf8]" />
            <span>Sync Telemetry</span>
          </button>
          <Link
            to="/dashboard"
            className="px-3.5 py-1.5 rounded-lg bg-gradient-to-r from-[#138808] to-[#046A38] text-xs font-bold text-white shadow-[0_0_12px_rgba(19,136,8,0.35)] flex items-center gap-1.5"
          >
            <ArrowRight className="w-3.5 h-3.5" />
            <span>Dashboard</span>
          </Link>
        </div>
      </div>

      {/* Main Grid: Radar Scope (Left) & Tactical Inspector / COA Matrix (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Interactive 360° Radar Canvas Display */}
        <div className="lg:col-span-7 flex flex-col space-y-4">
          <div className="rounded-xl bg-[#0b1120]/90 backdrop-blur-md border border-[#1e293b] p-4 shadow-2xl relative overflow-hidden">
            {/* Top 3-stripe Tiranga Ribbon */}
            <div className="absolute top-0 left-0 right-0 h-[3px] bg-gradient-to-r from-[#FF9933] via-white to-[#138808]" />

            {/* Scope Header Controls */}
            <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-[#1e293b] text-xs">
              <div className="flex items-center gap-2">
                <span className="font-mono text-[#94a3b8] uppercase font-bold text-[11px]">Sector:</span>
                <select
                  value={sectorFilter}
                  onChange={(e) => setSectorFilter(e.target.value)}
                  className="px-2 py-1 rounded bg-[#070c18] border border-[#1e293b] font-mono text-xs text-white focus:outline-none focus:border-[#FF9933]"
                >
                  <option value="ALL">ALL SECTORS (360°)</option>
                  <option value="DEMO-ZONE-A">ZONE-A (NORTHERN RIDGE)</option>
                  <option value="DEMO-ZONE-B">ZONE-B (EASTERN PASS)</option>
                  <option value="DEMO-ZONE-C">ZONE-C (DESERT RIM)</option>
                  <option value="DEMO-ZONE-D">ZONE-D (RIVERINE BASIN)</option>
                </select>
              </div>

              <div className="flex items-center gap-2">
                <span className="font-mono text-[#94a3b8] uppercase font-bold text-[11px]">Filter:</span>
                <select
                  value={threatFilter}
                  onChange={(e) => setThreatFilter(e.target.value)}
                  className="px-2 py-1 rounded bg-[#070c18] border border-[#1e293b] font-mono text-xs text-white focus:outline-none focus:border-[#FF9933]"
                >
                  <option value="ALL">ALL TARGETS</option>
                  <option value="CONTRADICTIONS_ONLY">CONTRADICTIONS ONLY</option>
                  <option value="HIGH_CRITICAL">HIGH & CRITICAL</option>
                </select>
              </div>

              {/* Live Polar Mouse Tracking Indicator */}
              <div className="font-mono text-[11px] px-2.5 py-1 rounded bg-[#070c18] border border-[#1e293b] text-[#38bdf8] flex items-center gap-1.5">
                <Crosshair className="w-3.5 h-3.5 text-[#FF9933]" />
                {mousePolar ? (
                  <span>
                    BRG: <strong className="text-white">{mousePolar.bearing.toString().padStart(3, '0')}°</strong> | RNG:{' '}
                    <strong className="text-white">{mousePolar.range} KM</strong>
                  </span>
                ) : (
                  <span className="text-[#64748b]">AIM CURSOR OVER SCOPE</span>
                )}
              </div>
            </div>

            {/* Radar Scope Canvas Container */}
            <div className="relative flex items-center justify-center p-3">
              <canvas
                ref={canvasRef}
                width={560}
                height={560}
                onClick={handleCanvasClick}
                onMouseMove={handleCanvasMouseMove}
                className="w-full max-w-[560px] aspect-square rounded-full shadow-[0_0_40px_rgba(0,0,0,0.8)] border border-[#1e293b] cursor-crosshair"
              />
            </div>

            {/* Radar Scope Footer Info & Toggle Controls */}
            <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-[#1e293b] text-[11px] font-mono">
              <div className="flex items-center space-x-3 text-[#94a3b8]">
                <label className="flex items-center gap-1.5 cursor-pointer hover:text-white">
                  <input
                    type="checkbox"
                    checked={showRings}
                    onChange={(e) => setShowRings(e.target.checked)}
                    className="accent-[#FF9933]"
                  />
                  <span>Range Rings</span>
                </label>
                <label className="flex items-center gap-1.5 cursor-pointer hover:text-white">
                  <input
                    type="checkbox"
                    checked={showSectors}
                    onChange={(e) => setShowSectors(e.target.checked)}
                    className="accent-[#38bdf8]"
                  />
                  <span>Sectors</span>
                </label>
                <label className="flex items-center gap-1.5 cursor-pointer hover:text-white">
                  <input
                    type="checkbox"
                    checked={showEwAlerts}
                    onChange={(e) => setShowEwAlerts(e.target.checked)}
                    className="accent-[#f43f5e]"
                  />
                  <span>EW Halo</span>
                </label>
              </div>

              <div className="text-[#64748b]">
                TRACKING: <span className="text-emerald-400 font-bold">{filteredContacts.length} CONTACTS</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Tactical Contact Inspector & AI Advisory COA Matrix */}
        <div className="lg:col-span-5 space-y-4">
          {selectedContact ? (
            <>
              {/* Selected Contact Card */}
              <div className="rounded-xl bg-[#0b1120]/90 backdrop-blur-md border border-[#1e293b] border-t-4 border-t-[#FF9933] p-4 shadow-xl space-y-4">
                <div className="flex items-center justify-between border-b border-[#1e293b] pb-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-extrabold text-base tracking-wider text-white font-mono">
                        {selectedContact.callsign}
                      </span>
                      <StatusBadge type="priority" value={selectedContact.priority} />
                    </div>
                    <span className="text-xs text-[#38bdf8] font-mono">{selectedContact.sector_name} ({selectedContact.sector})</span>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] text-[#94a3b8] font-mono block">HEURISTIC INDEX</span>
                    <span className="text-lg font-bold font-mono text-white">
                      {selectedContact.heuristic_score} <span className="text-xs text-[#64748b]">/ 100</span>
                    </span>
                  </div>
                </div>

                {/* Contradiction Alert Banner */}
                {selectedContact.is_contradiction && (
                  <div className="p-3 rounded-lg bg-rose-950/70 border border-rose-600/70 text-xs text-rose-200 flex items-start gap-2 shadow-[0_0_15px_rgba(244,63,94,0.25)]">
                    <AlertTriangle className="w-4 h-4 text-rose-400 flex-shrink-0 mt-0.5" />
                    <div>
                      <span className="font-bold uppercase tracking-wider block">CONTRADICTION DETECTED:</span>
                      <span>Sensor observations directly conflict with observer reports. Confidence downgraded to 0. Do not fire without verification.</span>
                    </div>
                  </div>
                )}

                {/* Tactical Telemetry Metrics Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs font-mono">
                  <div className="p-2 rounded bg-[#070c18] border border-[#1e293b]">
                    <span className="text-[10px] text-[#64748b] block">BEARING</span>
                    <span className="font-bold text-white">{selectedContact.bearing_deg.toString().padStart(3, '0')}°</span>
                  </div>
                  <div className="p-2 rounded bg-[#070c18] border border-[#1e293b]">
                    <span className="text-[10px] text-[#64748b] block">RANGE</span>
                    <span className="font-bold text-white">{selectedContact.range_km} KM</span>
                  </div>
                  <div className="p-2 rounded bg-[#070c18] border border-[#1e293b]">
                    <span className="text-[10px] text-[#64748b] block">ALTITUDE</span>
                    <span className="font-bold text-white">{selectedContact.altitude_m > 0 ? `${selectedContact.altitude_m} M` : 'SURFACE'}</span>
                  </div>
                  <div className="p-2 rounded bg-[#070c18] border border-[#1e293b]">
                    <span className="text-[10px] text-[#64748b] block">VELOCITY</span>
                    <span className="font-bold text-white">{selectedContact.speed_kmh} KM/H</span>
                  </div>
                </div>

                {/* Electronic Warfare (EW) Spoofing & Sensor Trust Gauges */}
                <div className="space-y-2 pt-2 border-t border-[#1e293b] text-xs">
                  <div>
                    <div className="flex justify-between font-mono text-[11px] mb-1">
                      <span className="text-[#94a3b8] flex items-center gap-1">
                        <Zap className="w-3.5 h-3.5 text-amber-400" />
                        EW Spoofing / Jamming Risk:
                      </span>
                      <span className={`font-bold ${selectedContact.ew_spoofing_risk > 50 ? 'text-rose-400' : 'text-emerald-400'}`}>
                        {selectedContact.ew_spoofing_risk}%
                      </span>
                    </div>
                    <div className="h-1.5 w-full bg-[#070c18] rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full ${
                          selectedContact.ew_spoofing_risk > 50 ? 'bg-rose-500' : 'bg-emerald-500'
                        }`}
                        style={{ width: `${selectedContact.ew_spoofing_risk}%` }}
                      />
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between font-mono text-[11px] mb-1">
                      <span className="text-[#94a3b8] flex items-center gap-1">
                        <ShieldAlert className="w-3.5 h-3.5 text-[#38bdf8]" />
                        Sensor Trust Index:
                      </span>
                      <span className="font-bold text-white">{selectedContact.sensor_trust_index}%</span>
                    </div>
                    <div className="h-1.5 w-full bg-[#070c18] rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full bg-blue-500"
                        style={{ width: `${selectedContact.sensor_trust_index}%` }}
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* AI Advisory Courses of Action (COA) Matrix */}
              <div className="rounded-xl bg-[#0b1120]/90 backdrop-blur-md border border-[#1e293b] border-t-4 border-t-[#2563EB] p-4 shadow-xl space-y-3">
                <div className="flex items-center justify-between border-b border-[#1e293b] pb-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-white font-mono flex items-center gap-1.5">
                    <Crosshair className="w-4 h-4 text-[#38bdf8]" />
                    AI Advisory Courses of Action (COA)
                  </span>
                  <span className="text-[10px] text-blue-300 font-mono px-2 py-0.5 rounded bg-blue-950/80 border border-blue-500/40">
                    STRICTLY ADVISORY
                  </span>
                </div>

                <p className="text-[11px] text-[#94a3b8]">
                  Deterministic options evaluated against rules of engagement. Selection requires human command sign-off.
                </p>

                {/* COA Cards List */}
                <div className="space-y-2.5">
                  {selectedContact.recommended_coas?.map((coa) => (
                    <div
                      key={coa.coa_id}
                      className={`p-3 rounded-lg border transition-all ${
                        coa.recommended
                          ? 'bg-[#071324] border-[#38bdf8]/60 shadow-[0_0_12px_rgba(56,189,248,0.2)]'
                          : 'bg-[#070c18] border-[#1e293b] hover:border-white/30'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <div className="flex items-center gap-1.5">
                            <span className="font-bold text-xs text-white font-mono">{coa.coa_id}:</span>
                            <span className="font-semibold text-xs text-[#f8fafc]">{coa.name}</span>
                          </div>
                          <span className="text-[10px] text-[#38bdf8] font-mono block mt-0.5">
                            {coa.action_type} • READY IN: {coa.readiness_time}
                          </span>
                        </div>
                        {coa.recommended && (
                          <span className="text-[9px] px-2 py-0.5 rounded-full bg-emerald-950 text-emerald-300 border border-emerald-500 font-bold font-mono">
                            RECOMMENDED
                          </span>
                        )}
                      </div>

                      <p className="text-xs text-[#cbd5e1] mt-2 leading-relaxed">{coa.summary}</p>

                      {/* Pros & Cons */}
                      {coa.pros && (
                        <div className="mt-2 text-[10px] space-y-0.5 font-mono">
                          <div className="text-emerald-400">✓ PRO: {coa.pros}</div>
                          {coa.cons && <div className="text-amber-400">⚠ CON: {coa.cons}</div>}
                        </div>
                      )}

                      <div className="mt-3 flex justify-end">
                        <button
                          onClick={() => handleOpenCoaModal(coa)}
                          className="px-3 py-1 rounded bg-gradient-to-r from-[#FF9933] to-[#FF671F] text-black font-extrabold text-xs hover:brightness-110 shadow-sm flex items-center gap-1 cursor-pointer font-mono"
                        >
                          <Send className="w-3 h-3" />
                          <span>Transmit COA Order</span>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </>
          ) : (
            <div className="p-8 text-center text-xs text-[#94a3b8] rounded-xl bg-[#0b1120] border border-[#1e293b]">
              Click any blip on the 360° radar scope to inspect telemetry and AI Courses of Action.
            </div>
          )}
        </div>
      </div>

      {/* COA Authorization Modal */}
      {isCoaModalOpen && selectedCoa && (
        <Modal
          isOpen={isCoaModalOpen}
          onClose={() => {
            setIsCoaModalOpen(false);
            setCoaSuccessReceipt(null);
          }}
          title="AUTHORIZE TACTICAL COURSE OF ACTION (COA)"
          subtitle={`Target: ${selectedContact?.callsign} (${selectedContact?.sector}) • COA: ${selectedCoa.coa_id}`}
        >
          {coaSuccessReceipt ? (
            <div className="space-y-4 text-center py-4">
              <div className="w-12 h-12 rounded-full bg-emerald-950 border border-emerald-500 mx-auto flex items-center justify-center text-emerald-400">
                <CheckCircle2 className="w-7 h-7" />
              </div>
              <h4 className="text-base font-bold text-white font-heading">
                COA ORDER TRANSMITTED TO TACTICAL ASSETS
              </h4>
              <p className="text-xs text-[#cbd5e1] max-w-md mx-auto font-mono">
                {coaSuccessReceipt.message}
              </p>
              <div className="p-3 rounded bg-[#070c18] border border-[#1e293b] text-left text-xs font-mono space-y-1">
                <div>Order Receipt: <span className="text-[#FF9933]">{coaSuccessReceipt.execution_receipt}</span></div>
                <div>Authorized Officer: <span className="text-white">{coaSuccessReceipt.authorized_by}</span></div>
                <div>Audit Event: <span className="text-emerald-400">RECORDED IN IMMUTABLE WAL DATABASE</span></div>
              </div>
              <button
                onClick={() => {
                  setIsCoaModalOpen(false);
                  setCoaSuccessReceipt(null);
                }}
                className="px-4 py-2 rounded bg-gradient-to-r from-[#138808] to-[#046A38] text-white font-bold text-xs"
              >
                Close & Return to Radar
              </button>
            </div>
          ) : (
            <div className="space-y-4 text-xs">
              <div className="p-3 rounded bg-[#070c18] border border-[#1e293b] space-y-1 font-mono">
                <div>Action: <strong className="text-white">{selectedCoa.name}</strong></div>
                <div>Target ID: <strong className="text-[#38bdf8]">{selectedContact?.callsign}</strong> ({selectedContact?.sector})</div>
                <div>Action Type: <strong className="text-[#FF9933]">{selectedCoa.action_type}</strong></div>
                <div>Readiness Estimate: <strong className="text-emerald-400">{selectedCoa.readiness_time}</strong></div>
              </div>

              <div>
                <label className="block text-[#cbd5e1] mb-1 font-semibold uppercase font-mono">
                  Mandatory Officer Tactical Justification & ROE Confirmation:
                </label>
                <textarea
                  rows={3}
                  value={justification}
                  onChange={(e) => setJustification(e.target.value)}
                  placeholder="State operational reason, ROE compliance, and tactical instructions..."
                  className="w-full p-2.5 rounded bg-[#070c18] border border-[#1e293b] text-white font-mono text-xs focus:outline-none focus:border-[#FF9933]"
                />
              </div>

              <div className="p-2.5 rounded bg-amber-950/40 border border-amber-600/40 text-[11px] text-amber-200">
                Notice: Officer sign-off enforces human accountability. This command order will be cryptographically registered in the append-only audit trail.
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-[#1e293b]">
                <button
                  type="button"
                  onClick={() => setIsCoaModalOpen(false)}
                  className="px-3 py-1.5 rounded bg-[#070c18] border border-[#1e293b] text-[#94a3b8]"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={isSubmittingCoa || justification.trim().length < 5}
                  onClick={handleSubmitCoa}
                  className="px-4 py-1.5 rounded bg-gradient-to-r from-[#FF9933] to-[#FF671F] text-black font-extrabold text-xs hover:brightness-110 flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>{isSubmittingCoa ? 'Transmitting...' : 'Sign & Transmit COA Order'}</span>
                </button>
              </div>
            </div>
          )}
        </Modal>
      )}
    </div>
  );
};
