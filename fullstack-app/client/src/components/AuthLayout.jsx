import '../pages/auth.css';

export function AuthLayout({ title, children, footer }) {
  return (
    <div className="auth-wrap">
      <div className="auth-card">
        <h2 className="auth-title">{title}</h2>
        {children}
        {footer && <p className="auth-footer">{footer}</p>}
      </div>
    </div>
  );
}
