import { useEffect, useState, type FormEvent } from "react";
import {
  ArrowDownToLine,
  BadgeCheck,
  BellRing,
  BookOpenCheck,
  Check,
  ChevronRight,
  CircleAlert,
  CircleDollarSign,
  Clock3,
  FileCheck2,
  FileText,
  FolderOpen,
  Plus,
  RefreshCw,
  Send,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import type { Analysis, Evidence, InvoiceCase } from "./types";

type Health = { mode: string; aiConfigured: boolean; paypalConfigured: boolean };

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(path, {
    ...init,
    headers: { "Content-Type": "application/json", ...init?.headers },
  });
  const body = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(body.error || `Request failed (${response.status}).`);
  return body as T;
}

function formatDate(value: string): string {
  return new Intl.DateTimeFormat("en-IN", { day: "numeric", month: "short", year: "numeric" }).format(new Date(value));
}

export default function App() {
  const [invoice, setInvoice] = useState<InvoiceCase>();
  const [evidence, setEvidence] = useState<Evidence[]>([]);
  const [health, setHealth] = useState<Health>();
  const [analysis, setAnalysis] = useState<Analysis>();
  const [newText, setNewText] = useState("");
  const [paypalInvoiceId, setPaypalInvoiceId] = useState(() => localStorage.getItem("cleardues.paypalInvoiceId") || "");
  const [paypalStatus, setPaypalStatus] = useState(() => localStorage.getItem("cleardues.paypalStatus") || "");
  const [busy, setBusy] = useState("");
  const [error, setError] = useState("");

  async function loadCase() {
    const [healthData, caseData] = await Promise.all([
      request<Health>("/api/health"),
      request<{ invoice: InvoiceCase; evidence: Evidence[] }>("/api/case"),
    ]);
    setHealth(healthData);
    setInvoice(caseData.invoice);
    setEvidence(caseData.evidence);
  }

  useEffect(() => {
    loadCase().catch((cause: unknown) => setError(cause instanceof Error ? cause.message : "Could not connect to ClearDues."));
  }, []);

  async function addEvidence(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy("evidence");
    setError("");
    try {
      await request<Evidence>("/api/evidence", { method: "POST", body: JSON.stringify({ text: newText }) });
      setNewText("");
      setAnalysis(undefined);
      await loadCase();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Could not add evidence.");
    } finally {
      setBusy("");
    }
  }

  async function runAnalysis() {
    setBusy("analysis");
    setError("");
    try {
      setAnalysis(await request<Analysis>("/api/analyze", { method: "POST", body: "{}" }));
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Analysis failed.");
    } finally {
      setBusy("");
    }
  }

  async function createInvoice() {
    if (!invoice || !window.confirm(`Create a PayPal Sandbox draft for ${invoice.currency} ${invoice.amount}? No real payment will be taken.`)) return;
    setBusy("create");
    setError("");
    try {
      const result = await request<{ id?: string; status?: string }>("/api/paypal/invoices", {
        method: "POST",
        body: JSON.stringify({
          recipientName: invoice.recipientName,
          recipientEmail: invoice.recipientEmail,
          amount: invoice.amount,
          currency: invoice.currency,
          dueDate: invoice.dueDate,
        }),
      });
      const invoiceId = result.id || "";
      const status = result.status || "Draft created in Sandbox";
      setPaypalInvoiceId(invoiceId);
      setPaypalStatus(status);
      localStorage.setItem("cleardues.paypalInvoiceId", invoiceId);
      localStorage.setItem("cleardues.paypalStatus", status);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Sandbox invoice could not be created.");
    } finally {
      setBusy("");
    }
  }

  async function sendInvoice() {
    if (!paypalInvoiceId || !window.confirm("Send this invoice through PayPal Sandbox now? This contacts the Sandbox recipient.")) return;
    setBusy("send");
    setError("");
    try {
      await request(`/api/paypal/invoices/${encodeURIComponent(paypalInvoiceId)}/send`, {
        method: "POST",
        body: JSON.stringify({ confirm: true }),
      });
      setPaypalStatus("Send request completed in Sandbox");
      localStorage.setItem("cleardues.paypalStatus", "Send request completed in Sandbox");
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Sandbox send failed.");
    } finally {
      setBusy("");
    }
  }

  async function refreshInvoice() {
    if (!paypalInvoiceId) return;
    setBusy("refresh");
    setError("");
    try {
      const result = await request<{ status?: string }>(`/api/paypal/invoices/${encodeURIComponent(paypalInvoiceId)}`);
      const status = result.status || "Status refreshed from Sandbox";
      setPaypalStatus(status);
      localStorage.setItem("cleardues.paypalStatus", status);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Status refresh failed.");
    } finally {
      setBusy("");
    }
  }

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <a className="brand" href="#overview" aria-label="ClearDues home">
          <span className="brand-mark"><CircleDollarSign size={23} strokeWidth={2.2} /></span>
          <span>cleardues<span className="brand-period">.</span></span>
        </a>
        <div className="workspace-label">WORKSPACE</div>
        <nav className="primary-nav" aria-label="Primary navigation">
          <a className="nav-item active" href="#overview"><FolderOpen size={17} /> Receivables <span className="nav-count">1</span></a>
          <a className="nav-item" href="#evidence"><FileCheck2 size={17} /> Evidence</a>
          <a className="nav-item" href="#review"><Sparkles size={17} /> Review desk</a>
        </nav>
        <div className="sidebar-bottom">
          <div className="privacy-note"><ShieldCheck size={17} /><span>Synthetic demo data<br />Sandbox only</span></div>
          <div className="profile-row"><span className="avatar">CD</span><span className="profile-copy"><strong>ClearDues demo</strong><small>Local workspace</small></span><ChevronRight size={15} /></div>
        </div>
      </aside>

      <main className="main-content" id="overview">
        <header className="topbar">
          <div className="breadcrumb">Receivables <ChevronRight size={14} /> <span>Invoice review</span></div>
          <div className="topbar-right">
            <span className="sandbox-badge"><span className="pulse-dot" /> PAYPAL SANDBOX</span>
            <button className="icon-button" title="Refresh case" aria-label="Refresh case" onClick={() => loadCase().catch((cause) => setError(String(cause)))}><RefreshCw size={17} /></button>
          </div>
        </header>

        <div className="page-wrap">
          <section className="page-heading">
            <div>
              <div className="eyebrow"><span className="case-dot" /> CASE CD-1042 <span className="eyebrow-divider">/</span> SYNTHETIC RECORD</div>
              <h1>Invoice review</h1>
              <p className="subtitle">A clear next step, grounded in the record.</p>
            </div>
            <div className="heading-actions">
              <a className="button button-secondary" href="/api/export.json"><ArrowDownToLine size={16} /> Export JSON</a>
              <a className="button button-primary" href="/api/export.pdf"><FileText size={16} /> Evidence packet</a>
            </div>
          </section>

          {error && <div className="error-banner" role="alert"><CircleAlert size={18} /><span>{error}</span><button aria-label="Dismiss error" onClick={() => setError("")}>Dismiss</button></div>}

          <section className="invoice-strip" aria-label="Invoice summary">
            <div className="invoice-identity"><span className="invoice-icon"><FileText size={20} /></span><div><span className="label-small">INVOICE</span><strong>{invoice?.number || "Loading…"}</strong></div></div>
            <div className="invoice-stat"><span className="label-small">CLIENT</span><strong>{invoice?.recipientName}</strong></div>
            <div className="invoice-stat"><span className="label-small">AMOUNT DUE</span><strong className="amount">{invoice?.currency} {invoice?.amount}</strong></div>
            <div className="invoice-stat"><span className="label-small">DUE DATE</span><strong>{invoice?.dueDate ? formatDate(invoice.dueDate) : "—"}</strong></div>
            <div className="invoice-status"><span className="status-dot" /> {invoice?.status || "Loading"}</div>
          </section>

          <div className="mode-row">
            <div className="mode-note"><BadgeCheck size={16} /><span><strong>Demo record</strong> · No real client or payment data</span></div>
            <div className="connection-state"><span className={health?.aiConfigured ? "connection-on" : "connection-off"} /> AI {health?.aiConfigured ? "provider configured" : "not configured"}<span className="connection-sep">·</span><span className={health?.paypalConfigured ? "connection-on" : "connection-off"} /> PayPal {health?.paypalConfigured ? "credentials configured" : "not configured"}</div>
          </div>

          <div className="work-grid">
            <section className="work-panel evidence-panel" id="evidence">
              <div className="panel-heading">
                <div><span className="section-index">01</span><div><h2>Evidence trail</h2><p>Source text stays attached to every fact.</p></div></div>
                <span className="count-pill">{evidence.length} ITEMS</span>
              </div>

              <div className="timeline">
                {evidence.slice().reverse().map((item, index) => (
                  <article className="timeline-item" key={item.id}>
                    <div className={`timeline-marker ${index === 0 ? "marker-current" : ""}`}>{item.kind === "invoice" ? <FileText size={15} /> : <BookOpenCheck size={15} />}</div>
                    <div className="timeline-content">
                      <div className="event-meta"><strong>{item.title}</strong><time>{formatDate(item.createdAt)}</time></div>
                      <p className="source-quote">“{item.text}”</p>
                      <div className="source-id">SOURCE ID <code>{item.id}</code></div>
                    </div>
                  </article>
                ))}
              </div>

              <form className="add-evidence" onSubmit={addEvidence}>
                <label htmlFor="source-text"><span className="add-icon"><Plus size={16} /></span>Add correspondence excerpt</label>
                <textarea id="source-text" value={newText} onChange={(event) => setNewText(event.target.value)} maxLength={5000} minLength={12} placeholder="Paste a short client email or project update…" required />
                <div className="form-footer"><span>12–5,000 characters · Avoid confidential information</span><button className="button button-primary button-small" type="submit" disabled={busy === "evidence" || newText.trim().length < 12}>{busy === "evidence" ? "Adding…" : "Add to record"}<ChevronRight size={15} /></button></div>
              </form>
            </section>

            <aside className="review-column" id="review">
              <section className="work-panel review-panel">
                <div className="panel-heading review-heading">
                  <div><span className="section-index accent-index">02</span><div><h2>AI review</h2><p>Extract only what the record supports.</p></div></div>
                  <span className={`ai-badge ${health?.aiConfigured ? "ai-ready" : "ai-demo"}`}><Sparkles size={13} /> {health?.aiConfigured ? "CONFIGURED" : "DEMO"}</span>
                </div>
                <div className="ai-disclosure"><ShieldCheck size={15} /><span>Evidence is sent only to your configured provider. No provider means no model request.</span></div>
                <button className="button button-dark analyze-button" onClick={runAnalysis} disabled={busy === "analysis"}>
                  <Sparkles size={16} /> {busy === "analysis" ? "Reviewing record…" : "Review evidence"}
                </button>
                {analysis ? (
                  <div className="analysis-result" aria-live="polite">
                    <div className="result-label"><Check size={14} /> {analysis.mode === "ai" ? "AI SELECTED · EXACT QUOTES VERIFIED" : "DEMO MODE · NO MODEL CALLED"}</div>
                    <p className="analysis-summary">{analysis.summary}</p>
                    {analysis.claims.map((claim, index) => (
                      <div className="claim" key={`${claim.sourceId}-${index}`}><p>{claim.text}</p><blockquote>“{claim.quote}”</blockquote><small>Source: {claim.sourceId}</small></div>
                    ))}
                    {analysis.missingFacts.map((fact) => <div className="missing-fact" key={fact}><CircleAlert size={14} /> AI suggestion; verify manually: {fact}</div>)}
                    {analysis.draft && <div className="draft-box"><div className="draft-title"><BellRing size={14} /> NEUTRAL STARTER · EDIT BEFORE USE</div><textarea aria-label="Edit neutral follow-up starter" value={analysis.draft} onChange={(event) => setAnalysis({ ...analysis, draft: event.target.value })} /></div>}
                  </div>
                ) : <div className="analysis-empty"><Sparkles size={18} /><p>Review the attached excerpts for supported facts and gaps.</p></div>}
              </section>

              <section className="work-panel paypal-panel">
                <div className="panel-heading compact-heading">
                  <div><span className="section-index paypal-index">03</span><div><h2>PayPal invoice</h2><p>Sandbox actions require your confirmation.</p></div></div>
                  <span className="paypal-wordmark">PayPal</span>
                </div>
                {!health?.paypalConfigured ? (
                  <div className="provider-empty"><CircleAlert size={17} /><p><strong>Sandbox not connected.</strong> Add test credentials to `.env` to enable API actions. No request has been made.</p></div>
                ) : (
                  <div className="paypal-actions">
                    {!paypalInvoiceId ? <button className="button button-secondary full-button" onClick={createInvoice} disabled={busy === "create"}>{busy === "create" ? "Creating draft…" : "Create Sandbox draft"}<ChevronRight size={15} /></button> : <>
                      <div className="paypal-result"><span className="label-small">SANDBOX INVOICE ID</span><code>{paypalInvoiceId}</code><span className="paypal-status"><span className="connection-on" />{paypalStatus}</span></div>
                      <div className="paypal-button-row"><button className="button button-secondary" onClick={refreshInvoice} disabled={busy === "refresh"}><RefreshCw size={15} /> Refresh</button><button className="button button-primary" onClick={sendInvoice} disabled={busy === "send"}><Send size={15} /> {busy === "send" ? "Sending…" : "Confirm & send"}</button></div>
                    </>}
                  </div>
                )}
                <div className="human-control"><ShieldCheck size={15} /><span>AI cannot create, send, or change invoices.</span></div>
              </section>
            </aside>
          </div>

          <footer className="page-footer"><span><ShieldCheck size={14} /> Local prototype · Synthetic case · Not legal or accounting advice</span><span><Clock3 size={14} /> {paypalInvoiceId ? "Sandbox record" : "No PayPal call made"}</span></footer>
        </div>
      </main>
    </div>
  );
}