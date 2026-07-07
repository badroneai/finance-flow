/*
  قيد العقار — حدود الأخطاء (مستخرجة من App.jsx — الخطوة 2)
*/

import React from 'react';

/** حد أخطاء لتبويبات الدفتر (مثلاً تقارير الدفتر) — يمنع الصفحة البيضاء */
export class LedgerTabErrorBoundary extends React.Component {
  state = { hasError: false, error: null };
  static getDerivedStateFromError(err) {
    return { hasError: true, error: err };
  }
  componentDidCatch(err, info) {
    console.error('LedgerTabErrorBoundary', err, info);
  }
  render() {
    if (this.state.hasError) {
      return (
        <div className="error-surface error-surface--page">
          <h4 className="error-surface__title">حدث خطأ في تحميل هذه الصفحة</h4>
          <p className="error-surface__desc">
            يمكنك العودة إلى تبويب آخر والمحاولة مرة أخرى.
          </p>
          {this.props.onBack && (
            <button
              type="button"
              onClick={this.props.onBack}
              className="btn-primary"
              aria-label="العودة للدفاتر"
            >
              العودة إلى الدفاتر
            </button>
          )}
        </div>
      );
    }
    return this.props.children;
  }
}

/** حد أخطاء لتحميل الصفحات المؤجلة (lazy) — يعرض رسالة وزر العودة أو إعادة التحميل */
export class PageLoadErrorBoundary extends React.Component {
  state = { hasError: false };
  static getDerivedStateFromError() {
    return { hasError: true };
  }
  componentDidCatch(err, info) {
    console.error('PageLoadErrorBoundary', err, info);
  }
  render() {
    if (this.state.hasError) {
      return (
        <div className="error-surface error-surface--page" dir="rtl">
          <p className="error-surface__title">تعذر تحميل هذه الصفحة</p>
          <p className="error-surface__desc">
            تحقق من الاتصال بالإنترنت وحاول مرة أخرى.
          </p>
          <div className="error-surface__actions">
            {this.props.onGoHome && (
              <button
                type="button"
                onClick={this.props.onGoHome}
                className="btn-primary"
                aria-label="العودة للنبض المالي"
              >
                العودة للنبض المالي
              </button>
            )}
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="btn-secondary"
              aria-label="إعادة تحميل الصفحة"
            >
              إعادة تحميل الصفحة
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

/** حد أخطاء عام مع واجهة استعادة (نسخ تفاصيل الخطأ + إعادة تحميل) */
export class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }
  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }
  componentDidCatch(error, errorInfo) {
    this.setState((prev) => ({ ...prev, errorInfo }));
  }
  handleReload = () => {
    window.location.reload();
  };
  handleCopyDetails = () => {
    const { error, errorInfo } = this.state;
    const text = [error && error.toString(), errorInfo && errorInfo.componentStack]
      .filter(Boolean)
      .join('\n\n');
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(() => alert('تم نسخ التفاصيل'));
    } else {
      prompt('انسخ التفاصيل:', text);
    }
  };
  render() {
    if (this.state.hasError) {
      return (
        <div className="error-surface__wrap" dir="rtl">
          <div className="error-surface error-surface--fullscreen">
            <h1 className="error-surface__title error-surface__title--lg">حدث خطأ غير متوقع</h1>
            <p className="error-surface__desc--lg">
              يمكنك إعادة تحميل التطبيق أو نسخ تفاصيل الخطأ للمساعدة الفنية.
            </p>
            <div className="error-surface__actions">
              <button
                type="button"
                onClick={this.handleReload}
                className="btn-primary"
                aria-label="إعادة تحميل التطبيق"
              >
                إعادة تحميل التطبيق
              </button>
              <button
                type="button"
                onClick={this.handleCopyDetails}
                className="btn-secondary"
                aria-label="نسخ تفاصيل الخطأ"
              >
                نسخ تفاصيل الخطأ
              </button>
            </div>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
