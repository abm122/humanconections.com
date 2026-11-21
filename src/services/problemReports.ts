/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type ProblemCategory =
  | 'technical'
  | 'rules'
  | 'payment'
  | 'conduct'
  | 'feedback'
  | 'other';

export interface ProblemReport {
  id: string;
  timestamp: number;
  category: ProblemCategory;
  categoryLabel: string;
  message: string;
  isAnonymous: boolean;
  reporterName?: string;
  reporterEmail?: string;
  status: 'new' | 'investigating' | 'resolved';
  deviceInfo?: string;
  ownerNotes?: string;
  ownerReply?: string;
  ownerRepliedAt?: number;
  ownerRepliedBy?: string;
}

const REPORTS_STORAGE_KEY = 'joypulse_problem_reports_v1';
const OWNER_EMAIL = 'adhanom3@gmail.com';

const INITIAL_REPORTS: ProblemReport[] = [
  {
    id: 'rep-init-1',
    timestamp: Date.now() - 3600000 * 5,
    category: 'feedback',
    categoryLabel: 'Forslag & forbedring',
    message: 'Fantastisk app for bingokvelden vår! Kunne dere vurdert å legge til enda flere sang- og musikkrelaterte spørsmål i RIL-kategorien?',
    isAnonymous: false,
    reporterName: 'Ingrid M.',
    reporterEmail: 'ingrid.m@example.com',
    status: 'new',
    deviceInfo: 'Nettleser / PC',
  },
  {
    id: 'rep-init-2',
    timestamp: Date.now() - 3600000 * 24,
    category: 'technical',
    categoryLabel: 'Teknisk spørsmål',
    message: 'Trommelen rullet litt raskt på en eldre mobilskjerm, men fungerte perfekt etter omstart.',
    isAnonymous: true,
    status: 'investigating',
    deviceInfo: 'Mobil (Chrome)',
  },
];

class ProblemReportsService {
  private reports: ProblemReport[];
  private listeners: Set<() => void> = new Set();

  constructor() {
    this.reports = this.loadReports();
  }

  private loadReports(): ProblemReport[] {
    try {
      if (typeof window !== 'undefined') {
        const stored = localStorage.getItem(REPORTS_STORAGE_KEY);
        if (stored) {
          const parsed = JSON.parse(stored);
          if (Array.isArray(parsed)) {
            return parsed;
          }
        }
      }
    } catch {
      // Fallback
    }
    return [...INITIAL_REPORTS];
  }

  private saveReports() {
    try {
      if (typeof window !== 'undefined') {
        localStorage.setItem(REPORTS_STORAGE_KEY, JSON.stringify(this.reports));
      }
      this.notify();
    } catch {
      // Ignore
    }
  }

  private notify() {
    this.listeners.forEach((cb) => cb());
  }

  public subscribe(cb: () => void): () => void {
    this.listeners.add(cb);
    return () => this.listeners.delete(cb);
  }

  public getReports(): ProblemReport[] {
    return [...this.reports].sort((a, b) => b.timestamp - a.timestamp);
  }

  public getNewReportsCount(): number {
    return this.reports.filter((r) => r.status === 'new').length;
  }

  public getOwnerEmail(): string {
    return OWNER_EMAIL;
  }

  public submitReport(input: {
    category: ProblemCategory;
    categoryLabel: string;
    message: string;
    isAnonymous: boolean;
    reporterName?: string;
    reporterEmail?: string;
  }): ProblemReport {
    const report: ProblemReport = {
      id: `rep-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      timestamp: Date.now(),
      category: input.category,
      categoryLabel: input.categoryLabel,
      message: input.message.trim(),
      isAnonymous: input.isAnonymous,
      reporterName: input.isAnonymous ? undefined : input.reporterName?.trim(),
      reporterEmail: input.isAnonymous ? undefined : input.reporterEmail?.trim(),
      status: 'new',
      deviceInfo: typeof navigator !== 'undefined' ? `${navigator.userAgent.slice(0, 45)}...` : 'Nettleser',
    };

    this.reports.unshift(report);
    this.saveReports();
    return report;
  }

  public updateReportStatus(id: string, status: ProblemReport['status'], notes?: string): void {
    this.reports = this.reports.map((r) => {
      if (r.id === id) {
        return {
          ...r,
          status,
          ownerNotes: notes !== undefined ? notes : r.ownerNotes,
        };
      }
      return r;
    });
    this.saveReports();
  }

  public addOwnerReply(id: string, reply: string, authorName = 'Eier (Admin)'): void {
    const cleanReply = reply.trim();
    if (!cleanReply) return;
    this.reports = this.reports.map((r) => {
      if (r.id === id) {
        return {
          ...r,
          ownerReply: cleanReply,
          ownerRepliedAt: Date.now(),
          ownerRepliedBy: authorName,
          status: 'resolved',
        };
      }
      return r;
    });
    this.saveReports();
  }

  public deleteReport(id: string): void {
    this.reports = this.reports.filter((r) => r.id !== id);
    this.saveReports();
  }

  public createMailtoUrl(report: {
    categoryLabel: string;
    message: string;
    isAnonymous: boolean;
    reporterName?: string;
    reporterEmail?: string;
  }): string {
    const subject = encodeURIComponent(`[JoyBingo Problemrapport] ${report.categoryLabel}`);
    const senderLine = report.isAnonymous
      ? 'Avsender: Anonym bruker'
      : `Avsender: ${report.reporterName || 'Ukjent'} (${report.reporterEmail || 'Ingen e-post oppgitt'})`;

    const body = encodeURIComponent(
      `Hei Eier,\n\nDet er rapportert et problem / tilbakemelding fra JoyBingo:\n\n` +
      `Kategori: ${report.categoryLabel}\n` +
      `${senderLine}\nDato: ${new Date().toLocaleString('nb-NO')}\n\n` +
      `Beskrivelse:\n${report.message}\n\n` +
      `--\nSendt via JoyBingo tilbakemeldingssystem`
    );

    return `mailto:${OWNER_EMAIL}?subject=${subject}&body=${body}`;
  }
}

export const problemReports = new ProblemReportsService();
