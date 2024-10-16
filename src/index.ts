import EventSource from 'react-native-sse';
import * as FileSystem from 'expo-file-system';
import {
  OpenAI as OpenAINode,
  type ClientOptions as ClientOptionsNode,
} from 'openai';

// export types from this library
export type onError = (error: any) => void;
export type onOpen = () => void;
export type onDone = () => void;
export type onEvents = {
  onError?: onError;
  onOpen?: onOpen;
  onDone?: onDone;
};
export interface ClientOptions extends ClientOptionsNode {
  apiKey: string;
  baseURL: string;
}
export type onChatCompletionChunkData = (data: ChatCompletionChunk) => void;
export type onThreadRunData = (data: Beta.Threads.Run) => void;
// export top level types from OpenAINode
export import Moderation = OpenAINode.Moderation;
export import ModerationCreateResponse = OpenAINode.ModerationCreateResponse;
export import ModerationCreateParams = OpenAINode.ModerationCreateParams;
export import Model = OpenAINode.Model;
export import ChatCompletionCreateParamsNonStreaming = OpenAINode.ChatCompletionCreateParamsNonStreaming;
export import ChatCompletionChunk = OpenAINode.ChatCompletionChunk;
export import ChatCompletion = OpenAINode.ChatCompletion;
export import FileObject = OpenAINode.FileObject;
export import FileContent = OpenAINode.FileContent;
export import FileDeleted = OpenAINode.FileDeleted;
// export nested types from OpenAINode Beta API
export namespace Beta {
  export import ThreadCreateParams = OpenAINode.Beta.ThreadCreateParams;
  export import Thread = OpenAINode.Beta.Thread;
  export import ThreadUpdateParams = OpenAINode.Beta.ThreadUpdateParams;
  export import ThreadCreateAndRunParamsNonStreaming = OpenAINode.Beta.ThreadCreateAndRunParamsNonStreaming;
  export import ThreadDeleted = OpenAINode.Beta.ThreadDeleted;
  export import Assistant = OpenAINode.Beta.Assistant;
  export import AssistantDeleted = OpenAINode.Beta.AssistantDeleted;
  export namespace Assistants {
    export import AssistantCreateParams = OpenAINode.Beta.Assistants.AssistantCreateParams;
  }
  export namespace Threads {
    export import Run = OpenAINode.Beta.Threads.Run;
    export namespace Runs {
      export type RunCreateParamsNonStreaming =
        OpenAINode.Beta.Threads.Runs.RunCreateParamsNonStreaming;
    }
    export import Message = OpenAINode.Beta.Threads.Message;
    export import MessagesPage = OpenAINode.Beta.Threads.MessagesPage;
    export namespace Messages {
      export import MessageCreateParams = OpenAINode.Beta.Threads.Messages.MessageCreateParams;
      export import MessageListParams = OpenAINode.Beta.Threads.Messages.MessageListParams;
      export import MessageDeleted = OpenAINode.Beta.Threads.Messages.MessageDeleted;
    }
  }
}

export class OpenAI {
  public apiKey: string;
  public baseURL: string;
  private client: OpenAINode;

  constructor(opts: ClientOptions) {
    this.apiKey = opts.apiKey;
    this.baseURL = opts.baseURL;
    // expo file system does not work in web anyway
    // opts.dangerouslyAllowBrowser = true;
    this.client = new OpenAINode(opts);
  }

  public models = {
    list: async (): Promise<Model[]> => (await this.client.models.list()).data,
  };

  public moderations = {
    create: async (
      body: ModerationCreateParams
    ): Promise<ModerationCreateResponse> =>
      this.client.moderations.create(body),
  };

  public beta = {
    assistants: {
      list: async (): Promise<Beta.Assistant[]> =>
        (await this.client.beta.assistants.list()).data,
      create: async (
        body: Beta.Assistants.AssistantCreateParams
      ): Promise<Beta.Assistant> =>
        await this.client.beta.assistants.create(body),
      del: async (assistantId: string): Promise<Beta.AssistantDeleted> =>
        await this.client.beta.assistants.del(assistantId),
      retrieve: async (assistantId: string): Promise<Beta.Assistant> =>
        await this.client.beta.assistants.retrieve(assistantId),
      update: async (
        assistantId: string,
        body: Beta.Assistants.AssistantCreateParams
      ): Promise<Beta.Assistant> =>
        await this.client.beta.assistants.update(assistantId, body),
    },
    threads: {
      create: async (body?: Beta.ThreadCreateParams): Promise<Beta.Thread> =>
        this.client.beta.threads.create(body),
      retrieve: async (threadId: string): Promise<Beta.Thread> =>
        this.client.beta.threads.retrieve(threadId),
      update: async (
        threadId: string,
        body: Beta.ThreadUpdateParams
      ): Promise<Beta.Thread> =>
        this.client.beta.threads.update(threadId, body),
      del: async (threadId: string): Promise<Beta.ThreadDeleted> =>
        this.client.beta.threads.del(threadId),
      createAndRunPoll: async (
        body: Beta.ThreadCreateAndRunParamsNonStreaming
      ): Promise<Beta.Threads.Run> =>
        this.client.beta.threads.createAndRunPoll(body),
      messages: {
        list: async (
          threadId: string,
          query?: Beta.Threads.Messages.MessageListParams
        ): Promise<Beta.Threads.MessagesPage> =>
          await this.client.beta.threads.messages.list(threadId, query),
        del: async (
          threadId: string,
          messageId: string
        ): Promise<Beta.Threads.Messages.MessageDeleted> =>
          await this.client.beta.threads.messages.del(threadId, messageId),
        create: async (
          threadId: string,
          body: Beta.Threads.Messages.MessageCreateParams
        ): Promise<Beta.Threads.Message> =>
          await this.client.beta.threads.messages.create(threadId, body),
      },
      runs: {
        retrieve: (threadId: string, runId: string ): Promise<Beta.Threads.Run> => this.client.beta.threads.runs.retrieve(threadId,runId),
        create: async (threadId: string, body: Beta.Threads.Runs.RunCreateParamsNonStreaming): Promise<Beta.Threads.Run> =>  await this.client.beta.threads.runs.create(threadId, body),
        stream: (
          threadId: string,
          body: Beta.Threads.Runs.RunCreateParamsNonStreaming,
          onData: onThreadRunData,
          callbacks: onEvents
        ): void =>
          this._stream(
            `${this.baseURL}/threads/${threadId}/runs`,
            body,
            onData,
            callbacks
          ),
      },
    },
  };

