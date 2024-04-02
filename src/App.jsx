import React, { useState, useRef, useEffect } from "react";
import {
  configHeaders,
  configRequestBody,
  userID,
  ulcaApiKey,
  target_language,
} from "./constants/configRequest";

const App = () => {
  const [isRecording, setIsRecording] = useState(false);
  const [recordedChunks, setRecordedChunks] = useState([]);
  const [base64Encoded, setBase64Encoded] = useState("");
  const [transcript, setTranscript] = useState("");
  const [translated, setTranslated] = useState("");
  const [NMT_service_id, setNMT_service_id] = useState("");
  const [authKey, setAuthKey] = useState("");
  const [callback_url, setCallback_url] = useState("");
  const initialRender = useRef(true);
  const mediaRecorder = useRef(null);

  const playAudio = (base64Data) => {
    // Convert base64 string to blob
    const binaryAudio = atob(base64Data);
    const array = [];
    for(let i = 0; i < binaryAudio.length; i++) {
      array.push(binaryAudio.charCodeAt(i));
    }
    const blob = new Blob([new Uint8Array(array)], { type: 'audio/mpeg' });

    // Create object URL from blob
    const url = URL.createObjectURL(blob);

    // Create audio element
    const audio = new Audio(url);

    // Play audio
    audio.play();
  };

  const handleStartRecording = () => {
    navigator.mediaDevices
      .getUserMedia({ audio: true })
      .then((stream) => {
        setIsRecording(true);
        const recorder = new MediaRecorder(stream);
        recorder.addEventListener("dataavailable", handleDataAvailable);
        recorder.start();
        mediaRecorder.current = recorder;
      })
      .catch((error) => console.error("Error accessing microphone:", error));
  };

  const handleStopRecording = () => {
    mediaRecorder.current.stop();
    setIsRecording(false);
  };

  const handleDataAvailable = (event) => {
    setRecordedChunks(recordedChunks.concat(event.data));
  };

  const handlePlayRecording = () => {
    const audioBlob = new Blob(recordedChunks, { type: "audio/wav" });
    const audioUrl = URL.createObjectURL(audioBlob);
    const audio = new Audio(audioUrl);
    audio.play();
  };

  const handleEncodeBase64 = () => {
    const audioBlob = new Blob(recordedChunks, { type: "audio/wav" });
    const reader = new FileReader();
    reader.readAsDataURL(audioBlob);
    reader.onloadend = () => {
      const base64String = reader.result.split(",")[1];
      setBase64Encoded(base64String);
    };
  };

  // useEffect(() => {
  //   if (initialRender.current) {
  //     initialRender.current = false;
  //     return;
  //   }
  //   // if (transcript && authKey) {
  //   console.log(transcript);
  //   console.log("Auth key : ", authKey);
  //   handleNMTReuqest();
  //   // }

  //   // return ()=>setTranscript('')
  // }, [transcript]);
  // useEffect(() => {
  //   if (initialRender.current) {
  //     initialRender.current = false;
  //     return;
  //   }
  //   // if(translated){
  //   console.log(translated);
  //   // }

  //   // return ()=>setTranslated('')
  // }, [translated]);
  const handleNMTReuqest = async () => {
    const NMTRequestBody = {
      pipelineTasks: [
        {
          taskType: "translation",
          config: {
            language: {
              sourceLanguage: "hi",
              targetLanguage: `${target_language}`,
            },
            serviceId: `${NMT_service_id}`,
          },
        },
      ],
      inputData: {
        input: [
          {
            source: `${transcript}`,
          },
        ],
      },
    };
    const NMTHeaders = {
      "Content-Type": "application/json",
      Authorization: authKey,
    };
    const NMTresponse = await fetch(callback_url, {
      method: "POST",
      headers: NMTHeaders,
      body: JSON.stringify(NMTRequestBody),
    });

    // Handle the API response
    const data = await NMTresponse.json().catch((err) => {
      console.error("Error parsing JSON:", err);
      return null; // Return null or handle the error appropriately
    });

    if (data) {
      const translatedString = data.pipelineResponse[0].output[0].target;
      console.log(translatedString);
      setTranslated(translatedString);
    }

    // // Handle the API response
    // const data = await ASRresponse.json();
    // const recongnizedString = data.pipelineResponse[0].output[0].source;
    // setTranscript((prev) => (prev = recongnizedString));
    // // console.log(recongnizedString);
  };

  const handleApiReuqest = async () => {
    const response = await fetch(
      "https://meity-auth.ulcacontrib.org/ulca/apis/v0/model/getModelsPipeline",
      {
        method: "POST",
        headers: configHeaders,
        body: JSON.stringify(configRequestBody),
      }
    );

    // Handle the API response
    const jsonRes = await response.json();
    // console.log("API Response:", jsonRes);
    const callback = jsonRes.pipelineInferenceAPIEndPoint.callbackUrl;
    setCallback_url(callback);
    const callback_url_feedback = jsonRes.feedbackUrl;
    const compute_call_authorization_key =
      jsonRes.pipelineInferenceAPIEndPoint.inferenceApiKey.name;
    const compute_call_authorization_value =
      jsonRes.pipelineInferenceAPIEndPoint.inferenceApiKey.value;

    setAuthKey(compute_call_authorization_value);
    var pipelineResponseConfig = jsonRes.pipelineResponseConfig;
    const asr_service_id = pipelineResponseConfig[0].config[0].serviceId;
    const nmt_service_id = pipelineResponseConfig[1].config[0].serviceId;
    // setNMT_service_id(nmt_service_id);
    const tts_service_id = pipelineResponseConfig[2].config[0].serviceId;
    console.log(asr_service_id, nmt_service_id, tts_service_id);

    const requestBody = {
      pipelineTasks: [
        {
          taskType: "asr",
          config: {
            language: {
              sourceLanguage: "hi",
            },
            serviceId: asr_service_id,
            audioFormat: "flac",
            samplingRate: 16000,
          },
        },
      ],
      inputData: {
        audio: [
          {
            audioContent: base64Encoded,
          },
        ],
      },
    };

    // Make the API request using the requestBody
    const ASRresponse = await fetch(callback_url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: compute_call_authorization_value,
        userID: userID,
        ulcaApiKey: ulcaApiKey,
      },
      body: JSON.stringify(requestBody),
    });
    const data = await ASRresponse.json();
    const recongnizedString = data.pipelineResponse[0].output[0].source;
    console.log(recongnizedString);
    setTranscript(recongnizedString);
    console.log("Inside then call back");


    const NMTRequestBody={
      "pipelineTasks": [
          {
              "taskType": "translation",
              "config": {
                  "language": {
                      "sourceLanguage": 'hi',
                      "targetLanguage": `${target_language}`,
                  },
                  "serviceId": nmt_service_id,
              }
          }
      ],
      "inputData": {
          "input": [
              {
                  "source": recongnizedString,
              }
          ]
      }
  }
  const NMTHeaders = {
    "Content-Type": "application/json",
    Authorization: compute_call_authorization_value,
  }
  const NMTresponse = await fetch(
    callback_url,
    {
      method: "POST",
      headers:NMTHeaders,
      body: JSON.stringify(NMTRequestBody),
    }
  );

  // Handle the API response
  // if(NMTresponse.ok){
  // console.log("response : ",NMTresponse)
  const NMTdata = await NMTresponse.json();
  const translatedString = NMTdata.pipelineResponse[0].output[0].target;
  console.log(translatedString);
  console.log("In second call");
  // }
    // setTranscript((prev) => (prev = recongnizedString));
    // console.log(recongnizedString);

    const reverseNMTRequestBody={
      "pipelineTasks": [
          {
              "taskType": "translation",
              "config": {
                  "language": {
                      "sourceLanguage": `${target_language}`,
                      "targetLanguage": 'hi',
                  },
                  "serviceId": nmt_service_id,
              }
          }
      ],
      "inputData": {
          "input": [
              {
                  "source": translatedString,
              }
          ]
      }
  }
  const reverseNMTHeaders = {
    "Content-Type": "application/json",
    Authorization: compute_call_authorization_value,
  }
  const reverseNMTresponse = await fetch(
    callback_url,
    {
      method: "POST",
      headers:reverseNMTHeaders,
      body: JSON.stringify(reverseNMTRequestBody),
    }
  );
  // console.log("response : ",reverseNMTresponse)
  const reverseNMTdata = await reverseNMTresponse.json();
  const outputString = reverseNMTdata.pipelineResponse[0].output[0].target;
  console.log(outputString);
  console.log("In third  call");


  const TTSRequestBody={
    "pipelineTasks": [       
        {
            "taskType": "tts",
            "config": {
                "language": {
                    "sourceLanguage": `${target_language}`
                },
                "serviceId": `${tts_service_id}`,
                "gender": "female",
                "samplingRate": 8000
            }
        }
    ],
    "inputData": {
        "input": [
            {
                "source": outputString
            }
        ]
    }
}
const TTSHeaders = {
  "Content-Type": "application/json",
  Authorization: compute_call_authorization_value,
}
const TTSResponse = await fetch(
  callback_url,
  {
    method: "POST",
    headers: TTSHeaders,
    body: JSON.stringify(TTSRequestBody),
  }
);
// console.log("response : ",reverseNMTresponse)
const TTSdata = await TTSResponse.json();
console.log("TTs response : ",TTSdata)
const TTSBase64 = TTSdata.pipelineResponse[0].audio[0].audioContent;
console.log(TTSBase64);
console.log("In third  call");
playAudio(TTSBase64)
  };

  return (
    <div>
      <h1>Voice Recorder</h1>
      <button onClick={handleStartRecording} disabled={isRecording}>
        Start Recording
      </button>
      <button onClick={handleStopRecording} disabled={!isRecording}>
        Stop Recording
      </button>
      <button
        onClick={handlePlayRecording}
        disabled={recordedChunks.length === 0}
      >
        Play Recording
      </button>
      <button
        onClick={handleEncodeBase64}
        disabled={recordedChunks.length === 0}
      >
        Encode to Base64
      </button>
      <button onClick={handleApiReuqest}>send Data</button>
      {base64Encoded && <p>Base64 Encoded: {base64Encoded}</p>}
    </div>
  );
};

export default App;
