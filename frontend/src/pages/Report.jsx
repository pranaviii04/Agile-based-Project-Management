import { useParams, Link } from "react-router-dom";

function Report() {
  const { id } = useParams();

  return (
    <div className="p-6">
      <nav className="text-sm text-slate-400 mb-4">
        <Link to="/projects" className="hover:text-white transition-colors">
          Projects
        </Link>
        <span className="mx-2">/</span>
        <span className="text-white">Report {id}</span>
      </nav>

      <h1 className="text-3xl font-bold text-white mb-2">Report — Project {id}</h1>
      <p className="text-slate-400 mb-8">
        Project analytics and CPM report data will be displayed here.
      </p>

      {/* Placeholder report sections */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-slate-800 border border-slate-700 rounded-xl p-6">
          <h3 className="text-sm font-medium text-slate-400 uppercase tracking-wider mb-3">
            Sprint Progress
          </h3>
          <p className="text-slate-500 text-sm">Chart placeholder</p>
        </div>
        <div className="bg-slate-800 border border-slate-700 rounded-xl p-6">
          <h3 className="text-sm font-medium text-slate-400 uppercase tracking-wider mb-3">
            Critical Path
          </h3>
          <p className="text-slate-500 text-sm">CPM visualization placeholder</p>
        </div>
      </div>
    </div>
  );
}

export default Report;
