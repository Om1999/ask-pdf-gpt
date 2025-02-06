# Ask-PDF GPT

A Next.js application that allows users to upload PDFs, convert their content into vector embeddings, and interact with the document using AI-powered chat. The app utilizes **Cohere** for embeddings, **Pinecone** for storing namespaces, and **Vercel Blob** for storage. The app is deployed on **Vercel**.

## Features
- Upload PDF files
- Convert content into vector embeddings (using **Cohere’s embeddingV3**)
- AI-powered chat to interact with documents (using **Command R+** for generating responses)
- Store embeddings in **Pinecone** namespaces
- Authentication via **Clerk**
- File storage via **Vercel Blob**
- Deployed on **Vercel**

## Tech Stack
- **Frontend:** Next.js, Tailwind CSS
- **Backend:** Cohere for embeddings, Pinecone for storage
- **Auth:** Clerk
- **Storage:** Vercel Blob
- **AI:** Command R+ for responses

## Getting Started

### Clone the repo
git clone https://github.com/your-username/ask-pdf-gpt.git
cd ask-pdf-gpt


## Install dependencies
npm install
## Run locally
npm run dev

## Environment Variables
Create a .env.local file and add:

NEXT_PUBLIC_CLERK_FRONTEND_API=your_clerk_key  

NEXT_PUBLIC_VERCEL_BLOB_READ_WRITE_TOKEN=your_blob_token  

COHERE_API_KEY=your_cohere_key  

PINECONE_API_KEY=your_pinecone_key  

VERCEL_BLOB_READ_WRITE_TOKEN=vercel_blob_key


# Functionalities Yet to Be Worked On  

Implement limited functionality for non-paid users

Implementing a payment system .  

Deleting uploaded files by users.

# Credits & Acknowledgements
A special thanks to Kishan (GitHub: kishanshetty1991) for helping me resolve an issue with the app
