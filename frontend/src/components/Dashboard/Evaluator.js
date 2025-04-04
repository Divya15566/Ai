import { useState, useEffect } from 'react';
import { FaCheck, FaSpinner, FaExclamationTriangle, FaVolumeUp, FaStop } from 'react-icons/fa';
import { toast } from 'react-hot-toast';

export default function Evaluator({ generatedQuestions, onEvaluationAdded, pdfFile }) {
  const [answers, setAnswers] = useState({});
  const [isEvaluating, setIsEvaluating] = useState(false);
  const [evaluationResults, setEvaluationResults] = useState([]);
  const [validationErrors, setValidationErrors] = useState({});
  const [isReading, setIsReading] = useState(false);
  const [currentReadIndex, setCurrentReadIndex] = useState(null);

  useEffect(() => {
    return () => {
      window.speechSynthesis.cancel();
    };
  }, []);

  // Helper function for semantic similarity
  const calculateSemanticSimilarity = (text1, text2) => {
    const getPhrases = (text) => {
      return text.match(/\b[\w\s]{5,}\b/g) || [];
    };
    
    const phrases1 = getPhrases(text1);
    const phrases2 = getPhrases(text2);
    
    if (phrases1.length === 0 || phrases2.length === 0) return 0;
    
    const matchingPhrases = phrases1.filter(p1 => 
      phrases2.some(p2 => 
        p1.includes(p2) || p2.includes(p1))
    ).length;
    
    return matchingPhrases / Math.max(phrases1.length, phrases2.length);
  };

  // Improved keyword extraction with stemming
  const extractKeywords = (text) => {
    const stopWords = new Set(['the', 'and', 'this', 'that', 'these', 'those', 'they']);
    
    const stem = (word) => {
      if (word.length > 6 && word.endsWith('ing')) return word.slice(0, -3);
      if (word.length > 5 && word.endsWith('es')) return word.slice(0, -2);
      if (word.length > 4 && word.endsWith('s')) return word.slice(0, -1);
      return word;
    };
    
    return text.toLowerCase()
      .replace(/[^\w\s.,;!?-]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim()
      .split(/\s+/)
      .filter(word => word.length >= 3 && !stopWords.has(word))
      .map(stem)
      .filter((word, index, arr) => arr.indexOf(word) === index);
  };

  const getQuestionsForDisplay = () => {
    if (!generatedQuestions) return [];
    
    const questionSections = generatedQuestions.split(/(Q\d+\))/g);
    const processedQuestions = [];
    
    for (let i = 1; i < questionSections.length; i += 2) {
      if (questionSections[i] && questionSections[i+1]) {
        let questionText = questionSections[i] + questionSections[i+1];
        
        // For MCQs, remove the (Correct) markers
        if (questionText.includes('(Correct)')) {
          questionText = questionText
            .replace(/\(Correct\)/g, '')
            .replace(/Type your answer here.*?\n/g, '');
        }
        // For subjective questions, remove the model answer completely
        else if (questionText.includes('Model Answer:')) {
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
    if (isReading) {
      window.speechSynthesis.cancel();
      if (currentReadIndex === index) {
        setIsReading(false);
        setCurrentReadIndex(null);
        return;
      }
    }

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 0.9;
    utterance.pitch = 10;
    utterance.onend = () => {
      setIsReading(false);
      setCurrentReadIndex(null);
    };

    window.speechSynthesis.speak(utterance);
    setIsReading(true);
    setCurrentReadIndex(index);
  };

  const stopReading = () => {
    window.speechSynthesis.cancel();
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

      const studentKeywords = extractKeywords(studentText);
      const modelKeywords = extractKeywords(modelText);

      if (modelKeywords.length === 0) return 0;

      const matchedKeywords = modelKeywords.filter(modelKw => 
        studentKeywords.some(studentKw => 
          studentKw.includes(modelKw) || modelKw.includes(studentKw))
      ).length;

      let score = (matchedKeywords / modelKeywords.length) * 60;
      const semanticScore = calculateSemanticSimilarity(studentText, modelText);
      score += semanticScore * 30;
      
      const lengthRatio = Math.min(2, studentText.length / modelText.length);
      score += Math.min(10, lengthRatio * 10);

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
      
      const missingKeywords = modelAnswer ? 
        extractKeywords(modelAnswer.toLowerCase())
          .filter(kw => !extractKeywords(studentAnswer.toLowerCase())
            .some(skw => skw.includes(kw) || kw.includes(skw)))
          .slice(0, 3) : [];
      
      let feedback = 'Needs improvement - review the material.';
      if (missingKeywords.length > 0) {
        feedback += ` Missing concepts: ${missingKeywords.join(', ')}`;
      }
      
      return feedback;
    }
  };

  const evaluateAnswers = async () => {
    if (!validateAnswers()) {
      toast.error('Please answer all questions before evaluating');
      return;
    }

    setIsEvaluating(true);
    try {
      const results = [];
      const originalQuestions = getOriginalQuestionsWithAnswers();
      
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
      toast.success('Evaluation completed!');
    } catch (err) {
      toast.error('Failed to evaluate answers');
      console.error('Evaluation error:', err);
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
                    aria-label="Read question aloud"
                  >
                    {isReading && currentReadIndex === index ? <FaStop /> : <FaVolumeUp />}
                  </button>
                </div>
                <textarea
                  className={`w-full p-3 border rounded ${
                    validationErrors[index] ? 'border-red-500' : ''
                  }`}
                  rows={question.includes('A)') ? 1 : 4}
                  placeholder={
                    question.includes('A)') 
                      ? "Enter the letter of your answer (e.g., A, B, C, D)" 
                      : "Type your answer here (minimum 3-4 sentences)..."
                  }
                  value={answers[index] || ''}
                  onChange={(e) => handleAnswerChange(index, e.target.value)}
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
          >
            <FaStop className="mr-2" />
            Stop Reading
          </button>
          <button
            onClick={evaluateAnswers}
            className="btn-primary flex items-center px-6 py-2"
            disabled={isEvaluating || questionList.length === 0}
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
}