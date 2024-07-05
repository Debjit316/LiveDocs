import { React, useEffect, useCallback, useState } from "react";
import Quill from "quill";
import "quill/dist/quill.snow.css";
import { io } from "socket.io-client";
import { useParams } from "react-router-dom";

const toolbar_options = [
  [{ header: [1, 2, 3, 4, 5, 6, false] }],
  [{ font: [] }],
  [{ list: "ordered" }, { list: "bullet" }, { list: "check" }],
  [{}],
  ["bold", "italic", "underline"],
  [{ color: [] }, { background: [] }],
  [{ script: "sub" }, { script: "super" }],
  [{ align: [] }],
  ["image", "link", "blockquote", "code-block"],
  ["clean", "video", "strike"],
];

export default function TextEditor() {
  const [socket, setSocket] = useState();
  const [quill, setQuill] = useState();
  const { id: documentId } = useParams();
  //   console.log(documentId);

  useEffect(() => {
    const s = io(import.meta.env.VITE_URL);
    setSocket(s);

    return () => {
      s.disconnect();
    };
  }, []);

  useEffect(() => {
    if (socket == null || quill == null) return;

    //* load the document back to the client from the server.
    socket.once("load-document", (document) => {
      quill.setContents(document);
      quill.enable();
    });

    //* get document from the server via the document id
    socket.emit("get-document", documentId);
  }, [socket, quill, documentId]);

  useEffect(() => {
    if (socket == null || quill == null) return;

    //* Save the documents with the current quill content every 1000ms
    const interval = setInterval(() => {
      socket.emit("save-document", quill.getContents());
    }, 1000);

    return () => {
      clearInterval(interval);
    };
  }, [socket, quill]);

  useEffect(() => {
    if (socket == null || quill == null) return;
    //? delta: it is not the whole document, it is a small component or a subset of the entire document that is changing

    const handler = (delta) => {
      //* update the contents of quill according to changes
      quill.updateContents(delta);
    };

    //* changes passed from our other client
    socket.on("receive-changes", handler);

    return () => {
      quill.off("receive-changes", handler);
    };
  }, [socket, quill]);

  //* detecting changes whenever Quill changes
  useEffect(() => {
    if (socket == null || quill == null) return;

    const handler = (delta, oldDelta, source) => {
      //* because we only want to track the changes that the user makes
      if (source !== "user") return;

      //* whenever quill got changes we are sending the changes to the server
      socket.emit("send-changes", delta);
    };

    quill.on("text-change", handler);

    return () => {
      quill.off("text-change", handler);
    };
  }, [socket, quill]);

  //* Only render the component once during mounting the element for the first time.
  const wrapperRef = useCallback((wrapper) => {
    if (wrapper == null) return;

    wrapper.innerHTML = "";
    const editor = document.createElement("div");
    wrapper.append(editor);
    const q = new Quill(editor, {
      theme: "snow",
      modules: { toolbar: toolbar_options },
    });
    //* Disable the editor untill the document is loaded from the browser
    q.disable();
    q.setText("Loading...");
    setQuill(q);
  }, []);

  return <div className="container" ref={wrapperRef}></div>;
}
