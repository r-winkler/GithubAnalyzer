import { GithubRepoLoader } from 'langchain/document_loaders/web/github'
import { OpenAIEmbeddings } from 'langchain/embeddings/openai'
import { MemoryVectorStore } from 'langchain/vectorstores/memory'
import { RecursiveCharacterTextSplitter } from 'langchain/text_splitter'
import { OpenAI } from 'langchain/llms/openai'
import { RetrievalQAChain } from 'langchain/chains'

const repoUrl = 'https://github.com/verwec/Agents'
const llm = new OpenAI({ modelName: 'gpt-3.5-turbo-16k' })

export async function analyzeRepo(query) {
  const loader = new GithubRepoLoader(repoUrl)
  const data = await loader.load()

  const textSplitter = new RecursiveCharacterTextSplitter({
    chunkSize: 5000,
    chunkOverlap: 1000,
  })

  const splitted = await textSplitter.splitDocuments(data)

  const vectorStore = await MemoryVectorStore.fromDocuments(
    splitted,
    new OpenAIEmbeddings(),
  )

  const chain = RetrievalQAChain.fromLLM(llm, vectorStore.asRetriever())
  const response = await chain.call({
    query: query,
  })

  return response.text
}
