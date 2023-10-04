import { GithubRepoLoader } from 'langchain/document_loaders/web/github'
import { OpenAIEmbeddings } from 'langchain/embeddings/openai'
import { MemoryVectorStore } from 'langchain/vectorstores/memory'
import { RecursiveCharacterTextSplitter } from 'langchain/text_splitter'
import { OpenAI } from 'langchain/llms/openai'
import { RetrievalQAChain } from 'langchain/chains'

const llm = new OpenAI({ modelName: 'gpt-4' })

export async function analyzeRepo(repoUrl, query) {
  console.log(`start analyzing: "${query}" ...`)

  const loader = new GithubRepoLoader(repoUrl, {
    recursive: true,
    branch: 'main',
    maxConcurrency: 5,
  })

  const data = await loader.load()

  const textSplitter = new RecursiveCharacterTextSplitter({
    chunkSize: 5000,
    chunkOverlap: 1000,
  })

  const splitted = await textSplitter.splitDocuments(data);

  const vectorStore = await MemoryVectorStore.fromDocuments(
    splitted,
    new OpenAIEmbeddings(),
  )

  console.log(`Execute query ...`)
  const chain = RetrievalQAChain.fromLLM(llm, vectorStore.asRetriever(), { returnSourceDocuments: true });

  const response = await chain.call({
    query: 
    `
    Assist with the user's query about the GitHub repository: "${query}".

    Answer in HTML format using TailwindCSS:
    - Headings: <h2 class="text-xl font-bold mb-3">
    - Paragraphs: <p class="mb-4">

    Response:
    `,
  })

  console.log(`Finished 🏁`)
  return response.text
}

// Basic Test:
console.log((await analyzeRepo('https://github.com/verwec/Business-Knowledge', 'What does the repo?')))