declare module 'mammoth' {
  export interface MammothMessage {
    type?: string
    message?: string
  }

  export interface ExtractRawTextResult {
    value: string
    messages: MammothMessage[]
  }

  export function extractRawText(input: { buffer: Buffer }): Promise<ExtractRawTextResult>
  export function convertToHtml(input: { arrayBuffer: ArrayBuffer } | { buffer: Buffer }): Promise<{ value: string; messages: MammothMessage[] }>

  const mammoth: {
    extractRawText: typeof extractRawText
    convertToHtml: typeof convertToHtml
  }
  export default mammoth
}
