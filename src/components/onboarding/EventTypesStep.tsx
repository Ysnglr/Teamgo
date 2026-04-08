"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { COLOR_PALETTE } from "@/lib/onboarding-templates";
import { Pencil, Trash2, Check, X, Plus } from "lucide-react";

type EventTypeItem = { name: string; color: string };

type Props = {
  eventTypes: EventTypeItem[];
  onChange: (eventTypes: EventTypeItem[]) => void;
};

export default function EventTypesStep({ eventTypes, onChange }: Props) {
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [editName, setEditName] = useState("");
  const [editColor, setEditColor] = useState("");
  const [adding, setAdding] = useState(false);
  const [newName, setNewName] = useState("");
  const [newColor, setNewColor] = useState(COLOR_PALETTE[0]);

  function startEdit(index: number) {
    setEditingIndex(index);
    setEditName(eventTypes[index].name);
    setEditColor(eventTypes[index].color);
  }

  function commitEdit() {
    if (editingIndex === null) return;
    if (editName.trim()) {
      const next = [...eventTypes];
      next[editingIndex] = { name: editName.trim(), color: editColor };
      onChange(next);
    }
    setEditingIndex(null);
  }

  function cancelEdit() {
    setEditingIndex(null);
  }

  function deleteItem(index: number) {
    onChange(eventTypes.filter((_, i) => i !== index));
  }

  function commitAdd() {
    if (newName.trim()) {
      onChange([...eventTypes, { name: newName.trim(), color: newColor }]);
    }
    setAdding(false);
    setNewName("");
    setNewColor(COLOR_PALETTE[0]);
  }

  function cancelAdd() {
    setAdding(false);
    setNewName("");
  }

  return (
    <div className="space-y-3">
      <ul className="space-y-2">
        {eventTypes.map((et, i) => (
          <li key={i} className="flex items-center gap-2 rounded-lg border bg-card px-3 py-2 group">
            {editingIndex === i ? (
              <>
                <div className="flex gap-1 flex-wrap">
                  {COLOR_PALETTE.map((c) => (
                    <button
                      key={c}
                      onClick={() => setEditColor(c)}
                      className="w-5 h-5 rounded-full border-2 transition-transform hover:scale-110"
                      style={{
                        backgroundColor: c,
                        borderColor: editColor === c ? "#000" : "transparent",
                      }}
                      aria-label={c}
                    />
                  ))}
                </div>
                <Input
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") commitEdit();
                    if (e.key === "Escape") cancelEdit();
                  }}
                  className="h-7 flex-1 text-sm"
                  autoFocus
                />
                <button onClick={commitEdit} className="text-green-600 hover:text-green-700" aria-label="Kaydet">
                  <Check size={16} />
                </button>
                <button onClick={cancelEdit} className="text-muted-foreground hover:text-foreground" aria-label="İptal">
                  <X size={16} />
                </button>
              </>
            ) : (
              <>
                <span
                  className="w-3 h-3 rounded-full shrink-0"
                  style={{ backgroundColor: et.color }}
                />
                <span className="flex-1 text-sm">{et.name}</span>
                <button
                  onClick={() => startEdit(i)}
                  className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-foreground transition-opacity"
                  aria-label="Düzenle"
                >
                  <Pencil size={14} />
                </button>
                <button
                  onClick={() => deleteItem(i)}
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
        <div className="space-y-2 rounded-lg border border-dashed p-3">
          <div className="flex gap-1 flex-wrap">
            {COLOR_PALETTE.map((c) => (
              <button
                key={c}
                onClick={() => setNewColor(c)}
                className="w-5 h-5 rounded-full border-2 transition-transform hover:scale-110"
                style={{
                  backgroundColor: c,
                  borderColor: newColor === c ? "#000" : "transparent",
                }}
                aria-label={c}
              />
            ))}
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: newColor }} />
            <Input
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") commitAdd();
                if (e.key === "Escape") cancelAdd();
              }}
              placeholder="Event tipi adı..."
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
