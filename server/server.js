// ? CORS stands for Cross Origin Request Support
//* Used when the server and client are in different url, and ensures communication between them, i.e, make requests from a different url to another url

const mongoose = require("mongoose");
const Document = require("./Document");
require("dotenv").config();

main().catch((err) => console.log(err));

async function main() {
  await mongoose.connect(process.env.URL);
}

//* default value to be passed to create anew document
const defaultValue = "";

// const PORT = 3001;
// const http = require("http");
// const httpServer = http.createServer();
//* The io object will enable us to do our connections
const io = require("socket.io")(3001, {
  cors: {
    origin: "*",
    //* socket io only performs these two requests,i.e, GET and POST
    methods: ["GET", "POST"],
  },
});

io.on("connection", (socket) => {
  socket.on("get-document", async (documentId) => {
    const document = await findOrCreateDocument(documentId);

    //* joining a room to communicate between users in the same room
    socket.join(documentId);

    //* loading our document fetched from the server
    socket.emit("load-document", document.data);

    socket.on("send-changes", (delta) => {
      //* On the current socket, we are going to broadcast the message to everyone except us, that there are some changes to be received("receive-changes") and here are the changes (delta)
      socket.broadcast.to(documentId).emit("receive-changes", delta);

      //* Logs the changes taking place in the document, i.e, the insertion & deletion of characters in the editor
      //^ console.log(delta);
    });

    socket.on("save-document", async (data) => {
      await Document.findByIdAndUpdate(documentId, { data });
    });
  });

  console.log("connected");
});

// httpServer.listen(PORT);

async function findOrCreateDocument(id) {
  if (id == null) return;

  const document = await Document.findById(id);
  if (document) return document;

  //* creating a new Document, in case , no document id found with the id
  return await Document.create({ _id: id, data: defaultValue });
}
