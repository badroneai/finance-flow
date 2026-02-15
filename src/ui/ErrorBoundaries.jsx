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
        <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
          <h4 className="font-bold text-gray-900 mb-2">حدث خطأ في تحميل هذه الصفحة</h4>
          <p className="text-sm text-gray-600 mb-4">يمكنك العودة إلى تبويب آخر والمحاولة مرة أخرى.</p>
          {this.props.onBack && (
            <button type="button" onClick={this.props.onBack} className="px-4 py-2 rounded-lg bg-blue-600 text-white text-sm font-medium hover:bg-blue-700" aria-label="العودة للدفاتر">
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
        <div className="p-6 max-w-md mx-auto text-center" dir="rtl">
          <p className="text-gray-700 font-medium mb-1">تعذر تحميل هذه الصفحة</p>
          <p className="text-sm text-gray-500 mb-4">تحقق من الاتصال بالإنترنت وحاول مرة أخرى.</p>
          <div className="flex flex-wrap gap-2 justify-center">
            {this.props.onGoHome && (
              <button type="button" onClick={this.props.onGoHome} className="px-4 py-2 rounded-lg bg-blue-600 text-white text-sm font-medium hover:bg-blue-700" aria-label="العودة للنبض المالي">
                العودة للنبض المالي
              </button>
            )}
            <button type="button" onClick={() => window.location.reload()} className="px-4 py-2 rounded-lg border border-gray-300 text-gray-700 text-sm font-medium hover:bg-gray-50" aria-label="إعادة تحميل الصفحة">
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
    const text = [error && error.toString(), errorInfo && errorInfo.componentStack].filter(Boolean).join('\n\n');
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(() => alert('تم نسخ التفاصيل'));
    } else {
      prompt('انسخ التفاصيل:', text);
    }
  };
  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-100 p-6" dir="rtl">
          <div className="bg-white rounded-xl border border-gray-200 shadow-lg p-8 max-w-md w-full text-center">
            <h1 className="text-xl font-bold text-gray-900 mb-2">حدث خطأ غير متوقع</h1>
            <p className="text-gray-600 text-sm mb-6">يمكنك إعادة تحميل التطبيق أو نسخ تفاصيل الخطأ للمساعدة الفنية.</p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <button type="button" onClick={this.handleReload} className="px-5 py-2.5 rounded-lg bg-blue-600 text-white font-medium hover:bg-blue-700" aria-label="إعادة تحميل التطبيق">
                إعادة تحميل التطبيق
              </button>
              <button type="button" onClick={this.handleCopyDetails} className="px-5 py-2.5 rounded-lg border border-gray-300 bg-white text-gray-700 font-medium hover:bg-gray-50" aria-label="نسخ تفاصيل الخطأ">
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
