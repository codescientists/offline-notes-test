import dbConnect from "@/lib/mongodb";
import Note from "@/models/Note";

export default async function handler(req, res) {
  if (req.method === "DELETE") {
    try {
      await dbConnect();

      const { id } = req.query;

      if (!id) {
        return res.status(400).json({ error: "Missing note ID" });
      }

      const deletedNote = await Note.findByIdAndDelete(id);

      if (!deletedNote) {
        return res.status(404).json({ error: "Note not found" });
      }

      res.status(200).json({ message: "Note deleted successfully" });
    } catch (error) {
      console.error("Error deleting note:", error);
      res.status(500).json({ error: "Failed to delete note" });
    }
  } else {
    res.status(405).json({ error: "Method not allowed" });
  }
}
