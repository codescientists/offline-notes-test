import mongoose from "mongoose";

const NoteSchema = new mongoose.Schema({
  title: String,
  tags: [String],
  localId: String,
  createdAt: Date,
  updatedAt: Date,
});

export default mongoose.models.Note || mongoose.model("Note", NoteSchema);