  /**
   * Create a chat completion using the OpenAI API.
   * @param {OpenAIParams} params - Parameters for the OpenAI chat completion API.
   * @returns {void}
   */
  public chat = {
    completions: {
      /**
       * Create a chat completion using the OpenAI API.
       * @body {ChatCompletionCreateParamsNonStreaming} body - Parameters for the OpenAI chat completion API.
       * @returns {Promise<ChatCompletion>}
       */
      create: async (
        body: ChatCompletionCreateParamsNonStreaming
      ): Promise<ChatCompletion> => this.client.chat.completions.create(body),
      /**
       * Create a chat completion stream using the OpenAI API.
       * @param {ChatCompletionCreateParamsNonStreaming} params - Parameters for the OpenAI chat completion API since streaming is assumed.
       * @param {onChatCompletion} onData - Callback to handle incoming messages.
       * @param {onEvents} callbacks - Object containing optional callback functions.
       * @returns {void}
       */
      stream: (
        params: ChatCompletionCreateParamsNonStreaming,
        onData: onChatCompletionChunkData,
        callbacks: onEvents
      ): void =>
        this._stream(
          `${this.baseURL}/chat/completions`,
          params,
          onData,
          callbacks
        ),
    },
  };

  public files = {
    /**
     * Upload file using the Expo FileSystem to the OpenAI API /v1/files endpoints
     * @param {string} filePath - The path of the file to upload.
     * @param {string} purpose - The purpose of the data (e.g., "fine-tune").
     * @see {@link https://docs.expo.dev/versions/latest/sdk/filesystem/ Expo FileSystem}
     * @see {@link https://beta.openai.com/docs/api-reference/files OpenAI Files API}
     * @returns {Promise<FileObject>}
     */
    create: async (filePath: string, purpose: string): Promise<FileObject> => {
      const response = await FileSystem.uploadAsync(
        `${this.baseURL}/files`,
        filePath,
        {
          headers: {
            Authorization: `Bearer ${this.apiKey}`,
          },
          httpMethod: 'POST',
          fieldName: 'file',
          uploadType: FileSystem.FileSystemUploadType.MULTIPART,
          parameters: {
            purpose: purpose,
          },
        }
      );
      const responseData: FileObject = JSON.parse(response.body);
      return responseData;
    },
    content: async (fileId: string): Promise<Response> =>
      this.client.files.content(fileId),
    delete: async (fileId: string): Promise<FileDeleted> =>
      this.client.files.del(fileId),
    retrieve: async (fileId: string): Promise<FileObject> =>
      this.client.files.retrieve(fileId),
    list: async (): Promise<FileObject[]> =>
      (await this.client.files.list()).data,
  };

  /**
   * Connect to a given OpenAI API endpoint and start streaming.
   * @param {string} url - The API endpoint to connect to.
   * @param {OpenAIParams} params - The parameters to send with the API request.
   * @param {onChatCompletion | onThreadRun} onData - Callback to handle incoming data.
   * @param {onEvents} callbacks - Object containing callback functions.
   * @param {onStreamError} [callbacks.onError] - Callback to handle errors.
   * @param {onStreamOpen} [callbacks.onOpen] - Callback to handle when the connection opens.
   * @param {onStreamDone} [callbacks.onDone] - Callback to handle when the stream ends.
   * @private
   */
  private _stream(
    url: string,
    params:
      | ChatCompletionCreateParamsNonStreaming
      | Beta.Threads.Runs.RunCreateParamsNonStreaming,
    onData: onChatCompletionChunkData | onThreadRunData,
    callbacks: onEvents
  ) {
    const { onError, onOpen, onDone } = callbacks;
    const requestBody = { ...params, stream: true };

    const eventSource = new EventSource(url, {
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
      },
      method: 'POST',
      body: JSON.stringify(requestBody),
    });

    eventSource.addEventListener('message', (event) => {
      if (event.data && event.data !== '[DONE]') {
        try {
          const data = JSON.parse(event.data);
          onData(data);
        } catch (error: any) {
          onError?.(
            new Error(`JSON Parse on ${event.data} with error ${error.message}`)
          );
          eventSource.close(); // Disconnect the EventSource
        }
      } else {
        onDone?.(); // Call onDone when the stream ends
        eventSource.close(); // Disconnect the EventSource
      }
    });

    eventSource.addEventListener('error', (error) => {
      onError?.(error);
      eventSource.close(); // Disconnect the EventSource
    });

    eventSource.addEventListener('open', () => {
      onOpen?.();
    });
  }
}

export default OpenAI;
