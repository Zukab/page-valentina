import { useState, useRef, useEffect } from 'react';
import { X } from 'lucide-react';
import { supabase, StickyNote as StickyNoteType } from '../lib/supabase';

interface StickyNoteProps {
  note: StickyNoteType;
  onDelete: (id: string) => void;
}

export default function StickyNote({ note, onDelete }: StickyNoteProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [position, setPosition] = useState({ x: note.position_x, y: note.position_y });
  const [rotation] = useState(Math.random() * 6 - 3);
  const dragRef = useRef<{ startX: number; startY: number; noteX: number; noteY: number; finalX: number; finalY: number } | null>(null);

  const handleMouseDown = (e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest('button')) return;

    setIsDragging(true);
    dragRef.current = {
      startX: e.clientX,
      startY: e.clientY,
      noteX: position.x,
      noteY: position.y,
      finalX: position.x,
      finalY: position.y,
    };
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging || !dragRef.current) return;

      const deltaX = e.clientX - dragRef.current.startX;
      const deltaY = e.clientY - dragRef.current.startY;

      const newX = dragRef.current.noteX + deltaX;
      const newY = dragRef.current.noteY + deltaY;

      dragRef.current.finalX = newX;
      dragRef.current.finalY = newY;

      setPosition({
        x: newX,
        y: newY,
      });
    };

    const handleMouseUp = async () => {
      if (!isDragging || !dragRef.current) return;

      setIsDragging(false);

      await supabase
        .from('sticky_notes')
        .update({ position_x: dragRef.current.finalX, position_y: dragRef.current.finalY })
        .eq('id', note.id);
    };

    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isDragging]);

  const handleDelete = async () => {
    await supabase.from('sticky_notes').delete().eq('id', note.id);
    onDelete(note.id);
  };

  return (
    <div
      className={`fixed w-36 h-36 p-3 shadow-xl rounded-lg cursor-move select-none transition-all origin-center ${
        isDragging ? 'scale-110 shadow-2xl' : 'hover:scale-105 hover:shadow-2xl'
      }`}
      style={{
        left: `${position.x}px`,
        top: `${position.y}px`,
        backgroundColor: note.color,
        transform: `rotate(${rotation}deg) ${isDragging ? 'scale(1.1)' : 'scale(1)'}`,
        zIndex: isDragging ? 30 : 20,
      }}
      onMouseDown={handleMouseDown}
    >
      <div className="w-full h-full flex flex-col overflow-hidden">
        <button
          onClick={handleDelete}
          className="absolute -top-2 -right-2 bg-red-400 text-white rounded-full p-0.5 hover:bg-red-600 transition-all opacity-70 hover:opacity-100 z-10 hover:scale-125"
        >
          <X size={12} />
        </button>

        <div className="flex-1 font-handwriting text-gray-800 break-words overflow-hidden text-xs leading-relaxed">
          {note.content}
        </div>

        {note.author_name && (
          <div className="mt-auto pt-2 border-t border-gray-400/40 text-xs text-gray-600 italic font-poppins truncate">
            - {note.author_name}
          </div>
        )}
      </div>
    </div>
  );
}
