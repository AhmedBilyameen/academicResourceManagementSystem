export default function Topbar({ title, actions }) {
    return (
        <header className="topbar">
            <div className="topbar-title">{title}</div>
            {actions && <div className="topbar-actions">{actions}</div>}
        </header>
    );
}
