import { useState, useRef, useEffect } from 'react';
import { X } from 'lucide-react';
import { supabase, StickyNote as StickyNoteType } from '../lib/supabase';

interface StickyNoteProps {
  note: StickyNoteType;
  onDelete: (id: string) => void;
}

export default function StickyNote({ note, onDelete, onExpand }: StickyNoteProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [position, setPosition] = useState({ x: note.position_x, y: note.position_y });
  const [rotation] = useState(Math.random() * 6 - 3);
  const dragRef = useRef<{ startX: number; startY: number; noteX: number; noteY: number; finalX: number; finalY: number } | null>(null);
  
  // Refs for Long Press Logic
  const longPressTimer = useRef<NodeJS.Timeout | null>(null);
  const isLongPressMode = useRef(false);
  const startPos = useRef({ x: 0, y: 0 });

  const handleMouseDown = (e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest('button')) return;

    // Desktop: Immediate drag setup, but check movement threshold before setting isDragging
    startPos.current = { x: e.clientX, y: e.clientY };
    isLongPressMode.current = false; // Reuse this flag or use a new one. Let's stick to simple desktop logic for now.
    
    // For desktop, we can keep the immediate drag or add a small threshold. 
    // Let's keep it simple: Click = Expand (if no move), Drag = Move.
    // To distinguish, we need to know if it moved.
    
    dragRef.current = {
      startX: e.clientX,
      startY: e.clientY,
      noteX: position.x,
      noteY: position.y,
      finalX: position.x,
      finalY: position.y,
    };
    
    // Add temporary listeners to detect move vs click
    const handleMouseMoveTemp = (moveEvent: MouseEvent) => {
      const dx = moveEvent.clientX - e.clientX;
      const dy = moveEvent.clientY - e.clientY;
      if (dx*dx + dy*dy > 9) { // 3px threshold
        setIsDragging(true);
        document.removeEventListener('mousemove', handleMouseMoveTemp);
        document.removeEventListener('mouseup', handleMouseUpTemp);
      }
    };
    
    const handleMouseUpTemp = () => {
      document.removeEventListener('mousemove', handleMouseMoveTemp);
      document.removeEventListener('mouseup', handleMouseUpTemp);
      onExpand(); // It was a click
    };
    
    document.addEventListener('mousemove', handleMouseMoveTemp);
    document.addEventListener('mouseup', handleMouseUpTemp);
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    if ((e.target as HTMLElement).closest('button')) return;
    
    const touch = e.touches[0];
    startPos.current = { x: touch.clientX, y: touch.clientY };
    isLongPressMode.current = false;
    
    dragRef.current = {
      startX: touch.clientX,
      startY: touch.clientY,
      noteX: position.x,
      noteY: position.y,
      finalX: position.x,
      finalY: position.y,
    };

    // Start Long Press Timer (500ms)
    longPressTimer.current = setTimeout(() => {
      isLongPressMode.current = true;
      setIsDragging(true);
      if (navigator.vibrate) navigator.vibrate(50); // Haptic feedback
    }, 500);
  };

  const handleTouchMoveLocal = (e: React.TouchEvent) => {
    if (isLongPressMode.current) {
      // If dragging is active, prevent scrolling
      // Note: This might not be enough if the event is passive, 
      // but we handle the actual move in the useEffect non-passive listener.
      // This handler is mainly to cancel the timer if we move BEFORE the timer triggers.
    } else {
      const touch = e.touches[0];
      const dx = touch.clientX - startPos.current.x;
      const dy = touch.clientY - startPos.current.y;
      
      // If moved more than 10px before timer fires, cancel timer (it's a scroll)
      if (dx*dx + dy*dy > 100) {
        if (longPressTimer.current) {
          clearTimeout(longPressTimer.current);
          longPressTimer.current = null;
        }
      }
    }
  };

  const handleTouchEndLocal = (e: React.TouchEvent) => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }

    if (!isLongPressMode.current && !isDragging) {
      // If we are here, it wasn't a long press (drag), so it's a tap.
      // But we must check if we cancelled the timer due to movement.
      // If longPressTimer was nullified in move, we shouldn't click.
      // Actually, if we clear it here, it means it was still running -> so no significant move -> Tap!
      onExpand();
    }
    // If isDragging is true, the global 'touchend' in useEffect will handle the cleanup.
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

    const handleTouchMove = (e: TouchEvent) => {
      if (!isDragging || !dragRef.current) return;
      e.preventDefault(); // Prevent scrolling while dragging

      const touch = e.touches[0];
      const deltaX = touch.clientX - dragRef.current.startX;
      const deltaY = touch.clientY - dragRef.current.startY;

      const newX = dragRef.current.noteX + deltaX;
      const newY = dragRef.current.noteY + deltaY;

      dragRef.current.finalX = newX;
      dragRef.current.finalY = newY;

      setPosition({
        x: newX,
        y: newY,
      });
    };

    const handleDragEnd = async () => {
      if (!isDragging || !dragRef.current) return;

      setIsDragging(false);
      isLongPressMode.current = false;

      await supabase
        .from('sticky_notes')
        .update({ position_x: dragRef.current.finalX, position_y: dragRef.current.finalY })
        .eq('id', note.id);
    };

    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleDragEnd);
      document.addEventListener('touchmove', handleTouchMove, { passive: false });
      document.addEventListener('touchend', handleDragEnd);
      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleDragEnd);
        document.removeEventListener('touchmove', handleTouchMove);
        document.removeEventListener('touchend', handleDragEnd);
      };
    }
  }, [isDragging]);

  const handleDelete = async () => {
    await supabase.from('sticky_notes').delete().eq('id', note.id);
    onDelete(note.id);
  };

  return (
    <div
      className={`fixed w-32 h-32 md:w-36 md:h-36 p-3 shadow-xl rounded-lg cursor-move select-none transition-all origin-center touch-none ${
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
      onTouchStart={handleTouchStart}
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
          <div 
            onClick={(e) => {
              e.stopPropagation();
              onExpand();
            }}
            className="mt-auto pt-2 border-t border-gray-400/40 text-xs text-gray-600 italic font-poppins truncate cursor-pointer hover:text-gray-900 hover:underline"
          >
            - {note.author_name}
          </div>
        )}
      </div>
    </div>
  );
}
