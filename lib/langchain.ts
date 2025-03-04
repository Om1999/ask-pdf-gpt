import { ChatOpenAI } from "@langchain/openai";
import { PDFLoader } from "@langchain/community/document_loaders/fs/pdf";
import { RecursiveCharacterTextSplitter } from "langchain/text_splitter";
// import { OpenAIEmbeddings } from "@langchain/openai";
import { ChatCohere, CohereEmbeddings } from "@langchain/cohere";
import { createStuffDocumentsChain } from "langchain/chains/combine_documents";
import { ChatPromptTemplate } from "@langchain/core/prompts";
import { createRetrievalChain } from "langchain/chains/retrieval";
import { createHistoryAwareRetriever } from "langchain/chains/history_aware_retriever";
import { HumanMessage, AIMessage } from "@langchain/core/messages";
import pineconeClient from "./pinecone";
import { PineconeStore } from "@langchain/pinecone";
import { PineconeConflictError } from "@pinecone-database/pinecone/dist/errors";
import { Index, RecordMetadata } from "@pinecone-database/pinecone";
import { adminDb } from "../firebaseAdmin";
import { auth } from "@clerk/nextjs/server";

// Initialize the AI Model with API Key and model name

const model = new ChatCohere({
    model: "command-r-plus",
    temperature: 0.3,
    maxRetries: 3,
  });

export const indexName = "brucewayne";

async function fetchMessagesFromDB(docId: string){
  const { userId } = await auth();
  if(!userId){
    throw new Error("User not found")
  }

  console.log("--- Fetching chat history from the firestore database... ---");
  const LIMIT=10
  // Get the last 10 messages from the chat history

  const chats = await adminDb
    .collection(`users`)
    .doc(userId)
    .collection("files")
    .doc(docId)
    .collection("chat")
    .orderBy("createdAt","desc")
    .limit(LIMIT)
    .get();

  const chatHistory = chats.docs.map((doc) => {
    return doc.data().role === "human"
      ? new HumanMessage(doc.data().message)
      : new AIMessage(doc.data().message)
  })

  console.log(`--- fetched last ${chatHistory.length} messages successfully ---`);

  console.log(chatHistory.map((msg) => msg.content.toString()));

  return chatHistory
}

export async function generateDocs(docId: string){
    const { userId } = await auth();

    if (!userId){
        throw new Error ("Uer not found")
    }

    console.log("--- Fetching the download URL from Firebase... ---");
    const firebaseRef = await adminDb
        .collection("users")
        .doc(userId)
        .collection("files")
        .doc(docId)
        .get();

    const downloadUrl = firebaseRef.data()?.downloadUrl;

    if(!downloadUrl){
        throw new Error("Download URL not found")
    }

    console.log(`--- Download URL fetched successfully: ${downloadUrl} --- `)

    // Fetch the PDF from the specified URL
    const response = await fetch(downloadUrl);

    // Load the PDF into a PDF Document object
    const data = await response.blob()

    // Load the PDF document from the specified path
    console.log("--- Loading PDF Document... ---")
    const loader = new PDFLoader(data);
    const docs = await loader.load();

    // Split the loaded document into smaller parts for easier processing
    console.log("--- Splitting the document into smaller parts... ---");
    const splitter = new RecursiveCharacterTextSplitter();

    const splitDocs = await splitter.splitDocuments(docs);
    console.log(`--- Split into ${splitDocs.length} parts ---`);

    return splitDocs;

}

async function namespaceExists(
    index: Index<RecordMetadata>,
    namespace: string
  ) {
    if (namespace === null) throw new Error("No namespace value provided.");
    const { namespaces } = await index.describeIndexStats();
    return namespaces?.[namespace] !== undefined;
  }

