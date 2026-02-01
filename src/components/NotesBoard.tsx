import { useEffect, useState } from 'react';
import { Plus, X } from 'lucide-react';
import { supabase, StickyNote as StickyNoteType } from '../lib/supabase';
import StickyNote from './StickyNote';

const NOTE_COLORS = ['#fef3c7', '#fecaca', '#ddd6fe', '#bbf7d0', '#fde68a', '#fbcfe8'];

export default function NotesBoard() {
  const [notes, setNotes] = useState<StickyNoteType[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [expandedNote, setExpandedNote] = useState<StickyNoteType | null>(null);
  const [newNote, setNewNote] = useState({ content: '', author_name: '' });
  const [selectedColor, setSelectedColor] = useState(NOTE_COLORS[0]);

  useEffect(() => {
    fetchNotes();

    const channel = supabase
      .channel('sticky_notes_changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'sticky_notes' }, () => {
        fetchNotes();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const fetchNotes = async () => {
    const { data } = await supabase
      .from('sticky_notes')
      .select('*')
      .order('created_at', { ascending: true });

    if (data) {
      setNotes(data);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!newNote.content.trim()) return;

    const randomX = Math.random() * Math.max(0, window.innerWidth - 200);
    const randomY = Math.random() * Math.max(0, window.innerHeight - 250) + 100;

    try {
      const { data, error } = await supabase.from('sticky_notes').insert({
        content: newNote.content,
        author_name: newNote.author_name,
        color: selectedColor,
        position_x: Math.floor(randomX),
        position_y: Math.floor(randomY),
      }).select();

      if (error) {
        console.error('Error al agregar nota:', error);
      } else {
        setNewNote({ content: '', author_name: '' });
        setShowForm(false);
        await fetchNotes();
      }
    } catch (err) {
      console.error('Error:', err);
    }
  };

  const handleDelete = (id: string) => {
    setNotes(notes.filter((note) => note.id !== id));
  };

  return (
    <>
      {notes.map((note) => (
        <StickyNote key={note.id} note={note} onDelete={handleDelete} />
      ))}

      <button
        onClick={() => setShowForm(!showForm)}
        className="fixed bottom-8 right-8 bg-rose-500 hover:bg-rose-600 text-white rounded-full p-4 shadow-2xl transition-all z-50 hover:scale-110 pointer-events-auto"
        title="Agregar nota"
      >
        <Plus size={28} />
      </button>

      {showForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 pointer-events-auto">
          <div className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-md">
            <h2 className="text-2xl font-bold text-gray-800 mb-4">Nueva Nota</h2>

            <form onSubmit={handleSubmit}>
              <textarea
                value={newNote.content}
                onChange={(e) => setNewNote({ ...newNote, content: e.target.value })}
                placeholder="Escribe tu mensaje aquí..."
                className="w-full p-3 border-2 border-gray-300 rounded-lg mb-4 min-h-[120px] focus:outline-none focus:border-rose-400"
                autoFocus
              />

              <input
                type="text"
                value={newNote.author_name}
                onChange={(e) => setNewNote({ ...newNote, author_name: e.target.value })}
                placeholder="Tu nombre (opcional)"
                className="w-full p-3 border-2 border-gray-300 rounded-lg mb-4 focus:outline-none focus:border-rose-400"
              />

              <div className="mb-4">
                <label className="block text-sm font-semibold text-gray-700 mb-2">Color:</label>
                <div className="flex gap-2">
                  {NOTE_COLORS.map((color) => (
                    <button
                      key={color}
                      type="button"
                      onClick={() => setSelectedColor(color)}
                      className={`w-10 h-10 rounded-full border-4 transition-all ${
                        selectedColor === color ? 'border-gray-800 scale-110' : 'border-gray-300'
                      }`}
                      style={{ backgroundColor: color }}
                    />
                  ))}
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  type="submit"
                  className="flex-1 bg-rose-500 hover:bg-rose-600 text-white font-semibold py-3 rounded-lg transition-colors"
                >
                  Agregar Nota
                </button>
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-800 font-semibold py-3 rounded-lg transition-colors"
                >
                  Cancelar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {expandedNote && (
        <div 
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 pointer-events-auto"
          onClick={() => setExpandedNote(null)}
        >
          <div 
            className="rounded-2xl shadow-2xl p-8 w-full max-w-lg max-h-[90vh] overflow-y-auto transform transition-all scale-100 rotate-1 relative"
            style={{ backgroundColor: expandedNote.color }}
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setExpandedNote(null)}
              className="absolute top-4 right-4 p-2 rounded-full hover:bg-black/10 transition-colors"
            >
              <X size={24} className="text-gray-800" />
            </button>
            <p className="text-gray-800 whitespace-pre-wrap font-medium text-lg leading-relaxed">
              {expandedNote.content}
            </p>
            {expandedNote.author_name && (
              <p className="mt-6 text-right text-gray-600 italic">
                - {expandedNote.author_name}
              </p>
            )}
          </div>
        </div>
      )}
    </>
  );
}
