import dbConnect from "@/lib/mongodb";
import Note from "@/models/Note";

export default async function handler(req, res) {
  if (req.method === "POST") {
    try {
      const noteData = req.body;

      if (!noteData || !noteData.title || !noteData.localId || !noteData.createdAt) {
        return res.status(400).json({ error: "Invalid note data" });
      }

      await dbConnect();

      const newNote = await Note.create({
        title: noteData.title,
        content: noteData.content || "",
        tags: noteData.tags || [],
        localId: noteData.localId,
        createdAt: new Date(noteData.createdAt),
        updatedAt: new Date(),
      });

      res.status(200).json({ insertedId: newNote._id.toString() });
    } catch (error) {
      console.error("Error saving note:", error);
      res.status(500).json({ error: "Failed to save note" });
    }
  } else {
    res.status(405).json({ error: "Method not allowed" });
  }
}
