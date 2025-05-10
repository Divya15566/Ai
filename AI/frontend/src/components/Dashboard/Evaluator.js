import { forwardRef, useState, useEffect, useRef, useImperativeHandle } from 'react';
import { FaCheck, FaSpinner, FaExclamationTriangle, FaVolumeUp, FaStop } from 'react-icons/fa';
import { toast } from 'react-hot-toast';

const Evaluator = forwardRef(({ 
  generatedQuestions, 
  onEvaluationAdded, 
  pdfFile 
}, ref) => {
  const [answers, setAnswers] = useState({});
  const [isEvaluating, setIsEvaluating] = useState(false);
  const [evaluationResults, setEvaluationResults] = useState([]);
  const [validationErrors, setValidationErrors] = useState({});
  const [isReading, setIsReading] = useState(false);
  const [currentReadIndex, setCurrentReadIndex] = useState(null);
  const speechRef = useRef(null);
  const answerInputRefs = useRef([]);

  // Expose functions to parent via ref
  useImperativeHandle(ref, () => ({
    handleVoiceAnswer: (command) => {
      if (command.isMCQ) {
        handleMCQAnswer(command.questionIndex, command.answer);
      } else {
        handleSubjectiveAnswer(command.questionIndex, command.answer);
      }
    },
    handleVoiceEvaluate: () => {
      evaluateAnswers();
    },
    handleVoiceReadQuestion: (questionIndex) => {
      if (questionList[questionIndex]) {
        readAloud(questionList[questionIndex], questionIndex);
      }
    }
  }));

  useEffect(() => {
    // Initialize refs array
    answerInputRefs.current = answerInputRefs.current.slice(0, questionList.length);
    
    return () => {
      if (speechRef.current) {
        window.speechSynthesis.cancel();
      }
    };
  }, [generatedQuestions]);

  const handleMCQAnswer = (questionIndex, answer) => {
    const processedAnswer = answer.toUpperCase();
    
    setAnswers(prev => ({
      ...prev,
      [questionIndex]: processedAnswer
    }));
    
    // Visual and audio feedback
    provideFeedback(questionIndex, `Option ${processedAnswer} recorded for question ${questionIndex + 1}`);
  };

  const handleSubjectiveAnswer = (questionIndex, answer) => {
    setAnswers(prev => ({
      ...prev,
      [questionIndex]: answer
    }));

    // Visual and audio feedback
    provideFeedback(questionIndex, `Answer recorded for question ${questionIndex + 1}`);
  };

  const provideFeedback = (questionIndex, message) => {
    // Scroll to and highlight the answered question
    setTimeout(() => {
      const input = answerInputRefs.current[questionIndex];
      if (input) {
        input.scrollIntoView({ behavior: 'smooth', block: 'center' });
        input.focus();
        input.classList.add('ring-2', 'ring-blue-500');
        setTimeout(() => input.classList.remove('ring-2', 'ring-blue-500'), 2000);
      }
    }, 300);

    // Clear any validation errors
    if (validationErrors[questionIndex]) {
      setValidationErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[questionIndex];
        return newErrors;
      });
    }

    // Provide audio feedback
    const synth = window.speechSynthesis;
    synth.cancel();
    const utterance = new SpeechSynthesisUtterance(message);
    utterance.rate = 0.9;
    synth.speak(utterance);
  };

  const getQuestionsForDisplay = () => {
    if (!generatedQuestions) return [];
    
    const questionSections = generatedQuestions.split(/(Q\d+\))/g);
    const processedQuestions = [];
    
    for (let i = 1; i < questionSections.length; i += 2) {
      if (questionSections[i] && questionSections[i+1]) {
        let questionText = questionSections[i] + questionSections[i+1];
        
        if (questionText.includes('(Correct)')) {
          questionText = questionText
            .replace(/\(Correct\)/g, '')
            .replace(/Type your answer here.*?\n/g, '');
        } else if (questionText.includes('Model Answer:')) {
          questionText = questionText.split('Model Answer:')[0].trim();
        }
        
        processedQuestions.push(questionText.trim());
      }
    }
    
    return processedQuestions;
  };

  const getOriginalQuestionsWithAnswers = () => {
    if (!generatedQuestions) return [];
    
    const questionSections = generatedQuestions.split(/(Q\d+\))/g);
    const processedQuestions = [];
    
    for (let i = 1; i < questionSections.length; i += 2) {
      if (questionSections[i] && questionSections[i+1]) {
        const questionText = questionSections[i] + questionSections[i+1];
        processedQuestions.push(questionText.trim());
      }
    }
    
    return processedQuestions;
  };

  const questionList = getQuestionsForDisplay();
  const originalQuestions = getOriginalQuestionsWithAnswers();

  const readAloud = (text, index) => {
    // Get the speech synthesis API
    const synth = window.speechSynthesis;
    
    // If already reading this question, stop and return
    if (isReading && currentReadIndex === index) {
        synth.cancel();
        setIsReading(false);
        setCurrentReadIndex(null);
        return;
    }

    // Cancel any ongoing speech
    synth.cancel();

    // Create new utterance with improved configuration
    const utterance = new SpeechSynthesisUtterance();
    utterance.text = text;
    utterance.rate = 0.9;  // Slightly slower than default for clarity
    utterance.pitch = 1;   // Normal pitch
    utterance.volume = 1;  // Full volume

    // Store in ref for potential cancellation
    speechRef.current = utterance;

    // Event handlers
    utterance.onstart = () => {
        setIsReading(true);
        setCurrentReadIndex(index);
        console.log(`Started reading question ${index + 1}`);
    };

    utterance.onend = () => {
        if (speechRef.current === utterance) {
            speechRef.current = null;
        }
        setIsReading(false);
        setCurrentReadIndex(null);
        console.log(`Finished reading question ${index + 1}`);
    };

    utterance.onerror = (event) => {
        console.error('Speech synthesis error:', event);
        if (speechRef.current === utterance) {
            speechRef.current = null;
        }
        setIsReading(false);
        setCurrentReadIndex(null);
    };

    utterance.onboundary = (event) => {
        // Optional: Could add word highlighting here if needed
    };

    // Speak with error handling
    try {
        synth.speak(utterance);
        console.log(`Attempting to read question ${index + 1}`);
    } catch (error) {
        console.error('Failed to speak:', error);
        setIsReading(false);
        setCurrentReadIndex(null);
        speechRef.current = null;
    }
};

  const stopReading = () => {
    window.speechSynthesis.cancel();
    speechRef.current = null;
    setIsReading(false);
    setCurrentReadIndex(null);
  };

  const handleAnswerChange = (questionIndex, answer) => {
    setAnswers(prev => ({
      ...prev,
      [questionIndex]: answer
    }));
    
    if (validationErrors[questionIndex]) {
      setValidationErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[questionIndex];
        return newErrors;
      });
    }
  };

  const validateAnswers = () => {
    const errors = {};
    let isValid = true;

    questionList.forEach((question, index) => {
      if (!answers[index] || answers[index].trim() === '') {
        errors[index] = 'Please provide an answer to proceed';
        isValid = false;
      } else {
        const isMCQ = question.includes('A)') && question.includes('B)');
        if (!isMCQ && answers[index].trim().split(/\s+/).length < 15) {
          errors[index] = 'Please provide a more detailed answer (at least 3-4 sentences)';
          isValid = false;
        }
      }
    });

    setValidationErrors(errors);
    return isValid;
  };

  const calculateScore = (studentAnswer, modelAnswer, isMCQ, questionText) => {
    if (isMCQ) {
      const studentChoice = studentAnswer.trim().toLowerCase().charAt(0);
      const correctOptions = [];
      const optionRegex = /([a-z])\) .*?\(Correct\)/gi;
      let match;
      
      while ((match = optionRegex.exec(questionText))) {
        correctOptions.push(match[1].toLowerCase());
      }
      
      return correctOptions.includes(studentChoice) ? 1 : 0;
    } else {
      if (!modelAnswer || !studentAnswer) return 0;
      
      const normalize = (text) => {
        return text.toLowerCase()
          .replace(/[^\w\s.,;!?-]/g, ' ')
          .replace(/\s+/g, ' ')
          .trim();
      };

      const studentText = normalize(studentAnswer);
      const modelText = normalize(modelAnswer);

      const studentKeywords = studentText.split(/\s+/).filter(word => word.length >= 3);
      const modelKeywords = modelText.split(/\s+/).filter(word => word.length >= 3);

      if (modelKeywords.length === 0) return 0;

      const matchedKeywords = modelKeywords.filter(modelKw => 
        studentKeywords.some(studentKw => 
          studentKw.includes(modelKw) || modelKw.includes(studentKw))
      ).length;

      let score = (matchedKeywords / modelKeywords.length) * 60;
      score += Math.min(40, (studentText.length / modelText.length) * 40);

      return Math.round(Math.min(100, Math.max(0, score)));
    }
  };

  const getFeedback = (score, isMCQ, questionText, studentAnswer, modelAnswer) => {
    if (isMCQ) {
      if (score === 1) return 'Correct answer! ✔️';
      
      const correctAnswers = [];
      const answerRegex = /([a-z])\) (.*?)\(Correct\)/gi;
      let match;
      
      while ((match = answerRegex.exec(questionText))) {
        correctAnswers.push(`${match[1].toUpperCase()}) ${match[2].trim()}`);
      }
      
      return `Incorrect ✖️ - The correct answer${correctAnswers.length > 1 ? 's were' : ' was'}: ${correctAnswers.join(' OR ')}`;
    } else {
      if (score >= 85) return 'Excellent! You covered all key points. ✅';
      if (score >= 70) return 'Good answer, but could include more details. 👍';
      if (score >= 50) return 'Partial answer - you missed some important concepts. ➖';
      
      return 'Needs improvement - review the material.';
    }
  };

  const evaluateAnswers = async () => {
    if (!validateAnswers()) {
      toast.error('Please answer all questions before evaluating');
      return;
    }

    setIsEvaluating(true);
    
    // Speak evaluation started message
    const synth = window.speechSynthesis;
    synth.cancel();
    const startUtterance = new SpeechSynthesisUtterance('Evaluating answers, please wait');
    startUtterance.rate = 0.9;
    synth.speak(startUtterance);

    try {
      const results = [];
      
      for (let i = 0; i < originalQuestions.length; i++) {
        const question = originalQuestions[i];
        const studentAnswer = answers[i] || '';
        const isMCQ = question.includes('A)') && question.includes('B)');
        let modelAnswer = '';
        
        if (isMCQ) {
          const correctOptions = question.match(/[A-Z]\) .*?\(Correct\)/g) || [];
          modelAnswer = correctOptions.map(opt => opt.replace('(Correct)', '').trim()).join(' OR ');
        } else if (question.includes('Model Answer:')) {
          modelAnswer = question.split('Model Answer:')[1].trim();
        }

        const score = calculateScore(studentAnswer, modelAnswer, isMCQ, question);
        const feedback = getFeedback(score, isMCQ, question, studentAnswer, modelAnswer);
        
        results.push({
          question: question.split('\n')[0],
          studentAnswer,
          modelAnswer,
          score: isMCQ ? (score === 1 ? 100 : 0) : Number(score),
          feedback,
          isMCQ: Boolean(isMCQ),
          timestamp: new Date().toISOString()
        });
      }

      setEvaluationResults(results);
      if (onEvaluationAdded) {
        onEvaluationAdded(results);
      }
      
      // Speak evaluation complete message
      const completeUtterance = new SpeechSynthesisUtterance('Evaluation completed!');
      completeUtterance.rate = 0.9;
      synth.speak(completeUtterance);
      
      toast.success('Evaluation completed!');
    } catch (err) {
      console.error('Evaluation error:', err);
      
      // Speak error message
      const errorUtterance = new SpeechSynthesisUtterance('Failed to evaluate answers');
      errorUtterance.rate = 0.9;
      synth.speak(errorUtterance);
      
      toast.error('Failed to evaluate answers');
    } finally {
      setIsEvaluating(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-lg shadow">
        <h2 className="text-xl font-bold mb-4">Generated Questions</h2>
        {pdfFile && (
          <p className="text-sm text-gray-600 mb-4">
            From: {pdfFile.name}
          </p>
        )}
        
        {questionList.length === 0 ? (
          <p className="text-gray-500">No questions available for evaluation</p>
        ) : (
          <div className="space-y-6">
            {questionList.map((question, index) => (
              <div key={index} className="border-b pb-4">
                <div className="flex justify-between items-start">
                  <pre className="whitespace-pre-wrap bg-gray-50 p-4 rounded mb-2 flex-1">
                    {question}
                  </pre>
                  <button
                    onClick={() => readAloud(question, index)}
                    className={`ml-2 p-2 rounded-full ${
                      isReading && currentReadIndex === index 
                        ? 'bg-blue-100 text-blue-600' 
                        : 'bg-gray-100 text-gray-600'
                    }`}
                    aria-label={isReading && currentReadIndex === index ? "Stop reading" : "Read question aloud"}
                  >
                    {isReading && currentReadIndex === index ? <FaStop /> : <FaVolumeUp />}
                  </button>
                </div>
                <textarea
                  id={`question-${index}`}
                  ref={el => answerInputRefs.current[index] = el}
                  className={`w-full p-3 border rounded answer-input transition-colors ${
                    validationErrors[index] ? 'border-red-500' : ''
                  }`}
                  data-index={index}
                  rows={question.includes('A)') ? 1 : 4}
                  placeholder={
                    question.includes('A)') 
                      ? "Enter the letter of your answer (e.g., A, B, C, D)" 
                      : "Type your answer here (minimum 3-4 sentences)..."
                  }
                  value={answers[index] || ''}
                  onChange={(e) => handleAnswerChange(index, e.target.value)}
                  aria-label={`Answer for question ${index + 1}`}
                />
                {validationErrors[index] && (
                  <p className="text-red-500 text-sm mt-1 flex items-center">
                    <FaExclamationTriangle className="mr-1" />
                    {validationErrors[index]}
                  </p>
                )}
              </div>
            ))}
          </div>
        )}

        <div className="mt-6 flex justify-between">
          <button
            onClick={stopReading}
            className="flex items-center px-4 py-2 bg-gray-100 text-gray-700 rounded hover:bg-gray-200"
            disabled={!isReading}
            aria-label="Stop reading"
          >
            <FaStop className="mr-2" />
            Stop Reading
          </button>
          <button
            onClick={evaluateAnswers}
            className="btn-primary flex items-center px-6 py-2 evaluate-btn"
            disabled={isEvaluating || questionList.length === 0}
            aria-label={isEvaluating ? "Evaluating answers" : "Evaluate answers"}
          >
            {isEvaluating ? (
              <>
                <FaSpinner className="animate-spin mr-2" />
                Evaluating...
              </>
            ) : (
              <>
                <FaCheck className="mr-2" />
                Evaluate Answers
              </>
            )}
          </button>
        </div>
      </div>

      {evaluationResults.length > 0 && (
        <div className="bg-white p-6 rounded-lg shadow mt-6">
          <h2 className="text-xl font-bold mb-4">Evaluation Results</h2>
          <div className="space-y-4">
            {evaluationResults.map((result, index) => (
              <div key={index} className="border-b pb-4">
                <h3 className="font-medium">{result.question}</h3>
                <p className="text-sm text-gray-600 mt-1">
                  <strong>Your answer:</strong> {result.studentAnswer}
                </p>
                {result.modelAnswer && (
                  <p className="text-sm text-gray-600">
                    <strong>{result.isMCQ ? 'Correct option:' : 'Model answer:'}</strong> {result.modelAnswer}
                  </p>
                )}
                <div className="mt-2">
                  <span className={`px-2 py-1 rounded ${
                    result.isMCQ
                      ? result.score === 100 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-red-100 text-red-800'
                      : result.score >= 80 
                        ? 'bg-green-100 text-green-800' 
                        : result.score >= 60 
                          ? 'bg-yellow-100 text-yellow-800' 
                          : 'bg-red-100 text-red-800'
                  }`}>
                    {result.isMCQ 
                      ? result.score === 100 
                        ? 'Correct (100%)' 
                        : 'Incorrect (0%)'
                      : `Score: ${result.score}%`}
                  </span>
                  <p className="mt-1 text-sm">
                    <strong>Feedback:</strong> {result.feedback}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
});

Evaluator.displayName = 'Evaluator';
export default Evaluator;