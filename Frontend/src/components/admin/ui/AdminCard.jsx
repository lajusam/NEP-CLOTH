export default function AdminCard({ title, description, action, children, className = '' }) {
  return <section className={`admin-card${className ? ` ${className}` : ''}`}>
    {(title || description || action) && <header className="admin-card-header"><div>{title && <h2>{title}</h2>}{description && <p>{description}</p>}</div>{action}</header>}
    <div className="admin-card-body">{children}</div>
  </section>;
}
