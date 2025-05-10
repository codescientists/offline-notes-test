import dbConnect from "@/lib/mongodb";
import Note from "@/models/Note";

export default async function handler(req, res) {
  if (req.method === 'GET') {
    try {
      await dbConnect();

      // Fetch all notes, sorted by creation date descending
      const notes = await Note.find({}).sort({ createdAt: -1 });

      res.status(200).json(notes);
    } catch (error) {
      console.error('Error fetching notes:', error);
      res.status(500).json({ error: 'Failed to fetch notes' });
    }
  } else {
    res.status(405).json({ error: 'Method not allowed' });
  }
}
