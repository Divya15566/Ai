import { useState, useEffect, useRef } from 'react';
import { FaMicrophone, FaMicrophoneSlash } from 'react-icons/fa';
import { toast } from 'react-hot-toast';

export default function VoiceControl({ 
  onCommand, 
  onAnswer, 
  activeTab,
  isEvaluatorActive
}) {
  const [isListening, setIsListening] = useState(false);
  const recognitionRef = useRef(null);
  const [lastCommand, setLastCommand] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const synthRef = useRef(null);
  const commandQueueRef = useRef([]);
  const isProcessingRef = useRef(false);
  const activationRef = useRef(false);
  const silenceTimerRef = useRef(null);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      // Initialize speech synthesis
      synthRef.current = window.speechSynthesis;

      // Initialize speech recognition
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      if (!SpeechRecognition) {
        toast.error('Speech recognition not supported in this browser');
        return;
      }

      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = true;
      recognitionRef.current.interimResults = false;
      recognitionRef.current.lang = 'en-US';
      recognitionRef.current.maxAlternatives = 1;

      recognitionRef.current.onresult = (event) => {
        // Reset silence timer on every result
        resetSilenceTimer();
        
        const transcript = event.results[event.results.length - 1][0].transcript;
        setLastCommand(transcript);
        processCommand(transcript);
      };

      recognitionRef.current.onerror = (event) => {
        console.error('Speech recognition error:', event.error);
        if (event.error === 'aborted' || event.error === 'network') {
          console.warn('Transient error occurred. Restarting recognition.');
          if (isListening) {
            recognitionRef.current.start();
          }
        } else if (event.error !== 'no-speech') {
          toast.error(`Speech recognition error: ${event.error}`);
        }
      };

      recognitionRef.current.onend = () => {
        if (isListening) {
          recognitionRef.current.start();
        }
      };
    }

    return () => {
      stopListening();
      clearTimeout(silenceTimerRef.current);
    };
  }, [isListening, activeTab, isEvaluatorActive]);

  const resetSilenceTimer = () => {
    clearTimeout(silenceTimerRef.current);
    silenceTimerRef.current = setTimeout(() => {
      if (isListening) {
        speak("I didn't hear anything. Going to sleep. Say 'activate voice' to continue.", false);
        stopListening();
      }
    }, 120000); // 2 minutes of silence
  };

  const stopListening = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }
    setIsListening(false);
    clearTimeout(silenceTimerRef.current);
  };

  const speak = (text, interrupt = true) => {
    if (interrupt) {
      window.speechSynthesis.cancel();
    }
    if (synthRef.current && text) {
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 0.9;
      synthRef.current.speak(utterance);
    }
  };

  const debugUpdateTextAreas = (commands) => {
    console.log('Commands received for update:', commands);
    commands.forEach(({ questionIndex, answer }) => {
      const textArea = document.querySelector(`#question-${questionIndex + 1}`);
      if (textArea) {
        console.log(`Updating text area for question ${questionIndex + 1} with answer: ${answer}`);
        textArea.value = answer;
        textArea.dispatchEvent(new Event('input', { bubbles: true }));
      } else {
        console.warn(`Text area for question ${questionIndex + 1} not found.`);
      }
    });
  };

  // Replace updateTextAreas with debugUpdateTextAreas for debugging
  const processCommand = (transcript) => {
    console.log('Received transcript:', transcript);

    if (isProcessingRef.current) {
      console.log('Currently processing another command. Adding to queue:', transcript);
      commandQueueRef.current.push(transcript);
      return;
    }

    isProcessingRef.current = true;
    setIsProcessing(true);

    const lowerTranscript = transcript.toLowerCase().trim();
    console.log('Processed transcript to lowercase:', lowerTranscript);

    let commandProcessed = false;

    // Stop commands take highest priority
    if (lowerTranscript.includes('stop')) {
      console.log('Matched stop command.');
      window.speechSynthesis.cancel();
      stopListening();
      commandProcessed = true;
      speak('Voice control stopped', false);
    }
    // Activation commands
    else if (lowerTranscript.includes('activate voice') || lowerTranscript.includes('hey assistant')) {
      console.log('Matched activation command.');
      if (!isListening) {
        toggleListening();
      } else {
        speak("Voice control is already active");
      }
      commandProcessed = true;
    }
    // Read commands
    else if (lowerTranscript.includes('read') || lowerTranscript.includes('read aloud')) {
      console.log('Matched read command.');
      onCommand({ type: 'READ_ALOUD' });
      speak('Reading the content aloud');
      commandProcessed = true;
    }
    // Regenerate commands
    else if (lowerTranscript.includes('regenerate')) {
      console.log('Matched regenerate command.');
      onCommand({ type: 'REGENERATE' });
      speak('Regenerating questions');
      commandProcessed = true;
    }
    // Navigation commands
    else if (lowerTranscript.includes('go to') || lowerTranscript.includes('navigate to') || 
             lowerTranscript.includes('open') || lowerTranscript.includes('show') ||
             lowerTranscript.includes('switch to')) {
      console.log('Matched navigation command.');
      if (lowerTranscript.includes('upload') || lowerTranscript.includes('pdf')) {
        onCommand({ type: 'NAVIGATE', tab: 'upload' });
        speak('Opening PDF upload section');
        commandProcessed = true;
      } else if (lowerTranscript.includes('evaluator') || lowerTranscript.includes('evaluate')) {
        onCommand({ type: 'NAVIGATE', tab: 'evaluator' });
        speak('Opening answer evaluator');
        commandProcessed = true;
      } else if (lowerTranscript.includes('analytics') || lowerTranscript.includes('progress')) {
        onCommand({ type: 'NAVIGATE', tab: 'analytics' });
        speak('Opening analytics dashboard');
        commandProcessed = true;
      } else if (lowerTranscript.includes('search') || lowerTranscript.includes('web')) {
        onCommand({ type: 'NAVIGATE', tab: 'search' });
        speak('Opening web search');
        commandProcessed = true;
      }
    }
    // Question generation commands
    else if (lowerTranscript.includes('generate') && activeTab === 'upload') {
      console.log('Matched generate command.');
      const numMatch = lowerTranscript.match(/generate (\d+)/);
      const typeMatch = lowerTranscript.match(/(mcq|multiple choice|subjective|essay)/i);
      const pagesMatch = lowerTranscript.match(/(?:pages?|from pages?) (\d+-\d+|all)/i);

      let numQuestions = numMatch ? parseInt(numMatch[1]) : 5;

      // Validate number range
      if (numQuestions < 1) numQuestions = 1;
      if (numQuestions > 20) numQuestions = 20;

      // Determine question type
      let questionType = "MCQ"; // default
      if (typeMatch) {
          questionType = typeMatch[0].toLowerCase().includes('subjective') ? 'Subjective' : 'MCQ';
      }

      const command = {
          type: 'GENERATE',
          numQuestions,
          questionType,
          pageRange: pagesMatch ? pagesMatch[1] : 'all'
      };

      console.log('Generated command:', command);
      onCommand(command);
      speak(`Generating ${numQuestions} ${questionType} questions`);
      commandProcessed = true;
    }
    // Evaluation commands
    else if (isEvaluatorActive) {
      console.log('Matched evaluator command.');
      if (lowerTranscript.includes('evaluate') || lowerTranscript.includes('grade answers')) {
        onCommand({ type: 'EVALUATE' });
        speak('Evaluating answers');
        commandProcessed = true;
      } 
      // Handle MCQ answers (e.g., "question 1 option b")
      else if (lowerTranscript.match(/(?:question|q)\s*(\d+)\s*(?:option|answer|choose|select|is)\s*([a-d])/i)) {
        const match = lowerTranscript.match(/(?:question|q)\s*(\d+)\s*(?:option|answer|choose|select|is)\s*([a-d])/i);
        const questionIndex = parseInt(match[1]) - 1;
        const answer = match[2].toUpperCase();
  
        console.log(`Matched MCQ answer command for question ${questionIndex + 1}: ${answer}`);
        onCommand({ 
            type: 'ANSWER', 
            questionIndex, 
            answer,
            isMCQ: true
        });
        speak(`Recorded option ${answer} for question ${questionIndex + 1}`);
        commandProcessed = true;
      }
      // Handle subjective answers
      else if (lowerTranscript.match(/(?:answer|response|my answer|the answer)\s*(?:for|to|is)\s*(?:question|q)\s*(\d+)\s*[:,-]?\s*(.+)/i)) {
        const match = lowerTranscript.match(/(?:answer|response|my answer|the answer)\s*(?:for|to|is)\s*(?:question|q)\s*(\d+)\s*[:,-]?\s*(.+)/i);
        const questionIndex = parseInt(match[1]) - 1;
        const answer = match[2].trim();
  
        console.log(`Matched subjective answer command for question ${questionIndex + 1}: ${answer}`);
        onCommand({ 
            type: 'ANSWER', 
            questionIndex, 
            answer,
            isMCQ: false
        });
        speak(`Recorded answer for question ${questionIndex + 1}`);
        commandProcessed = true;
      }
      else if (lowerTranscript.match(/(?:option|answer)\s*([a-d])\s*(?:for|to)\s*(?:question|q)\s*(\d+)/i)) {
        const match = lowerTranscript.match(/(?:option|answer)\s*([a-d])\s*(?:for|to)\s*(?:question|q)\s*(\d+)/i);
        const questionIndex = parseInt(match[2]) - 1;
        const answer = match[1].toUpperCase();
  
        console.log(`Matched alternative MCQ format for question ${questionIndex + 1}: ${answer}`);
        onCommand({ 
            type: 'ANSWER', 
            questionIndex, 
            answer,
            isMCQ: true
        });
        speak(`Recorded option ${answer} for question ${questionIndex + 1}`);
        commandProcessed = true;
      }
      // Handle precise MCQ answers (e.g., "q1 A", "q2 B/C/D")
      const preciseMcqMatch = lowerTranscript.match(/q(\d+)\s*([a-d](?:\/[a-d])*)/gi);
      if (preciseMcqMatch) {
        console.log('Matched precise MCQ pattern:', preciseMcqMatch);
        preciseMcqMatch.forEach(match => {
          const [, questionNumber, answer] = match.match(/q(\d+)\s*([a-d](?:\/[a-d])*)/i);
          const questionIndex = parseInt(questionNumber) - 1;
          const processedAnswer = answer.toUpperCase();
  
          console.log(`Processing precise MCQ command for question ${questionIndex + 1}: ${processedAnswer}`);
          onCommand({
            type: 'ANSWER',
            questionIndex,
            answer: processedAnswer,
            isMCQ: true
          });
          speak(`Recorded option ${processedAnswer} for question ${questionIndex + 1}`);
        });
        commandProcessed = true;
      }
      // Read specific question
      else if (lowerTranscript.match(/read question \d+/i)) {
        const match = lowerTranscript.match(/read question (\d+)/i);
        if (match) {
          const questionIndex = parseInt(match[1]) - 1;
          console.log(`Matched read question command for question ${questionIndex + 1}`);
          onCommand({
            type: 'READ_QUESTION',
            questionIndex
          });
          commandProcessed = true;
        }
      }
    }

    if (!commandProcessed && !lowerTranscript.includes('activate voice')) {
      console.log('No matching command found for transcript:', lowerTranscript);
      speak("Sorry, I didn't understand that command. Please try again.");
    }

    setTimeout(() => {
      isProcessingRef.current = false;
      setIsProcessing(false);
      
      if (commandQueueRef.current.length > 0) {
        const nextCommand = commandQueueRef.current.shift();
        processCommand(nextCommand);
      }
    }, 300);
  };

  const toggleListening = () => {
    if (isListening) {
      stopListening();
      speak('Voice control deactivated', true);
    } else {
      try {
        recognitionRef.current.start();
        setIsListening(true);
        activationRef.current = true;
        resetSilenceTimer();
        toast.success('Voice control activated. Speak your commands.');
        speak('Voice control activated. Please speak your commands.', true);
      } catch (err) {
        toast.error('Failed to start voice recognition');
        console.error(err);
      }
    }
  };

  return (
    <div className="fixed bottom-4 right-4 z-50">
      <button
        onClick={toggleListening}
        className={`p-4 rounded-full shadow-lg text-white ${
          isListening ? 'bg-red-500 animate-pulse' : 'bg-blue-600'
        }`}
        aria-label={isListening ? 'Stop listening' : 'Start listening'}
      >
        {isListening ? <FaMicrophoneSlash size={24} /> : <FaMicrophone size={24} />}
      </button>
      {isListening && (
        <div className="mt-2 p-2 bg-white rounded shadow text-sm max-w-xs">
          <p className="font-semibold">Listening...</p>
          <p className="truncate">{lastCommand}</p>
        </div>
      )}
    </div>
  );
}