const { Schema, model } = require("mongoose");

//* Document is the schema name that will be containing an id, and data as returned from Quill
const Document = new Schema({
  _id: String,
  data: Object,
});

// * exporting the model by its name("Documents") and the schema(Document as declared above)
module.exports = model("Document", Document);
