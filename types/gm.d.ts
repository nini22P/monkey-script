interface GMXMLHttpRequestOptions {
  method?: 'GET' | 'POST' | 'HEAD' | 'DELETE'
  url: string
  headers?: Record<string, string>
  data?: string
  onload?: (res: { responseText: string; status: number; responseHeaders: string }) => void
  onerror?: (err: unknown) => void
}

declare function GM_xmlhttpRequest(options: GMXMLHttpRequestOptions): void

declare function GM_listValues(): string[]
