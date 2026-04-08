"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Pencil, Trash2, Check, X, Plus } from "lucide-react";

type Props = {
  roles: string[];
  onChange: (roles: string[]) => void;
};

export default function RolesStep({ roles, onChange }: Props) {
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [editValue, setEditValue] = useState("");
  const [adding, setAdding] = useState(false);
  const [newValue, setNewValue] = useState("");

  function startEdit(index: number) {
    setEditingIndex(index);
    setEditValue(roles[index]);
  }

  function commitEdit() {
    if (editingIndex === null) return;
    if (editValue.trim()) {
      const next = [...roles];
      next[editingIndex] = editValue.trim();
      onChange(next);
    }
    setEditingIndex(null);
    setEditValue("");
  }

  function cancelEdit() {
    setEditingIndex(null);
    setEditValue("");
  }

  function deleteRole(index: number) {
    onChange(roles.filter((_, i) => i !== index));
  }

  function commitAdd() {
    if (newValue.trim()) {
      onChange([...roles, newValue.trim()]);
    }
    setAdding(false);
    setNewValue("");
  }

  function cancelAdd() {
    setAdding(false);
    setNewValue("");
  }

  return (
    <div className="space-y-3">
      <ul className="space-y-2">
        {roles.map((role, i) => (
          <li
            key={i}
            className="flex items-center gap-2 rounded-lg border bg-card px-3 py-2 group"
          >
            {editingIndex === i ? (
              <>
                <Input
                  value={editValue}
                  onChange={(e) => setEditValue(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") commitEdit();
                    if (e.key === "Escape") cancelEdit();
                  }}
                  className="h-7 flex-1 text-sm"
                  autoFocus
                />
                <button
                  onClick={commitEdit}
                  className="text-green-600 hover:text-green-700"
                  aria-label="Kaydet"
                >
                  <Check size={16} />
                </button>
                <button
                  onClick={cancelEdit}
                  className="text-muted-foreground hover:text-foreground"
                  aria-label="İptal"
                >
                  <X size={16} />
                </button>
              </>
            ) : (
              <>
                <span className="flex-1 text-sm">{role}</span>
                <button
                  onClick={() => startEdit(i)}
                  className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-foreground transition-opacity"
                  aria-label="Düzenle"
                >
                  <Pencil size={14} />
                </button>
                <button
                  onClick={() => deleteRole(i)}
                  className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive transition-opacity"
                  aria-label="Sil"
                >
                  <Trash2 size={14} />
                </button>
              </>
            )}
          </li>
        ))}
      </ul>

      {adding ? (
        <div className="flex items-center gap-2 rounded-lg border border-dashed px-3 py-2">
          <Input
            value={newValue}
            onChange={(e) => setNewValue(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") commitAdd();
              if (e.key === "Escape") cancelAdd();
            }}
            placeholder="Rol adı..."
            className="h-7 flex-1 text-sm"
            autoFocus
          />
          <button onClick={commitAdd} className="text-green-600 hover:text-green-700" aria-label="Ekle">
            <Check size={16} />
          </button>
          <button onClick={cancelAdd} className="text-muted-foreground hover:text-foreground" aria-label="İptal">
            <X size={16} />
          </button>
        </div>
      ) : (
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="w-full border-dashed"
          onClick={() => setAdding(true)}
        >
          <Plus size={14} className="mr-1" /> Yeni Ekle
        </Button>
      )}
    </div>
  );
}