export async function generateEmbeddingsInPineconeVectorStore(docId: string){
    const { userId } = await auth();

    if (!userId){
        throw new Error ("user not found");
    }

    let pineconeVectorStore;

    // Generate embeddings (numerical representations) for the split documents
    console.log("--- Generating embeddings... ---");
    const embeddings = new CohereEmbeddings({
        apiKey: process.env.COHERE_API_KEY, // In Node.js defaults to process.env.COHERE_API_KEY
        model: "embed-english-v3.0",
      });

    const embedding = await embeddings.embedQuery("Sample text");
    console.log(embedding.length); 


    const index = await pineconeClient.index(indexName);
    const namespaceAlreadyExists = await namespaceExists(index, docId);

    if (namespaceAlreadyExists) {
        console.log(
          `--- Namespace ${docId} already exists, reusing existing embeddings... ---`
        );
    
        pineconeVectorStore = await PineconeStore.fromExistingIndex(embeddings, {
          pineconeIndex: index,
          namespace: docId,
        });
    
        return pineconeVectorStore;
      } else {
        // If the namespace does not exist, download the PDF from firestore via the stored Download URL & generate the embeddings and store them in the Pinecone vector store
        const splitDocs = await generateDocs(docId);
    
        console.log(
          `--- Storing the embeddings in namespace ${docId} in the ${indexName} Pinecone vector store... ---`
        );
    
        pineconeVectorStore = await PineconeStore.fromDocuments(
          splitDocs,
          embeddings,
          {
            pineconeIndex: index,
            namespace: docId,
          }
        );
        console.log("Embeddings Generated ")
        return pineconeVectorStore;
      }
    
}

const generateLangchainCompletion = async (docId: string, question: string) => {
  let pineconeVectorStore;

  pineconeVectorStore = await generateEmbeddingsInPineconeVectorStore(docId)
  

  if(!pineconeVectorStore){
    throw new Error("PineCone Vector store not found");
  }

  // Create a retriever to search through vector store
  console.log("--- Creating a retriver... ---")
  const retriever = pineconeVectorStore.asRetriever();

  // Fetch the chat history from the database
  const chatHistory = await fetchMessagesFromDB(docId);

  // Define a prompt template for generating search queries based on conversation history
  console.log("--- Defining a prompt template... ---");
  const historyAwarePrompt = ChatPromptTemplate.fromMessages([
    ...chatHistory,// Insert the actual chat history here
    ["user","{input}"],
    [
      "user",
      "Given the above conversation, generate a search query to look up in order to get information relevant to the conversation",
    ],

  ])

  // Create a history-aware retriever chain that uses the model, retriever, and prompt
  console.log("--- Creating a history-aware retriever chain... ---");

  const historyAwareRetrieverChain = await createHistoryAwareRetriever({
    llm: model,
    retriever,
    rephrasePrompt: historyAwarePrompt
  })

  // Define a prompt template for answering questions based on reterieved context
  console.log("--- Defining a prompt template for answering questiong... ---");
  const historyAwareRetrieverPrompt = ChatPromptTemplate.fromMessages([
    [
      "system",
      "Answer the user's questions based on the below context:\n\n{context}"
    ],

    ...chatHistory,// Insert the actual chat history here

    ["user", "{input}"],
  ])

  // Create a chain to combine the retrieved documents into a coherent response
  console.log("--- Creating a document combining chain ... ---");
  const historyAwareCombineDocsChain = await createStuffDocumentsChain({
    llm: model,
    prompt: historyAwareRetrieverPrompt
  });

  // Create the main retrieval chain the combines the history-aware and document combining chains
  console.log("--- Creating the main retrieval chain ... ---");

  const conversationalRetrievalChain = await createRetrievalChain({
    retriever: historyAwareRetrieverChain,
    combineDocsChain: historyAwareCombineDocsChain,
  });

  console.log("--- Running the chain with a sample conversation... ---")
  const reply = await conversationalRetrievalChain.invoke({
    chat_history: chatHistory,
    input: question,
  })

  // Print the result to the console
  console.log(reply.answer)
  return reply.answer
}

// Export the model and the run function
export { model, generateLangchainCompletion};