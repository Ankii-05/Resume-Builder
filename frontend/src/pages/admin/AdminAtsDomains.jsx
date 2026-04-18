import { useCallback, useEffect, useState } from "react";
import { Pencil, Plus, Trash2, X } from "lucide-react";
import toast from "react-hot-toast";
import axiosInstance from "../../utils/axiosInstance";
import { API_PATHS } from "../../utils/apiPaths";

function slugify(name) {
  const s = String(name || "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
  return s.slice(0, 80);
}

function TagInput({ label, value, onChange, placeholder, hint, countLabel = "keywords" }) {
  const [input, setInput] = useState("");

  const pushTags = (raw) => {
    const parts = String(raw)
      .split(/[,]+/)
      .map((s) => s.trim())
      .filter(Boolean);
    if (!parts.length) return;
    const next = [...value];
    for (const p of parts) {
      if (!next.includes(p)) next.push(p);
    }
    onChange(next);
  };

  const removeAt = (i) => {
    onChange(value.filter((_, idx) => idx !== i));
  };

  return (
    <div>
      <label className="block text-xs font-semibold text-gray-400 mb-2 uppercase tracking-wider">
        {label}
      </label>
      {hint && <p className="text-xs text-gray-500 mb-2">{hint}</p>}
      <div className="flex flex-wrap gap-2 min-h-[42px] p-2 rounded-lg bg-gray-900 border border-gray-600 mb-2">
        {value.map((tag, i) => (
          <span
            key={`${tag}-${i}`}
            className="inline-flex items-center gap-1 pl-2 pr-1 py-1 rounded-full bg-blue-500/20 text-blue-300 text-xs font-medium"
          >
            {tag}
            <button
              type="button"
              onClick={() => removeAt(i)}
              className="p-0.5 rounded-full hover:bg-gray-700 text-gray-300"
              aria-label="Remove"
            >
              <X size={14} />
            </button>
          </span>
        ))}
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === ",") {
              e.preventDefault();
              pushTags(input);
              setInput("");
            }
          }}
          onBlur={() => {
            if (input.trim()) {
              pushTags(input);
              setInput("");
            }
          }}
          placeholder={placeholder}
          className="flex-1 min-w-[120px] bg-transparent border-0 text-white text-sm placeholder-gray-500 focus:ring-0 outline-none"
        />
      </div>
      <p className="text-xs text-gray-500">
        {value.length} {countLabel} added
      </p>
    </div>
  );
}

const emptyForm = {
  name: "",
  slug: "",
  keywords: [],
  suggestedKeywords: [],
  isActive: true,
};

