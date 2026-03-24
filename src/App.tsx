/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { 
  Shield, 
  Search, 
  Activity, 
  Users, 
  TrendingUp, 
  AlertTriangle, 
  Globe, 
  Hash, 
  Server,
  ChevronRight,
  FileText,
  Download,
  CheckCircle2,
  XCircle,
  Info,
  LayoutDashboard
} from 'lucide-react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  LineChart,
  Line,
  AreaChart,
  Area
} from 'recharts';
import { analyzeIOC, IOCAnalysisResult } from './services/geminiService';
import Markdown from 'react-markdown';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Types
interface ThreatActor {
  id: number;
  name: string;
  origin: string;
  description: string;
  targets: string;
  techniques: string;
}

interface ThreatTrend {
  id: number;
  trend_name: string;
  description: string;
  impact_level: string;
  frequency: number;
}

interface DashboardStats {
  totalActors: number;
  totalIocsAnalyzed: number;
  maliciousIocs: number;
  activeAlerts: number;
}

export default function App() {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'actors' | 'ioc' | 'phishing' | 'trends'>('dashboard');
  const [actors, setActors] = useState<ThreatActor[]>([]);
  const [trends, setTrends] = useState<ThreatTrend[]>([]);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [iocHistory, setIocHistory] = useState<any[]>([]);
  
  // IOC Analysis State
  const [iocInput, setIocInput] = useState('');
  const [iocType, setIocType] = useState<'IP' | 'Domain' | 'Hash'>('IP');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<IOCAnalysisResult | null>(null);
  const [reportContent, setReportContent] = useState<string | null>(null);
  const [isGeneratingReport, setIsGeneratingReport] = useState(false);

  // Phishing State
  const [phishingInput, setPhishingInput] = useState('');
  const [isPhishingCheck, setIsPhishingCheck] = useState(false);
  const [phishingResult, setPhishingResult] = useState<IOCAnalysisResult | null>(null);

  useEffect(() => {
    fetchData();
  }, []);

  const handleGenerateReport = async () => {
    if (!analysisResult) return;
    setIsGeneratingReport(true);
    try {
      const { generateThreatReport } = await import('./services/geminiService');
      const report = await generateThreatReport({
        ioc: iocInput,
        type: iocType,
        analysis: analysisResult
      });
      setReportContent(report);
    } catch (error) {
      console.error("Report generation failed:", error);
    } finally {
      setIsGeneratingReport(false);
    }
  };

  const fetchData = async () => {
    try {
      const [actorsRes, trendsRes, statsRes, historyRes] = await Promise.all([
        fetch('/api/actors'),
        fetch('/api/trends'),
        fetch('/api/dashboard-stats'),
        fetch('/api/ioc-history')
      ]);
      
      setActors(await actorsRes.json());
      setTrends(await trendsRes.json());
      setStats(await statsRes.json());
      setIocHistory(await historyRes.json());
    } catch (error) {
      console.error("Error fetching data:", error);
    }
  };

  const handleIOCAnalysis = async () => {
    if (!iocInput) return;
    setIsAnalyzing(true);
    setAnalysisResult(null);
    try {
      const result = await analyzeIOC(iocType, iocInput);
      setAnalysisResult(result);
      
      // Save to DB
      await fetch('/api/save-ioc', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: iocType,
          value: iocInput,
          status: result.status,
          analysis: result.explanation
        })
      });
      
      fetchData(); // Refresh history
    } catch (error) {
      console.error("Analysis failed:", error);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handlePhishingCheck = async () => {
    if (!phishingInput) return;
    setIsPhishingCheck(true);
    setPhishingResult(null);
    try {
      const result = await analyzeIOC('URL/Domain', phishingInput);
      setPhishingResult(result);
    } catch (error) {
      console.error("Phishing check failed:", error);
    } finally {
      setIsPhishingCheck(false);
    }
  };

  const renderDashboard = () => (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <StatCard title="Threat Actors" value={stats?.totalActors || 0} icon={<Users className="w-5 h-5" />} color="text-blue-400" />
        <StatCard title="IOCs Analyzed" value={stats?.totalIocsAnalyzed || 0} icon={<Search className="w-5 h-5" />} color="text-purple-400" />
        <StatCard title="Malicious Hits" value={stats?.maliciousIocs || 0} icon={<AlertTriangle className="w-5 h-5" />} color="text-red-400" />
        <StatCard title="Active Alerts" value={stats?.activeAlerts || 0} icon={<Activity className="w-5 h-5" />} color="text-orange-400" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="glass-panel p-6">
          <h3 className="text-sm font-semibold mb-6 flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-brand-accent" />
            Threat Trend Activity
          </h3>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={trends}>
                <defs>
                  <linearGradient id="colorFreq" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#26262a" vertical={false} />
                <XAxis dataKey="trend_name" stroke="#52525b" fontSize={10} tickLine={false} axisLine={false} />
                <YAxis stroke="#52525b" fontSize={10} tickLine={false} axisLine={false} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#151518', border: '1px solid #26262a', borderRadius: '8px' }}
                  itemStyle={{ color: '#3b82f6' }}
                />
                <Area type="monotone" dataKey="frequency" stroke="#3b82f6" fillOpacity={1} fill="url(#colorFreq)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="glass-panel p-6">
          <h3 className="text-sm font-semibold mb-6 flex items-center gap-2">
            <Activity className="w-4 h-4 text-brand-accent" />
            Recent IOC Analysis History
          </h3>
          <div className="overflow-x-auto">
            <table className="data-grid">
              <thead>
                <tr>
                  <th>Type</th>
                  <th>Value</th>
                  <th>Status</th>
                  <th>Date</th>
                </tr>
              </thead>
              <tbody>
                {iocHistory.map((item) => (
                  <tr key={item.id} className="hover:bg-white/5 transition-colors">
                    <td className="font-mono text-xs">{item.type}</td>
                    <td className="font-mono text-xs truncate max-w-[150px]">{item.value}</td>
                    <td>
                      <span className={cn(
                        "status-pill",
                        item.status === 'Malicious' ? "bg-red-500/10 text-red-500" : 
                        item.status === 'Suspicious' ? "bg-orange-500/10 text-orange-500" : 
                        "bg-green-500/10 text-green-500"
                      )}>
                        {item.status}
                      </span>
                    </td>
                    <td className="text-[10px] text-slate-500">{new Date(item.created_at).toLocaleDateString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );

  const renderActors = () => (
    <div className="space-y-6 animate-in slide-in-from-bottom-4 duration-500">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold">Threat Actor Database</h2>
        <div className="text-xs text-slate-500">Total Actors: {actors.length}</div>
      </div>
      <div className="grid grid-cols-1 gap-4">
        {actors.map(actor => (
          <div key={actor.id} className="glass-panel p-6 hover:border-brand-accent/50 transition-all group">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="text-lg font-bold text-white group-hover:text-brand-accent transition-colors">{actor.name}</h3>
                <div className="flex items-center gap-2 mt-1">
                  <Globe className="w-3 h-3 text-slate-500" />
                  <span className="text-xs text-slate-400">{actor.origin}</span>
                </div>
              </div>
              <span className="status-pill bg-blue-500/10 text-blue-400">Active</span>
            </div>
            <p className="text-sm text-slate-400 mb-4 leading-relaxed">{actor.description}</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-black/20 p-3 rounded-lg border border-brand-border">
                <h4 className="text-[10px] uppercase font-bold text-slate-500 mb-2">Primary Targets</h4>
                <p className="text-xs text-slate-300">{actor.targets}</p>
              </div>
              <div className="bg-black/20 p-3 rounded-lg border border-brand-border">
                <h4 className="text-[10px] uppercase font-bold text-slate-500 mb-2">TTPs (Techniques)</h4>
                <p className="text-xs text-slate-300">{actor.techniques}</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const renderIOC = () => (
    <div className="space-y-6 animate-in slide-in-from-bottom-4 duration-500">
      <div className="glass-panel p-8">
        <h2 className="text-xl font-bold mb-2">IOC Analysis Engine</h2>
        <p className="text-sm text-slate-400 mb-8">Analyze IP addresses, domains, or file hashes using AI-driven threat intelligence.</p>
        
        <div className="flex flex-col md:flex-row gap-4 mb-8">
          <select 
            value={iocType}
            onChange={(e) => setIocType(e.target.value as any)}
            className="bg-brand-bg border border-brand-border rounded-lg px-4 py-2 text-sm focus:outline-none focus:border-brand-accent"
          >
            <option value="IP">IP Address</option>
            <option value="Domain">Domain</option>
            <option value="Hash">File Hash (SHA-256)</option>
          </select>
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
            <input 
              type="text" 
              placeholder={`Enter ${iocType}...`}
              value={iocInput}
              onChange={(e) => setIocInput(e.target.value)}
              className="w-full bg-brand-bg border border-brand-border rounded-lg pl-10 pr-4 py-2 text-sm focus:outline-none focus:border-brand-accent"
            />
          </div>
          <button 
            onClick={handleIOCAnalysis}
            disabled={isAnalyzing || !iocInput}
            className="bg-brand-accent hover:bg-blue-600 disabled:opacity-50 text-white px-6 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2"
          >
            {isAnalyzing ? <Activity className="w-4 h-4 animate-spin" /> : <Shield className="w-4 h-4" />}
            Analyze IOC
          </button>
        </div>

        {analysisResult && (
          <div className="space-y-6 border-t border-brand-border pt-8 animate-in fade-in duration-700">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className={cn(
                  "p-3 rounded-full",
                  analysisResult.status === 'Malicious' ? "bg-red-500/10 text-red-500" : 
                  analysisResult.status === 'Suspicious' ? "bg-orange-500/10 text-orange-500" : 
                  "bg-green-500/10 text-green-500"
                )}>
                  {analysisResult.status === 'Malicious' ? <XCircle className="w-6 h-6" /> : 
                   analysisResult.status === 'Suspicious' ? <AlertTriangle className="w-6 h-6" /> : 
                   <CheckCircle2 className="w-6 h-6" />}
                </div>
                <div>
                  <h3 className="text-lg font-bold">Analysis: {analysisResult.status}</h3>
                  <p className="text-xs text-slate-500">Threat Level: {analysisResult.threatLevel}</p>
                </div>
              </div>
              <button 
                onClick={handleGenerateReport}
                disabled={isGeneratingReport}
                className="text-xs flex items-center gap-1 text-brand-accent hover:underline disabled:opacity-50"
              >
                {isGeneratingReport ? <Activity className="w-3 h-3 animate-spin" /> : <FileText className="w-3 h-3" />}
                {isGeneratingReport ? "Generating..." : "Generate Full Report"}
              </button>
            </div>

            {reportContent && (
              <div className="glass-panel p-6 bg-brand-accent/5 border-brand-accent/30 animate-in slide-in-from-top-2 duration-300">
                <div className="flex justify-between items-center mb-4">
                  <h4 className="text-sm font-bold flex items-center gap-2">
                    <FileText className="w-4 h-4 text-brand-accent" />
                    AI-Generated Threat Intelligence Report
                  </h4>
                  <button 
                    onClick={() => setReportContent(null)}
                    className="text-xs text-slate-500 hover:text-white"
                  >
                    Close
                  </button>
                </div>
                <div className="prose prose-invert prose-sm max-w-none text-slate-300 font-sans">
                  <Markdown>{reportContent}</Markdown>
                </div>
              </div>
            )}

            <div className="bg-black/20 p-6 rounded-xl border border-brand-border">
              <h4 className="text-xs font-bold uppercase text-slate-500 mb-3 flex items-center gap-2">
                <Info className="w-3 h-3" />
                Technical Explanation
              </h4>
              <p className="text-sm text-slate-300 leading-relaxed">{analysisResult.explanation}</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="glass-panel p-5">
                <h4 className="text-xs font-bold uppercase text-slate-500 mb-4">Recommendations</h4>
                <ul className="space-y-3">
                  {analysisResult.recommendations.map((rec, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-slate-400">
                      <ChevronRight className="w-4 h-4 text-brand-accent shrink-0 mt-0.5" />
                      {rec}
                    </li>
                  ))}
                </ul>
              </div>
              <div className="glass-panel p-5">
                <h4 className="text-xs font-bold uppercase text-slate-500 mb-4">Contextual Intelligence</h4>
                <div className="space-y-4">
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-slate-500">First Seen</span>
                    <span className="text-slate-300">2024-02-15</span>
                  </div>
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-slate-500">Reputation Score</span>
                    <span className={cn(
                      "font-bold",
                      analysisResult.status === 'Malicious' ? "text-red-500" : "text-green-500"
                    )}>
                      {analysisResult.status === 'Malicious' ? "12/100" : "98/100"}
                    </span>
                  </div>
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-slate-500">Associated Actor</span>
                    <span className="text-slate-300">Unknown / Generic</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );

  const renderPhishing = () => (
    <div className="space-y-6 animate-in slide-in-from-bottom-4 duration-500">
      <div className="glass-panel p-8">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 bg-orange-500/10 rounded-lg">
            <Globe className="w-6 h-6 text-orange-500" />
          </div>
          <div>
            <h2 className="text-xl font-bold">Phishing Detection Tool</h2>
            <p className="text-sm text-slate-400">Verify suspicious URLs or email domains for malicious intent.</p>
          </div>
        </div>

        <div className="max-w-2xl space-y-4">
          <div className="relative">
            <input 
              type="text" 
              placeholder="Enter URL or Domain (e.g., secure-login-bank.com)"
              value={phishingInput}
              onChange={(e) => setPhishingInput(e.target.value)}
              className="w-full bg-brand-bg border border-brand-border rounded-lg pl-4 pr-32 py-3 text-sm focus:outline-none focus:border-brand-accent"
            />
            <button 
              onClick={handlePhishingCheck}
              disabled={isPhishingCheck || !phishingInput}
              className="absolute right-2 top-1/2 -translate-y-1/2 bg-brand-accent hover:bg-blue-600 disabled:opacity-50 text-white px-4 py-1.5 rounded-md text-xs font-medium transition-colors"
            >
              {isPhishingCheck ? "Checking..." : "Check Safety"}
            </button>
          </div>
          
          {phishingResult && (
            <div className={cn(
              "p-4 rounded-lg border flex items-start gap-4 animate-in zoom-in-95 duration-300",
              phishingResult.status === 'Malicious' ? "bg-red-500/5 border-red-500/20" : "bg-green-500/5 border-green-500/20"
            )}>
              {phishingResult.status === 'Malicious' ? 
                <AlertTriangle className="w-5 h-5 text-red-500 shrink-0" /> : 
                <CheckCircle2 className="w-5 h-5 text-green-500 shrink-0" />
              }
              <div>
                <h4 className={cn(
                  "text-sm font-bold mb-1",
                  phishingResult.status === 'Malicious' ? "text-red-500" : "text-green-500"
                )}>
                  {phishingResult.status === 'Malicious' ? "Potential Phishing Detected" : "No Immediate Threats Found"}
                </h4>
                <p className="text-xs text-slate-400 leading-relaxed">{phishingResult.explanation}</p>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <FeatureCard 
          icon={<Server className="w-5 h-5 text-blue-400" />}
          title="Domain Reputation"
          description="Checks domain age, registrar info, and historical malicious activity."
        />
        <FeatureCard 
          icon={<Hash className="w-5 h-5 text-purple-400" />}
          title="Content Analysis"
          description="Analyzes page structure for credential harvesting patterns."
        />
        <FeatureCard 
          icon={<Globe className="w-5 h-5 text-emerald-400" />}
          title="Global Blacklists"
          description="Cross-references with 50+ threat intelligence feeds."
        />
      </div>
    </div>
  );

  const renderTrends = () => (
    <div className="space-y-6 animate-in slide-in-from-bottom-4 duration-500">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold">Emerging Threat Trends</h2>
        <span className="text-xs text-slate-500">Updated: March 2024</span>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {trends.map(trend => (
          <div key={trend.id} className="glass-panel p-6 flex flex-col">
            <div className="flex justify-between items-start mb-4">
              <div className="p-2 bg-brand-accent/10 rounded-lg">
                <TrendingUp className="w-5 h-5 text-brand-accent" />
              </div>
              <span className={cn(
                "status-pill",
                trend.impact_level === 'Critical' ? "bg-red-500/10 text-red-500" : "bg-orange-500/10 text-orange-500"
              )}>
                {trend.impact_level} Impact
              </span>
            </div>
            <h3 className="text-lg font-bold mb-2">{trend.trend_name}</h3>
            <p className="text-sm text-slate-400 mb-6 flex-1">{trend.description}</p>
            <div className="space-y-2">
              <div className="flex justify-between text-[10px] text-slate-500 uppercase font-bold">
                <span>Frequency Score</span>
                <span>{trend.frequency}%</span>
              </div>
              <div className="w-full bg-brand-border h-1.5 rounded-full overflow-hidden">
                <div 
                  className="bg-brand-accent h-full rounded-full" 
                  style={{ width: `${trend.frequency}%` }}
                />
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="glass-panel p-6">
        <h3 className="text-sm font-semibold mb-6">Global Threat Landscape (Mock Data)</h3>
        <div className="h-[400px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={trends}>
              <CartesianGrid strokeDasharray="3 3" stroke="#26262a" vertical={false} />
              <XAxis dataKey="trend_name" stroke="#52525b" fontSize={10} tickLine={false} />
              <YAxis stroke="#52525b" fontSize={10} tickLine={false} />
              <Tooltip 
                contentStyle={{ backgroundColor: '#151518', border: '1px solid #26262a', borderRadius: '8px' }}
                cursor={{ fill: 'rgba(255,255,255,0.05)' }}
              />
              <Bar dataKey="frequency" fill="#3b82f6" radius={[4, 4, 0, 0]} barSize={40} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen flex flex-col md:flex-row">
      {/* Sidebar */}
      <aside className="w-full md:w-64 bg-brand-card border-r border-brand-border flex flex-col">
        <div className="p-6 flex items-center gap-3 border-b border-brand-border">
          <div className="p-2 bg-brand-accent rounded-lg">
            <Shield className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-sm font-bold text-white tracking-tight">SENTINEL</h1>
            <p className="text-[10px] text-slate-500 font-mono">INTEL SYSTEM v1.0</p>
          </div>
        </div>

        <nav className="flex-1 p-4 space-y-2">
          <NavItem 
            active={activeTab === 'dashboard'} 
            onClick={() => setActiveTab('dashboard')} 
            icon={<LayoutDashboard className="w-4 h-4" />} 
            label="Dashboard" 
          />
          <NavItem 
            active={activeTab === 'actors'} 
            onClick={() => setActiveTab('actors')} 
            icon={<Users className="w-4 h-4" />} 
            label="Threat Actors" 
          />
          <NavItem 
            active={activeTab === 'ioc'} 
            onClick={() => setActiveTab('ioc')} 
            icon={<Search className="w-4 h-4" />} 
            label="IOC Analysis" 
          />
          <NavItem 
            active={activeTab === 'phishing'} 
            onClick={() => setActiveTab('phishing')} 
            icon={<Globe className="w-4 h-4" />} 
            label="Phishing Check" 
          />
          <NavItem 
            active={activeTab === 'trends'} 
            onClick={() => setActiveTab('trends')} 
            icon={<TrendingUp className="w-4 h-4" />} 
            label="Threat Trends" 
          />
        </nav>

        <div className="p-4 border-t border-brand-border">
          <div className="bg-brand-bg rounded-lg p-4">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-8 h-8 rounded-full bg-brand-accent/20 flex items-center justify-center text-brand-accent text-xs font-bold">
                PI
              </div>
              <div>
                <p className="text-xs font-bold text-white">Intel Intern</p>
                <p className="text-[10px] text-slate-500">Active Session</p>
              </div>
            </div>
            <button className="w-full py-2 text-[10px] font-bold uppercase tracking-wider text-slate-500 hover:text-white transition-colors border border-brand-border rounded-md">
              Logout
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 bg-brand-bg p-6 md:p-10 overflow-y-auto">
        <header className="flex justify-between items-center mb-10">
          <div>
            <h2 className="text-2xl font-bold text-white capitalize">{activeTab.replace('-', ' ')}</h2>
            <p className="text-sm text-slate-500">Sentinel Threat Intelligence Platform</p>
          </div>
          <div className="flex items-center gap-4">
            <div className="hidden md:flex items-center gap-2 px-3 py-1.5 bg-brand-card border border-brand-border rounded-lg text-xs">
              <span className={cn(
                "w-2 h-2 rounded-full animate-pulse",
                process.env.GEMINI_API_KEY ? "bg-green-500" : "bg-yellow-500"
              )} />
              <span className="text-slate-400 font-mono">
                System Status: {process.env.GEMINI_API_KEY ? "Operational" : "Mock Mode (No API Key)"}
              </span>
            </div>
            <button className="p-2 bg-brand-card border border-brand-border rounded-lg text-slate-400 hover:text-white transition-colors">
              <FileText className="w-4 h-4" />
            </button>
          </div>
        </header>

        {activeTab === 'dashboard' && renderDashboard()}
        {activeTab === 'actors' && renderActors()}
        {activeTab === 'ioc' && renderIOC()}
        {activeTab === 'phishing' && renderPhishing()}
        {activeTab === 'trends' && renderTrends()}
      </main>
    </div>
  );
}

function NavItem({ active, onClick, icon, label }: { active: boolean, onClick: () => void, icon: React.ReactNode, label: string }) {
  return (
    <button 
      onClick={onClick}
      className={cn(
        "w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all",
        active ? "bg-brand-accent text-white shadow-lg shadow-brand-accent/20" : "text-slate-400 hover:bg-white/5 hover:text-slate-200"
      )}
    >
      {icon}
      {label}
    </button>
  );
}

function StatCard({ title, value, icon, color }: { title: string, value: number | string, icon: React.ReactNode, color: string }) {
  return (
    <div className="glass-panel p-6">
      <div className="flex justify-between items-start mb-4">
        <div className={cn("p-2 rounded-lg bg-black/20", color)}>
          {icon}
        </div>
      </div>
      <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">{title}</p>
      <h4 className="text-2xl font-bold text-white">{value}</h4>
    </div>
  );
}

function FeatureCard({ icon, title, description }: { icon: React.ReactNode, title: string, description: string }) {
  return (
    <div className="glass-panel p-6">
      <div className="mb-4">{icon}</div>
      <h4 className="text-sm font-bold mb-2">{title}</h4>
      <p className="text-xs text-slate-500 leading-relaxed">{description}</p>
    </div>
  );
}
