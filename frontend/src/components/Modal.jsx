import { useEffect } from "react";
import { X } from "lucide-react";

/**
 * Reusable modal with backdrop blur and Esc-to-close.
 * @param {boolean}   props.open
 * @param {Function}  props.onClose
 * @param {string}    props.title
 * @param {ReactNode} props.children
 * @param {ReactNode} props.footer   - optional footer content
 * @param {string}    props.maxWidth - e.g. "520px"
 */
function Modal({ open, onClose, title, children, footer, maxWidth = "480px" }) {
  // Esc to close
  useEffect(() => {
    if (!open) return;
    const handler = (e) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div
        className="modal"
        style={{ maxWidth }}
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
      >
        {/* Header */}
        <div className="modal-header">
          <h2
            id="modal-title"
            tabIndex={-1}
            style={{ fontSize: "18px", fontWeight: "700", color: "var(--text-primary)", margin: 0 }}
          >
            {title}
          </h2>
          <button
            onClick={onClose}
            style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-muted)", display: "flex", padding: "4px", borderRadius: "6px", transition: "all 0.15s ease" }}
            onMouseEnter={e => { e.currentTarget.style.background = "var(--bg-hover)"; e.currentTarget.style.color = "var(--text-primary)"; }}
            onMouseLeave={e => { e.currentTarget.style.background = "none"; e.currentTarget.style.color = "var(--text-muted)"; }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div className="modal-body">{children}</div>

        {/* Footer */}
        {footer && <div className="modal-footer">{footer}</div>}
      </div>
    </div>
  );
}

export default Modal;
