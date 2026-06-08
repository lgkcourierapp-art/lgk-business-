import Sidebar from '@/components/Sidebar'
import BottomNav from '@/components/BottomNav'
import Header from '@/components/Header'

export default function PortalLayout({ children }) {
  return (
    <>
      <div className="sidebar-wrap"><Sidebar /></div>
      <div className="bottomnav-wrap"><BottomNav /></div>
      <div className="portal-header-wrap"><Header /></div>
      <div className="portal-content">{children}</div>
      <style>{`
        .sidebar-wrap   { display: block; }
        .bottomnav-wrap { display: none; }
        .portal-header-wrap { margin-left: 220px; }
        .portal-content {
          margin-left: 220px;
          background: #FFFFFF;
          color: #0A0A0A;
          min-height: 100vh;
        }
        /* Fixed bottom bars inside portal pages (orders/new submit bar) */
        .portal-bottom-bar { left: 220px; }

        @media (max-width: 768px) {
          .sidebar-wrap   { display: none; }
          .bottomnav-wrap { display: block; }
          .portal-header-wrap { margin-left: 0; }
          .portal-content { margin-left: 0; padding-bottom: 72px; }
          .portal-bottom-bar { left: 0; bottom: 72px !important; }
        }

        @media print {
          .sidebar-wrap, .bottomnav-wrap { display: none !important; }
          .portal-content { margin-left: 0; padding-bottom: 0; }
        }

        /* Form inputs — override dark globals.css inside portal only */
        .portal-content input,
        .portal-content select,
        .portal-content textarea {
          background: #F5F5F5;
          border-color: #E5E5E5;
          color: #0A0A0A;
        }
        .portal-content input:focus,
        .portal-content select:focus,
        .portal-content textarea:focus { border-color: #D4FF00; }
        .portal-content select option { background: #FFFFFF; color: #0A0A0A; }

        /* Card CSS classes — override dark globals.css inside portal only */
        .portal-content .card,
        .portal-content .card-standard,
        .portal-content .card-hero {
          background: #F5F5F5;
          border-color: #E5E5E5;
          box-shadow: 0 1px 4px rgba(0,0,0,0.06);
        }
        .portal-content label { color: #555; }
        .portal-content .section-title,
        .portal-content .section-heading {
          color: #888;
          border-color: #E5E5E5;
        }
      `}</style>
    </>
  )
}
