<!-- App.vue -->
<template>
  <div class="container mx-auto px-4 py-8">
    <h1 class="text-3xl font-bold mb-6 text-center">MCQ Generator</h1>

    <div class="bg-white rounded-lg shadow-md p-6 mb-8">
      <h2 class="text-xl font-semibold mb-4">Upload Document</h2>
      
      <div 
        class="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center cursor-pointer hover:bg-gray-50 transition-colors"
        @click="triggerFileInput"
        @dragover.prevent
        @drop.prevent="handleFileDrop"
      >
        <input 
          type="file" 
          ref="fileInput" 
          class="hidden" 
          @change="handleFileChange"
          accept=".txt,.pdf,.docx,.doc"
        />
        <div v-if="!selectedFile">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-12 w-12 mx-auto text-gray-400 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
          </svg>
          <p class="text-gray-600 mb-2">Drag and drop your file here</p>
          <p class="text-gray-500 text-sm">Or click to browse files</p>
          <p class="text-gray-400 text-xs mt-2">Supported formats: TXT, PDF, DOCX, DOC</p>
        </div>
        <div v-else class="text-left">
          <div class="flex items-center">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-8 w-8 text-green-500 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div>
              <p class="font-medium">{{ selectedFile.name }}</p>
              <p class="text-sm text-gray-500">{{ formatFileSize(selectedFile.size) }}</p>
            </div>
          </div>
          <button 
            @click.stop="removeFile" 
            class="mt-4 text-red-500 text-sm hover:text-red-700"
          >
            Remove file
          </button>
        </div>
      </div>

      <div class="mt-6">
        <label class="block text-sm font-medium text-gray-700 mb-2">
          Number of questions to generate:
        </label>
        <input 
          type="number" 
          v-model="numQuestions" 
          min="1" 
          max="20"
          class="border border-gray-300 rounded-md px-3 py-2 w-full focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      <div class="mt-6">
        <label class="block text-sm font-medium text-gray-700 mb-2">
          Difficulty level:
        </label>
        <select 
          v-model="difficulty"
          class="border border-gray-300 rounded-md px-3 py-2 w-full focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="easy">Easy</option>
          <option value="medium">Medium</option>
          <option value="hard">Hard</option>
        </select>
      </div>

      <button 
        @click="generateQuestions" 
        class="mt-6 w-full bg-blue-600 hover:bg-blue-700 text-white py-3 px-4 rounded-md font-medium transition-colors disabled:bg-blue-300"
        :disabled="!selectedFile || isGenerating"
      >
        <span v-if="isGenerating">
          <svg class="animate-spin -ml-1 mr-3 h-5 w-5 text-white inline-block" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          Generating questions...
        </span>
        <span v-else>Generate Questions</span>
      </button>
    </div>

    <!-- Generated MCQs Section -->
    <div v-if="generatedQuestions.length > 0" class="bg-white rounded-lg shadow-md p-6">
      <div class="flex justify-between items-center mb-6">
        <h2 class="text-xl font-semibold">Generated Questions</h2>
        <div class="flex space-x-3">
          <button 
            @click="downloadQuestions" 
            class="bg-green-600 hover:bg-green-700 text-white py-2 px-4 rounded-md text-sm font-medium transition-colors"
          >
            Download Questions
          </button>
          <button 
            v-if="hasSubmittedAnswers"
            @click="resetUserAnswers" 
            class="bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-md text-sm font-medium transition-colors"
          >
            Retry Quiz
          </button>
        </div>
      </div>
      
      <div v-for="(question, index) in generatedQuestions" :key="index" class="mb-8 border-b pb-6 last:border-b-0">
        <div class="font-medium text-lg mb-2">{{ index + 1 }}. {{ question.question }}</div>
        <div class="ml-6 space-y-2 mt-3">
          <div
            v-for="(option, optIndex) in question.options"
            :key="optIndex"
            class="flex items-start"
          >
            <div 
              class="w-full p-2 rounded-md cursor-pointer flex items-center"
              :class="{
                'bg-gray-100 hover:bg-gray-200': !userAnswers[index],
                'bg-red-100': userAnswers[index] && userAnswers[index] === option && option !== question.correctAnswer,
                'bg-green-100': userAnswers[index] && option === question.correctAnswer,
                'opacity-60': userAnswers[index] && userAnswers[index] !== option && option !== question.correctAnswer
              }"
              @click="selectAnswer(index, option)"
              :disabled="!!userAnswers[index]"
            >
              <span class="mr-2 font-medium">{{ ['A', 'B', 'C', 'D'][optIndex] }}.</span>
              <span>{{ option }}</span>
              
              <!-- Correct answer icon -->
              <svg 
                v-if="userAnswers[index] && option === question.correctAnswer" 
                xmlns="http://www.w3.org/2000/svg" 
                class="h-5 w-5 text-green-500 ml-2" 
                viewBox="0 0 20 20" 
                fill="currentColor"
              >
                <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd" />
              </svg>
              
              <!-- Wrong answer icon -->
              <svg 
                v-if="userAnswers[index] === option && option !== question.correctAnswer" 
                xmlns="http://www.w3.org/2000/svg" 
                class="h-5 w-5 text-red-500 ml-2" 
                viewBox="0 0 20 20" 
                fill="currentColor"
              >
                <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd" />
              </svg>
            </div>
          </div>
        </div>
        
        <!-- Explanation - only shown after answering -->
        <div v-if="userAnswers[index]" class="mt-4 text-gray-600 text-sm p-3 bg-blue-50 rounded-md">
          <strong class="text-blue-800">Explanation:</strong> {{ question.explanation }}
        </div>

        <!-- Score display after answering -->
        <div v-if="hasSubmittedAnswers" class="mt-3 text-right">
          <span class="text-sm font-medium" :class="getScoreColor()">
            Your score: {{ correctAnswers }}/{{ generatedQuestions.length }} ({{ Math.round((correctAnswers / generatedQuestions.length) * 100) }}%)
          </span>
        </div>
      </div>

      <!-- Submit button to see results -->
      <div v-if="generatedQuestions.length > 0 && !isAllQuestionsAnswered && !hasSubmittedAnswers" class="text-center mt-6">
        <button 
          @click="submitAnswers" 
          class="bg-blue-600 hover:bg-blue-700 text-white py-3 px-6 rounded-md font-medium transition-colors"
          :disabled="Object.keys(userAnswers).length === 0"
        >
          Submit Answers
        </button>
        <p v-if="Object.keys(userAnswers).length > 0 && !isAllQuestionsAnswered" class="text-sm text-gray-500 mt-2">
          {{ unansweredQuestionsCount }} question{{ unansweredQuestionsCount !== 1 ? 's' : '' }} remaining
        </p>
      </div>
    </div>

    <!-- Error Alert -->
    <div 
      v-if="errorMessage" 
      class="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mt-6 relative"
    >
      <strong class="font-bold">Error:</strong>
      <span class="block sm:inline">{{ errorMessage }}</span>
      <button 
        @click="errorMessage = ''" 
        class="absolute top-0 bottom-0 right-0 px-4 py-3"
      >
        <svg class="h-6 w-6 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </div>
  </div>
