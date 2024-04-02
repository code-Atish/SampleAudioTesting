const source_language='hi'
const target_language='en'
const pipeline_id='64392f96daac500b55c543cd'
const userID="c0dfad49ffc74a0fb3736c9738bfaedd"
const ulcaApiKey="067ff8725e-9c67-4e99-bac4-e1f31c149b44"

const configHeaders={
  "Content-Type": "application/json",
  userID: userID,
  ulcaApiKey: ulcaApiKey,
}

const configRequestBody = {
  "pipelineTasks": [
      {
          "taskType": "asr",
          "config": {
              "language": {
                  "sourceLanguage": `${source_language}`,
              }
          }
      },
      {
          "taskType": "translation",
          "config": {
              "language": {
                  "sourceLanguage": `${source_language}`,
                  "targetLanguage": `${target_language}`,
              }
          }
      },
      {
          "taskType": "tts",
          "config": {
              "language": {
                  "sourceLanguage": `${target_language}`,
              }
          }
      }
  ],
  "pipelineRequestConfig": {
      "pipelineId": `${pipeline_id}`,
  }
}

export {source_language,target_language,configHeaders,configRequestBody,ulcaApiKey,userID,pipeline_id}