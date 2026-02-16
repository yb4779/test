import { useState, useRef } from "react";
import { voiceApi } from "../../services/api";
import type { VoiceParsed, TradingIdea } from "../../types";

interface Props {
  onTickerDetected: (ticker: string) => void;
}

export default function VoiceInput({ onTickerDetected }: Props) {
  const [isRecording, setIsRecording] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [preview, setPreview] = useState<VoiceParsed | null>(null);
  const [createdIdeas, setCreatedIdeas] = useState<TradingIdea[]>([]);
  const recognitionRef = useRef<ReturnType<typeof getSpeechRecognition> | null>(null);

  function getSpeechRecognition() {
    const SR = window.SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SR) return null;
    const recognition = new SR();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = "en-US";
    return recognition;
  }

  const toggleRecording = () => {
    if (isRecording) {
      recognitionRef.current?.stop();
      setIsRecording(false);
      return;
    }

    const recognition = getSpeechRecognition();
    if (!recognition) {
      alert("Speech recognition not supported in this browser. Try Chrome.");
      return;
    }

    recognition.onresult = (event: any) => {
      let text = "";
      for (let i = 0; i < event.results.length; i++) {
        text += event.results[i][0].transcript;
      }
      setTranscript(text);
    };

    recognition.onerror = () => setIsRecording(false);
    recognition.onend = () => setIsRecording(false);

    recognitionRef.current = recognition;
    recognition.start();
    setIsRecording(true);
  };

  const handlePreview = async () => {
    if (!transcript.trim()) return;
    try {
      const parsed = (await voiceApi.parseOnly(transcript)) as VoiceParsed;
      setPreview(parsed);
      if (parsed.tickers.length > 0) {
        onTickerDetected(parsed.tickers[0]);
      }
    } catch {
      /* ignore */
    }
  };

  const handleSubmit = async () => {
    if (!transcript.trim()) return;
    try {
      const result = (await voiceApi.process(transcript)) as {
        parsed: VoiceParsed;
        ideas_created: TradingIdea[];
      };
      setCreatedIdeas(result.ideas_created);
      setPreview(result.parsed);
      if (result.parsed.tickers.length > 0) {
        onTickerDetected(result.parsed.tickers[0]);
      }
    } catch {
      /* ignore */
    }
  };

  return (
    <div>
      <div className="card-header">
        <h2>Voice Input</h2>
      </div>
      <div className="voice-controls">
        <button
          className={`voice-btn record ${isRecording ? "active" : ""}`}
          onClick={toggleRecording}
        >
          {isRecording ? "Stop" : "Record"}
        </button>
        <textarea
          className="voice-transcript"
          placeholder='Say something like "Buy AAPL at 180 target 200 stop 170"'
          value={transcript}
          onChange={(e) => setTranscript(e.target.value)}
        />
        <button className="voice-btn submit" onClick={handlePreview}>
          Preview
        </button>
        <button className="voice-btn submit" onClick={handleSubmit}>
          Save
        </button>
      </div>

      {preview && (
        <div className="voice-preview">
          <span className={`tag ${preview.idea_type}`}>{preview.idea_type.toUpperCase()}</span>
          {preview.tickers.map((t) => (
            <span key={t} className="tag watch">{t}</span>
          ))}
          {preview.entry_price && <span> Entry: ${preview.entry_price}</span>}
          {preview.target_price && <span> Target: ${preview.target_price}</span>}
          {preview.stop_loss && <span> Stop: ${preview.stop_loss}</span>}
        </div>
      )}

      {createdIdeas.length > 0 && (
        <div className="voice-preview" style={{ marginTop: 6 }}>
          Saved {createdIdeas.length} idea(s): {createdIdeas.map((i) => i.ticker).join(", ")}
        </div>
      )}
    </div>
  );
}
