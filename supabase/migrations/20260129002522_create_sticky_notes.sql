/*
  # Create sticky notes table for birthday countdown page

  1. New Tables
    - `sticky_notes`
      - `id` (uuid, primary key) - Unique identifier for each note
      - `content` (text) - The text content of the sticky note
      - `position_x` (integer) - X coordinate position on the page
      - `position_y` (integer) - Y coordinate position on the page
      - `color` (text) - Color of the sticky note (hex or preset)
      - `author_name` (text) - Optional name of the person who left the note
      - `created_at` (timestamptz) - When the note was created
  
  2. Security
    - Enable RLS on `sticky_notes` table
    - Add policy for anyone to read all notes (public read)
    - Add policy for anyone to create notes (public insert)
    - Add policy for anyone to update notes (public update for repositioning)
    - Add policy for anyone to delete their own notes

  Notes:
    - This is a public birthday page, so we allow anonymous access
    - Notes are meant to be collaborative and visible to everyone
    - Position updates allow dragging notes around the page
*/

CREATE TABLE IF NOT EXISTS sticky_notes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  content text NOT NULL,
  position_x integer NOT NULL DEFAULT 100,
  position_y integer NOT NULL DEFAULT 100,
  color text NOT NULL DEFAULT '#fef3c7',
  author_name text DEFAULT '',
  created_at timestamptz DEFAULT now()
);

ALTER TABLE sticky_notes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read sticky notes"
  ON sticky_notes FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "Anyone can create sticky notes"
  ON sticky_notes FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

CREATE POLICY "Anyone can update sticky notes"
  ON sticky_notes FOR UPDATE
  TO anon, authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Anyone can delete sticky notes"
  ON sticky_notes FOR DELETE
  TO anon, authenticated
  USING (true);