"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Pencil, Trash2, Plus } from "lucide-react";

type Field = {
  key: string;
  label: string;
  type?: "text" | "email" | "password" | "checkbox";
  required?: boolean;
};

type Row = Record<string, unknown>;

type CrudTableProps = {
  title: string;
  rows: Row[];
  columns: { key: string; label: string; render?: (row: Row) => React.ReactNode }[];
  fields: Field[];
  onCreate: (data: Row) => Promise<void>;
  onUpdate: (id: string, data: Row) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
  loading?: boolean;
};

export function CrudTable({
  title,
  rows,
  columns,
  fields,
  onCreate,
  onUpdate,
  onDelete,
  loading,
}: CrudTableProps) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editRow, setEditRow] = useState<Row | null>(null);
  const [form, setForm] = useState<Record<string, string | boolean>>({});
  const [saving, setSaving] = useState(false);

  function openCreate() {
    setEditRow(null);
    setForm({});
    setDialogOpen(true);
  }

  function openEdit(row: Row) {
    setEditRow(row);
    const f: Record<string, string | boolean> = {};
    fields.forEach((field) => {
      f[field.key] = (row[field.key] as string | boolean) ?? "";
    });
    setForm(f);
    setDialogOpen(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      if (editRow) {
        await onUpdate(editRow.id as string, form);
      } else {
        await onCreate(form);
      }
      setDialogOpen(false);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-gray-900">{title}</h2>
        <Button onClick={openCreate} size="sm">
          <Plus className="h-4 w-4 mr-1" />
          Ekle
        </Button>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-gray-400 text-sm">Yükleniyor...</div>
        ) : rows.length === 0 ? (
          <div className="p-8 text-center text-gray-400 text-sm">Kayıt bulunamadı</div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                {columns.map((col) => (
                  <th key={col.key} className="text-left px-4 py-3 text-gray-500 font-medium">
                    {col.label}
                  </th>
                ))}
                <th className="px-4 py-3 text-right text-gray-500 font-medium">İşlem</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {rows.map((row) => (
                <tr key={row.id as string} className="hover:bg-gray-50">
                  {columns.map((col) => (
                    <td key={col.key} className="px-4 py-3 text-gray-700">
                      {col.render ? col.render(row) : String(row[col.key] ?? "")}
                    </td>
                  ))}
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => openEdit(row)}
                        className="p-1 rounded hover:bg-gray-100 text-gray-400 hover:text-gray-700 transition-colors"
                      >
                        <Pencil className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => onDelete(row.id as string)}
                        className="p-1 rounded hover:bg-red-50 text-gray-400 hover:text-red-600 transition-colors"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editRow ? "Düzenle" : "Yeni Ekle"}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            {fields.map((field) => (
              <div key={field.key} className="space-y-1.5">
                {field.type === "checkbox" ? (
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={Boolean(form[field.key])}
                      onChange={(e) => setForm({ ...form, [field.key]: e.target.checked })}
                      className="w-4 h-4 accent-orange-500"
                    />
                    <span className="text-sm font-medium">{field.label}</span>
                  </label>
                ) : (
                  <>
                    <Label htmlFor={field.key}>{field.label}</Label>
                    <Input
                      id={field.key}
                      type={field.type ?? "text"}
                      value={String(form[field.key] ?? "")}
                      onChange={(e) => setForm({ ...form, [field.key]: e.target.value })}
                      required={field.required}
                    />
                  </>
                )}
              </div>
            ))}
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                İptal
              </Button>
              <Button type="submit" disabled={saving}>
                {saving ? "Kaydediliyor..." : "Kaydet"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
