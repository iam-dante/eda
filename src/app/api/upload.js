import { v4 as uuidv4 } from "uuid";
import { PDFDocument } from "pdf-lib";
import chromadb from "chromadb";
import { Groq } from "groq";
import multer from "multer";
import { NextApiRequest, NextApiResponse } from "next";

// Environment variables
const CHROMADB_API_TOKEN = process.env.CHROMA_API_KEY;
const GROQ_API_KEY = process.env.GROQ_API_KEY;

// Multer configuration for memory storage
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
  fileFilter: (req, file, cb) => {
    const ALLOWED_EXTENSIONS = new Set(["txt", "pdf"]);
    const ext = file.originalname.split(".").pop().toLowerCase();
    if (!ALLOWED_EXTENSIONS.has(ext)) {
      return cb(new Error("Invalid file type"));
    }
    cb(null, true);
  },
});

// ChromaDB client
const chromaClient = new chromadb.HttpClient({
  ssl: true,
  host: "api.trychroma.com",
  tenant: "c74d6ead-7a1a-4e7d-afbb-3dd8d548c5ed",
  database: "rag-0a14d70f",
  headers: { "x-chroma-token": CHROMADB_API_TOKEN },
});

let currentCollectionId = null;
let currentCollectionName = null;

// Utility functions
async function extractTextFromPDF(buffer) {
  const pdfDoc = await PDFDocument.load(buffer);
  const pages = pdfDoc.getPages();
  return pages
    .map((page) =>
      page
        .getTextContent()
        .items.map((item) => item.str)
        .join(" ")
    )
    .join("\n");
}

function cleanText(text) {
  return text.replace(/\s+/g, " ").trim();
}

async function splitTextIntoSentences(text) {
  return text
    .split(/[.!?]+/)
    .filter((s) => s.trim())
    .map((s) => s.replace(/\n/g, " ").trim());
}

async function createResourcesFromBytes(buffer) {
  try {
    const text = await extractTextFromPDF(buffer);
    if (!text.trim()) return [];
    const cleanedText = cleanText(text);
    return await splitTextIntoSentences(cleanedText);
  } catch (error) {
    console.error("Error in createResourcesFromBytes:", error);
    return [];
  }
}

async function getOrCreateCollection() {
  if (!currentCollectionId) {
    currentCollectionId = uuidv4();
    currentCollectionName = `documents_${currentCollectionId}`;
    const collection = await chromaClient.createCollection({
      name: currentCollectionName,
    });
    return [collection, currentCollectionName];
  }
  try {
    const collection = await chromaClient.getCollection({
      name: currentCollectionName,
    });
    return [collection, currentCollectionName];
  } catch (error) {
    currentCollectionId = uuidv4();
    currentCollectionName = `documents_${currentCollectionId}`;
    const collection = await chromaClient.createCollection({
      name: currentCollectionName,
    });
    return [collection, currentCollectionName];
  }
}

async function saveToChromaDB(file) {
  try {
    if (!file) return [{ error: "No file selected" }, 400];

    currentCollectionId = uuidv4();
    currentCollectionName = `documents_${currentCollectionId}`;
    const collection = await chromaClient.createCollection({
      name: currentCollectionName,
    });

    const resources = await createResourcesFromBytes(file.buffer);
    if (!resources.length)
      return [{ error: "No valid text content could be extracted" }, 400];

    await collection.add({
      documents: resources,
      ids: resources.map(() => uuidv4()),
    });

    return [
      {
        message: "File processed and uploaded successfully",
        documents_processed: resources.length,
        collection_id: currentCollectionId,
        filename: file.originalname,
      },
      200,
    ];
  } catch (error) {
    console.error("Error in saveToChromaDB:", error);
    return [{ error: error.message }, 500];
  }
}

// Middleware to handle multer in Next.js
const runMiddleware = (req, res, fn) => {
  return new Promise((resolve, reject) => {
    fn(req, res, (result) => {
      if (result instanceof Error) return reject(result);
      return resolve(result);
    });
  });
};

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    await runMiddleware(req, res, upload.single("file"));
    const [response, status] = await saveToChromaDB(req.file);
    res.status(status).json(response);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

export const config = {
  api: {
    bodyParser: false, // Disable Next.js body parsing to use multer
  },
};
