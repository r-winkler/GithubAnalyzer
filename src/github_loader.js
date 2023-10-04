import { GithubRepoLoader } from 'langchain/document_loaders/web/github'
import { OpenAIEmbeddings } from 'langchain/embeddings/openai'
import { MemoryVectorStore } from 'langchain/vectorstores/memory'
import { RecursiveCharacterTextSplitter } from 'langchain/text_splitter'
import { OpenAI } from 'langchain/llms/openai'
import { RetrievalQAChain } from 'langchain/chains'

const llm = new OpenAI({ modelName: 'gpt-3.5-turbo' })

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
    query: `Help the user with the query: ${query}. Return the result formated as HTML using <h1>, <ul>,<p> and <code>. Format the code inside the <code> block.`,
  })

  console.log(`Finished 🏁`)
  return response.text
}

console.log((await analyzeRepo('https://github.com/verwec/FineTuner', 'What does the repo?')))