export default function AdminAtsDomains() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState(null);
  const [panelOpen, setPanelOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [slugTouched, setSlugTouched] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [deleteId, setDeleteId] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    setErr(null);
    try {
      const { data } = await axiosInstance.get(API_PATHS.ADMIN.ATS_DOMAINS);
      setRows(data.data || []);
    } catch (e) {
      setErr(e.response?.data?.message || "Failed to load profiles");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    if (!panelOpen || editingId || slugTouched) return;
    setForm((f) => ({ ...f, slug: slugify(f.name) }));
  }, [form.name, panelOpen, editingId, slugTouched]);

  const openCreate = () => {
    setEditingId(null);
    setSlugTouched(false);
    setForm(emptyForm);
    setPanelOpen(true);
  };

  const openEdit = (row) => {
    setEditingId(row._id);
    setSlugTouched(true);
    setForm({
      name: row.name || "",
      slug: row.slug || "",
      keywords: [...(row.keywords || [])],
      suggestedKeywords: [...(row.suggestedKeywords || [])],
      isActive: row.isActive !== false,
    });
    setPanelOpen(true);
  };

  const save = async () => {
    if (!form.name.trim()) {
      toast.error("Name is required");
      return;
    }
    if (!form.keywords.length) {
      toast.error("Add at least one keyword");
      return;
    }
    try {
      const body = {
        name: form.name.trim(),
        slug: form.slug.trim() || slugify(form.name),
        keywords: form.keywords,
        suggestedKeywords: form.suggestedKeywords,
        isActive: form.isActive,
      };
      if (editingId) {
        await axiosInstance.put(API_PATHS.ADMIN.ATS_DOMAIN(editingId), body);
        toast.success("Profile updated");
      } else {
        await axiosInstance.post(API_PATHS.ADMIN.ATS_DOMAINS, body);
        toast.success("Profile created");
      }
      setPanelOpen(false);
      load();
    } catch (e) {
      toast.error(e.response?.data?.message || "Save failed");
    }
  };

  const confirmDelete = async () => {
    if (!deleteId) return;
    try {
      await axiosInstance.delete(API_PATHS.ADMIN.ATS_DOMAIN(deleteId));
      toast.success("Deleted");
      setDeleteId(null);
      load();
    } catch (e) {
      toast.error(e.response?.data?.message || "Delete failed");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-2xl font-bold text-white mb-0">ATS Domain Profiles</h1>
        <button
          type="button"
          onClick={openCreate}
          className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg px-4 py-2 font-medium transition-colors"
        >
          <Plus size={18} />
          Add Domain Profile
        </button>
      </div>

      {err && (
        <div className="rounded-xl border border-red-500/40 bg-red-500/10 p-4 flex justify-between items-center">
          <p className="text-sm text-red-300">{err}</p>
          <button type="button" className="text-sm text-red-400 underline" onClick={load}>
            Retry
          </button>
        </div>
      )}

      <div className="rounded-xl border border-gray-700 bg-gray-800 shadow-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left min-w-[900px]">
            <thead className="bg-gray-700/50 text-gray-400 text-xs uppercase tracking-wider">
              <tr>
                <th className="px-4 py-3">Name</th>
                <th className="px-4 py-3">Slug</th>
                <th className="px-4 py-3">Keywords</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Created By</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-4 py-16">
                    <div className="space-y-2 animate-pulse">
                      {[1, 2, 3, 4].map((i) => (
                        <div key={i} className="h-10 bg-gray-700/50 rounded" />
                      ))}
                    </div>
                  </td>
                </tr>
              ) : rows.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-16 text-center text-gray-400">
                    No domain profiles yet. Create your first one.
                  </td>
                </tr>
              ) : (
                rows.map((row) => {
                  const creator = row.createdBy;
                  return (
                    <tr
                      key={row._id}
                      className="border-b border-gray-700/50 hover:bg-gray-700/30 text-white"
                    >
                      <td className="px-4 py-3 font-medium">{row.name}</td>
                      <td className="px-4 py-3 text-gray-400 font-mono text-xs">{row.slug}</td>
                      <td className="px-4 py-3 text-gray-300 tabular-nums">
                        {(row.keywords || []).length}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={
                            row.isActive !== false
                              ? "bg-green-500/20 text-green-400 rounded-full px-2 py-0.5 text-xs"
                              : "bg-red-500/20 text-red-400 rounded-full px-2 py-0.5 text-xs"
                          }
                        >
                          {row.isActive !== false ? "Active" : "Inactive"}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-gray-400 text-xs">
                        {creator?.name || creator?.email || "—"}
                      </td>
                      <td className="px-4 py-3 text-right space-x-1">
                        <button
                          type="button"
                          className="inline-flex p-2 rounded-lg hover:bg-gray-700 text-gray-300"
                          onClick={() => openEdit(row)}
                          aria-label="Edit"
                        >
                          <Pencil size={18} />
                        </button>
                        <button
                          type="button"
                          className="inline-flex p-2 rounded-lg hover:bg-red-500/20 text-red-400"
                          onClick={() => setDeleteId(row._id)}
                          aria-label="Delete"
                        >
                          <Trash2 size={18} />
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {panelOpen && (
        <>
          <button
            type="button"
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
            aria-label="Close"
            onClick={() => setPanelOpen(false)}
          />
          <div className="fixed inset-y-0 right-0 z-50 w-full max-w-md bg-gray-800 border-l border-gray-700 shadow-2xl flex flex-col">
            <div className="flex items-center justify-between p-4 border-b border-gray-700">
              <h2 className="text-lg font-bold text-white">
                {editingId ? "Edit profile" : "New profile"}
              </h2>
              <button
                type="button"
                className="p-2 rounded-lg hover:bg-gray-700 text-gray-400"
                onClick={() => setPanelOpen(false)}
                aria-label="Close"
              >
                <X size={22} />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-6 space-y-5">
              <div>
                <label className="block text-xs font-semibold text-gray-400 mb-2 uppercase tracking-wider">
                  Domain name
                </label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                  className="w-full bg-gray-900 border border-gray-600 rounded-lg text-white placeholder-gray-500 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 px-3 py-2"
                  placeholder="e.g. Healthcare IT"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-400 mb-2 uppercase tracking-wider">
                  Slug
                </label>
                <input
                  type="text"
                  value={form.slug}
                  onChange={(e) => {
                    setSlugTouched(true);
                    setForm((f) => ({ ...f, slug: e.target.value }));
                  }}
                  className="w-full bg-gray-900 border border-gray-600 rounded-lg text-white font-mono text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 px-3 py-2"
                  placeholder="healthcare_it"
                />
              </div>
              <TagInput
                label="Keywords"
                value={form.keywords}
                onChange={(keywords) => setForm((f) => ({ ...f, keywords }))}
                placeholder="Type keyword, Enter or comma"
              />
              <TagInput
                label="Keyword suggestions (hints for admin)"
                hint="Optional — shown as hints in admin only."
                countLabel="suggestions"
                value={form.suggestedKeywords}
                onChange={(suggestedKeywords) =>
                  setForm((f) => ({ ...f, suggestedKeywords }))
                }
                placeholder="Optional hints"
              />
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.isActive}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, isActive: e.target.checked }))
                  }
                  className="rounded border-gray-600 text-blue-600 focus:ring-blue-500"
                />
                <span className="text-sm text-white">Active</span>
              </label>
            </div>
            <div className="p-4 border-t border-gray-700 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setPanelOpen(false)}
                className="px-4 py-2 rounded-lg border border-gray-600 hover:bg-gray-700 text-gray-300 font-medium"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={save}
                className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-medium"
              >
                Save
              </button>
            </div>
          </div>
        </>
      )}

      {deleteId && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-gray-800 border border-gray-700 rounded-2xl shadow-2xl p-6 max-w-md w-full">
            <p className="text-white font-medium mb-4">
              Delete this domain profile? This cannot be undone.
            </p>
            <div className="flex justify-end gap-2">
              <button
                type="button"
                className="px-4 py-2 rounded-lg border border-gray-600 hover:bg-gray-700 text-gray-300"
                onClick={() => setDeleteId(null)}
              >
                Cancel
              </button>
              <button
                type="button"
                className="px-4 py-2 rounded-lg bg-red-600 hover:bg-red-700 text-white font-medium"
                onClick={confirmDelete}
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