</template>

<script>
import { ref, computed } from 'vue';
import * as pdfjsLib from 'pdfjs-dist';
import mammoth from 'mammoth'; // For .docx files

export default {
  name: 'App',
  setup() {
    const fileInput = ref(null);
    const selectedFile = ref(null);
    const numQuestions = ref(5);
    const difficulty = ref('medium');
    const isGenerating = ref(false);
    const generatedQuestions = ref([]);
    const errorMessage = ref('');
    const fileContent = ref('');
    const userAnswers = ref({});
    const hasSubmittedAnswers = ref(false);
    const correctAnswers = ref(0);
    
    // Computed properties
    const isAllQuestionsAnswered = computed(() => {
      return Object.keys(userAnswers.value).length === generatedQuestions.value.length;
    });
    
    const unansweredQuestionsCount = computed(() => {
      return generatedQuestions.value.length - Object.keys(userAnswers.value).length;
    });
    
    const triggerFileInput = () => {
      fileInput.value.click();
    };

    const handleFileChange = (event) => {
      const file = event.target.files[0];
      if (file) {
        selectedFile.value = file;
        readFileContent(file);
      }
    };

    const handleFileDrop = (event) => {
      const file = event.dataTransfer.files[0];
      if (file) {
        selectedFile.value = file;
        readFileContent(file);
      }
    };

    const readFileContent = (file) => {
      const reader = new FileReader();

      reader.onload = async (e) => {
        const fileData = e.target.result;

        if (file.type === 'application/pdf') {
          try {
            const pdf = await pdfjsLib.getDocument({ data: fileData }).promise;
            let textContent = '';

            for (let i = 1; i <= pdf.numPages; i++) {
              const page = await pdf.getPage(i);
              const text = await page.getTextContent();
              textContent += text.items.map(item => item.str).join(' ');
            }

            fileContent.value = textContent;
          } catch (error) {
            console.error("Error reading PDF file:", error);
            errorMessage.value = "Error reading PDF file";
          }
        } else if (file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
          // Handle .docx files using mammoth
          try {
            const result = await mammoth.extractRawText({ arrayBuffer: fileData });
            fileContent.value = result.value;
          } catch (error) {
            console.error("Error reading DOCX file:", error);
            errorMessage.value = "Error reading DOCX file";
          }
        } else if (file.type === 'text/plain') {
          // Handle plain text files
          fileContent.value = fileData;
        } else {
          errorMessage.value = "Unsupported file type";
        }
      };

      reader.onerror = () => {
        errorMessage.value = "Error reading file";
      };

      if (file.type === 'application/pdf' || file.type === 'text/plain') {
        reader.readAsText(file);
      } else if (file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
        reader.readAsArrayBuffer(file);
      } else {
        errorMessage.value = "Unsupported file type";
      }
    };

    const removeFile = () => {
      selectedFile.value = null;
      fileContent.value = '';
      fileInput.value.value = '';
    };

    const formatFileSize = (bytes) => {
      if (bytes === 0) return '0 Bytes';
      const k = 1024;
      const sizes = ['Bytes', 'KB', 'MB', 'GB'];
      const i = Math.floor(Math.log(bytes) / Math.log(k));
      return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    };

    const generateQuestions = async () => {
      if (!selectedFile.value) {
        errorMessage.value = "Please upload a document first";
        return;
      }

      isGenerating.value = true;
      errorMessage.value = '';
      userAnswers.value = {};
      hasSubmittedAnswers.value = false;
      correctAnswers.value = 0;

      try {
        const formData = new FormData();
        formData.append('file', selectedFile.value);
        formData.append('numQuestions', numQuestions.value);
        formData.append('difficulty', difficulty.value);
      
        const response = await fetch('http://localhost:3000/generate-questions', {
          method: 'POST',
          body: formData
        });
      
        if (!response.ok) {
          throw new Error(`API Error: ${response.status}`);
        }
      
        const data = await response.json();
        generatedQuestions.value = data.questions;
      } catch (error) {
        console.error("Error generating questions:", error);
        errorMessage.value = error.message || "Failed to generate questions";
      } finally {
        isGenerating.value = false;
      }
    };

    const selectAnswer = (questionIndex, option) => {
      if (hasSubmittedAnswers.value) return; // Don't allow changing answers after submission
      
      userAnswers.value = {
        ...userAnswers.value,
        [questionIndex]: option
      };
    };

    const submitAnswers = () => {
      correctAnswers.value = 0;
      
      generatedQuestions.value.forEach((question, index) => {
        if (userAnswers.value[index] === question.correctAnswer) {
          correctAnswers.value++;
        }
      });
      
      hasSubmittedAnswers.value = true;
    };

    const resetUserAnswers = () => {
      userAnswers.value = {};
      hasSubmittedAnswers.value = false;
      correctAnswers.value = 0;
    };

    const getScoreColor = () => {
      const percentage = (correctAnswers.value / generatedQuestions.value.length) * 100;
      if (percentage >= 80) return 'text-green-600';
      if (percentage >= 60) return 'text-blue-600';
      if (percentage >= 40) return 'text-yellow-600';
      return 'text-red-600';
    };

    const downloadQuestions = () => {
      if (generatedQuestions.value.length === 0) return;
      
      let content = "# Generated Multiple Choice Questions\n\n";
      
      generatedQuestions.value.forEach((q, index) => {
        content += `## Question ${index + 1}\n${q.question}\n\n`;
        q.options.forEach((option, optIndex) => {
          const letter = ['A', 'B', 'C', 'D'][optIndex];
          content += `${letter}. ${option}\n`;
        });
        content += `\nCorrect Answer: ${q.correctAnswer}\n`;
        content += `\nExplanation: ${q.explanation}\n\n`;
      });
      
      const blob = new Blob([content], { type: 'text/markdown' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'generated_questions.md';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    };

    return {
      fileInput,
      selectedFile,
      numQuestions,
      difficulty,
      isGenerating,
      generatedQuestions,
      errorMessage,
      userAnswers,
      hasSubmittedAnswers,
      correctAnswers,
      isAllQuestionsAnswered,
      unansweredQuestionsCount,
      triggerFileInput,
      handleFileChange,
      handleFileDrop,
      removeFile,
      formatFileSize,
      generateQuestions,
      downloadQuestions,
      selectAnswer,
      submitAnswers,
      resetUserAnswers,
      getScoreColor
    };
  }
};
</script>