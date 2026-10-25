"use client";

import React, { Component, ErrorInfo, ReactNode } from "react";
import { AlertCircle, RefreshCw, Home } from "lucide-react";

interface PortalTabErrorBoundaryProps {
  tabName: string;
  tabKey?: string;
  children: ReactNode;
  onReset?: () => void;
  onNavigateHome?: () => void;
}

interface PortalTabErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  resetKey: number;
}

/**
 * Tab-Level React Error Boundary for Guardian Portal
 *
 * Catches errors in child tab components, isolates the failure to the active tab,
 * prevents the entire portal shell from crashing, and provides an active retry button
 * which genuinely resets state and remounts the children.
 */
export class PortalTabErrorBoundary extends Component<
  PortalTabErrorBoundaryProps,
  PortalTabErrorBoundaryState
> {
  public state: PortalTabErrorBoundaryState = {
    hasError: false,
    error: null,
    resetKey: 0,
  };

  public static getDerivedStateFromError(error: Error): Partial<PortalTabErrorBoundaryState> {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error(`[PortalTabErrorBoundary:${this.props.tabName}] Uncaught tab rendering error:`, error, errorInfo);
  }

  public handleRetry = () => {
    this.setState((prev) => ({
      hasError: false,
      error: null,
      resetKey: prev.resetKey + 1,
    }));
    if (this.props.onReset) {
      this.props.onReset();
    }
  };

  public handleNavigateDashboard = () => {
    this.setState({
      hasError: false,
      error: null,
    });
    if (this.props.onNavigateHome) {
      this.props.onNavigateHome();
    } else if (typeof window !== "undefined") {
      window.location.href = "/portal?tab=DASHBOARD";
    }
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div
          role="alert"
          aria-live="assertive"
          className="bg-white rounded-2xl border border-red-200 p-8 shadow-sm text-center max-w-xl mx-auto my-8 space-y-5"
          data-testid={`error-boundary-${this.props.tabKey || this.props.tabName}`}
        >
          <div className="w-14 h-14 bg-red-50 text-red-600 rounded-2xl flex items-center justify-center mx-auto border border-red-100 shadow-sm">
            <AlertCircle className="w-7 h-7 text-red-600" />
          </div>

          <div className="space-y-2">
            <span className="text-[11px] font-bold text-red-600 uppercase tracking-wider bg-red-50 px-2.5 py-0.5 rounded-full border border-red-200">
              {this.props.tabName} বিভাগ
            </span>
            <h3 className="text-base sm:text-lg font-bold text-slate-900">
              তথ্য প্রদর্শনে সাময়িক সমস্যা হয়েছে
            </h3>
            <p className="text-xs text-slate-500 max-w-md mx-auto leading-relaxed">
              &apos;{this.props.tabName}&apos; বিভাগের তথ্য লোড করার সময় একটি ত্রুটি ঘটেছে। পোর্টালের বাকি সকল বিভাগ সচল ও নিরাপদ রয়েছে।
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
            <button
              type="button"
              onClick={this.handleRetry}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-[#0D5C3A] hover:bg-[#083B25] text-white text-xs font-bold transition shadow-sm cursor-pointer"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>পুনরায় চেষ্টা করুন</span>
            </button>
            <button
              type="button"
              onClick={this.handleNavigateDashboard}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition cursor-pointer"
            >
              <Home className="w-3.5 h-3.5 text-slate-500" />
              <span>ড্যাশবোর্ডে ফিরে যান</span>
            </button>
          </div>
        </div>
      );
    }

    return (
      <React.Fragment key={this.state.resetKey}>
        {this.props.children}
      </React.Fragment>
    );
  }
}

export default PortalTabErrorBoundary;
