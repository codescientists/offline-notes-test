import dbConnect from "@/lib/mongodb";
import Note from "@/models/Note";

export default async function handler(req, res) {
  if (req.method === 'PUT') {
    try {
      await dbConnect();

      const { id } = req.query; // This needs to be the MongoDB _id
      const { title: noteTitle, tags } = req.body;

      if (!id || typeof noteTitle !== "string") {
        return res.status(400).json({ error: "Missing note ID or title" });
      }

      const updatedNote = await Note.findByIdAndUpdate(
        id,
        { title: noteTitle, tags },
        { new: true }
      );

      if (!updatedNote) {
        return res.status(404).json({ error: "Note not founnd" });
      }

      res.status(200).json({ message: "Note edited successfully", updatedNote });
    } catch (error) {
      console.error("Error editing note:", error);
      res.status(500).json({ error: "Failed to edit note" });
    }
  } else {
    res.status(405).json({ error: "Method not allowed" });
  }
}
